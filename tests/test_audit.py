import json
from pathlib import Path
import shutil

from chronomap_data.audit import audit_package, render_audit_markdown
from chronomap_data.loader import load_package


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"
OGURIKE_PACKAGE = ROOT / "data" / "ogurike"


def test_audit_projects_only_public_features_and_reachable_metadata():
    report = audit_package(load_package(SYNTHETIC_PACKAGE))

    assert report.feature_count == 3
    assert [feature.id for feature in report.features] == [
        "synthetic:version:line-alternative-a",
        "synthetic:version:line-alternative-b",
        "synthetic:version:point-open-boundary",
    ]
    assert "synthetic:version:polygon-private" not in render_audit_markdown(report)
    assert {source.id for source in report.sources} == {
        "synthetic:source:open-method-note",
        "synthetic:source:restricted-citation",
    }
    assert all(evidence.locator for feature in report.features for evidence in feature.evidence)


def test_audit_is_deterministic_and_exposes_four_uncertainty_dimensions(tmp_path: Path):
    package_dir = tmp_path / "ogurike"
    shutil.copytree(OGURIKE_PACKAGE, package_dir)
    for filename, key in (
        ("sources.json", None),
        ("evidence.json", None),
        ("feature-versions.geojson", "features"),
    ):
        path = package_dir / filename
        document = json.loads(path.read_text(encoding="utf-8"))
        if key is None:
            document.reverse()
        else:
            document[key].reverse()
        path.write_text(json.dumps(document, ensure_ascii=False), encoding="utf-8")

    report = audit_package(load_package(OGURIKE_PACKAGE))
    reordered_report = audit_package(load_package(package_dir))
    rendered = render_audit_markdown(report)

    assert render_audit_markdown(report) == rendered
    assert render_audit_markdown(reordered_report) == rendered
    assert [feature.id for feature in report.features] == sorted(feature.id for feature in report.features)
    assert all(
        [uncertainty.dimension for uncertainty in feature.uncertainty]
        == ["temporal", "location", "geometry", "identity"]
        for feature in report.features
    )
    assert "ogurike:evidence:waterbody-geometry" in rendered
    assert "精密な境界" in rendered


def test_audit_keeps_citation_only_sources_as_metadata_without_source_body():
    report = audit_package(load_package(OGURIKE_PACKAGE))
    rendered = render_audit_markdown(report)

    monument = next(feature for feature in report.features if "monument" in feature.id)
    restricted = next(source for source in monument.sources if source.rights_status == "restricted")

    assert restricted.citation == "京都市『巨椋池干拓碑』GA015"
    assert restricted.rights_terms.startswith("引用メタデータのみ")
    assert not hasattr(restricted, "body")
