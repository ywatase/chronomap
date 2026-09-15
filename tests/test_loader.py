from dataclasses import FrozenInstanceError
from pathlib import Path
import shutil

import pytest

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


@pytest.mark.parametrize("nonfinite_token", ["NaN", "Infinity", "-Infinity"])
def test_load_package_rejects_nonfinite_json_constants(tmp_path: Path, nonfinite_token: str):
    package_dir = copy_package(tmp_path)
    (package_dir / "evidence.json").write_text(nonfinite_token, encoding="utf-8")

    with pytest.raises(PackageLoadError, match=r"evidence\.json.*invalid JSON"):
        load_package(package_dir)
