"""Filesystem loading for normalized Chronomap dataset packages."""

import errno
import json
import os
from pathlib import Path
import stat
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


class _DuplicateJsonMemberError(ValueError):
    """An object name appears more than once in one JSON object."""


def _reject_duplicate_json_members(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for name, value in pairs:
        if name in result:
            raise _DuplicateJsonMemberError(f"duplicate JSON object member name {name!r}")
        result[name] = value
    return result


def _freeze(value: object) -> JsonValue:
    if value is None or isinstance(value, bool | int | float | str):
        return value
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    if isinstance(value, dict):
        return MappingProxyType({str(key): _freeze(item) for key, item in value.items()})
    raise TypeError(f"unsupported JSON value: {type(value).__name__}")


def _reject_json_constant(token: str) -> None:
    raise ValueError(f"non-JSON constant {token!r}")


def _file_identity(file_status: os.stat_result) -> tuple[int, int]:
    return file_status.st_dev, file_status.st_ino


def _initial_entry_status(file_path: Path, filename: str) -> os.stat_result:
    try:
        entry_status = file_path.lstat()
    except FileNotFoundError as error:
        raise PackageLoadError(filename, "required package file is missing") from error
    except OSError as error:
        detail = getattr(error, "strerror", None) or str(error)
        raise PackageLoadError(filename, f"cannot inspect required package entry: {detail}") from error
    if stat.S_ISLNK(entry_status.st_mode):
        try:
            file_path.stat()
        except FileNotFoundError as error:
            raise PackageLoadError(filename, "required package file is missing") from error
        except OSError:
            pass
        raise PackageLoadError(filename, "required package entry must be a file")
    if not stat.S_ISREG(entry_status.st_mode):
        raise PackageLoadError(filename, "required package entry must be a file")
    return entry_status


def _entry_changed(filename: str) -> PackageLoadError:
    return PackageLoadError(filename, "required package entry changed during loading")


def _read_verified_bytes(file_path: Path, filename: str, initial_status: os.stat_result) -> bytes:
    open_flags = os.O_RDONLY
    if hasattr(os, "O_NOFOLLOW"):
        open_flags |= os.O_NOFOLLOW
    try:
        descriptor = os.open(file_path, open_flags)
    except OSError as error:
        if error.errno in {errno.ENOENT, errno.ELOOP}:
            raise _entry_changed(filename) from error
        detail = getattr(error, "strerror", None) or str(error)
        raise PackageLoadError(filename, f"cannot read package file: {detail}") from error
    try:
        descriptor_status = os.fstat(descriptor)
        if not stat.S_ISREG(descriptor_status.st_mode) or (
            _file_identity(descriptor_status) != _file_identity(initial_status)
        ):
            raise _entry_changed(filename)
        try:
            current_status = file_path.lstat()
        except OSError as error:
            raise _entry_changed(filename) from error
        if not stat.S_ISREG(current_status.st_mode) or (
            _file_identity(current_status) != _file_identity(initial_status)
        ):
            raise _entry_changed(filename)
        with os.fdopen(descriptor, "rb") as package_file:
            descriptor = -1
            return package_file.read()
    except OSError as error:
        detail = getattr(error, "strerror", None) or str(error)
        raise PackageLoadError(filename, f"cannot read package file: {detail}") from error
    finally:
        if descriptor >= 0:
            os.close(descriptor)


def _read_json(package_dir: Path, filename: str) -> JsonValue:
    file_path = package_dir / filename
    initial_status = _initial_entry_status(file_path, filename)
    try:
        text = _read_verified_bytes(file_path, filename, initial_status).decode("utf-8")
    except UnicodeDecodeError as error:
        detail = getattr(error, "strerror", None) or str(error)
        raise PackageLoadError(filename, f"cannot read package file: {detail}") from error
    try:
        return _freeze(
            json.loads(
                text,
                object_pairs_hook=_reject_duplicate_json_members,
                parse_constant=_reject_json_constant,
            )
        )
    except (json.JSONDecodeError, ValueError) as error:
        detail = getattr(error, "msg", None) or str(error)
        raise PackageLoadError(filename, f"invalid JSON: {detail}") from error


def load_package(path: Path) -> DatasetPackage:
    """Load exactly the five normalized package files from *path*."""
    package_dir = Path(path)
    if not package_dir.is_dir():
        raise PackageLoadError(str(package_dir), "dataset directory does not exist or is not a directory")

    try:
        unexpected_entries = sorted(entry.name for entry in package_dir.iterdir() if entry.name not in PACKAGE_FILENAMES)
    except OSError as error:
        detail = getattr(error, "strerror", None) or str(error)
        raise PackageLoadError(str(package_dir), f"cannot list dataset directory: {detail}") from error
    if unexpected_entries:
        raise PackageLoadError(
            unexpected_entries[0],
            "unexpected top-level package entry; only the five required package files are allowed",
        )
    loaded = {filename: _read_json(package_dir, filename) for filename in PACKAGE_FILENAMES}
    return DatasetPackage(
        path=package_dir,
        dataset=loaded["dataset.json"],
        entities=loaded["entities.json"],
        sources=loaded["sources.json"],
        evidence=loaded["evidence.json"],
        feature_versions=loaded["feature-versions.geojson"],
    )
