import json
from pathlib import Path

import pytest

from chronomap_data.audit import audit_package
from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics


ROOT = Path(__file__).parents[1]
PACKAGE = ROOT / "data" / "ogurike"
ANCHOR = (135.76225, 34.903225)

shapely_geometry = pytest.importorskip("shapely.geometry")
shape = shapely_geometry.shape


def _features_by_id():
    collection = json.loads((PACKAGE / "feature-versions.geojson").read_text(encoding="utf-8"))
    return {feature["id"]: feature for feature in collection["features"]}


def _geometry(features, key):
    return shape(features[f"ogurike:version:{key}"]["geometry"])


def test_ogurike_package_has_three_entities_and_eight_public_versions():
    package = load_package(PACKAGE)
    assert package.dataset["defaultLanguage"] == "ja"
    assert len(package.entities) == 3
    features = package.feature_versions["features"]
    assert len(features) == 8
    assert {feature["geometry"]["type"] for feature in features} == {"Point", "LineString", "Polygon", "MultiPolygon"}
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

    assert report.feature_count == 8
    assert {feature.geometry_type for feature in report.features} == {"Point", "LineString", "Polygon", "MultiPolygon"}
    assert all(len(feature.uncertainty) == 4 for feature in report.features)
    assert all(feature.evidence for feature in report.features)
    assert {source.rights_status for source in report.sources} == {"open-license", "restricted"}


def test_ogurike_waterbodies_are_at_the_codh_and_gsi_location_anchor():
    features = _features_by_id()
    waterbody_ids = (
        "waterbody-1590",
        "waterbody-1596",
        "waterbody-1885",
        "waterbody-1910",
        "waterbody-1933",
    )

    for key in waterbody_ids:
        centroid = _geometry(features, key).centroid
        assert centroid.x == pytest.approx(ANCHOR[0], abs=0.001)
        assert centroid.y == pytest.approx(ANCHOR[1], abs=0.001)


def test_ogurike_reference_shapes_and_1910_scale_are_distinct_and_ordered():
    features = _features_by_id()
    codh = _geometry(features, "waterbody-1885")
    intermediate = _geometry(features, "waterbody-1910")
    gsi = _geometry(features, "waterbody-1933")

    assert codh.geom_type == "MultiPolygon"
    assert codh.bounds == pytest.approx((135.740013, 34.887207, 135.784163, 34.921228), abs=0.00003)
    assert gsi.bounds == pytest.approx((135.736467, 34.888281, 135.782629, 34.918743), abs=0.00003)
    assert codh.area < intermediate.area < gsi.area


def test_ogurike_rivers_follow_their_period_waterbody_relationships():
    features = _features_by_id()
    lake_1590 = _geometry(features, "waterbody-1590")
    lake_1596 = _geometry(features, "waterbody-1596")
    river_1590 = _geometry(features, "ujigawa-1590")
    river_1596 = _geometry(features, "ujigawa-1596")

    assert river_1590.intersects(lake_1590)
    assert river_1596.disjoint(lake_1596)
    assert river_1596.distance(lake_1596) < 0.005


def test_ogurike_location_sources_are_open_license_derived_geometry_evidence():
    package = load_package(PACKAGE)
    features = _features_by_id()
    sources = {source["id"]: source for source in package.sources}
    evidence = {record["id"]: record for record in package.evidence}

    assert sources["ogurike:source:codh"]["rights"]["status"] == "open-license"
    assert sources["ogurike:source:codh"]["citation"] == "『江戸末期湖沼データセット』doi:10.20676/00000467"
    assert "CC BY 4.0" in sources["ogurike:source:codh"]["rights"]["terms"]
    assert sources["ogurike:source:gsi-artificial-land"]["rights"]["status"] == "open-license"
    for evidence_id in (
        "ogurike:evidence:waterbody-1885-geometry",
        "ogurike:evidence:waterbody-1933-geometry",
        "ogurike:evidence:waterbody-location-codh",
        "ogurike:evidence:waterbody-location-gsi",
    ):
        assert evidence[evidence_id]["usage"] == "derived-geometry"
        assert evidence[evidence_id]["publicationBasis"] == "open-license"
        assert evidence[evidence_id]["sourceId"] in sources

    location_anchors = {
        "ogurike:evidence:waterbody-location-codh",
        "ogurike:evidence:waterbody-location-gsi",
    }
    for key in (
        "waterbody-1590",
        "waterbody-1596",
        "waterbody-1910",
        "ujigawa-1590",
        "ujigawa-1596",
    ):
        feature = features[f"ogurike:version:{key}"]
        assert location_anchors.issubset(feature["properties"]["evidenceIds"])
        assert location_anchors.issubset(feature["properties"]["uncertainty"]["location"]["evidenceIds"])
