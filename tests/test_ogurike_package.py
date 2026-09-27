from pathlib import Path

from chronomap_data.audit import audit_package
from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics


ROOT = Path(__file__).parents[1]
PACKAGE = ROOT / "data" / "ogurike"


def test_ogurike_package_has_three_entities_and_four_public_versions():
    package = load_package(PACKAGE)
    assert package.dataset["defaultLanguage"] == "ja"
    assert len(package.entities) == 3
    features = package.feature_versions["features"]
    assert len(features) == 4
    assert {feature["geometry"]["type"] for feature in features} == {"Point", "LineString", "Polygon"}
    assert all(feature["properties"]["publicationStatus"] == "public" for feature in features)


def test_ogurike_package_passes_authoring_and_public_profiles():
    package = load_package(PACKAGE)
    assert validate_package(package, ValidationProfile.AUTHORING) == []
    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []


def test_ogurike_restricted_sources_are_citation_only():
    package = load_package(PACKAGE)
    restricted = {
        source["id"]
        for source in package.sources
        if source["rights"]["status"] == "restricted"
    }
    assert restricted
    for evidence in package.evidence:
        if evidence["sourceId"] in restricted:
            assert evidence["usage"] == "citation"


def test_ogurike_audit_reaches_all_public_versions_and_source_rights():
    report = audit_package(load_package(PACKAGE))

    assert report.feature_count == 4
    assert {feature.geometry_type for feature in report.features} == {"Point", "LineString", "Polygon"}
    assert all(len(feature.uncertainty) == 4 for feature in report.features)
    assert all(feature.evidence for feature in report.features)
    assert {source.rights_status for source in report.sources} == {"open-license", "restricted"}
