from pathlib import Path

import pytest

from chronomap_data.audit import audit_package, render_audit_markdown
from chronomap_data.coverage import build_coverage_matrix, render_coverage_matrix
from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package


ROOT = Path(__file__).parents[1]


PUBLIC_SLUGS = ["ogurike", "tonegawa", "heijokyo", "azuchijo", "kinugawa"]


@pytest.mark.parametrize("slug", PUBLIC_SLUGS)
def test_each_public_pilot_has_a_checked_in_deterministic_audit_snapshot(slug: str):
    package = load_package(ROOT / "data" / slug)
    assert validate_package(package, ValidationProfile.PUBLIC) == []

    report = audit_package(package)
    snapshot = ROOT / "docs" / "data" / f"{slug}-audit.md"

    assert snapshot.is_file()
    assert snapshot.read_text(encoding="utf-8") == render_audit_markdown(report)
    assert report.feature_count > 0
    assert all(len(feature.uncertainty) == 4 for feature in report.features)
    assert all(evidence.locator for feature in report.features for evidence in feature.evidence)
    assert all(source.rights_status for source in report.sources)


def test_japan_coverage_matrix_is_deterministic_and_matches_checked_in_snapshot():
    packages = {slug: load_package(ROOT / "data" / slug) for slug in PUBLIC_SLUGS}

    report = build_coverage_matrix(packages)
    snapshot = ROOT / "docs" / "product" / "japan-coverage-matrix.md"

    assert snapshot.is_file()
    assert snapshot.read_text(encoding="utf-8") == render_coverage_matrix(report)
    assert [row.slug for row in report] == PUBLIC_SLUGS
    assert sum(row.feature_count for row in report) == 26
    assert sum(row.entity_count for row in report) == 18
    assert all(row.source_count > 0 and row.evidence_count > 0 for row in report)
    assert "polity" in render_coverage_matrix(report)
    assert "sphere-of-influence" in render_coverage_matrix(report)
