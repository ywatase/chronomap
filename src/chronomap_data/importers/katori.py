"""Build a model estimate of the Katori Sea from GSI elevation tiles."""

from array import array
from collections import deque
from collections.abc import Mapping, Sequence
import datetime
import math
from pathlib import Path
import struct
import time
import urllib.error
import urllib.request
import zlib

from .common import FILES, RawDataError, assessment, round_coordinates, temporal, write_package

SLUG = "katori-sea"
DEM_ZOOM = 13
DEM_FALLBACK_ZOOM = 12
DEM5A_URL = "https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png"
DEM10B_URL = "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png"
DEM_LAYERS = (("dem5a_png", DEM5A_URL), ("dem10b_png", DEM10B_URL))
USER_AGENT = "chronomap/0.1 (historical map research)"
REQUEST_INTERVAL = 0.08
NO_DATA = -32768
MISSING = 32767
_MIN_ELEVATION_CM = -32767
_MAX_ELEVATION_CM = 32766
_WEB_MERCATOR_RADIUS_M = 6_378_137.0
_WEB_MERCATOR_HALF_WORLD_M = math.pi * _WEB_MERCATOR_RADIUS_M
_PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
STUDY_BBOX = (139.95, 35.65, 140.95, 36.25)
CHOSHI_SEED_COORDINATE = (140.852448, 35.737221)
KATORI_CUT_ANCHORS = (
    (140.640121, 35.974564),  # 鹿嶋市宮中
    CHOSHI_SEED_COORDINATE,
    (140.862457, 35.706104),  # 銚子市犬吠埼
)
CHOSHI_OUTLET_YEARS = (1200, 1600)
CHOSHI_OUTLET_WIDTH_M = 300.0
INBANUMA_CONTROL_COORDINATE = (140.20, 35.77)  # PM指定の入り江検査点
TEGANUMA_CONTROL_COORDINATE = (140.06, 35.86)  # PM指定の入り江検査点
SAWARA_TONE_CONTROL_COORDINATE = (140.50, 35.90)  # PM指定の利根川検査点
INBANUMA_LOCAL_THRESHOLD_M = 4.0
TEGANUMA_LOCAL_THRESHOLD_M = 5.0
INLET_CONNECTION_WIDTH_M = 300.0
SAWARA_CONNECTION_WIDTH_M = {1200: 300.0, 1600: 700.0}
MIN_COMPONENT_AREA_M2 = 10_000.0
MIN_HOLE_AREA_M2 = 10_000.0
def _paeth(left: int, above: int, upper_left: int) -> int:
    estimate = left + above - upper_left
    distances = (abs(estimate - left), abs(estimate - above), abs(estimate - upper_left))
    return (left, above, upper_left)[distances.index(min(distances))]


def decode_dem_png(data: bytes) -> list[array]:
    """Decode a GSI RGB PNG into rows of centimetres, preserving NoData separately.

    Positive elevations above 327.66m and negative elevations below -327.67m are
    saturated because the watershed thresholds are all within 0–4m. NoData and
    missing tiles use distinct sentinels.
    """
    if not data.startswith(_PNG_SIGNATURE):
        raise RawDataError("elevation tile is not a PNG")

    width = height = bit_depth = color_type = None
    compressed = bytearray()
    offset = len(_PNG_SIGNATURE)
    try:
        while offset + 12 <= len(data):
            length = struct.unpack_from(">I", data, offset)[0]
            kind = data[offset + 4 : offset + 8]
            start = offset + 8
            end = start + length
            if end + 4 > len(data):
                raise RawDataError("truncated PNG chunk")
            payload = data[start:end]
            if kind == b"IHDR":
                width, height, bit_depth, color_type, compression, filtering, interlace = struct.unpack(
                    ">IIBBBBB", payload
                )
                if compression or filtering or interlace:
                    raise RawDataError("unsupported PNG compression, filter method, or interlace")
            elif kind == b"IDAT":
                compressed.extend(payload)
            elif kind == b"IEND":
                break
            offset = end + 4
    except struct.error as error:
        raise RawDataError(f"invalid PNG header: {error}") from error

    if width is None or height is None or bit_depth != 8 or color_type != 2:
        raise RawDataError("GSI elevation tiles must be 8-bit RGB PNGs")

    try:
        scanlines = zlib.decompress(compressed)
    except zlib.error as error:
        raise RawDataError(f"invalid PNG image data: {error}") from error

    bytes_per_pixel = 3
    stride = width * bytes_per_pixel
    if len(scanlines) != height * (stride + 1):
        raise RawDataError("PNG image data has an unexpected length")

    rows: list[array] = []
    previous = bytearray(stride)
    offset = 0
    for _row_index in range(height):
        filter_type = scanlines[offset]
        offset += 1
        source = scanlines[offset : offset + stride]
        offset += stride
        raw = bytearray(stride)
        for index, value in enumerate(source):
            left = raw[index - bytes_per_pixel] if index >= bytes_per_pixel else 0
            above = previous[index]
            upper_left = previous[index - bytes_per_pixel] if index >= bytes_per_pixel else 0
            if filter_type == 0:
                predictor = 0
            elif filter_type == 1:
                predictor = left
            elif filter_type == 2:
                predictor = above
            elif filter_type == 3:
                predictor = (left + above) // 2
            elif filter_type == 4:
                predictor = _paeth(left, above, upper_left)
            else:
                raise RawDataError(f"unsupported PNG row filter: {filter_type}")
            raw[index] = (value + predictor) & 0xFF

        elevations = array("h")
        for index in range(0, stride, bytes_per_pixel):
            encoded = (raw[index] << 16) | (raw[index + 1] << 8) | raw[index + 2]
            if encoded == 1 << 23:
                elevations.append(NO_DATA)
                continue
            centimeters = encoded if encoded < 1 << 23 else encoded - (1 << 24)
            elevations.append(max(_MIN_ELEVATION_CM, min(_MAX_ELEVATION_CM, centimeters)))
        rows.append(elevations)
        previous = raw
    return rows


