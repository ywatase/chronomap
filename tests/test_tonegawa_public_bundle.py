import json
from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.public_builder import build_public_bundle


ROOT = Path(__file__).parents[1]
DATA = ROOT / "data" / "tonegawa"
FILES = ("dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson")


def test_tonegawa_public_bundle_is_reachable_and_deterministic(tmp_path: Path):
    first = tmp_path / "first"
    second = tmp_path / "second"
    package = load_package(DATA)
    build_public_bundle(package, first)
    build_public_bundle(package, second)

    features = json.loads((first / "feature-versions.geojson").read_text(encoding="utf-8"))
    assert len(features["features"]) == 3
    assert {feature["properties"]["entityId"] for feature in features["features"]} == {
        "tonegawa:entity:river",
        "tonegawa:entity:kawamata-closure",
    }
    sources = json.loads((first / "sources.json").read_text(encoding="utf-8"))
    evidence = json.loads((first / "evidence.json").read_text(encoding="utf-8"))
    restricted_ids = {source["id"] for source in sources if source["rights"]["status"] == "restricted"}
    assert all(item["usage"] == "citation" for item in evidence if item["sourceId"] in restricted_ids)
    assert [(name, (first / name).read_bytes()) for name in FILES] == [
        (name, (second / name).read_bytes()) for name in FILES
    ]
