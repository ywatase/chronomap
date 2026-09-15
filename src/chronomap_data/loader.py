"""Filesystem loading for normalized Chronomap dataset packages."""

import json
from pathlib import Path
from types import MappingProxyType

from .models import DatasetPackage, JsonValue


PACKAGE_FILENAMES = (
    "dataset.json",
    "entities.json",
    "sources.json",
    "evidence.json",
    "feature-versions.geojson",
)


class PackageLoadError(Exception):
    """A package cannot be read from the supplied filesystem location."""

    def __init__(self, file: str, message: str) -> None:
        self.file = file
        self.message = message
        super().__init__(f"{file}: {message}")


def _freeze(value: object) -> JsonValue:
    if value is None or isinstance(value, bool | int | float | str):
        return value
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    if isinstance(value, dict):
        return MappingProxyType({str(key): _freeze(item) for key, item in value.items()})
    raise TypeError(f"unsupported JSON value: {type(value).__name__}")


def _read_json(package_dir: Path, filename: str) -> JsonValue:
    file_path = package_dir / filename
    try:
        text = file_path.read_text(encoding="utf-8")
    except FileNotFoundError as error:
        raise PackageLoadError(filename, "required package file is missing") from error
    except (OSError, UnicodeDecodeError) as error:
        detail = getattr(error, "strerror", None) or str(error)
        raise PackageLoadError(filename, f"cannot read package file: {detail}") from error
    try:
        return _freeze(json.loads(text))
    except json.JSONDecodeError as error:
        raise PackageLoadError(filename, f"invalid JSON: {error.msg}") from error


def load_package(path: Path) -> DatasetPackage:
    """Load exactly the five normalized package files from *path*."""
    package_dir = Path(path)
    if not package_dir.is_dir():
        raise PackageLoadError(str(package_dir), "dataset directory does not exist or is not a directory")

    loaded = {filename: _read_json(package_dir, filename) for filename in PACKAGE_FILENAMES}
    return DatasetPackage(
        path=package_dir,
        dataset=loaded["dataset.json"],
        entities=loaded["entities.json"],
        sources=loaded["sources.json"],
        evidence=loaded["evidence.json"],
        feature_versions=loaded["feature-versions.geojson"],
    )
