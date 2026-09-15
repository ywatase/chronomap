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


def valid_instance(data_filename: str):
    return load_json(ROOT / "tests/fixtures/valid/synthetic-package" / data_filename)


def nested_errors(errors):
    for error in errors:
        yield error
        yield from nested_errors(error.context)


def assert_error(errors, path, validator):
    assert any(
        list(error.absolute_path) == path and error.validator == validator
        for error in nested_errors(errors)
    ), [str(error) for error in errors]


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


@pytest.mark.parametrize(
    "tag",
    ["en-u-ca-gregory", "x-private", "i-klingon", "en-Latn-US-oxendict-a-extend1-x-private"],
)
def test_rfc_5646_language_tags_are_accepted(tag):
    dataset = valid_instance("dataset.json")
    dataset["defaultLanguage"] = tag
    assert list(validator_for("dataset.schema.json").iter_errors(dataset)) == []


@pytest.mark.parametrize("tag", ["I-KLINGON", "EN-gb-OED"])
def test_mixed_case_grandfathered_rfc_5646_language_tags_are_accepted(tag):
    dataset = valid_instance("dataset.json")
    dataset["defaultLanguage"] = tag
    assert list(validator_for("dataset.schema.json").iter_errors(dataset)) == []


@pytest.mark.parametrize("tag", ["en\n", "en\r", "en\u2028", "en\u2029", "I-KLINGON\n"])
def test_json_and_ecma_line_terminators_are_rejected_from_language_tags(tag):
    dataset = valid_instance("dataset.json")
    dataset["defaultLanguage"] = tag
    errors = list(validator_for("dataset.schema.json").iter_errors(dataset))
    assert_error(errors, ["defaultLanguage"], "not")


@pytest.mark.parametrize("tag", ["de-1901-1901", "en-a-foo-a-bar"])
def test_exact_duplicate_rfc_5646_variants_and_extension_singletons_are_rejected(tag):
    dataset = valid_instance("dataset.json")
    dataset["defaultLanguage"] = tag
    errors = list(validator_for("dataset.schema.json").iter_errors(dataset))
    assert_error(errors, ["defaultLanguage"], "not")


@pytest.mark.parametrize("tag", ["en-u", "x", "en--US", "en-123456789"])
def test_invalid_language_tags_are_rejected_at_the_default_language_field(tag):
    dataset = valid_instance("dataset.json")
    dataset["defaultLanguage"] = tag
    errors = list(validator_for("dataset.schema.json").iter_errors(dataset))
    assert_error(errors, ["defaultLanguage"], "pattern")


@pytest.mark.parametrize(
    ("data_filename", "schema_filename", "path"),
    [
        ("dataset.json", "dataset.schema.json", ["title"]),
        ("entities.json", "entities.schema.json", [0, "type"]),
        ("sources.json", "sources.schema.json", [0, "citation"]),
        ("evidence.json", "evidence.schema.json", [0, "locator"]),
        ("feature-versions.geojson", "feature-versions.schema.json", ["features", 0, "properties", "rights"]),
    ],
)
def test_required_contract_fields_are_rejected_at_the_containing_record(data_filename, schema_filename, path):
    instance = valid_instance(data_filename)
    target = instance
    for component in path[:-1]:
        target = target[component]
    del target[path[-1]]
    errors = list(validator_for(schema_filename).iter_errors(instance))
    assert_error(errors, path[:-1], "required")


@pytest.mark.parametrize(
    ("data_filename", "schema_filename", "path"),
    [
        ("dataset.json", "dataset.schema.json", []),
        ("entities.json", "entities.schema.json", [0]),
        ("sources.json", "sources.schema.json", [0]),
        ("evidence.json", "evidence.schema.json", [0]),
        ("feature-versions.geojson", "feature-versions.schema.json", ["features", 0, "properties"]),
    ],
)
def test_additional_properties_are_rejected_at_the_contract_record(data_filename, schema_filename, path):
    instance = valid_instance(data_filename)
    target = instance
    for component in path:
        target = target[component]
    target["unexpected"] = "synthetic"
    errors = list(validator_for(schema_filename).iter_errors(instance))
    assert_error(errors, path, "additionalProperties")


def test_fixed_schema_version_is_rejected_at_the_schema_version_field():
    dataset = valid_instance("dataset.json")
    dataset["schemaVersion"] = "1.0.1"
    errors = list(validator_for("dataset.schema.json").iter_errors(dataset))
    assert_error(errors, ["schemaVersion"], "const")


def test_fixed_package_filename_is_rejected_at_the_file_entry():
    dataset = valid_instance("dataset.json")
    dataset["files"]["entities"] = "wrong.json"
    errors = list(validator_for("dataset.schema.json").iter_errors(dataset))
    assert_error(errors, ["files", "entities"], "const")


@pytest.mark.parametrize(
    ("data_filename", "schema_filename", "path", "value"),
    [
        ("dataset.json", "dataset.schema.json", ["rights", "status"], "not-a-rights-status"),
        ("entities.json", "entities.schema.json", [0, "type"], "not-an-entity-type"),
        ("evidence.json", "evidence.schema.json", [0, "usage"], "not-an-evidence-usage"),
        ("evidence.json", "evidence.schema.json", [0, "supports", 0], "not-a-support-dimension"),
        ("evidence.json", "evidence.schema.json", [2, "publicationBasis"], "not-a-publication-basis"),
        ("feature-versions.geojson", "feature-versions.schema.json", ["features", 0, "properties", "publicationStatus"], "not-a-publication-status"),
        ("feature-versions.geojson", "feature-versions.schema.json", ["features", 0, "properties", "temporal", "start", "precision"], "not-a-precision"),
        ("feature-versions.geojson", "feature-versions.schema.json", ["features", 0, "properties", "temporal", "start", "qualifier"], "not-a-qualifier"),
        ("feature-versions.geojson", "feature-versions.schema.json", ["features", 0, "properties", "uncertainty", "temporal", "assessment"], "not-an-assessment"),
    ],
)
def test_contract_enums_are_rejected_at_their_declared_field(data_filename, schema_filename, path, value):
    instance = valid_instance(data_filename)
    target = instance
    for component in path[:-1]:
        target = target[component]
    target[path[-1]] = value
    errors = list(validator_for(schema_filename).iter_errors(instance))
    assert_error(errors, path, "enum")


@pytest.mark.parametrize(("path", "value"), [([0, "url"], "not a URI"), ([0, "accessedDate"], "2026-02-30")])
def test_source_formats_are_checked_with_the_jsonschema_format_checker(path, value):
    sources = valid_instance("sources.json")
    target = sources
    for component in path[:-1]:
        target = target[component]
    target[path[-1]] = value
    validator = validator_for("sources.schema.json")
    assert validator.format_checker is not None
    assert {"uri", "date"} <= set(validator.format_checker.checkers)
    errors = list(validator.iter_errors(sources))
    assert_error(errors, path, "format")
