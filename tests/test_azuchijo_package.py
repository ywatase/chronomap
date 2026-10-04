from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics


ROOT = Path(__file__).parents[1]
PACKAGE = ROOT / "data" / "azuchijo"


def test_azuchijo_has_a_source_backed_omi_sphere_of_influence_polygon():
    package = load_package(PACKAGE)
    entities = {entity["id"]: entity for entity in package.entities}
    territory = entities["azuchijo:entity:omi-sphere"]
    assert territory["type"] == "sphere-of-influence"

    features = [
        feature
        for feature in package.feature_versions["features"]
        if feature["properties"]["entityId"] == territory["id"]
    ]
    assert len(features) == 2
    feature = next(item for item in features if item["id"] == "azuchijo:version:omi-sphere-1576-broad")
    assert feature["geometry"]["type"] == "Polygon"
    assert feature["properties"]["hypothesisGroupId"] == "azuchijo:hypothesis:omi-control-envelope-1576"
    assert feature["properties"]["hypothesisLabel"]["ja"] == "近江全体を囲む案"
    assert feature["properties"]["uncertainty"]["geometry"]["assessment"] == "approximate"
    assert "azuchijo:evidence:omi-control" in feature["properties"]["evidenceIds"]
    assert "azuchijo:evidence:omi-shape" in feature["properties"]["evidenceIds"]


def test_azuchijo_has_a_source_backed_omi_polity_center_hypotheses():
    package = load_package(PACKAGE)
    entities = {entity["id"]: entity for entity in package.entities}
    polity = entities["azuchijo:entity:omi-polity"]
    assert polity["type"] == "polity"

    features = [
        feature
        for feature in package.feature_versions["features"]
        if feature["properties"]["entityId"] == polity["id"]
    ]
    assert len(features) == 2
    assert {feature["geometry"]["type"] for feature in features} == {"Polygon"}
    assert {feature["properties"]["hypothesisGroupId"] for feature in features} == {
        "azuchijo:hypothesis:omi-polity-center-1576"
    }
    assert {feature["properties"]["hypothesisLabel"]["ja"] for feature in features} == {
        "安土城中心案",
        "安土城下町・湖岸を含む案",
    }
    assert all(feature["properties"]["uncertainty"]["identity"]["assessment"] == "approximate" for feature in features)
    assert all("azuchijo:evidence:omi-polity" in feature["properties"]["evidenceIds"] for feature in features)
    assert all("azuchijo:evidence:omi-polity-shape" in feature["properties"]["evidenceIds"] for feature in features)


def test_azuchijo_territory_passes_public_validation():
    package = load_package(PACKAGE)
    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []
