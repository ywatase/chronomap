"""Cross-file validation of the synthetic Chronomap package."""

import json
from pathlib import Path
import shutil

import pytest

from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics, validate_temporal


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"


def copy_package(tmp_path: Path) -> Path:
    package_dir = tmp_path / "synthetic-package"
    shutil.copytree(SYNTHETIC_PACKAGE, package_dir)
    return package_dir


def mutate_json(package_dir: Path, filename: str, mutate) -> None:
    path = package_dir / filename
    value = json.loads(path.read_text(encoding="utf-8"))
    mutate(value)
    path.write_text(json.dumps(value), encoding="utf-8")


def issues_for(package_dir: Path, profile: ValidationProfile = ValidationProfile.AUTHORING):
    return validate_package(load_package(package_dir), profile)


def test_semantic_validation_rejects_a_duplicate_resource_id(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(package_dir, "entities.json", lambda entities: entities[1].__setitem__("id", entities[0]["id"]))

    issues = validate_semantics(load_package(package_dir), ValidationProfile.AUTHORING)

    assert ("id.duplicate", "entities.json", "/1/id") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_semantic_validation_rejects_a_wrong_reference_kind(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "evidence.json",
        lambda evidence: evidence[0].__setitem__("sourceId", "synthetic:entity:line-subject"),
    )

    issues = validate_semantics(load_package(package_dir), ValidationProfile.AUTHORING)

    assert [(issue.code, issue.file, issue.pointer) for issue in issues] == [
        ("id.invalid_kind", "evidence.json", "/0/sourceId"),
    ]


def test_semantic_validation_rejects_a_missing_cross_file_reference(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][0]["properties"].__setitem__(
            "entityId", "synthetic:entity:missing-subject"
        ),
    )

    issues = validate_semantics(load_package(package_dir), ValidationProfile.AUTHORING)

    assert ("ref.missing", "feature-versions.geojson", "/features/0/properties/entityId") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_semantic_validation_requires_default_language_keys(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][0]["properties"].__setitem__("labels", {"fr": "Synthetic"}),
    )

    issues = issues_for(package_dir)

    assert {(issue.code, issue.file, issue.pointer) for issue in issues} == {
        ("ref.missing", "feature-versions.geojson", "/features/0/properties/labels"),
    }


