from dataclasses import FrozenInstanceError
import os
from pathlib import Path
import shutil
import subprocess
import sys

import pytest

import chronomap_data.loader as loader
from chronomap_data.cli import main
from chronomap_data.loader import PackageLoadError, load_package


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"


def copy_package(tmp_path: Path) -> Path:
    package_dir = tmp_path / "synthetic-package"
    shutil.copytree(SYNTHETIC_PACKAGE, package_dir)
    return package_dir


def test_load_package_reads_the_complete_five_file_package_into_an_immutable_value(tmp_path: Path):
    package = load_package(copy_package(tmp_path))

    assert package.path == tmp_path / "synthetic-package"
    assert package.dataset["id"] == "synthetic:dataset:contract-sample"
    assert len(package.entities) == 3
    assert len(package.sources) == 2
    assert len(package.evidence) == 3
    assert len(package.feature_versions["features"]) == 4
    assert isinstance(package.entities, tuple)
    assert isinstance(package.feature_versions["features"], tuple)
    with pytest.raises(FrozenInstanceError):
        package.path = tmp_path
    with pytest.raises(TypeError):
        package.dataset["title"]["en"] = "Changed synthetic title"


def test_load_package_reports_the_missing_required_filename(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    (package_dir / "sources.json").unlink()

    with pytest.raises(PackageLoadError, match=r"sources\.json.*missing"):
        load_package(package_dir)


def test_load_package_reports_malformed_json_with_its_filename(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    (package_dir / "evidence.json").write_text("{ invalid json", encoding="utf-8")

    with pytest.raises(PackageLoadError, match=r"evidence\.json.*invalid JSON"):
        load_package(package_dir)


@pytest.mark.parametrize(
    ("filename", "content", "member_name"),
    [
        ("dataset.json", '{"rights":{"status":"public-domain","status":"restricted"}}', "status"),
        ("feature-versions.geojson", '{"type":"FeatureCollection","features":[{"properties":{"publicationStatus":"public","publicationStatus":"private"}}]}', "publicationStatus"),
    ],
)
def test_load_package_rejects_duplicate_json_object_member_names_at_any_depth(
    tmp_path: Path, filename: str, content: str, member_name: str
):
    package_dir = copy_package(tmp_path)
    (package_dir / filename).write_text(content, encoding="utf-8")

    with pytest.raises(PackageLoadError, match=rf"{filename}.*duplicate JSON object member name {member_name!r}"):
        load_package(package_dir)


@pytest.mark.parametrize("unexpected_name", ["notes.txt", "unexpected-directory"])
def test_load_package_rejects_every_unexpected_top_level_entry(tmp_path: Path, unexpected_name: str):
    package_dir = copy_package(tmp_path)
    unexpected_path = package_dir / unexpected_name
    if unexpected_path.suffix:
        unexpected_path.write_text("synthetic", encoding="utf-8")
    else:
        unexpected_path.mkdir()

    with pytest.raises(PackageLoadError, match=rf"{unexpected_name}.*unexpected top-level package entry"):
        load_package(package_dir)


def test_load_package_requires_each_named_entry_to_be_a_file(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    (package_dir / "sources.json").unlink()
    (package_dir / "sources.json").mkdir()

    with pytest.raises(PackageLoadError, match=r"sources\.json.*required package entry must be a file"):
        load_package(package_dir)


def test_load_package_rejects_a_required_entry_symlink_to_an_external_file(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    source_path = package_dir / "sources.json"
    external_file = tmp_path / "external-sources.json"
    external_file.write_bytes(source_path.read_bytes())
    source_path.unlink()
    source_path.symlink_to(external_file)

    with pytest.raises(PackageLoadError, match=r"sources\.json.*required package entry must be a file"):
        load_package(package_dir)


def test_load_package_reports_a_dangling_required_entry_symlink_as_missing(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    source_path = package_dir / "sources.json"
    source_path.unlink()
    source_path.symlink_to(tmp_path / "missing-sources.json")

    with pytest.raises(PackageLoadError, match=r"sources\.json.*missing"):
        load_package(package_dir)


@pytest.mark.skipif(not hasattr(os, "mkfifo"), reason="FIFO creation is unavailable on this platform")
def test_load_package_rejects_a_fifo_required_entry_without_attempting_to_read_it(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    source_path = package_dir / "sources.json"
    source_path.unlink()
    os.mkfifo(source_path)

    with pytest.raises(PackageLoadError, match=r"sources\.json.*required package entry must be a file"):
        load_package(package_dir)


@pytest.mark.parametrize("replacement", ["external-symlink", "different-regular-file"])
def test_load_package_rejects_a_required_entry_replaced_after_lstat_before_descriptor_read(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, replacement: str
):
    package_dir = copy_package(tmp_path)
    source_path = package_dir / "sources.json"
    external_file = tmp_path / "external-sources.json"
    external_file.write_text("[]", encoding="utf-8")
    original_lstat = Path.lstat
    replaced = False

    def replace_after_validation(path: Path):
        nonlocal replaced
        result = original_lstat(path)
        if path == source_path and not replaced:
            replaced = True
            if replacement == "external-symlink":
                source_path.unlink()
                source_path.symlink_to(external_file)
            else:
                external_file.replace(source_path)
        return result

    monkeypatch.setattr(Path, "lstat", replace_after_validation)

    with pytest.raises(PackageLoadError, match=r"sources\.json.*changed during loading"):
        load_package(package_dir)

    if replacement == "external-symlink":
        assert external_file.read_text(encoding="utf-8") == "[]"


@pytest.mark.skipif(
    not hasattr(os, "mkfifo") or not hasattr(os, "O_NONBLOCK"),
    reason="bounded FIFO-open regression requires POSIX FIFO and O_NONBLOCK support",
)
def test_load_package_rejects_a_regular_entry_replaced_with_a_fifo_before_any_blocking_read(tmp_path: Path):
    package_dir = copy_package(tmp_path)
    script = """
import os
from pathlib import Path
import sys

from chronomap_data import loader

package_dir = Path(sys.argv[1])
source_path = package_dir / 'sources.json'
original_lstat = Path.lstat
replaced = False

def replace_after_validation(path):
    global replaced
    result = original_lstat(path)
    if path == source_path and not replaced:
        replaced = True
        source_path.unlink()
        os.mkfifo(source_path)
    return result

Path.lstat = replace_after_validation
try:
    loader.load_package(package_dir)
except loader.PackageLoadError as error:
    raise SystemExit(0 if 'sources.json: required package entry changed during loading' == str(error) else 1)
raise SystemExit(1)
"""
    environment = dict(os.environ)
    environment["PYTHONPATH"] = str(ROOT / "src")
    try:
        result = subprocess.run(
            [sys.executable, "-c", script, str(package_dir)],
            cwd=ROOT,
            env=environment,
            text=True,
            capture_output=True,
            check=False,
            timeout=2,
        )
    except subprocess.TimeoutExpired:
        pytest.fail("FIFO replacement blocked before descriptor validation")

    assert result.returncode == 0, result.stderr


@pytest.mark.parametrize("primary_operation", ["fstat", "read"])
def test_primary_descriptor_error_is_preserved_when_closing_the_descriptor_also_fails(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, primary_operation: str
):
    package_dir = copy_package(tmp_path)
    source_path = package_dir / "sources.json"
    close_calls: list[int] = []
    original_close = loader.os.close

    def close_then_fail(descriptor: int):
        close_calls.append(descriptor)
        original_close(descriptor)
        raise OSError("close failure")

    monkeypatch.setattr(loader.os, "close", close_then_fail)
    if primary_operation == "fstat":
        monkeypatch.setattr(loader.os, "fstat", lambda descriptor: (_ for _ in ()).throw(OSError("fstat failure")))
    else:
        monkeypatch.setattr(loader.os, "read", lambda descriptor, count: (_ for _ in ()).throw(OSError("read failure")))

    with pytest.raises(PackageLoadError, match=rf"sources\.json.*{primary_operation} failure"):
        loader._read_json(package_dir, "sources.json")

    assert len(close_calls) == 1


def test_standalone_descriptor_close_failure_is_an_actionable_package_load_error(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
):
    package_dir = copy_package(tmp_path)
    close_calls: list[int] = []
    original_close = loader.os.close

    def close_then_fail(descriptor: int):
        close_calls.append(descriptor)
        original_close(descriptor)
        raise OSError("close failure")

    monkeypatch.setattr(loader.os, "close", close_then_fail)

    with pytest.raises(PackageLoadError, match=r"sources\.json.*cannot close package file.*close failure"):
        loader._read_json(package_dir, "sources.json")

    assert len(close_calls) == 1


def test_validate_maps_a_standalone_descriptor_close_failure_to_exit_2(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys):
    package_dir = copy_package(tmp_path)
    original_close = loader.os.close

    def close_then_fail(descriptor: int):
        original_close(descriptor)
        raise OSError("close failure")

    monkeypatch.setattr(loader.os, "close", close_then_fail)

    assert main(["validate", str(package_dir)]) == 2
    stderr = capsys.readouterr().err
    assert "cannot close package file: close failure" in stderr
    assert "Traceback" not in stderr


@pytest.mark.parametrize("nonfinite_token", ["NaN", "Infinity", "-Infinity"])
def test_load_package_rejects_nonfinite_json_constants(tmp_path: Path, nonfinite_token: str):
    package_dir = copy_package(tmp_path)
    (package_dir / "evidence.json").write_text(nonfinite_token, encoding="utf-8")

    with pytest.raises(PackageLoadError, match=r"evidence\.json.*invalid JSON"):
        load_package(package_dir)
