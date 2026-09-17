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
    assert len(package.entities) == 3
    assert len(package.feature_versions["features"]) == 3
    assert {feature["geometry"]["type"] for feature in package.feature_versions["features"]} == {"Point", "LineString", "Polygon"}
    assert {feature["properties"]["temporal"]["start"]["earliestYear"] for feature in package.feature_versions["features"]} == {710}
    assert all(feature["properties"]["publicationStatus"] == "public" for feature in package.feature_versions["features"])
    assert all(value["assessment"] == "approximate" for feature in package.feature_versions["features"] for value in feature["properties"]["uncertainty"].values())


def test_heijokyo_package_passes_public_validation():
    package = load_package(PACKAGE)
    assert validate_package(package, ValidationProfile.AUTHORING) == []
    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []
