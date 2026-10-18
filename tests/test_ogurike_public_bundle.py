import json
import math
from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.public_builder import build_public_bundle


ROOT = Path(__file__).parents[1]
DATA = ROOT / "data" / "ogurike"
FILES = ("dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson")


def test_ogurike_public_bundle_has_only_reachable_public_records(tmp_path: Path):
    output = tmp_path / "public"
    build_public_bundle(load_package(DATA), output)

    features = json.loads((output / "feature-versions.geojson").read_text(encoding="utf-8"))
    assert len(features["features"]) == 8
    assert {feature["properties"]["entityId"] for feature in features["features"]} == {
        "ogurike:entity:waterbody",
        "ogurike:entity:ujigawa",
        "ogurike:entity:reclamation-monument",
    }

    sources = json.loads((output / "sources.json").read_text(encoding="utf-8"))
    evidence = json.loads((output / "evidence.json").read_text(encoding="utf-8"))
    restricted_ids = {source["id"] for source in sources if source["rights"]["status"] == "restricted"}
    assert restricted_ids
    assert all(record["usage"] == "citation" for record in evidence if record["sourceId"] in restricted_ids)
    assert all(record["note"] == "Citation-only metadata; no authored source content is reproduced." for record in evidence if record["sourceId"] in restricted_ids)


def test_ogurike_public_bundle_is_deterministic(tmp_path: Path):
    first = tmp_path / "first"
    second = tmp_path / "second"
    package = load_package(DATA)
    build_public_bundle(package, first)
    build_public_bundle(package, second)

    assert [(name, (first / name).read_bytes()) for name in FILES] == [
        (name, (second / name).read_bytes()) for name in FILES
    ]


def test_ogurike_1910_waterbody_keeps_a_readable_historical_outline():
    package = load_package(DATA)
    feature = next(item for item in package.feature_versions["features"] if item["id"] == "ogurike:version:waterbody-1910")

    # The outline is still explicitly approximate, but it must retain the
    # source-figure shoreline bends instead of regressing to a generic
    # octagon that cannot communicate the former shoreline.
    assert feature["geometry"]["type"] == "Polygon"
    coordinates = feature["geometry"]["coordinates"]
    assert len(coordinates) == 1  # only the main pool's exterior; no unverified islands/holes
    ring = coordinates[0]
    assert len(ring) >= 50
    assert max(math.dist(a, b) for a, b in zip(ring, ring[1:])) < 0.0041
    assert (round(min(point[0] for point in ring), 3), round(max(point[0] for point in ring), 3)) == (135.739, 135.782)
    assert (round(min(point[1] for point in ring), 3), round(max(point[1] for point in ring), 3)) == (34.889, 34.918)
    assert any(point[0] < 135.741 and 34.900 <= point[1] <= 34.903 for point in ring)  # west inlet
    assert any(point[0] > 135.781 and 34.899 <= point[1] <= 34.902 for point in ring)  # east shoulder
    assert any(point[1] < 34.891 and 135.758 <= point[0] <= 135.761 for point in ring)  # south bay
    assert any(point[1] > 34.916 and 135.758 <= point[0] <= 135.763 for point in ring)  # northern shoulder
    turns = []
    unique_count = len(ring) - 1
    for index in range(unique_count):
        previous, current, following = ring[(index - 1) % unique_count], ring[index], ring[(index + 1) % unique_count]
        turns.append((current[0] - previous[0]) * (following[1] - current[1]) - (current[1] - previous[1]) * (following[0] - current[0]))
    assert sum(turn > 0 for turn in turns) > 8
    assert sum(turn < 0 for turn in turns) > 8
    assert feature["properties"]["uncertainty"]["geometry"]["assessment"] == "approximate"


def test_ogurike_1910_outline_reflects_its_own_source_figure():
    package = load_package(DATA)
    features = {item["id"]: item for item in package.feature_versions["features"]}
    outline_1596 = features["ogurike:version:waterbody-1596"]["geometry"]["coordinates"][0]
    outline_1910 = features["ogurike:version:waterbody-1910"]["geometry"]["coordinates"][0]

    # The 1910 snapshot must be independently interpreted from figure ④. A
    # translated or uniformly scaled copy of the 1596 outline hides the
    # documented change in the main pool's bays and south shore.
    assert normalized_outline_distance(outline_1596, outline_1910) > 0.08


def test_ogurike_1885_pool_uses_the_codh_estimated_lake_geometry():
    from shapely.geometry import shape

    package = load_package(DATA)
    pool = next(item for item in package.feature_versions["features"] if item["id"] == "ogurike:version:waterbody-1885")
    geometry = shape(pool["geometry"])

    assert geometry.geom_type == "MultiPolygon"
    assert geometry.is_valid
    assert all(
        math.isclose(actual, expected, abs_tol=0.00003)
        for actual, expected in zip(geometry.bounds, (135.74001, 34.88721, 135.78416, 34.92123))
    )
    assert geometry.area > 0.0007


def test_ogurike_1885_outline_and_caveat_use_the_registered_figure_evidence():
    package = load_package(DATA)
    pool = next(item for item in package.feature_versions["features"] if item["id"] == "ogurike:version:waterbody-1885")
    properties = pool["properties"]
    evidence_id = "ogurike:evidence:waterbody-1885-geometry"

    assert properties["uncertainty"]["geometry"]["assessment"] == "approximate"
    assert properties["uncertainty"]["location"]["assessment"] == "approximate"
    assert evidence_id in properties["uncertainty"]["geometry"]["evidenceIds"]
    assert evidence_id in properties["uncertainty"]["location"]["evidenceIds"]
    assert evidence_id in properties["evidenceIds"]
    assert "ID 26007" in properties["description"]["ja"]
    assert "1885年の測量成果であることは示しません" in properties["description"]["ja"]


def test_ogurike_1590_pool_is_independent_with_northern_inlets_and_a_caveated_river_connection():
    package = load_package(DATA)
    features = {item["id"]: item for item in package.feature_versions["features"]}
    pool = features["ogurike:version:waterbody-1590"]
    outline_1590 = pool["geometry"]["coordinates"][0]
    outline_1596 = features["ogurike:version:waterbody-1596"]["geometry"]["coordinates"][0]
    river = features["ogurike:version:ujigawa-1590"]

    assert pool["geometry"]["type"] == "Polygon"
    assert len(pool["geometry"]["coordinates"]) == 1  # main basin only; no speculative islands or branches
    # These snapshots share a broad basin footprint, so require a meaningful
    # shoreline difference without exaggerating it to clear an arbitrary gap.
    assert normalized_outline_distance(outline_1596, outline_1590) > 0.07
    # Three broad northern water inlets join the central basin, with shore
    # between them; these are shape landmarks, not asserted river branches.
    assert point_in_polygon((135.75418, 34.91545), outline_1590)
    assert not point_in_polygon((135.75818, 34.91545), outline_1590)
    assert point_in_polygon((135.76418, 34.91545), outline_1590)
    assert not point_in_polygon((135.76818, 34.91545), outline_1590)
    assert point_in_polygon((135.77418, 34.91545), outline_1590)
    north_inlet_bands = ((135.752, 135.758), (135.762, 135.768), (135.772, 135.778))
    assert all(sum(start <= point[0] <= end and point[1] >= 34.913 for point in outline_1590[:-1]) >= 3 for start, end in north_inlet_bands)
    assert minimum_vertex_angle(outline_1590) >= 60  # no needle-like spike or abrupt reversal
    assert line_crosses_polygon_interior(river["geometry"]["coordinates"], outline_1590)
    assert "主水域" in pool["properties"]["description"]["ja"]
    assert "網状河道" in pool["properties"]["description"]["ja"]
    assert "補間頂点" in pool["properties"]["uncertainty"]["geometry"]["note"]
    assert "代表線" in river["properties"]["description"]["ja"]


def test_ogurike_1590_main_pool_and_river_location_cite_geometry_evidence():
    package = load_package(DATA)
    features = {item["id"]: item for item in package.feature_versions["features"]}
    evidence_id = "ogurike:evidence:waterbody-1590-geometry"
    pool = features["ogurike:version:waterbody-1590"]["properties"]
    river = features["ogurike:version:ujigawa-1590"]["properties"]

    assert pool["uncertainty"]["geometry"]["assessment"] == "approximate"
    assert pool["uncertainty"]["location"]["assessment"] == "approximate"
    assert evidence_id in pool["uncertainty"]["geometry"]["evidenceIds"]
    assert evidence_id in pool["uncertainty"]["location"]["evidenceIds"]
    assert "ogurike:evidence:ujigawa-1590-geometry" in river["uncertainty"]["location"]["evidenceIds"]


def test_ogurike_1933_pool_does_not_invent_a_large_shrink_from_1910():
    from shapely.geometry import shape

    package = load_package(DATA)
    features = {item["id"]: item for item in package.feature_versions["features"]}
    geometry_1910 = shape(features["ogurike:version:waterbody-1910"]["geometry"])
    geometry_1933 = shape(features["ogurike:version:waterbody-1933"]["geometry"])

    # Figure ⑤ draws a main pool of broadly comparable size to figure ④.
    # It does not establish the large contraction in the previous polygon.
    area_ratio = geometry_1933.area / geometry_1910.area
    assert 1.0 < area_ratio <= 1.1


def test_ogurike_1596_ujigawa_does_not_cross_the_main_pool():
    package = load_package(DATA)
    features = {item["id"]: item for item in package.feature_versions["features"]}
    river = features["ogurike:version:ujigawa-1596"]["geometry"]["coordinates"]
    lake = features["ogurike:version:waterbody-1596"]["geometry"]["coordinates"][0]

    assert not line_crosses_polygon_interior(river, lake)


def test_ogurike_1596_ujigawa_stays_near_the_lakes_north_side():
    package = load_package(DATA)
    features = {item["id"]: item for item in package.feature_versions["features"]}
    river = features["ogurike:version:ujigawa-1596"]["geometry"]["coordinates"]
    lake = features["ogurike:version:waterbody-1596"]["geometry"]["coordinates"][0]
    lake_north = max(point[1] for point in lake)
    lake_height = lake_north - min(point[1] for point in lake)
    lake_min_lon = min(point[0] for point in lake)
    lake_max_lon = max(point[0] for point in lake)
    river_points_along_pool = [point for point in river if lake_min_lon <= point[0] <= lake_max_lon]

    assert len(river_points_along_pool) >= 4
    # Over the pool's longitude span, keep the line close to its northern edge
    # relative to the pool's full north-south extent, not a fixed loose margin.
    assert max(abs(point[1] - lake_north) for point in river_points_along_pool) <= lake_height * 0.2
    assert min(point[0] for point in river) < lake_max_lon - 0.02
    assert max(point[0] for point in river) > lake_max_lon
    assert all(round(coordinate, 3) == coordinate for point in river for coordinate in point)


def test_ogurike_1596_ujigawa_location_uses_geometry_evidence():
    package = load_package(DATA)
    feature = next(item for item in package.feature_versions["features"] if item["id"] == "ogurike:version:ujigawa-1596")

    assert "ogurike:evidence:ujigawa-1596-geometry" in feature["properties"]["uncertainty"]["location"]["evidenceIds"]


def test_ogurike_historical_waterbodies_use_organic_approximate_outlines():
    from shapely.geometry import shape

    package = load_package(DATA)
    waterbodies = {
        item["id"]: item
        for item in package.feature_versions["features"]
        if item["properties"]["entityId"] == "ogurike:entity:waterbody"
    }

    assert set(waterbodies) == {
        "ogurike:version:waterbody-1590",
        "ogurike:version:waterbody-1596",
        "ogurike:version:waterbody-1885",
        "ogurike:version:waterbody-1910",
        "ogurike:version:waterbody-1933",
    }
    for feature in waterbodies.values():
        geometry = feature["geometry"]
        if geometry["type"] == "MultiPolygon":
            continue  # the 1885 CODH and 1933 GSI source shapes are preserved as multipolygons
        ring = geometry["coordinates"][0]
        assert len(ring) >= 38
        assert ring[0] == ring[-1]
        assert max(math.dist(a, b) for a, b in zip(ring, ring[1:])) < 0.0041
        assert feature["properties"]["uncertainty"]["geometry"]["assessment"] == "approximate"

    # The official overview describes the former lake as roughly 4 km east-west
    # and 3 km north-south. These guards keep a hand-drawn outline from
    # regressing to the old 7 km-wide placeholder or a pin-sized shape.
    for feature in waterbodies.values():
        min_x, min_y, max_x, max_y = shape(feature["geometry"]).bounds
        width = max_x - min_x
        height = max_y - min_y
        assert 0.025 <= width <= 0.06
        assert 0.02 <= height <= 0.04

    # The hand-reconstructed years should retain both convex and concave turns.
    for feature in waterbodies.values():
        if feature["geometry"]["type"] == "MultiPolygon":
            continue
        ring = feature["geometry"]["coordinates"][0]
        unique_count = len(ring) - 1
        turns = []
        for index in range(unique_count):
            previous, current, following = ring[(index - 1) % unique_count], ring[index], ring[(index + 1) % unique_count]
            turns.append((current[0] - previous[0]) * (following[1] - current[1]) - (current[1] - previous[1]) * (following[0] - current[0]))
        assert sum(turn > 0 for turn in turns) >= 4
        assert sum(turn < 0 for turn in turns) >= 4


