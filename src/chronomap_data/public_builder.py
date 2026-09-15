"""Deterministic, fail-closed projection of authoring packages for publication."""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
import json
import os
from pathlib import Path
import shutil
import stat
import tempfile
from uuid import uuid4

from .models import DatasetPackage, JsonValue, ValidationIssue, ValidationProfile
from .schema_validation import validate_package


SAFE_CITATION_NOTE = "Citation-only metadata; no authored source content is reproduced."


@dataclass(frozen=True, slots=True)
class BuildSummary:
    """Counts and location of a completed public-bundle build."""

    versions: int
    entities: int
    evidence: int
    sources: int
    output: Path

    @property
    def version_count(self) -> int:
        return self.versions

    @property
    def entity_count(self) -> int:
        return self.entities

    @property
    def evidence_count(self) -> int:
        return self.evidence

    @property
    def source_count(self) -> int:
        return self.sources


class PublicBuildValidationError(Exception):
    """The authoring package cannot safely be emitted as a public bundle."""

    def __init__(self, issues: Sequence[ValidationIssue]) -> None:
        self.issues = tuple(issues)
        super().__init__("public bundle validation failed")


class PublicBuildIOError(Exception):
    """The public bundle could not be safely written or replaced."""


def _source_identity(source_status: os.stat_result) -> tuple[int, int]:
    return source_status.st_dev, source_status.st_ino


def _verify_package_source(package: DatasetPackage) -> Path:
    """Ensure the source captured by the loader still names the same directory."""
    source_path = package.path
    try:
        source_status = source_path.lstat()
    except OSError as error:
        raise PublicBuildIOError(f"source directory changed or is unavailable: {source_path}: {error}") from error
    if not stat.S_ISDIR(source_status.st_mode) or _source_identity(source_status) != package.directory_identity:
        raise PublicBuildIOError(f"source directory changed or is unavailable: {source_path}")
    return source_path


def _records(value: JsonValue) -> Sequence[Mapping[str, JsonValue]]:
    return value if isinstance(value, tuple) else ()


def _mapping(value: JsonValue) -> Mapping[str, JsonValue]:
    return value if isinstance(value, Mapping) else {}


def _plain_json(value: JsonValue) -> object:
    if isinstance(value, Mapping):
        return {key: _plain_json(item) for key, item in value.items()}
    if isinstance(value, tuple):
        return [_plain_json(item) for item in value]
    return value


def _sorted_records(records: Sequence[Mapping[str, JsonValue]]) -> list[object]:
    return [_plain_json(record) for record in sorted(records, key=lambda record: str(record["id"]))]


def _canonicalize_feature_identifier_arrays(feature_collection: dict[str, object]) -> None:
    """Sort FeatureVersion evidence references without changing semantic arrays."""
    features = feature_collection.get("features")
    if not isinstance(features, list):
        return
    for feature in features:
        if not isinstance(feature, dict):
            continue
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            continue
        evidence_ids = properties.get("evidenceIds")
        if isinstance(evidence_ids, list):
            properties["evidenceIds"] = sorted(evidence_ids)
        uncertainty = properties.get("uncertainty")
        if not isinstance(uncertainty, dict):
            continue
        for assessment in uncertainty.values():
            if isinstance(assessment, dict) and isinstance(assessment.get("evidenceIds"), list):
                assessment["evidenceIds"] = sorted(assessment["evidenceIds"])


def _project_evidence(
    evidence: Sequence[Mapping[str, JsonValue]], source_by_id: Mapping[object, Mapping[str, JsonValue]]
) -> list[object]:
    projected: list[object] = []
    for record in sorted(evidence, key=lambda item: str(item["id"])):
        source = source_by_id.get(record.get("sourceId"))
        source_status = _mapping(_mapping(source).get("rights")).get("status")
        if record.get("usage") == "citation" and source_status in {"restricted", "unknown"}:
            projected.append(
                {
                    "id": _plain_json(record["id"]),
                    "sourceId": _plain_json(record["sourceId"]),
                    "locator": _plain_json(record["locator"]),
                    "usage": "citation",
                    "supports": _plain_json(record["supports"]),
                    "note": SAFE_CITATION_NOTE,
                }
            )
        else:
            projected.append(_plain_json(record))
    return projected


def _project(package: DatasetPackage) -> tuple[dict[str, object], list[object], list[object], list[object], dict[str, object]]:
    collection = _mapping(package.feature_versions)
    public_features = [
        feature
        for feature in _records(collection.get("features"))
        if _mapping(feature.get("properties")).get("publicationStatus") == "public"
    ]
    entity_ids = {_mapping(feature.get("properties")).get("entityId") for feature in public_features}
    evidence_ids = {
        evidence_id
        for feature in public_features
        for evidence_id in _records(_mapping(feature.get("properties")).get("evidenceIds"))
    }
    entities = [record for record in _records(package.entities) if record.get("id") in entity_ids]
    evidence = [record for record in _records(package.evidence) if record.get("id") in evidence_ids]
    source_by_id = {record.get("id"): record for record in _records(package.sources)}
    source_ids = {record.get("sourceId") for record in evidence}
    sources = [record for record in _records(package.sources) if record.get("id") in source_ids]
    feature_collection = _plain_json(collection)
    assert isinstance(feature_collection, dict)
    feature_collection["features"] = _sorted_records(public_features)
    _canonicalize_feature_identifier_arrays(feature_collection)
    dataset = _plain_json(package.dataset)
    assert isinstance(dataset, dict)
    return dataset, _sorted_records(entities), _sorted_records(sources), _project_evidence(evidence, source_by_id), feature_collection


def _format_json_integer(value: int) -> str:
    """Format an integer without Python's decimal-string digit limit."""
    if value == 0:
        return "0"
    negative = value < 0
    remaining = -value if negative else value
    chunk_size = 18
    base = 10**chunk_size
    chunks: list[int] = []
    while remaining:
        remaining, chunk = divmod(remaining, base)
        chunks.append(chunk)
    head = str(chunks.pop())
    tail = "".join(f"{chunk:0{chunk_size}d}" for chunk in reversed(chunks))
    return ("-" if negative else "") + head + tail


def _canonical_json(value: object, indentation: int = 0, active: set[int] | None = None) -> str:
    """Encode contract JSON with sorted object keys and two-space indentation."""
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        return _format_json_integer(value)
    if isinstance(value, float):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)

    active = set() if active is None else active
    marker = id(value)
    if marker in active:
        raise ValueError("Circular reference detected")
    if isinstance(value, list | tuple):
        active.add(marker)
        try:
            if not value:
                return "[]"
            child_indent = indentation + 1
            prefix = "  " * child_indent
            joined = ",\n".join(prefix + _canonical_json(item, child_indent, active) for item in value)
            return f"[\n{joined}\n{'  ' * indentation}]"
        finally:
            active.remove(marker)
    if isinstance(value, dict):
        if not all(isinstance(key, str) for key in value):
            raise TypeError("JSON object keys must be strings")
        active.add(marker)
        try:
            if not value:
                return "{}"
            child_indent = indentation + 1
            prefix = "  " * child_indent
            joined = ",\n".join(
                prefix
                + json.dumps(key, ensure_ascii=False)
                + ": "
                + _canonical_json(value[key], child_indent, active)
                for key in sorted(value)
            )
            return f"{{\n{joined}\n{'  ' * indentation}}}"
        finally:
            active.remove(marker)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _serialized(value: object) -> bytes:
    try:
        return (_canonical_json(value) + "\n").encode("utf-8")
    except (TypeError, UnicodeError, ValueError) as error:
        raise PublicBuildIOError(f"could not serialize public output: {error}") from error


def _write_bundle(directory: Path, documents: tuple[dict[str, object], list[object], list[object], list[object], dict[str, object]]) -> None:
    dataset, entities, sources, evidence, feature_collection = documents
    for filename, value in (
        ("dataset.json", dataset),
        ("entities.json", entities),
        ("sources.json", sources),
        ("evidence.json", evidence),
        ("feature-versions.geojson", feature_collection),
    ):
        (directory / filename).write_bytes(_serialized(value))


def _remove_tree(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)


def _cleanup_paths(*paths: Path | None) -> None:
    """Attempt every cleanup, then raise the first filesystem error."""
    cleanup_error: OSError | None = None
    for path in paths:
        if path is None:
            continue
        try:
            _remove_tree(path)
        except OSError as error:
            if cleanup_error is None:
                cleanup_error = error
    if cleanup_error is not None:
        raise cleanup_error


def _swap_output(temp_directory: Path, output: Path) -> None:
    """Commit *temp_directory*, rolling back only before its rename succeeds."""
    backup = output.parent / f".{output.name}.backup-{uuid4().hex}"
    had_output = output.exists()
    try:
        if had_output:
            output.replace(backup)
    except OSError as error:
        raise PublicBuildIOError(f"could not preserve prior public output: {error}") from error

    try:
        temp_directory.replace(output)
    except OSError as error:
        if had_output and backup.exists():
            try:
                backup.replace(output)
            except OSError as rollback_error:
                raise PublicBuildIOError(
                    f"could not commit public output: {error}; prior output recovery artifact retained at "
                    f"{backup}; restore also failed: {rollback_error}"
                ) from error
        raise PublicBuildIOError(f"could not commit public output: {error}") from error

    if had_output:
        try:
            _remove_tree(backup)
        except OSError as cleanup_error:
            raise PublicBuildIOError(
                f"public output installed but backup cleanup incomplete; recovery artifact retained at "
                f"{backup}: {cleanup_error}"
            ) from cleanup_error


def build_public_bundle(package: DatasetPackage, output: Path) -> BuildSummary:
    """Validate and atomically project *package* into the public *output* directory."""
    try:
        output = Path(output).resolve()
    except (OSError, RuntimeError) as error:
        raise PublicBuildIOError(f"could not resolve output path: {error}") from error
    package_path = _verify_package_source(package)
    if package_path == output or package_path in output.parents or output in package_path.parents:
        raise PublicBuildIOError(
            f"input and output paths overlap: package {package_path} and output {output}"
        )

    issues = validate_package(package, ValidationProfile.PUBLIC)
    if issues:
        raise PublicBuildValidationError(issues)

    if not output.parent.is_dir():
        raise PublicBuildIOError(f"output parent directory does not exist: {output.parent}")
    if output.exists() and not output.is_dir():
        raise PublicBuildIOError(f"output path is not a directory: {output}")

    documents = _project(package)
    temp_directory: Path | None = None
    primary_error: PublicBuildIOError | None = None
    try:
        temp_directory = Path(tempfile.mkdtemp(prefix=f".{output.name}.tmp-", dir=output.parent))
        _write_bundle(temp_directory, documents)
        _swap_output(temp_directory, output)
    except OSError as error:
        primary_error = PublicBuildIOError(f"could not write public output: {error}")
        raise primary_error from error
    except PublicBuildIOError as error:
        primary_error = error
        raise
    finally:
        if temp_directory is not None:
            try:
                _cleanup_paths(temp_directory)
            except OSError as cleanup_error:
                if primary_error is None:
                    raise PublicBuildIOError(f"could not clean public output staging: {cleanup_error}") from cleanup_error

    return BuildSummary(
        versions=len(documents[4]["features"]),
        entities=len(documents[1]),
        evidence=len(documents[3]),
        sources=len(documents[2]),
        output=output,
    )
