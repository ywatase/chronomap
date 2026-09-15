import json
from pathlib import Path
import shutil
import subprocess

import pytest

from chronomap_data.cli import format_issue, main
from chronomap_data.models import ValidationIssue
from chronomap_data.schema_validation import json_pointer


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"


def copy_package(tmp_path: Path) -> Path:
    package_dir = tmp_path / "synthetic-package"
    shutil.copytree(SYNTHETIC_PACKAGE, package_dir)
    return package_dir


def run_installed_cli(*arguments: str) -> subprocess.CompletedProcess[str]:
    command = shutil.which("chronomap-data")
    assert command is not None, "chronomap-data must be installed in the active environment"
    return subprocess.run(
        [command, *arguments],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


def test_json_pointer_uses_the_empty_string_for_the_root_and_escapes_tokens():
    assert json_pointer(()) == ""
    assert json_pointer(("a~/b", 2)) == "/a~0~1b/2"


def test_format_issue_renders_a_complete_escaped_pointer_diagnostic_line():
    issue = ValidationIssue("schema.invalid", "synthetic.json", json_pointer(("a~/b",)), "synthetic problem")

    assert format_issue(issue) == "synthetic.json:/a~0~1b [schema.invalid] synthetic problem"


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
    assert lines == [
        "dataset.json: [schema.invalid] Additional properties are not allowed ('unexpected' was unexpected)",
        "sources.json:/0/url [schema.invalid] 'not a URI' is not a 'uri'",
    ]


def test_validate_reports_an_unsupported_schema_version(tmp_path: Path, capsys):
    package_dir = copy_package(tmp_path)
    dataset_path = package_dir / "dataset.json"
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    dataset["schemaVersion"] = "9.9.9"
    dataset_path.write_text(json.dumps(dataset), encoding="utf-8")

    exit_code = main(["validate", str(package_dir)])

    assert exit_code == 1
    assert capsys.readouterr().err == "dataset.json:/schemaVersion [schema.unsupported_version] unsupported schema version '9.9.9'; expected '1.0.0'\n"


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


def test_installed_validate_command_succeeds_for_a_valid_package(tmp_path: Path):
    result = run_installed_cli("validate", str(copy_package(tmp_path)))

    assert result.returncode == 0
    assert result.stdout == ""
    assert result.stderr == ""


def test_installed_validate_command_reports_a_complete_schema_diagnostic(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    dataset_path = package_dir / "dataset.json"
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    dataset["unexpected"] = "synthetic"
    dataset_path.write_text(json.dumps(dataset), encoding="utf-8")

    result = run_installed_cli("validate", str(package_dir))

    assert result.returncode == 1
    assert result.stdout == ""
    assert result.stderr == "dataset.json: [schema.invalid] Additional properties are not allowed ('unexpected' was unexpected)\n"


@pytest.mark.parametrize(
    ("filename", "content", "member_name"),
    [
        ("dataset.json", '{"rights":{"status":"public-domain","status":"restricted"}}', "status"),
        ("feature-versions.geojson", '{"type":"FeatureCollection","features":[{"properties":{"publicationStatus":"public","publicationStatus":"private"}}]}', "publicationStatus"),
    ],
)
def test_installed_validate_command_maps_duplicate_json_members_to_exit_2_without_a_traceback(
    tmp_path: Path, filename: str, content: str, member_name: str
):
    package_dir = copy_package(tmp_path)
    (package_dir / filename).write_text(content, encoding="utf-8")

    result = run_installed_cli("validate", str(package_dir))

    assert result.returncode == 2
    assert result.stdout == ""
    assert f"duplicate JSON object member name {member_name!r}" in result.stderr
    assert "Traceback" not in result.stderr


@pytest.mark.parametrize("invalid_input", ["missing", "malformed", "nonfinite"])
def test_installed_validate_command_maps_input_errors_to_exit_2_without_a_traceback(tmp_path: Path, invalid_input: str):
    if invalid_input == "missing":
        package_dir = tmp_path / "missing-package"
    else:
        package_dir = copy_package(tmp_path)
        content = "{ invalid json" if invalid_input == "malformed" else "NaN"
        (package_dir / "evidence.json").write_text(content, encoding="utf-8")

    result = run_installed_cli("validate", str(package_dir))

    assert result.returncode == 2
    assert result.stdout == ""
    assert "Traceback" not in result.stderr
