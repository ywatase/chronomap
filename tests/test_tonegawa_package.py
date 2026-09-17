from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics


ROOT = Path(__file__).parents[1]
PACKAGE = ROOT / "data" / "tonegawa"


def test_tonegawa_package_has_two_entities_and_three_public_versions():
    package = load_package(PACKAGE)
    assert package.dataset["defaultLanguage"] == "ja"
    assert len(package.entities) == 2
    features = package.feature_versions["features"]
    assert len(features) == 3
    assert {feature["geometry"]["type"] for feature in features} == {"Point", "LineString"}
    assert {feature["properties"]["temporal"]["start"]["earliestYear"] for feature in features} == {1590, 1594, 1654}
    assert all(feature["properties"]["publicationStatus"] == "public" for feature in features)


def test_tonegawa_package_passes_public_validation_and_keeps_restricted_sources_citation_only():
    package = load_package(PACKAGE)
    assert validate_package(package, ValidationProfile.AUTHORING) == []
    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []
    restricted = {source["id"] for source in package.sources if source["rights"]["status"] == "restricted"}
    assert restricted
    assert all(evidence["usage"] == "citation" for evidence in package.evidence if evidence["sourceId"] in restricted)
