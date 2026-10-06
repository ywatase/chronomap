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
    ring = feature["geometry"]["coordinates"][0]
    assert len(ring) >= 50
    assert max(math.dist(a, b) for a, b in zip(ring, ring[1:])) < 0.004
    assert (round(min(point[0] for point in ring), 3), round(max(point[0] for point in ring), 3)) == (135.757, 135.799)
    assert (round(min(point[1] for point in ring), 3), round(max(point[1] for point in ring), 3)) == (34.899, 34.927)
    assert any(point[0] < 135.758 and 34.909 <= point[1] <= 34.911 for point in ring)  # west inlet
    assert any(point[0] > 135.798 and 34.916 <= point[1] <= 34.919 for point in ring)  # east shoulder
    assert any(point[1] < 34.9 and 135.783 <= point[0] <= 135.787 for point in ring)  # south bay
    assert any(point[1] > 34.926 and 135.779 <= point[0] <= 135.783 for point in ring)  # north lobe
    turns = []
    unique_count = len(ring) - 1
    for index in range(unique_count):
        previous, current, following = ring[(index - 1) % unique_count], ring[index], ring[(index + 1) % unique_count]
        turns.append((current[0] - previous[0]) * (following[1] - current[1]) - (current[1] - previous[1]) * (following[0] - current[0]))
    assert sum(turn > 0 for turn in turns) > 8
    assert sum(turn < 0 for turn in turns) > 8
    assert feature["properties"]["uncertainty"]["geometry"]["assessment"] == "approximate"


def test_ogurike_historical_waterbodies_use_organic_approximate_outlines():
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
        ring = feature["geometry"]["coordinates"][0]
        assert len(ring) >= 38
        assert ring[0] == ring[-1]
        assert max(math.dist(a, b) for a, b in zip(ring, ring[1:])) < 0.004
        assert feature["properties"]["uncertainty"]["geometry"]["assessment"] == "approximate"

    # The official overview describes the former lake as roughly 4 km east-west
    # and 3 km north-south. These guards keep a hand-drawn outline from
    # regressing to the old 7 km-wide placeholder or a pin-sized shape.
    for feature in waterbodies.values():
        ring = feature["geometry"]["coordinates"][0]
        width = max(point[0] for point in ring) - min(point[0] for point in ring)
        height = max(point[1] for point in ring) - min(point[1] for point in ring)
        assert 0.025 <= width <= 0.06
        assert 0.02 <= height <= 0.04

    # A historical shoreline should contain both convex and concave turns;
    # a smoothed ellipse is still not enough to communicate the source maps.
    for feature in waterbodies.values():
        ring = feature["geometry"]["coordinates"][0]
        unique_count = len(ring) - 1
        turns = []
        for index in range(unique_count):
            previous, current, following = ring[(index - 1) % unique_count], ring[index], ring[(index + 1) % unique_count]
            turns.append((current[0] - previous[0]) * (following[1] - current[1]) - (current[1] - previous[1]) * (following[0] - current[0]))
        assert sum(turn > 0 for turn in turns) >= 4
        assert sum(turn < 0 for turn in turns) >= 4
