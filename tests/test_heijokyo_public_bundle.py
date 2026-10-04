import json
from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.public_builder import build_public_bundle


ROOT = Path(__file__).parents[1]
DATA = ROOT / "data" / "heijokyo"
FILES = ("dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson")


def test_heijokyo_public_bundle_contains_reachable_records(tmp_path: Path):
    output = tmp_path / "public"
    build_public_bundle(load_package(DATA), output)

    features = json.loads((output / "feature-versions.geojson").read_text(encoding="utf-8"))
    assert len(features["features"]) == 5
    assert {feature["id"] for feature in features["features"]} == {
        "heijokyo:version:capital-710",
        "heijokyo:version:capital-boundary-inner-710",
        "heijokyo:version:capital-boundary-outer-710",
        "heijokyo:version:palace-710",
        "heijokyo:version:suzaku-avenue-710",
    }
    assert {feature["properties"]["entityId"] for feature in features["features"]} == {
        "heijokyo:entity:capital",
        "heijokyo:entity:capital-boundary",
        "heijokyo:entity:palace",
        "heijokyo:entity:suzaku-avenue",
    }
    sources = json.loads((output / "sources.json").read_text(encoding="utf-8"))
    evidence = json.loads((output / "evidence.json").read_text(encoding="utf-8"))
    restricted_ids = {source["id"] for source in sources if source["rights"]["status"] == "restricted"}
    assert restricted_ids
    assert all(item["usage"] == "citation" for item in evidence if item["sourceId"] in restricted_ids)
    assert all(item["note"] == "Citation-only metadata; no authored source content is reproduced." for item in evidence if item["sourceId"] in restricted_ids)


def test_heijokyo_public_bundle_is_deterministic(tmp_path: Path):
    first = tmp_path / "first"
    second = tmp_path / "second"
    package = load_package(DATA)
    build_public_bundle(package, first)
    build_public_bundle(package, second)

    assert [(name, (first / name).read_bytes()) for name in FILES] == [
        (name, (second / name).read_bytes()) for name in FILES
    ]
