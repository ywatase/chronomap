from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics


ROOT = Path(__file__).parents[1]
PACKAGE = ROOT / "data" / "sekigahara"


def test_sekigahara_has_source_backed_battlefield_route_and_settlement_contexts():
    package = load_package(PACKAGE)
    entities = {entity["id"]: entity for entity in package.entities}
    expected = {
        "sekigahara:entity:battlefield": ("battlefield", "Point"),
        "sekigahara:entity:nakasendo-route": ("route", "LineString"),
        "sekigahara:entity:sekigahara-juku": ("settlement", "Point"),
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


def test_sekigahara_keeps_unverified_polity_and_boundary_shapes_out_of_public_bundle():
    package = load_package(PACKAGE)
    types = {entity["type"] for entity in package.entities}
    assert "polity" not in types
    assert "sphere-of-influence" not in types
    assert "boundary" not in types
    shape_notes = (ROOT / "docs" / "data" / "sekigahara-shape-notes.md").read_text(encoding="utf-8")
    assert "行政境界" in shape_notes
    assert "追加していない" in shape_notes


def test_sekigahara_uses_the_battle_year_and_traffic_context_as_distinct_features():
    package = load_package(PACKAGE)
    features = {feature["id"]: feature for feature in package.feature_versions["features"]}
    battlefield = features["sekigahara:version:battlefield-1600"]
    route = features["sekigahara:version:nakasendo-1600"]
    settlement = features["sekigahara:version:sekigahara-juku-1600"]
    assert battlefield["properties"]["temporal"]["start"]["qualifier"] == "exact"
    assert route["properties"]["temporal"]["start"]["qualifier"] == "circa"
    assert settlement["properties"]["temporal"]["start"]["qualifier"] == "circa"
    assert route["geometry"]["type"] == "LineString"
    assert settlement["geometry"]["type"] == "Point"


def test_sekigahara_package_passes_public_validation():
    package = load_package(PACKAGE)
    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []
