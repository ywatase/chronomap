import json
from pathlib import Path
import shutil

import pytest

from chronomap_data.cli import main


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"


def copy_package(tmp_path: Path) -> Path:
    package_dir = tmp_path / "synthetic-package"
    shutil.copytree(SYNTHETIC_PACKAGE, package_dir)
    return package_dir


@pytest.mark.parametrize("profile_args", [[], ["--profile", "public"]])
def test_validate_accepts_the_default_authoring_profile_and_explicit_public_profile(tmp_path: Path, capsys, profile_args: list[str]):
    exit_code = main(["validate", str(copy_package(tmp_path)), *profile_args])

    assert exit_code == 0
    assert capsys.readouterr().err == ""


def test_validate_prints_schema_diagnostics_in_contract_order(tmp_path: Path, capsys):
    package_dir = copy_package(tmp_path)
    dataset_path = package_dir / "dataset.json"
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    dataset["unexpected"] = "synthetic"
    dataset_path.write_text(json.dumps(dataset), encoding="utf-8")
    sources_path = package_dir / "sources.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    sources[0]["url"] = "not a URI"
    sources_path.write_text(json.dumps(sources), encoding="utf-8")

    exit_code = main(["validate", str(package_dir)])

    assert exit_code == 1
    lines = capsys.readouterr().err.splitlines()
    assert lines == sorted(lines)
    assert lines[0].startswith("dataset.json:/ [schema.invalid]")
    assert lines[1].startswith("sources.json:/0/url [schema.invalid]")


def test_validate_reports_an_unsupported_schema_version(tmp_path: Path, capsys):
    package_dir = copy_package(tmp_path)
    dataset_path = package_dir / "dataset.json"
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    dataset["schemaVersion"] = "9.9.9"
    dataset_path.write_text(json.dumps(dataset), encoding="utf-8")

    exit_code = main(["validate", str(package_dir)])

    assert exit_code == 1
    assert capsys.readouterr().err.startswith("dataset.json:/schemaVersion [schema.unsupported_version]")


@pytest.mark.parametrize(
    "argv",
    [
        ["validate", "missing-dataset-directory"],
        ["validate", "missing-dataset-directory", "--profile", "not-a-profile"],
    ],
)
def test_validate_maps_io_and_usage_errors_to_exit_2_without_a_traceback(capsys, argv: list[str]):
    exit_code = main(argv)

    stderr = capsys.readouterr().err
    assert exit_code == 2
    assert "Traceback" not in stderr
