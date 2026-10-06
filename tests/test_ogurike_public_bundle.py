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
    assert len(ring) >= 90
    assert max(math.dist(a, b) for a, b in zip(ring, ring[1:])) < 0.002
    assert (round(min(point[0] for point in ring), 3), round(max(point[0] for point in ring), 3)) == (135.763, 135.79)
    assert (round(min(point[1] for point in ring), 3), round(max(point[1] for point in ring), 3)) == (34.898, 34.923)
    assert any(point[0] < 135.764 and 34.906 <= point[1] <= 34.909 for point in ring)  # west inlet
    assert any(point[0] > 135.789 and 34.907 <= point[1] <= 34.91 for point in ring)  # east shoulder
    assert any(point[1] < 34.899 and 135.777 <= point[0] <= 135.781 for point in ring)  # south bay
    assert any(point[1] > 34.922 and 135.781 <= point[0] <= 135.784 for point in ring)  # north lobe
    turns = []
    unique_count = len(ring) - 1
    for index in range(unique_count):
        previous, current, following = ring[(index - 1) % unique_count], ring[index], ring[(index + 1) % unique_count]
        turns.append((current[0] - previous[0]) * (following[1] - current[1]) - (current[1] - previous[1]) * (following[0] - current[0]))
    assert sum(turn > 0 for turn in turns) > 8
    assert sum(turn < 0 for turn in turns) > 8
    assert feature["properties"]["uncertainty"]["geometry"]["assessment"] == "approximate"