def normalized_outline_distance(first, second, samples=48):
    first = sample_normalized_outline(first, samples)
    second = sample_normalized_outline(second, samples)
    candidates = []
    for outline in (second, list(reversed(second))):
        for offset in range(samples):
            distances = [
                math.dist(first[index], outline[(index + offset) % samples])
                for index in range(samples)
            ]
            candidates.append(math.sqrt(sum(distance * distance for distance in distances) / samples))
    return min(candidates)


def minimum_vertex_angle(ring):
    unique_count = len(ring) - 1
    angles = []
    for index in range(unique_count):
        previous = ring[(index - 1) % unique_count]
        current = ring[index]
        following = ring[(index + 1) % unique_count]
        first = (previous[0] - current[0], previous[1] - current[1])
        second = (following[0] - current[0], following[1] - current[1])
        cosine = sum(a * b for a, b in zip(first, second)) / (math.hypot(*first) * math.hypot(*second))
        angles.append(math.degrees(math.acos(max(-1, min(1, cosine)))))
    return min(angles)


def line_crosses_polygon_interior(line, ring):
    if any(point_in_polygon(point, ring) for point in line):
        return True

    for start, end in zip(line, line[1:]):
        midpoint = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2)
        if point_in_polygon(midpoint, ring):
            return True
        for edge_start, edge_end in zip(ring, ring[1:]):
            if segments_cross_interior(start, end, edge_start, edge_end):
                return True
    return False


def point_in_polygon(point, ring):
    x, y = point
    inside = False
    for start, end in zip(ring, ring[1:]):
        if (start[1] > y) != (end[1] > y):
            crossing_x = start[0] + (y - start[1]) * (end[0] - start[0]) / (end[1] - start[1])
            if x < crossing_x:
                inside = not inside
    return inside


def segments_cross_interior(first_start, first_end, second_start, second_end):
    def orientation(start, end, point):
        return (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0])

    first_side_a = orientation(first_start, first_end, second_start)
    first_side_b = orientation(first_start, first_end, second_end)
    second_side_a = orientation(second_start, second_end, first_start)
    second_side_b = orientation(second_start, second_end, first_end)
    return first_side_a * first_side_b < 0 and second_side_a * second_side_b < 0


def polygon_area(ring):
    return abs(sum(
        start[0] * end[1] - end[0] * start[1]
        for start, end in zip(ring, ring[1:])
    )) / 2


def sample_normalized_outline(ring, samples):
    points = ring[:-1]
    min_x = min(point[0] for point in points)
    max_x = max(point[0] for point in points)
    min_y = min(point[1] for point in points)
    max_y = max(point[1] for point in points)
    normalized = [((x - min_x) / (max_x - min_x), (y - min_y) / (max_y - min_y)) for x, y in points]
    segment_lengths = [math.dist(normalized[index], normalized[(index + 1) % len(normalized)]) for index in range(len(normalized))]
    perimeter = sum(segment_lengths)
    sampled = []
    for sample in range(samples):
        distance = perimeter * sample / samples
        for index, segment_length in enumerate(segment_lengths):
            if distance <= segment_length or index == len(segment_lengths) - 1:
                start = normalized[index]
                end = normalized[(index + 1) % len(normalized)]
                ratio = 0 if segment_length == 0 else distance / segment_length
                sampled.append((start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio))
                break
            distance -= segment_length
    return sampled
