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
    with pytest.raises(FrozenInstanceError):
        package.path = tmp_path


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
