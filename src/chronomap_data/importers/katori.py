"""Build a model estimate of the Katori Sea from GSI elevation tiles."""

from array import array
from collections import deque
import math
from pathlib import Path
import struct
import time
import urllib.error
import urllib.request
import zlib

from .common import RawDataError

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
_PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
STUDY_BBOX = (139.95, 35.65, 140.95, 36.25)


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
