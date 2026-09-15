"""Public bundle projection and replacement behavior."""

import json
from pathlib import Path
import shutil

import pytest

from chronomap_data import public_builder
from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.public_builder import PublicBuildIOError, PublicBuildValidationError, build_public_bundle
from chronomap_data.cli import main
from chronomap_data.schema_validation import validate_package


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"


def copy_package(tmp_path: Path) -> Path:
    package_dir = tmp_path / "synthetic-package"
    shutil.copytree(SYNTHETIC_PACKAGE, package_dir)
    return package_dir


def read_tree(path: Path) -> dict[str, bytes]:
    return {file.relative_to(path).as_posix(): file.read_bytes() for file in sorted(path.rglob("*")) if file.is_file()}


@pytest.mark.parametrize("relationship", ["same", "descendant", "ancestor", "symlink-descendant"])
def test_build_public_bundle_rejects_input_output_path_overlap_without_changing_authoring_data(
    tmp_path: Path, relationship: str
):
    input_parent = tmp_path / "input"
    input_parent.mkdir()
    package_dir = copy_package(input_parent)
    if relationship == "same":
        output = package_dir
    elif relationship == "descendant":
        output = package_dir / "public"
    elif relationship == "ancestor":
        output = input_parent
    else:
        alias = tmp_path / "package-alias"
        try:
            alias.symlink_to(package_dir, target_is_directory=True)
        except OSError as error:
            pytest.skip(f"directory symlinks unavailable: {error}")
        output = alias / "public"
    before = read_tree(package_dir)

    with pytest.raises(PublicBuildIOError, match="overlap"):
        build_public_bundle(load_package(package_dir), output)

    assert read_tree(package_dir) == before