def flood_fill(
    elevation_rows: list[array] | list[list[int]],
    threshold_m: float,
    seeds: list[tuple[int, int]],
) -> list[bytearray]:
    """Return cells at or below a threshold that connect to an ocean seed.

    NoData cells may carry an ocean connection; cells from unavailable tiles may
    not. Four-neighbor connectivity avoids creating channels through diagonal
    contact alone.
    """
    if not elevation_rows:
        return []
    width = len(elevation_rows[0])
    if any(len(row) != width for row in elevation_rows):
        raise ValueError("elevation rows must have equal widths")
    if width == 0:
        return [bytearray() for _row in elevation_rows]

    height = len(elevation_rows)
    threshold_cm = threshold_m * 100
    mask = [bytearray(width) for _row in elevation_rows]
    queue: deque[int] = deque()

    def candidate(row: int, column: int) -> bool:
        elevation = elevation_rows[row][column]
        return elevation == NO_DATA or (elevation != MISSING and elevation <= threshold_cm)

    for row, column in seeds:
        if 0 <= row < height and 0 <= column < width and not mask[row][column] and candidate(row, column):
            mask[row][column] = 1
            queue.append(row * width + column)

    while queue:
        index = queue.popleft()
        row, column = divmod(index, width)
        for next_row, next_column in (
            (row - 1, column),
            (row + 1, column),
            (row, column - 1),
            (row, column + 1),
        ):
            if (
                0 <= next_row < height
                and 0 <= next_column < width
                and not mask[next_row][next_column]
                and candidate(next_row, next_column)
            ):
                mask[next_row][next_column] = 1
                queue.append(next_row * width + next_column)
    return mask


def _coordinate_to_grid_index(
    coordinate: tuple[float, float], origin_x: int, origin_y: int, zoom: int
) -> tuple[int, int]:
    longitude, latitude = coordinate
    world_pixels = 256 * (1 << zoom)
    pixel_x = math.floor((longitude + 180) / 360 * world_pixels)
    latitude_radians = math.radians(latitude)
    pixel_y = math.floor(
        (1 - math.asinh(math.tan(latitude_radians)) / math.pi) / 2 * world_pixels
    )
    return pixel_y - origin_y * 256, pixel_x - origin_x * 256


def lowland_component_mask(
    elevation_rows: list[array] | list[list[int]],
    threshold_m: float,
    seed: tuple[int, int],
) -> tuple[list[bytearray], int, int]:
    """Return the seed-connected, numeric DEM lowland component as a cropped mask."""
    if not elevation_rows:
        return [], 0, 0
    width = len(elevation_rows[0])
    if width == 0 or any(len(row) != width for row in elevation_rows):
        raise ValueError("elevation rows must have equal non-zero widths")

    height = len(elevation_rows)
    seed_row, seed_column = seed
    if not 0 <= seed_row < height or not 0 <= seed_column < width:
        raise RawDataError("the local lowland seed is outside the DEM mosaic")
    threshold_cm = round(threshold_m * 100)

    def candidate(row: int, column: int) -> bool:
        value = elevation_rows[row][column]
        return value not in (NO_DATA, MISSING) and value <= threshold_cm

    if not candidate(seed_row, seed_column):
        raise RawDataError("the local lowland seed is above its elevation threshold")

    start = seed_row * width + seed_column
    queue: deque[int] = deque([start])
    seen = {start}
    cells = [start]
    while queue:
        index = queue.popleft()
        row, column = divmod(index, width)
        for next_row, next_column in (
            (row - 1, column),
            (row + 1, column),
            (row, column - 1),
            (row, column + 1),
        ):
            next_index = next_row * width + next_column
            if (
                0 <= next_row < height
                and 0 <= next_column < width
                and next_index not in seen
                and candidate(next_row, next_column)
            ):
                seen.add(next_index)
                cells.append(next_index)
                queue.append(next_index)

    row_offset = min(index // width for index in cells)
    column_offset = min(index % width for index in cells)
    max_row = max(index // width for index in cells)
    max_column = max(index % width for index in cells)
    mask = [bytearray(max_column - column_offset + 1) for _row in range(row_offset, max_row + 1)]
    for index in cells:
        row, column = divmod(index, width)
        mask[row - row_offset][column - column_offset] = 1
    return mask, row_offset, column_offset


def lowland_component_geometry(
    elevation_rows: list[array] | list[list[int]],
    coordinate: tuple[float, float],
    threshold_m: float,
    origin_x: int,
    origin_y: int,
    grid_transform: tuple[float, float, float, float, float, float],
):
    """Polygonize a PM-specified point's local DEM lowland component."""
    mask, row_offset, column_offset = lowland_component_mask(
        elevation_rows,
        threshold_m,
        _coordinate_to_grid_index(coordinate, origin_x, origin_y, DEM_ZOOM),
    )
    a, b, c, d, e, f = grid_transform
    local_transform = (
        a,
        b,
        c + a * column_offset + b * row_offset,
        d,
        e,
        f + d * column_offset + e * row_offset,
    )
    return polygonize_mask(
        mask,
        local_transform,
        STUDY_BBOX,
        simplify_m=0,
        min_component_area_m2=MIN_COMPONENT_AREA_M2,
        min_hole_area_m2=MIN_HOLE_AREA_M2,
    )


def choshi_offshore_seeds(
    elevation_rows: list[array] | list[list[int]],
    origin_x: int,
    origin_y: int,
    coordinate: tuple[float, float] = CHOSHI_SEED_COORDINATE,
    zoom: int = DEM_ZOOM,
) -> list[tuple[int, int]]:
    """Find one offshore NoData seed east of the GSI-geocoded Choshi address."""
    row_index, start_column = _coordinate_to_grid_index(coordinate, origin_x, origin_y, zoom)
    if not 0 <= row_index < len(elevation_rows):
        raise RawDataError("the Choshi offshore seed row is outside the DEM mosaic")
    row = elevation_rows[row_index]
    for column in range(len(row) - 1, max(0, start_column), -1):
        if row[column] == NO_DATA:
            return [(row_index, column)]
    raise RawDataError("no available offshore NoData cell was found east of Choshi")


def polygonize_mask(
    mask: list[bytearray],
    grid_transform: tuple[float, float, float, float, float, float],
    bbox: tuple[float, float, float, float],
    *,
    simplify_m: float = 100.0,
    min_component_area_m2: float = MIN_COMPONENT_AREA_M2,
    min_hole_area_m2: float = MIN_HOLE_AREA_M2,
):
    """Convert a raster mask to clipped WGS84 polygons.

    ``grid_transform`` is an affine transform ``(a, b, c, d, e, f)`` from
    pixel coordinates to Web Mercator metres. Raster boundary edges are
    traced with a right-turn rule so diagonal contacts remain separate.
    """
    from shapely import STRtree, union_all
    from shapely.geometry import MultiPolygon, Polygon, box

    if not mask:
        return MultiPolygon()
    width = len(mask[0])
    if width == 0 or any(len(row) != width for row in mask):
        raise ValueError("mask rows must have equal non-zero widths")
    if len(grid_transform) != 6:
        raise ValueError("grid_transform must contain six affine coefficients")
    a, b, c, d, e, f = grid_transform
    determinant = a * e - b * d
    if determinant == 0:
        raise ValueError("grid_transform must have non-zero pixel area")

    # Directed edges keep wet cells on their right in row/column coordinates.
    outgoing: dict[tuple[int, int], list[tuple[int, int, int, int]]] = {}
    edges: set[tuple[int, int, int, int]] = set()

    def add_edge(x1: int, y1: int, x2: int, y2: int) -> None:
        edge = (x1, y1, x2, y2)
        edges.add(edge)
        outgoing.setdefault((x1, y1), []).append(edge)

    height = len(mask)
    for row_index, row in enumerate(mask):
        above = mask[row_index - 1] if row_index else None
        below = mask[row_index + 1] if row_index + 1 < height else None
        for column, wet in enumerate(row):
            if not wet:
                continue
            if above is None or not above[column]:
                add_edge(column, row_index, column + 1, row_index)
            if column + 1 == width or not row[column + 1]:
                add_edge(column + 1, row_index, column + 1, row_index + 1)
            if below is None or not below[column]:
                add_edge(column + 1, row_index + 1, column, row_index + 1)
            if column == 0 or not row[column - 1]:
                add_edge(column, row_index + 1, column, row_index)

    direction_for = {(1, 0): 0, (0, 1): 1, (-1, 0): 2, (0, -1): 3}
    rings: list[tuple[list[tuple[float, float]], float]] = []
    while edges:
        first = min(edges)
        start = (first[0], first[1])
        edge = first
        pixel_ring = [start]
        while True:
            if edge not in edges:
                raise RawDataError("raster boundary tracing encountered a reused edge")
            edges.remove(edge)
            end = (edge[2], edge[3])
            pixel_ring.append(end)
            if end == start:
                break
            direction = direction_for[(edge[2] - edge[0], edge[3] - edge[1])]
            candidates = [candidate for candidate in outgoing[end] if candidate in edges]
            if not candidates:
                raise RawDataError("raster boundary tracing found an open ring")
            priority = ((direction + 1) % 4, direction, (direction - 1) % 4, (direction + 2) % 4)
            candidate_directions = {
                candidate: direction_for[(candidate[2] - candidate[0], candidate[3] - candidate[1])]
                for candidate in candidates
            }
            edge = min(
                candidates,
                key=lambda candidate: (priority.index(candidate_directions[candidate]), candidate),
            )

        projected_ring = [
            (a * column + b * row + c, d * column + e * row + f)
            for column, row in pixel_ring
        ]
        signed_area = sum(
            x1 * y2 - x2 * y1
            for (x1, y1), (x2, y2) in zip(projected_ring, projected_ring[1:])
        ) / 2
        if abs(signed_area) >= min(min_component_area_m2, min_hole_area_m2):
            rings.append((projected_ring, signed_area))

    shell_rings: list[list[tuple[float, float]]] = []
    hole_rings: list[list[tuple[float, float]]] = []
    for ring, signed_area in rings:
        if signed_area * determinant > 0:
            shell_rings.append(ring)
        else:
            hole_rings.append(ring)

    shell_shapes = [Polygon(ring) for ring in shell_rings]
    shell_holes: list[list[list[tuple[float, float]]]] = [[] for _ring in shell_rings]
    shell_tree = STRtree(shell_shapes) if shell_shapes else None
    for ring in hole_rings:
        hole_shape = Polygon(ring)
        if hole_shape.area < min_hole_area_m2 or shell_tree is None:
            continue
        point = hole_shape.representative_point()
        candidates = shell_tree.query(point, predicate="within")
        if len(candidates):
            parent_index = min((int(index) for index in candidates), key=lambda index: shell_shapes[index].area)
            shell_holes[parent_index].append(ring)

    polygons = [
        Polygon(shell, holes)
        for shell, holes in zip(shell_rings, shell_holes)
        if Polygon(shell).area >= min_component_area_m2
    ]
    geometry = union_all(polygons) if polygons else MultiPolygon()

    min_lon, min_lat, max_lon, max_lat = bbox
    min_x, min_y = _lon_lat_to_web_mercator(min_lon, min_lat)
    max_x, max_y = _lon_lat_to_web_mercator(max_lon, max_lat)
    geometry = geometry.intersection(box(min_x, min_y, max_x, max_y))
    if simplify_m > 0 and not geometry.is_empty:
        simplify_tolerance = simplify_m / math.cos(math.radians((min_lat + max_lat) / 2))
        geometry = geometry.simplify(simplify_tolerance, preserve_topology=True)

    cleaned = []
    candidates = list(geometry.geoms) if hasattr(geometry, "geoms") else [geometry]
    for polygon in candidates:
        if polygon.geom_type != "Polygon" or polygon.area < min_component_area_m2:
            continue
        holes = [
            list(interior.coords)
            for interior in polygon.interiors
            if Polygon(interior).area >= min_hole_area_m2
        ]
        cleaned.append(Polygon(polygon.exterior.coords, holes))
    geometry = union_all(cleaned) if cleaned else MultiPolygon()

    geography = _transform_web_mercator_geometry(geometry)
    return geography.intersection(box(*bbox))


def _lon_lat_to_web_mercator(longitude: float, latitude: float) -> tuple[float, float]:
    latitude = max(-85.05112878, min(85.05112878, latitude))
    x = _WEB_MERCATOR_RADIUS_M * math.radians(longitude)
    y = _WEB_MERCATOR_RADIUS_M * math.log(math.tan(math.pi / 4 + math.radians(latitude) / 2))
    return x, y


def apply_corrections(base, additions: list, exclusions: list):
    """Apply manual additions, then exclusions, to a base geometry."""
    from shapely import union_all

    geometry = union_all([base, *additions]) if additions else base
    return geometry.difference(union_all(exclusions)) if exclusions else geometry


def _transform_lon_lat_geometry(geometry):
    from shapely.ops import transform as transform_geometry

    def forward(longitude, latitude, z=None):
        if isinstance(longitude, (int, float)):
            x, y = _lon_lat_to_web_mercator(longitude, latitude)
            return (x, y) if z is None else (x, y, z)
        xs = tuple(_WEB_MERCATOR_RADIUS_M * math.radians(value) for value in longitude)
        ys = tuple(
            _WEB_MERCATOR_RADIUS_M * math.log(math.tan(math.pi / 4 + math.radians(value) / 2))
            for value in latitude
        )
        return (xs, ys) if z is None else (xs, ys, z)

    return transform_geometry(forward, geometry)


def _transform_web_mercator_geometry(geometry):
    from shapely.ops import transform as transform_geometry

    def inverse(x, y, z=None):
        if isinstance(x, (int, float)):
            longitude = math.degrees(x / _WEB_MERCATOR_RADIUS_M)
            latitude = math.degrees(2 * math.atan(math.exp(y / _WEB_MERCATOR_RADIUS_M)) - math.pi / 2)
            return (longitude, latitude) if z is None else (longitude, latitude, z)
        longitudes = tuple(math.degrees(value / _WEB_MERCATOR_RADIUS_M) for value in x)
        latitudes = tuple(
            math.degrees(2 * math.atan(math.exp(value / _WEB_MERCATOR_RADIUS_M)) - math.pi / 2)
            for value in y
        )
        return (longitudes, latitudes) if z is None else (longitudes, latitudes, z)

    return transform_geometry(inverse, geometry)


def outer_ocean_exclusion():
    """Return the south/east Pacific area excluded by the named cut."""
    from shapely.geometry import Polygon, box

    min_lon, min_lat, max_lon, max_lat = STUDY_BBOX
    katori_side = Polygon(
        [
            (min_lon, min_lat),
            KATORI_CUT_ANCHORS[2],
            KATORI_CUT_ANCHORS[1],
            KATORI_CUT_ANCHORS[0],
            (KATORI_CUT_ANCHORS[0][0], max_lat),
            (min_lon, max_lat),
        ]
    )
    return box(min_lon, min_lat, max_lon, max_lat).difference(katori_side)


def choshi_outlet_correction(base):
    """Create a 300m-wide inferred inlet joining Choshi to the DEM shoreline."""
    from shapely.geometry import Point

    return connect_geometry_to_main(
        base,
        Point(*CHOSHI_SEED_COORDINATE),
        width_m=CHOSHI_OUTLET_WIDTH_M,
    )


def connect_geometry_to_main(main_geometry, feature_geometry, width_m: float):
    """Add a short inferred corridor from a feature to the largest sea polygon."""
    from shapely.geometry import LineString
    from shapely.ops import nearest_points

    if main_geometry.is_empty or feature_geometry.is_empty:
        return main_geometry.__class__()

    projected_main = _transform_lon_lat_geometry(main_geometry)
    projected_feature = _transform_lon_lat_geometry(feature_geometry)
    main_parts = (
        list(projected_main.geoms)
        if hasattr(projected_main, "geoms")
        else [projected_main]
    )
    main_polygons = [part for part in main_parts if part.geom_type == "Polygon"]
    if not main_polygons:
        return main_geometry.__class__()
    main_core = max(main_polygons, key=lambda polygon: polygon.area)
    feature_point, main_point = nearest_points(projected_feature, main_core)
    corridor_line = LineString([feature_point, main_point])
    latitude = (feature_geometry.centroid.y + main_geometry.centroid.y) / 2
    projected_width_m = width_m / max(0.01, math.cos(math.radians(latitude)))
    corridor = corridor_line.buffer(projected_width_m / 2)
    return _transform_web_mercator_geometry(corridor)


def sawara_tone_correction(base, year: int):
    """Connect the Sawara Tone control point to the largest DEM water polygon."""
    from shapely.geometry import Point

    width_m = SAWARA_CONNECTION_WIDTH_M.get(year)
    if width_m is None:
        return base.__class__()
    return connect_geometry_to_main(
        base,
        Point(*SAWARA_TONE_CONTROL_COORDINATE),
        width_m=width_m,
    )


def correct_katori_geometry(base, year: int, extra_additions: Sequence = ()):
    """Apply the ocean cut, Choshi inlet, bbox clip, and 1ha cleanup."""
    from shapely import union_all
    from shapely.geometry import MultiPolygon, Polygon, box

    additions = list(extra_additions)
    if year in CHOSHI_OUTLET_YEARS:
        additions.append(choshi_outlet_correction(base))
    geometry = apply_corrections(base, additions, [outer_ocean_exclusion()]).intersection(box(*STUDY_BBOX))
    projected = _transform_lon_lat_geometry(geometry)
    candidates = list(projected.geoms) if hasattr(projected, "geoms") else [projected]
    cleaned = []
    for polygon in candidates:
        if polygon.geom_type != "Polygon" or polygon.area < MIN_COMPONENT_AREA_M2:
            continue
        holes = [
            list(interior.coords)
            for interior in polygon.interiors
            if Polygon(interior).area >= MIN_HOLE_AREA_M2
        ]
        cleaned.append(Polygon(polygon.exterior.coords, holes))
    projected = union_all(cleaned) if cleaned else MultiPolygon()
    geography = _transform_web_mercator_geometry(projected)
    return geography.intersection(box(*STUDY_BBOX))


def _multipolygon(geometry) -> dict[str, object]:
    from shapely import force_2d
    from shapely.geometry import MultiPolygon, Polygon, mapping

    geometry = force_2d(geometry)
    if isinstance(geometry, Polygon):
        geometry = MultiPolygon([geometry])
    elif not isinstance(geometry, MultiPolygon):
        geometry = MultiPolygon([part for part in getattr(geometry, "geoms", []) if isinstance(part, Polygon)])
    geojson = mapping(geometry)
    return {
        "type": geojson["type"],
        "coordinates": round_coordinates(geojson["coordinates"], 5),
    }


def package(geometries: Mapping[int, object], accessed: str):
    """Build the public five-file package from corrected year geometries."""
    slug = SLUG
    entity_id = f"{slug}:entity:katori-sea"
    source_ids = {
        "dem": f"{slug}:source:gsi-dem",
        "address": f"{slug}:source:gsi-address-search",
        "city": f"{slug}:source:katori-city-vol208",
        "city_history": f"{slug}:source:katori-city-vol148",
        "museum": f"{slug}:source:chiba-museum-figure",
        "mlit": f"{slug}:source:mlit-tone-eastward",
        "notes": f"{slug}:source:chronomap-notes",
    }
    evidence_ids = {
        "dem": f"{slug}:evidence:dem-model",
        "address": f"{slug}:evidence:gsi-address-search",
        "city": f"{slug}:evidence:katori-city-vol208-map",
        "city_history": f"{slug}:evidence:katori-city-vol148",
        "museum": f"{slug}:evidence:chiba-museum-figure",
        "mlit": f"{slug}:evidence:mlit-tone-eastward",
        "outer_cut": f"{slug}:evidence:outer-ocean-cut",
        "outlet": f"{slug}:evidence:choshi-outlet",
        "inbanuma": f"{slug}:evidence:inbanuma-inlet",
        "teganuma": f"{slug}:evidence:teganuma-inlet",
        "sawara": f"{slug}:evidence:sawara-tone-channel",
    }
    sea_attribution = "国土地理院 標高タイル（DEM5a・DEM10b、Chronomapが加工・補正）"
    sea_terms = "国土地理院コンテンツ利用規約に従う。形状はChronomapのモデル推定で、引用元の図形は含まない。"
    dataset_period = temporal((700, 700), (1654, 1654), precision="year", qualifier="circa")
    dataset = {
        "schemaVersion": "1.0.0",
        "id": f"{slug}:dataset:dem-reconstruction",
        "title": {"ja": "香取海の推定水域（DEM）"},
        "description": {"ja": "国土地理院の現在標高から低地と外洋連結を抽出し、資料図との比較に基づく外洋カット、銚子口、印旛沼・手賀沼の入り江、佐原から銚子への水路の補正を加えたモデル推定です。"},
        "defaultLanguage": "ja",
        "bbox": list(STUDY_BBOX),
        "temporalExtent": dataset_period,
        "rights": {"status": "open-license", "attribution": sea_attribution, "terms": sea_terms},
        "display": {"minZoom": 6, "seaMask": True},
        "files": FILES,
    }
    entity = {
        "id": entity_id,
        "type": "coastline",
        "labels": {"ja": "香取海"},
        "description": {"ja": "古代から近世初期に霞ヶ浦・北浦・印旛沼・手賀沼や利根川下流の低地へ広がった内海のモデル推定。"},
    }

    thresholds = {700: 4.0, 1200: 3.0, 1600: 2.0}
    periods = {
        700: temporal((700, 700), (700, 700), precision="year", qualifier="circa"),
        1200: temporal((1200, 1200), (1200, 1200), precision="year", qualifier="circa"),
        1600: temporal((1600, 1600), (1654, 1654), precision="year", qualifier="circa"),
    }
    features = []
    for year, threshold_m in thresholds.items():
        geometry = geometries[year]
        correction_ids = [evidence_ids["outer_cut"]]
        if year in CHOSHI_OUTLET_YEARS:
            correction_ids.append(evidence_ids["outlet"])
        correction_ids.extend(
            evidence_ids[key]
            for key in ("inbanuma", "teganuma", "sawara")
        )
        feature_evidence = [
            evidence_ids[key]
            for key in ("dem", "address", "city", "city_history", "museum", "mlit")
        ] + correction_ids
        geometry_evidence = [evidence_ids["dem"], *correction_ids]
        uncertainty = {
            "temporal": assessment("approximate", "代表時点または代表期間であり、古地図の測量年や当時の水位を示しません。", [evidence_ids["city_history"], evidence_ids["mlit"]]),
            "location": assessment("approximate", "現在のDEMタイルと国土地理院住所検索の位置基準から作成しました。", [evidence_ids["dem"], evidence_ids["address"]]),
            "geometry": assessment("approximate", f"閾値{threshold_m:g}m、4近傍連結、100m簡略化と入り江・水路の概略補正を使いました。", geometry_evidence),
            "identity": assessment("well-supported", "自治体・博物館資料が香取の海として記載する地域の概略水域です。", [evidence_ids["city"], evidence_ids["museum"]]),
        }
        features.append(
            {
                "type": "Feature",
                "id": f"{slug}:version:{year}",
                "geometry": _multipolygon(geometry),
                "properties": {
                    "entityId": entity_id,
                    "labels": {"ja": "香取海"},
                    "description": {"ja": f"{year}年（標高閾値{threshold_m:g}m）の香取海のモデル推定です。DEM由来の低地・外洋連結に資料比較による補正を加えています。"},
                    "temporal": periods[year],
                    "uncertainty": uncertainty,
                    "evidenceIds": feature_evidence,
                    "publicationStatus": "public",
                    "rights": {"status": "open-license", "attribution": sea_attribution, "terms": sea_terms},
                },
            }
        )

    sources = [
        {
            "id": source_ids["dem"], "type": "government-dataset",
            "citation": "国土地理院 地理院タイル「標高データ」（DEM5a・DEM10b、2026年10月取得）",
            "title": {"ja": "地理院タイル 標高データ"}, "creators": ["国土地理院"], "publishedYear": 2026,
            "url": "https://cyberjapandata.gsi.go.jp/development/demtile.html", "accessedDate": accessed,
            "rights": {"status": "open-license", "attribution": "国土地理院", "terms": "国土地理院コンテンツ利用規約。出典と加工内容を表示。"},
        },
        {
            "id": source_ids["address"], "type": "official-api",
            "citation": "国土地理院 住所検索API（県名・市名付き検索、2026年10月19日）",
            "title": {"ja": "地理院地図 住所検索API"}, "creators": ["国土地理院"], "publishedYear": 2026,
            "url": "https://msearch.gsi.go.jp/address-search/AddressSearch?q=", "accessedDate": accessed,
            "rights": {"status": "open-license", "attribution": "国土地理院", "terms": "国土地理院コンテンツ利用規約。住所検索の応答座標を位置基準に使用。"},
        },
        {
            "id": source_ids["city"], "type": "official-web-page",
            "citation": "香取市『香取遺産 Vol.208 香取の海と新田開発』広報かとり 令和5年12月号",
            "title": {"ja": "香取の海と新田開発"}, "creators": ["香取市"], "publishedYear": 2023,
            "url": "https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/201-210.html", "accessedDate": accessed,
            "rights": {"status": "restricted", "terms": "引用メタデータのみ。掲載図は再配布・トレースしない。"},
        },
        {
            "id": source_ids["city_history"], "type": "official-web-page",
            "citation": "香取市『香取遺産 Vol.148 香取の海と新島十六島』広報かとり 平成30年4月号",
            "title": {"ja": "香取の海と新島十六島"}, "creators": ["香取市"], "publishedYear": 2018,
            "url": "https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/141-150.html", "accessedDate": accessed,
            "rights": {"status": "restricted", "terms": "引用メタデータのみ。掲載図は再配布・トレースしない。"},
        },
        {
            "id": source_ids["museum"], "type": "museum-publication",
            "citation": "千葉県立中央博物館『古代・中世の香取の海と水陸交通』",
            "title": {"ja": "古代・中世の香取の海と水陸交通"}, "creators": ["千葉県立中央博物館"], "publishedYear": 2026,
            "url": "https://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2026/03/katorijinguten_zuroku.pdf", "accessedDate": accessed,
            "rights": {"status": "restricted", "terms": "引用メタデータのみ。掲載図は再配布・トレースしない。"},
        },
        {
            "id": source_ids["mlit"], "type": "official-report",
            "citation": "国土交通省 関東地方整備局『「利根川の東遷」と「荒川の西遷」』",
            "title": {"ja": "利根川の東遷と荒川の西遷"}, "creators": ["国土交通省 関東地方整備局"], "publishedYear": 2013,
            "url": "https://www.ktr.mlit.go.jp/ktr_content/content/000853737.pdf", "accessedDate": accessed,
            "rights": {"status": "restricted", "terms": "引用メタデータのみ。本文・図は再配布しない。"},
        },
        {
            "id": source_ids["notes"], "type": "original-reconstruction-notes",
            "citation": "Chronomap『香取海 形状作成メモ』",
            "title": {"ja": "香取海 形状作成メモ"}, "creators": ["Chronomap contributors"], "publishedYear": 2026,
            "url": "https://github.com/ywatase/chronomap/blob/main/docs/data/katori-sea-shape-notes.md", "accessedDate": accessed,
            "rights": {"status": "open-license", "attribution": "Chronomap contributors", "terms": "Chronomapのモデル手法・概略補正。外部資料の権利条件は個別Sourceに従う。"},
        },
    ]
    evidence = [
        {
            "id": evidence_ids["dem"], "sourceId": source_ids["dem"],
            "locator": "DEM5a z13→DEM10b z13→DEM10b z12。700年4m・1200年3m・1600年2m。入り江用局所DEMは印旛沼4m・手賀沼5m。取得タイルは.cache/raw/dem/katori-sea/に保存。",
            "usage": "derived-geometry", "supports": ["geometry", "location"],
            "note": "RGB標高から外洋連結した閾値以下セルをポリゴン化し、外洋・銚子口・入り江・佐原水路補正後にも面積1ha未満の穴と断片を除去した。入り江成分は史料で範囲を確認した2地点だけを対象とする。",
            "publicationBasis": "open-license",
        },
        {
            "id": evidence_ids["address"], "sourceId": source_ids["address"],
            "locator": "土浦市大岩田・行方市玉造甲・潮来市潮来・香取市佐原・一ノ分目新田・印西市師戸・我孫子市高野山・銚子市川口町・犬吠埼・鹿嶋市宮中・成田市花崎町・佐倉市海隣寺町・鉾田市鉾田・大竹・つくば市研究学園・霞ヶ浦・北浦の検索応答。",
            "usage": "citation", "supports": ["location"],
            "note": "住所検索応答を位置基準と外洋seed・外洋カットに使った。入り江・佐原水路のPM指定検査点は別の作業指定座標として区別した。",
        },
        {
            "id": evidence_ids["city"], "sourceId": source_ids["city"],
            "locator": "Vol.208「香取の海と新田開発」、掲載模式図208-2。",
            "usage": "citation", "supports": ["geometry", "location", "identity"],
            "note": "中世頃の内海が霞ヶ浦・印旛沼・手賀沼を含むという説明と、模式図を形状比較に使った。図はトレースしない。",
        },
        {
            "id": evidence_ids["city_history"], "sourceId": source_ids["city_history"],
            "locator": "Vol.148「香取の海と新島十六島 利根川が流れる前と後」、約1000年前の流域想定図。",
            "usage": "citation", "supports": ["temporal", "geometry", "identity"],
            "note": "霞ヶ浦・印旛沼にまたがる広大な内海と銚子への流路変更を確認した。図はトレースしない。",
        },
        {
            "id": evidence_ids["museum"], "sourceId": source_ids["museum"],
            "locator": "「古代・中世の香取の海と水陸交通」の資料図。",
            "usage": "citation", "supports": ["geometry", "location", "identity"],
            "note": "古代・中世の水域と水陸交通の比較に使った。図の画像・形は公開パッケージへ含めない。",
        },
        {
            "id": evidence_ids["mlit"], "sourceId": source_ids["mlit"],
            "locator": "利根川東遷 1594〜1654年、銚子から太平洋へ流下する説明。",
            "usage": "citation", "supports": ["temporal", "geometry"],
            "note": "銚子口が太平洋側の流路終端であることと1600〜1654年の期間を確認した。",
        },
        {
            "id": evidence_ids["outer_cut"], "sourceId": source_ids["notes"],
            "locator": "形状メモの『鹿島灘・銚子沖の外洋側』補正。",
            "usage": "derived-geometry", "supports": ["geometry", "location"],
            "note": "鹿嶋市宮中・銚子市川口町・犬吠埼の住所検索応答をつないだ概略カットで、外洋側のNoData面を除いた。",
            "publicationBasis": "original-reconstruction",
        },
        {
            "id": evidence_ids["outlet"], "sourceId": source_ids["notes"],
            "locator": "形状メモの『銚子口』補正、1200年・1600年。",
            "usage": "derived-geometry", "supports": ["geometry", "location"],
            "note": "銚子市川口町の住所検索点からDEM境界までに幅300mの短い回廊を加えた。",
            "publicationBasis": "original-reconstruction",
        },
        {
            "id": evidence_ids["inbanuma"], "sourceId": source_ids["notes"],
            "locator": "形状メモの『印旛沼の入り江』補正。PM指定点(140.20,35.77)、DEM局所成分4m以下、全3年代。",
            "usage": "derived-geometry", "supports": ["geometry", "location"],
            "note": "香取市Vol.208は中世頃の香取海が印旛沼を含むと説明する。局所DEM低地成分を抽出し、最大主水域まで幅300mの概略回廊でつないだ。各代表年へ適用することは長期的な水域範囲を用いたモデル推定であり、各年の正確な湖岸を示さない。",
            "publicationBasis": "original-reconstruction",
        },
        {
            "id": evidence_ids["teganuma"], "sourceId": source_ids["notes"],
            "locator": "形状メモの『手賀沼の入り江』補正。PM指定点(140.06,35.86)、DEM局所成分5m以下、全3年代。",
            "usage": "derived-geometry", "supports": ["geometry", "location"],
            "note": "香取市Vol.208は中世頃の香取海が手賀沼を含むと説明する。局所DEM低地成分を抽出し、最大主水域まで幅300mの概略回廊でつないだ。各代表年へ適用することは長期的な水域範囲を用いたモデル推定であり、各年の正確な湖岸を示さない。",
            "publicationBasis": "original-reconstruction",
        },
        {
            "id": evidence_ids["sawara"], "sourceId": source_ids["notes"],
            "locator": "形状メモの『佐原の利根川出口』補正。PM指定点(140.50,35.90)、1200年幅300m、1600年幅700m。",
            "usage": "derived-geometry", "supports": ["geometry", "location"],
            "note": "香取市Vol.208・Vol.148と国土交通省の利根川東遷資料にある銚子方面への流路を保つ。DEM下地で切れた区間を指定点から最大主水域まで接続した。回廊幅は表示用モデルで、歴史上の河幅測量値ではない。700年はDEM下地が検査点を含み銚子まで連結する。",
            "publicationBasis": "original-reconstruction",
        },
    ]
    return dataset, [entity], sources, evidence, features


def import_katori(output_root: Path, cache_dir: Path, today: datetime.date | None = None) -> list[Path]:
    """Download/cache DEM tiles and atomically write the Katori Sea package."""
    accessed = (today or datetime.date.today()).isoformat()
    rows, origin_x, origin_y, _layers = load_dem_grid(cache_dir=cache_dir, padding=0)
    seeds = choshi_offshore_seeds(rows, origin_x, origin_y)
    resolution = (2 * _WEB_MERCATOR_HALF_WORLD_M) / (256 * (1 << DEM_ZOOM))
    grid_transform = (
        resolution,
        0,
        -_WEB_MERCATOR_HALF_WORLD_M + origin_x * 256 * resolution,
        0,
        -resolution,
        _WEB_MERCATOR_HALF_WORLD_M - origin_y * 256 * resolution,
    )
    inbanuma_geometry = lowland_component_geometry(
        rows,
        INBANUMA_CONTROL_COORDINATE,
        INBANUMA_LOCAL_THRESHOLD_M,
        origin_x,
        origin_y,
        grid_transform,
    )
    teganuma_geometry = lowland_component_geometry(
        rows,
        TEGANUMA_CONTROL_COORDINATE,
        TEGANUMA_LOCAL_THRESHOLD_M,
        origin_x,
        origin_y,
        grid_transform,
    )
    geometries = {}
    for year, threshold_m in ((700, 4.0), (1200, 3.0), (1600, 2.0)):
        mask = flood_fill(rows, threshold_m, seeds)
        base = polygonize_mask(mask, grid_transform, STUDY_BBOX)
        additions = [
            inbanuma_geometry,
            connect_geometry_to_main(base, inbanuma_geometry, INLET_CONNECTION_WIDTH_M),
            teganuma_geometry,
            connect_geometry_to_main(base, teganuma_geometry, INLET_CONNECTION_WIDTH_M),
        ]
        if year in SAWARA_CONNECTION_WIDTH_M:
            additions.append(sawara_tone_correction(base, year))
        geometries[year] = correct_katori_geometry(base, year, additions)
    output = output_root / SLUG
    write_package(output, *package(geometries, accessed))
    return [output]


def tile_range(bbox: tuple[float, float, float, float], zoom: int, padding: int = 0) -> list[tuple[int, int]]:
    """Return XYZ tiles covering a WGS84 bbox, in north-to-south row order."""
    min_lon, min_lat, max_lon, max_lat = bbox
    world_tiles = 1 << zoom

    def x_tile(longitude: float) -> int:
        return math.floor((longitude + 180) / 360 * world_tiles)

    def y_tile(latitude: float) -> int:
        latitude = max(-85.05112878, min(85.05112878, latitude))
        radians = math.radians(latitude)
        return math.floor((1 - math.asinh(math.tan(radians)) / math.pi) / 2 * world_tiles)

    min_x, max_x = x_tile(min_lon) - padding, x_tile(max_lon) + padding
    min_y, max_y = y_tile(max_lat) - padding, y_tile(min_lat) + padding
    return [(x, y) for y in range(min_y, max_y + 1) for x in range(min_x, max_x + 1)]


def _tile_path(cache_dir: Path, layer: str, zoom: int, x: int, y: int) -> tuple[Path, Path]:
    target = cache_dir / "dem" / SLUG / layer / str(zoom) / str(x) / f"{y}.png"
    return target, target.with_suffix(".png.missing")


def _download_tile(url: str, target: Path, missing_marker: Path) -> bytes | None:
    if target.is_file():
        return target.read_bytes()
    if missing_marker.is_file():
        return None

    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                payload = response.read()
        except urllib.error.HTTPError as error:
            if error.code == 404:
                missing_marker.parent.mkdir(parents=True, exist_ok=True)
                missing_marker.touch()
                time.sleep(REQUEST_INTERVAL)
                return None
            if attempt == 3:
                raise RawDataError(f"could not fetch {url}: {error}") from error
        except (OSError, urllib.error.URLError) as error:
            if attempt == 3:
                raise RawDataError(f"could not fetch {url}: {error}") from error
        else:
            if not payload.startswith(_PNG_SIGNATURE):
                raise RawDataError(f"invalid elevation tile response from {url}")
            target.parent.mkdir(parents=True, exist_ok=True)
            partial = target.with_suffix(".png.part")
            partial.write_bytes(payload)
            partial.replace(target)
            missing_marker.unlink(missing_ok=True)
            time.sleep(REQUEST_INTERVAL)
            return payload
        time.sleep(2**attempt)
    return None


def _upsample_parent(parent: list[array], child_x: int, child_y: int) -> list[array]:
    """Nearest-neighbor expand a z12 tile quadrant into its z13 child tile."""
    left = (child_x % 2) * 128
    top = (child_y % 2) * 128
    result: list[array] = []
    for parent_row in parent[top : top + 128]:
        expanded = array("h")
        for value in parent_row[left : left + 128]:
            expanded.extend((value, value))
        result.extend((expanded, expanded[:]))
    return result


def fetch_dem_tile(zoom: int, x: int, y: int, cache_dir: Path) -> tuple[list[array] | None, str | None]:
    """Fetch the preferred tile, falling back from DEM5a to DEM10b and z12."""
    for layer, template in DEM_LAYERS:
        target, missing_marker = _tile_path(cache_dir, layer, zoom, x, y)
        payload = _download_tile(template.format(z=zoom, x=x, y=y), target, missing_marker)
        if payload is not None:
            return decode_dem_png(payload), f"{layer}/z{zoom}"

    if zoom == DEM_ZOOM:
        parent_zoom = DEM_FALLBACK_ZOOM
        parent_x, parent_y = x // 2, y // 2
        target, missing_marker = _tile_path(cache_dir, "dem10b_png", parent_zoom, parent_x, parent_y)
        payload = _download_tile(
            DEM10B_URL.format(z=parent_zoom, x=parent_x, y=parent_y), target, missing_marker
        )
        if payload is not None:
            return _upsample_parent(decode_dem_png(payload), x, y), "dem10b_png/z12"
    return None, None


def load_dem_grid(
    bbox: tuple[float, float, float, float] = STUDY_BBOX,
    cache_dir: Path = Path(".cache/raw"),
    zoom: int = DEM_ZOOM,
    padding: int = 1,
) -> tuple[list[array], int, int, set[str]]:
    """Load a padded z13 mosaic, caching each raw tile below ``.cache/raw/dem``."""
    tiles = tile_range(bbox, zoom, padding)
    min_x = min(x for x, _y in tiles)
    min_y = min(y for _x, y in tiles)
    width = (max(x for x, _y in tiles) - min_x + 1) * 256
    height = (max(y for _x, y in tiles) - min_y + 1) * 256
    blank = array("h", [MISSING]) * width
    grid = [blank[:] for _row in range(height)]
    layers: set[str] = set()

    for tile_x, tile_y in tiles:
        tile_rows, layer = fetch_dem_tile(zoom, tile_x, tile_y, cache_dir)
        if tile_rows is None:
            continue
        layers.add(layer or "unknown")
        row_start = (tile_y - min_y) * 256
        column_start = (tile_x - min_x) * 256
        for local_row, values in enumerate(tile_rows):
            grid[row_start + local_row][column_start : column_start + 256] = values
    return grid, min_x, min_y, layers
