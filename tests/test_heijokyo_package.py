from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics


ROOT = Path(__file__).parents[1]
PACKAGE = ROOT / "data" / "heijokyo"


def test_heijokyo_package_has_public_approximate_reconstructions():
    package = load_package(PACKAGE)
    assert package.dataset["defaultLanguage"] == "ja"
    assert len(package.entities) == 4
    assert len(package.feature_versions["features"]) == 5
    assert {feature["geometry"]["type"] for feature in package.feature_versions["features"]} == {"Point", "LineString", "Polygon"}
    assert {feature["properties"]["temporal"]["start"]["earliestYear"] for feature in package.feature_versions["features"]} == {710}
    assert all(feature["properties"]["publicationStatus"] == "public" for feature in package.feature_versions["features"])
    assert all(value["assessment"] == "approximate" for feature in package.feature_versions["features"] for value in feature["properties"]["uncertainty"].values())


def test_heijokyo_has_two_source_backed_boundary_hypotheses():
    package = load_package(PACKAGE)
    entities = {entity["id"]: entity for entity in package.entities}
    boundary = entities["heijokyo:entity:capital-boundary"]
    assert boundary["type"] == "boundary"

    features = [
        feature
        for feature in package.feature_versions["features"]
        if feature["properties"]["entityId"] == boundary["id"]
    ]
    assert len(features) == 2
    assert {feature["geometry"]["type"] for feature in features} == {"Polygon"}
    assert {feature["properties"]["hypothesisGroupId"] for feature in features} == {
        "heijokyo:hypothesis:capital-boundary-710"
    }
    assert {feature["properties"]["hypothesisLabel"]["ja"] for feature in features} == {
        "内京中心案",
        "外京を含む案",
    }
    assert all(feature["properties"]["uncertainty"]["geometry"]["assessment"] == "approximate" for feature in features)
    assert all("heijokyo:evidence:capital-extent" in feature["properties"]["evidenceIds"] for feature in features)
    assert all("heijokyo:evidence:boundary-shape" in feature["properties"]["evidenceIds"] for feature in features)


def test_heijokyo_package_passes_public_validation():
    package = load_package(PACKAGE)
    assert validate_package(package, ValidationProfile.AUTHORING) == []
    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []
