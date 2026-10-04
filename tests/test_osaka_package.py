from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics


ROOT = Path(__file__).parents[1]
PACKAGE = ROOT / "data" / "osaka"


def test_osaka_has_a_valid_historical_map_asset_for_the_osaka_tile_scope():
    package = load_package(PACKAGE)
    dataset = package.dataset
    assets = dataset["historicalMapAssets"]
    assert len(assets) == 1
    asset = assets[0]
    assert asset["tileTemplate"].startswith("https://cyberjapandata.gsi.go.jp/xyz/ort_riku10/")
    assert asset["bbox"] == (135.44, 34.59, 135.57, 34.78)
    assert asset["rights"]["status"] == "open-license"
    assert asset["georeference"]["error"]


def test_osaka_has_source_backed_core_historical_contexts():
    package = load_package(PACKAGE)
    entities = {entity["id"]: entity for entity in package.entities}
    expected = {
        "osaka:entity:kawachi-bay": ("waterbody", "Polygon"),
        "osaka:entity:ishiyama-honganji": ("fortification", "Point"),
        "osaka:entity:ishiyama-teramachi": ("settlement", "Polygon"),
        "osaka:entity:watanabe-port": ("port", "Point"),
        "osaka:entity:yodo-watercourse": ("watercourse", "LineString"),
    }
    features = package.feature_versions["features"]
    for entity_id, (entity_type, geometry_type) in expected.items():
        assert entities[entity_id]["type"] == entity_type
        matches = [feature for feature in features if feature["properties"]["entityId"] == entity_id]
        assert len(matches) == 1
        feature = matches[0]
        assert feature["geometry"]["type"] == geometry_type
        assert feature["properties"]["publicationStatus"] == "public"
        assert feature["properties"]["uncertainty"]["geometry"]["assessment"] == "approximate"
        assert feature["properties"]["evidenceIds"]


def test_osaka_keeps_old_map_context_separate_from_historical_geometry():
    package = load_package(PACKAGE)
    features = package.feature_versions["features"]
    assert all("ort_riku10" not in feature["properties"]["description"]["ja"] for feature in features)
    assert "1936〜1942年頃" in package.dataset["historicalMapAssets"][0]["date"]
    assert "当時の古代・中世geometryを示すものではない" in package.dataset["historicalMapAssets"][0]["description"]["ja"]


def test_osaka_package_passes_public_validation():
    package = load_package(PACKAGE)
    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []
