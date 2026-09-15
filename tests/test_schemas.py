import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource


ROOT = Path(__file__).parents[1]
SCHEMA_DIR = ROOT / "schemas" / "v1"
PACKAGE_FILES = {
    "dataset.json": "dataset.schema.json",
    "entities.json": "entities.schema.json",
    "sources.json": "sources.schema.json",
    "evidence.json": "evidence.schema.json",
    "feature-versions.geojson": "feature-versions.schema.json",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def schema_registry() -> Registry:
    resources = []
    for path in sorted(SCHEMA_DIR.glob("*.schema.json")):
        schema = load_json(path)
        resources.append((schema["$id"], Resource.from_contents(schema)))
    return Registry().with_resources(resources)


def validator_for(schema_filename: str) -> Draft202012Validator:
    schema = load_json(SCHEMA_DIR / schema_filename)
    return Draft202012Validator(
        schema,
        registry=schema_registry(),
        format_checker=FormatChecker(),
    )


def package_errors(package_dir: Path):
    errors = []
    for data_filename, schema_filename in PACKAGE_FILES.items():
        validator = validator_for(schema_filename)
        instance = load_json(package_dir / data_filename)
        errors.extend(validator.iter_errors(instance))
    return errors


def test_every_schema_is_a_valid_draft_2020_12_schema():
    schema_paths = sorted(SCHEMA_DIR.glob("*.schema.json"))
    assert {path.name for path in schema_paths} == {
        "common.schema.json",
        "dataset.schema.json",
        "entities.schema.json",
        "sources.schema.json",
        "evidence.schema.json",
        "feature-versions.schema.json",
    }
    for path in schema_paths:
        Draft202012Validator.check_schema(load_json(path))


def test_complete_synthetic_package_is_structurally_valid():
    assert package_errors(ROOT / "tests/fixtures/valid/synthetic-package") == []


@pytest.mark.parametrize(
    ("fixture_name", "schema_filename"),
    [
        ("invalid-dataset-id", "dataset.schema.json"),
        ("invalid-default-language-map", "dataset.schema.json"),
        ("invalid-temporal-boundary", "feature-versions.schema.json"),
        ("invalid-derived-geometry-evidence", "evidence.schema.json"),
        ("invalid-uncertainty-assessment", "feature-versions.schema.json"),
        ("invalid-hypothesis-label", "feature-versions.schema.json"),
        ("invalid-geometry-position", "feature-versions.schema.json"),
        ("invalid-geometry-collection", "feature-versions.schema.json"),
    ],
)
def test_structurally_invalid_synthetic_fixtures_are_rejected(fixture_name, schema_filename):
    instance = load_json(ROOT / "tests/fixtures/invalid" / f"{fixture_name}.json")
    assert list(validator_for(schema_filename).iter_errors(instance))
