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


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"


def copy_package(tmp_path: Path) -> Path:
    package_dir = tmp_path / "synthetic-package"
    shutil.copytree(SYNTHETIC_PACKAGE, package_dir)
    return package_dir


def read_tree(path: Path) -> dict[str, bytes]:
    return {file.relative_to(path).as_posix(): file.read_bytes() for file in sorted(path.rglob("*")) if file.is_file()}


def test_build_public_bundle_projects_only_reachable_public_records_without_mutating_input(tmp_path: Path):
    package = load_package(copy_package(tmp_path))
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
    assert read_tree(output) == {"old.json": b"old\n"}


def test_build_public_bundle_accepts_citation_only_unknown_source(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    sources_path = package_dir / "sources.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    sources[1]["rights"]["status"] = "unknown"
    sources_path.write_text(json.dumps(sources), encoding="utf-8")

    summary = build_public_bundle(load_package(package_dir), tmp_path / "public")

    assert summary.sources == 2
    assert ValidationProfile.PUBLIC.value == "public"


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