def test_build_public_bundle_rejects_a_retargeted_load_alias_when_output_is_the_original_source(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    alias = tmp_path / "package-alias"
    retarget = copy_package(tmp_path / "retarget-parent")
    try:
        alias.symlink_to(package_dir, target_is_directory=True)
    except OSError as error:
        pytest.skip(f"directory symlinks unavailable: {error}")
    package = load_package(alias)
    before = read_tree(package_dir)

    alias.unlink()
    alias.symlink_to(retarget, target_is_directory=True)

    with pytest.raises(PublicBuildIOError, match="overlap"):
        build_public_bundle(package, package_dir)

    assert read_tree(package_dir) == before


def test_build_public_bundle_rejects_a_source_directory_replaced_after_loading(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    package = load_package(package_dir)
    before = read_tree(package_dir)
    replacement = copy_package(tmp_path / "replacement-parent")
    displaced = tmp_path / "displaced-package"
    package_dir.replace(displaced)
    replacement.replace(package_dir)

    with pytest.raises(PublicBuildIOError, match="source directory changed"):
        build_public_bundle(package, tmp_path / "public")

    assert read_tree(package_dir) == before
    assert not (tmp_path / "public").exists()


def test_build_public_bundle_rejects_the_canonical_source_name_replaced_with_a_symlink_to_the_same_inode(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    package = load_package(package_dir)
    moved_package = tmp_path / "moved-package"
    package_dir.replace(moved_package)
    try:
        package_dir.symlink_to(moved_package, target_is_directory=True)
    except OSError as error:
        pytest.skip(f"directory symlinks unavailable: {error}")
    output = tmp_path / "public"
    output.mkdir()
    (output / "previous.json").write_bytes(b"previous bundle\n")
    before = read_tree(output)

    with pytest.raises(PublicBuildIOError, match="source directory changed"):
        build_public_bundle(package, output)

    assert read_tree(output) == before


def test_build_public_bundle_accepts_an_intact_canonical_source_directory(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    output = tmp_path / "public"

    build_public_bundle(load_package(package_dir), output)

    assert output.is_dir()


@pytest.mark.parametrize("replacement", ["missing", "regular-file"])
def test_build_public_bundle_rejects_a_missing_or_non_directory_source_after_loading(tmp_path: Path, replacement: str):
    package_dir = copy_package(tmp_path)
    package = load_package(package_dir)
    package_dir.replace(tmp_path / "displaced-package")
    if replacement == "regular-file":
        package_dir.write_text("not a directory", encoding="utf-8")

    with pytest.raises(PublicBuildIOError, match="source directory changed"):
        build_public_bundle(package, tmp_path / "public")

    assert not (tmp_path / "public").exists()


def test_build_public_bundle_accepts_a_sibling_output_without_mutating_the_authoring_directory(tmp_path: Path):
    input_parent = tmp_path / "input"
    input_parent.mkdir()
    package_dir = copy_package(input_parent)
    before = read_tree(package_dir)

    build_public_bundle(load_package(package_dir), input_parent / "public")

    assert read_tree(package_dir) == before


def test_build_public_cli_maps_path_overlap_to_exit_2_without_changing_authoring_data(tmp_path: Path, capsys):
    package_dir = copy_package(tmp_path)
    before = read_tree(package_dir)

    exit_code = main(["build-public", str(package_dir), "--output", str(package_dir)])

    captured = capsys.readouterr()
    assert exit_code == 2
    assert "overlap" in captured.err
    assert "Traceback" not in captured.err
    assert read_tree(package_dir) == before


def test_build_public_bundle_projects_only_reachable_public_records_without_mutating_input(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    before = read_tree(package_dir)
    package = load_package(package_dir)
    output = tmp_path / "public"

    summary = build_public_bundle(package, output)

    assert summary.output == output
    assert (summary.versions, summary.entities, summary.evidence, summary.sources) == (3, 2, 3, 2)
    assert [record["id"] for record in json.loads((output / "entities.json").read_text(encoding="utf-8"))] == [
        "synthetic:entity:line-subject",
        "synthetic:entity:point-subject",
    ]
    feature_collection = json.loads((output / "feature-versions.geojson").read_text(encoding="utf-8"))
    assert [feature["id"] for feature in feature_collection["features"]] == [
        "synthetic:version:line-alternative-a",
        "synthetic:version:line-alternative-b",
        "synthetic:version:point-open-boundary",
    ]
    evidence = json.loads((output / "evidence.json").read_text(encoding="utf-8"))
    sources = json.loads((output / "sources.json").read_text(encoding="utf-8"))
    assert {record["sourceId"] for record in evidence} == {record["id"] for record in sources}
    assert {
        evidence_id for feature in feature_collection["features"] for evidence_id in feature["properties"]["evidenceIds"]
    } == {record["id"] for record in evidence}
    assert {feature["properties"]["entityId"] for feature in feature_collection["features"]} == {
        record["id"] for record in json.loads((output / "entities.json").read_text(encoding="utf-8"))
    }
    assert "synthetic:version:polygon-private" not in b"".join(read_tree(output).values()).decode("utf-8")
    assert "Synthetic Private Polygon" not in b"".join(read_tree(output).values()).decode("utf-8")
    assert package.feature_versions["features"][3]["properties"]["rights"]["status"] == "restricted"
    assert read_tree(package_dir) == before


def test_build_public_bundle_is_byte_identical_when_rebuilt(tmp_path: Path):
    package = load_package(copy_package(tmp_path))
    output = tmp_path / "public"

    build_public_bundle(package, output)
    first_build = read_tree(output)
    build_public_bundle(package, output)

    assert read_tree(output) == first_build
    assert all(content.endswith(b"\n") for content in first_build.values())


def test_build_public_bundle_sorts_records_features_and_object_keys(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    for filename in ("entities.json", "sources.json", "evidence.json"):
        path = package_dir / filename
        records = json.loads(path.read_text(encoding="utf-8"))
        path.write_text(json.dumps(list(reversed(records))), encoding="utf-8")
    feature_path = package_dir / "feature-versions.geojson"
    feature_collection = json.loads(feature_path.read_text(encoding="utf-8"))
    feature_collection["features"].reverse()
    coordinates_by_id = {feature["id"]: feature["geometry"]["coordinates"] for feature in feature_collection["features"]}
    supports_by_id = {}
    for feature in feature_collection["features"]:
        properties = feature["properties"]
        properties["evidenceIds"].reverse()
        for assessment in properties["uncertainty"].values():
            assessment["evidenceIds"].reverse()
    evidence_path = package_dir / "evidence.json"
    evidence_records = json.loads(evidence_path.read_text(encoding="utf-8"))
    for evidence in evidence_records:
        supports_by_id[evidence["id"]] = evidence["supports"]
    feature_path.write_text(json.dumps(feature_collection), encoding="utf-8")

    build_public_bundle(load_package(package_dir), tmp_path / "public")

    output = tmp_path / "public"
    for filename in ("entities.json", "sources.json", "evidence.json"):
        records = json.loads((output / filename).read_text(encoding="utf-8"))
        assert [record["id"] for record in records] == sorted(record["id"] for record in records)
    features = json.loads((output / "feature-versions.geojson").read_text(encoding="utf-8"))["features"]
    assert [feature["id"] for feature in features] == sorted(feature["id"] for feature in features)
    for feature in features:
        assert feature["geometry"]["coordinates"] == coordinates_by_id[feature["id"]]
        assert feature["properties"]["evidenceIds"] == sorted(feature["properties"]["evidenceIds"])
        for assessment in feature["properties"]["uncertainty"].values():
            assert assessment["evidenceIds"] == sorted(assessment["evidenceIds"])
    for evidence in json.loads((output / "evidence.json").read_text(encoding="utf-8")):
        assert evidence["supports"] == supports_by_id[evidence["id"]]
    dataset = json.loads((output / "dataset.json").read_text(encoding="utf-8"))
    assert list(dataset) == sorted(dataset)


def test_build_public_bundle_rejects_invalid_public_profile_without_changing_existing_output(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    feature_path = package_dir / "feature-versions.geojson"
    features = json.loads(feature_path.read_text(encoding="utf-8"))
    features["features"][0]["properties"]["rights"]["status"] = "restricted"
    feature_path.write_text(json.dumps(features), encoding="utf-8")
    output = tmp_path / "public"
    output.mkdir()
    sentinel = output / "previous.json"
    sentinel.write_bytes(b"previous bundle\n")
    before = read_tree(output)

    with pytest.raises(PublicBuildValidationError) as error:
        build_public_bundle(load_package(package_dir), output)

    assert error.value.issues
    assert read_tree(output) == before


def test_build_public_bundle_rejects_invalid_public_profile_without_creating_an_absent_output(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    dataset_path = package_dir / "dataset.json"
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    dataset["rights"]["status"] = "restricted"
    dataset_path.write_text(json.dumps(dataset), encoding="utf-8")
    output = tmp_path / "public"

    with pytest.raises(PublicBuildValidationError):
        build_public_bundle(load_package(package_dir), output)

    assert not output.exists()


def test_build_public_bundle_replacement_removes_staging_and_backup_siblings(tmp_path: Path):
    output = tmp_path / "public"
    output.mkdir()
    (output / "old.json").write_text("old\n", encoding="utf-8")

    build_public_bundle(load_package(copy_package(tmp_path)), output)

    assert not list(tmp_path.glob(".public.tmp-*"))
    assert not list(tmp_path.glob(".public.backup-*"))


def test_build_failure_is_not_overridden_by_staging_cleanup_failure(tmp_path: Path, monkeypatch):
    def fail_write(directory: Path, documents: object) -> None:
        raise OSError("write failure")

    def fail_cleanup(path: Path) -> None:
        raise OSError("cleanup failure")

    monkeypatch.setattr(public_builder, "_write_bundle", fail_write)
    monkeypatch.setattr(public_builder, "_remove_tree", fail_cleanup)

    with pytest.raises(PublicBuildIOError, match="could not write public output: write failure"):
        build_public_bundle(load_package(copy_package(tmp_path)), tmp_path / "public")


def test_build_public_cli_maps_cleanup_only_failure_to_exit_2_without_traceback(tmp_path: Path, capsys, monkeypatch):
    output = tmp_path / "public"
    output.mkdir()
    (output / "old.json").write_text("old\n", encoding="utf-8")

    def fail_cleanup(path: Path) -> None:
        raise OSError("cleanup failure")

    monkeypatch.setattr(public_builder, "_remove_tree", fail_cleanup)

    exit_code = main(["build-public", str(copy_package(tmp_path)), "--output", str(output)])

    captured = capsys.readouterr()
    assert exit_code == 2
    assert "Traceback" not in captured.err
    assert not (output / "old.json").exists()
    assert validate_package(load_package(output), ValidationProfile.PUBLIC) == []
    backups = list(tmp_path.glob(".public.backup-*"))
    assert len(backups) == 1
    assert read_tree(backups[0]) == {"old.json": b"old\n"}


def test_partial_backup_cleanup_keeps_committed_output_and_recovery_artifact(tmp_path: Path, monkeypatch):
    output = tmp_path / "public"
    output.mkdir()
    (output / "old-a.json").write_text("old a\n", encoding="utf-8")
    (output / "old-b.json").write_text("old b\n", encoding="utf-8")
    real_remove_tree = public_builder._remove_tree

    def partially_remove_backup(path: Path) -> None:
        if path.name.startswith(".public.backup-"):
            (path / "old-a.json").unlink()
            raise OSError("partial backup cleanup failure")
        real_remove_tree(path)

    monkeypatch.setattr(public_builder, "_remove_tree", partially_remove_backup)

    with pytest.raises(PublicBuildIOError, match="recovery artifact retained") as error:
        build_public_bundle(load_package(copy_package(tmp_path)), output)

    assert not (output / "old-a.json").exists()
    assert not (output / "old-b.json").exists()
    assert validate_package(load_package(output), ValidationProfile.PUBLIC) == []
    backups = list(tmp_path.glob(".public.backup-*"))
    assert len(backups) == 1
    assert str(backups[0]) in str(error.value)
    assert not (backups[0] / "old-a.json").exists()
    assert (backups[0] / "old-b.json").read_bytes() == b"old b\n"


def test_build_public_bundle_accepts_citation_only_unknown_source(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    sources_path = package_dir / "sources.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    sources[1]["rights"]["status"] = "unknown"
    sources_path.write_text(json.dumps(sources), encoding="utf-8")

    summary = build_public_bundle(load_package(package_dir), tmp_path / "public")

    assert summary.sources == 2
    assert ValidationProfile.PUBLIC.value == "public"


@pytest.mark.parametrize("source_status", ["restricted", "unknown"])
def test_build_public_bundle_sanitizes_citation_only_evidence_for_nonpublishable_sources(
    tmp_path: Path, source_status: str
):
    package_dir = copy_package(tmp_path)
    sources_path = package_dir / "sources.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    restricted_source = next(source for source in sources if source["id"] == "synthetic:source:restricted-citation")
    restricted_source["rights"]["status"] = source_status
    sources_path.write_text(json.dumps(sources), encoding="utf-8")
    evidence_path = package_dir / "evidence.json"
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    citation = next(record for record in evidence if record["id"] == "synthetic:evidence:citation-identity")
    secret = "PRIVATE-SMUGGLED-CITATION-NOTE"
    citation["note"] = secret
    citation["publicationBasis"] = "permission"
    evidence_path.write_text(json.dumps(evidence), encoding="utf-8")
    output = tmp_path / "public"

    build_public_bundle(load_package(package_dir), output)

    public_evidence = json.loads((output / "evidence.json").read_text(encoding="utf-8"))
    public_citation = next(record for record in public_evidence if record["id"] == citation["id"])
    assert public_citation == {
        "id": "synthetic:evidence:citation-identity",
        "sourceId": "synthetic:source:restricted-citation",
        "locator": "Synthetic identifier A",
        "usage": "citation",
        "supports": ["identity"],
        "note": "Citation-only metadata; no authored source content is reproduced.",
    }
    assert secret not in b"".join(read_tree(output).values()).decode("utf-8")
    public_sources = json.loads((output / "sources.json").read_text(encoding="utf-8"))
    public_source = next(source for source in public_sources if source["id"] == citation["sourceId"])
    assert public_source["citation"] == "Synthetic Restricted Citation (test data only)."
    assert public_source["rights"]["status"] == source_status
    assert validate_package(load_package(output), ValidationProfile.PUBLIC) == []


def test_build_public_cli_returns_success_for_a_valid_package(tmp_path: Path, capsys):
    output = tmp_path / "public"

    exit_code = main(["build-public", str(copy_package(tmp_path)), "--output", str(output)])

    assert exit_code == 0
    assert output.is_dir()
    assert "3 versions" in capsys.readouterr().out


def test_build_public_cli_reports_validation_rejection_and_keeps_old_output(tmp_path: Path, capsys):
    package_dir = copy_package(tmp_path)
    dataset_path = package_dir / "dataset.json"
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    dataset["rights"]["status"] = "restricted"
    dataset_path.write_text(json.dumps(dataset), encoding="utf-8")
    output = tmp_path / "public"
    output.mkdir()
    (output / "old.json").write_text("untouched\n", encoding="utf-8")

    exit_code = main(["build-public", str(package_dir), "--output", str(output)])

    captured = capsys.readouterr()
    assert exit_code == 1
    assert "dataset.json:/rights/status [publication.rights]" in captured.err
    assert read_tree(output) == {"old.json": b"untouched\n"}


def test_build_public_cli_maps_output_io_errors_to_exit_2(tmp_path: Path, capsys):
    missing_parent = tmp_path / "missing" / "public"

    exit_code = main(["build-public", str(copy_package(tmp_path)), "--output", str(missing_parent)])

    captured = capsys.readouterr()
    assert exit_code == 2
    assert "Traceback" not in captured.err


@pytest.mark.parametrize("existing_output", [False, True])
def test_build_public_bundle_maps_serialization_unicode_errors_without_mutating_output(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, existing_output: bool
):
    package = load_package(copy_package(tmp_path))
    documents = (
        {"invalid": "\ud800"},
        [],
        [],
        [],
        {"features": []},
    )
    monkeypatch.setattr(public_builder, "validate_package", lambda package, profile: [])
    monkeypatch.setattr(public_builder, "_project", lambda package: documents)
    output = tmp_path / "public"
    if existing_output:
        output.mkdir()
        (output / "previous.json").write_bytes(b"previous bundle\n")
    before = read_tree(output) if existing_output else None

    with pytest.raises(PublicBuildIOError, match="could not serialize public output"):
        build_public_bundle(package, output)

    if existing_output:
        assert read_tree(output) == before
    else:
        assert not output.exists()


def test_build_public_cli_maps_serialization_unicode_errors_to_exit_2_without_a_traceback(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys
):
    documents = (
        {"invalid": "\ud800"},
        [],
        [],
        [],
        {"features": []},
    )
    monkeypatch.setattr(public_builder, "validate_package", lambda package, profile: [])
    monkeypatch.setattr(public_builder, "_project", lambda package: documents)

    exit_code = main(["build-public", str(copy_package(tmp_path)), "--output", str(tmp_path / "public")])

    assert exit_code == 2
    assert "could not serialize public output" in capsys.readouterr().err
