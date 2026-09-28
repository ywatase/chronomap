from pathlib import Path

import pytest

from chronomap_data.audit import audit_package, render_audit_markdown
from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package


ROOT = Path(__file__).parents[1]


@pytest.mark.parametrize("slug", ["ogurike", "tonegawa", "heijokyo"])
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