def test_semantic_validation_casefolds_every_text_map_language_key(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(package_dir, "sources.json", lambda sources: sources[0]["title"].__setitem__("EN", "Duplicate casing"))

    issues = issues_for(package_dir)

    assert ("ref.missing", "sources.json", "/0/title/EN") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_validate_package_skips_shape_dependent_semantics_after_a_schema_error(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(package_dir, "dataset.json", lambda dataset: dataset.__setitem__("unexpected", "synthetic"))
    mutate_json(package_dir, "dataset.json", lambda dataset: dataset.__setitem__("bbox", [10, -10, -10, 10]))

    issues = issues_for(package_dir)

    assert [issue.code for issue in issues] == ["schema.invalid"]


@pytest.mark.parametrize("tag", ["sl-rozaj-ROZAJ", "en-a-foo-A-bar"])
def test_semantic_validation_rejects_casefolded_duplicate_bcp47_variants_and_extension_singletons(tmp_path: Path, tag: str):
    package_dir = copy_package(tmp_path)
    mutate_json(package_dir, "dataset.json", lambda dataset: dataset.__setitem__("defaultLanguage", tag))

    issues = issues_for(package_dir)

    assert ("ref.missing", "dataset.json", f"/defaultLanguage/{tag}") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_temporal_validation_rejects_a_boundary_with_reversed_years():
    temporal = {
        "start": {"earliestYear": 3, "latestYear": 2, "precision": "year", "qualifier": "exact"},
        "end": None,
    }

    issues = validate_temporal(temporal, "dataset.json", "/temporalExtent")

    assert [(issue.code, issue.pointer) for issue in issues] == [
        ("temporal.invalid", "/temporalExtent/start"),
    ]


def test_temporal_validation_rejects_a_possible_activity_range_that_cannot_overlap():
    temporal = {
        "start": {"earliestYear": 4, "latestYear": 5, "precision": "year", "qualifier": "exact"},
        "end": {"earliestYear": 1, "latestYear": 2, "precision": "year", "qualifier": "exact"},
    }

    issues = validate_temporal(temporal, "feature-versions.geojson", "/features/0/properties/temporal")

    assert [(issue.code, issue.pointer) for issue in issues] == [
        ("temporal.invalid", "/features/0/properties/temporal"),
    ]


def test_semantic_validation_requires_hypothesis_members_to_overlap_for_one_entity(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][1]["properties"].__setitem__(
            "temporal",
            {
                "start": {"earliestYear": 10, "latestYear": 10, "precision": "year", "qualifier": "exact"},
                "end": {"earliestYear": 11, "latestYear": 11, "precision": "year", "qualifier": "exact"},
            },
        ),
    )

    issues = issues_for(package_dir)

    assert ("hypothesis.invalid", "feature-versions.geojson", "/features/1/properties/hypothesisGroupId") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_semantic_validation_requires_each_hypothesis_member_to_have_a_label(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][0]["properties"].__setitem__("hypothesisLabel", {}),
    )

    issues = validate_semantics(load_package(package_dir), ValidationProfile.AUTHORING)

    assert ("hypothesis.invalid", "feature-versions.geojson", "/features/0/properties/hypothesisLabel") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_semantic_validation_requires_uncertainty_evidence_to_be_a_supporting_feature_subset(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][0]["properties"]["uncertainty"]["geometry"].__setitem__(
            "evidenceIds", ["synthetic:evidence:citation-temporal"]
        ),
    )

    issues = issues_for(package_dir)

    assert ("uncertainty.invalid", "feature-versions.geojson", "/features/0/properties/uncertainty/geometry/evidenceIds/0") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_semantic_validation_requires_uncertainty_notes_even_without_schema_dispatch(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][0]["properties"]["uncertainty"]["location"].__setitem__("note", ""),
    )

    issues = validate_semantics(load_package(package_dir), ValidationProfile.AUTHORING)

    assert ("uncertainty.invalid", "feature-versions.geojson", "/features/0/properties/uncertainty/location/note") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_public_profile_requires_publishable_rights_and_evidence_for_time_and_geometry(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(package_dir, "dataset.json", lambda dataset: dataset["rights"].__setitem__("status", "restricted"))
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][0]["properties"].__setitem__(
            "evidenceIds", ["synthetic:evidence:citation-identity"]
        ),
    )

    issues = issues_for(package_dir, ValidationProfile.PUBLIC)

    shapes = {(issue.code, issue.file, issue.pointer) for issue in issues}
    assert ("publication.rights", "dataset.json", "/rights/status") in shapes
    assert ("publication.evidence", "feature-versions.geojson", "/features/0/properties/evidenceIds") in shapes


def test_public_profile_requires_publishable_feature_version_rights(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][0]["properties"]["rights"].__setitem__("status", "restricted"),
    )

    issues = issues_for(package_dir, ValidationProfile.PUBLIC)

    assert ("publication.rights", "feature-versions.geojson", "/features/0/properties/rights/status") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_public_profile_requires_complete_open_source_rights_metadata(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(package_dir, "sources.json", lambda sources: sources[0]["rights"].pop("terms"))

    issues = issues_for(package_dir, ValidationProfile.PUBLIC)

    assert ("publication.rights", "sources.json", "/0/rights") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }


def test_public_profile_allows_citation_only_unknown_sources_with_rights_metadata(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(package_dir, "sources.json", lambda sources: sources[1]["rights"].__setitem__("status", "unknown"))

    assert issues_for(package_dir, ValidationProfile.PUBLIC) == []


def test_public_profile_allows_citation_only_restricted_sources_but_rejects_derived_geometry_and_single_alternatives(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(
        package_dir,
        "sources.json",
        lambda sources: sources[0]["rights"].__setitem__("status", "restricted"),
    )
    mutate_json(
        package_dir,
        "feature-versions.geojson",
        lambda versions: versions["features"][1]["properties"].__setitem__("publicationStatus", "private"),
    )

    issues = issues_for(package_dir, ValidationProfile.PUBLIC)

    shapes = {(issue.code, issue.file, issue.pointer) for issue in issues}
    assert ("publication.evidence", "evidence.json", "/2/sourceId") in shapes
    assert ("hypothesis.invalid", "feature-versions.geojson", "/features/0/properties/hypothesisGroupId") in shapes


def test_public_profile_requires_geometry_evidence_to_have_a_derived_geometry_publication_basis(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    mutate_json(package_dir, "evidence.json", lambda evidence: evidence[2].__setitem__("usage", "citation"))

    issues = issues_for(package_dir, ValidationProfile.PUBLIC)

    assert ("publication.evidence", "feature-versions.geojson", "/features/0/properties/evidenceIds") in {
        (issue.code, issue.file, issue.pointer) for issue in issues
    }
