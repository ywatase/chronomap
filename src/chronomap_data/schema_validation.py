"""Draft 2020-12 structural validation for loaded dataset packages."""

from functools import cache
from importlib import resources
import json
from typing import Iterable, Mapping

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

from .models import DatasetPackage, JsonValue, ValidationIssue, ValidationProfile


SUPPORTED_SCHEMA_VERSION = "1.0.0"
SCHEMA_DIR = resources.files("chronomap_data").joinpath("schemas", "v1")
PACKAGE_DOCUMENTS = (
    ("dataset.json", "dataset.schema.json", "dataset"),
    ("entities.json", "entities.schema.json", "entities"),
    ("sources.json", "sources.schema.json", "sources"),
    ("evidence.json", "evidence.schema.json", "evidence"),
    ("feature-versions.geojson", "feature-versions.schema.json", "feature_versions"),
)


def _load_schema(filename: str) -> dict[str, object]:
    return json.loads(SCHEMA_DIR.joinpath(filename).read_text(encoding="utf-8"))


@cache
def _schema_registry() -> Registry:
    resources = []
    for resource in sorted(SCHEMA_DIR.iterdir(), key=lambda item: item.name):
        if not resource.name.endswith(".schema.json"):
            continue
        schema = _load_schema(resource.name)
        resources.append((schema["$id"], Resource.from_contents(schema)))
    return Registry().with_resources(resources)


@cache
def _validator_for(filename: str) -> Draft202012Validator:
    return Draft202012Validator(
        _load_schema(filename),
        registry=_schema_registry(),
        format_checker=FormatChecker(),
    )


def json_pointer(parts: Iterable[object]) -> str:
    """Convert an absolute validation path to a stable JSON Pointer."""
    tokens = [str(part).replace("~", "~0").replace("/", "~1") for part in parts]
    return "" if not tokens else "/" + "/".join(tokens)


def _schema_version_issue(dataset: JsonValue) -> ValidationIssue | None:
    if not isinstance(dataset, Mapping):
        return None
    version = dataset.get("schemaVersion")
    if isinstance(version, str) and version != SUPPORTED_SCHEMA_VERSION:
        return ValidationIssue(
            code="schema.unsupported_version",
            file="dataset.json",
            pointer="/schemaVersion",
            message=f"unsupported schema version {version!r}; expected {SUPPORTED_SCHEMA_VERSION!r}",
        )
    return None


def _plain_json(value: JsonValue) -> object:
    if isinstance(value, Mapping):
        return {key: _plain_json(item) for key, item in value.items()}
    if isinstance(value, tuple):
        return [_plain_json(item) for item in value]
    return value


def validate_package(package: DatasetPackage, profile: ValidationProfile) -> list[ValidationIssue]:
    """Return deterministic structural and semantic diagnostics for a package."""
    unsupported_version = _schema_version_issue(package.dataset)
    if unsupported_version is not None:
        return [unsupported_version]

    issues = []
    for filename, schema_filename, attribute in PACKAGE_DOCUMENTS:
        instance = _plain_json(getattr(package, attribute))
        validator = _validator_for(schema_filename)
        issues.extend(
            ValidationIssue(
                code="schema.invalid",
                file=filename,
                pointer=json_pointer(error.absolute_path),
                message=error.message,
            )
            for error in validator.iter_errors(instance)
        )
    if issues:
        return sorted(issues, key=lambda issue: (issue.file, issue.pointer, issue.code, issue.message))

    from .semantic_validation import validate_semantics

    return sorted(validate_semantics(package, profile), key=lambda issue: (issue.file, issue.pointer, issue.code, issue.message))
