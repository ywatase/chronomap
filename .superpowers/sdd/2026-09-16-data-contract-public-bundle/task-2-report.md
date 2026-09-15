# Task 2 report — versioned schemas and synthetic fixtures

## Scope delivered

- Python 3.12 `uv` project metadata and lockfile, with `jsonschema` and `pytest` version bounds required by the plan.
- Six addressable JSON Schema Draft 2020-12 documents: common definitions plus dataset, entity, source, evidence, and FeatureVersion GeoJSON roots.
- A complete, non-historical five-file fixture package that includes Point, LineString, and Polygon features; BCE years; an open temporal boundary; two parallel hypotheses; a private feature; citation-only use of a restricted source; and derived geometry.
- Eight wholly synthetic negative JSON fixtures covering wrong ID kind, invalid language-map key, empty temporal boundary, missing derived-geometry publication basis, unsupported uncertainty evidence state, incomplete hypothesis metadata, a three-dimensional position, and GeometryCollection.

The schemas constrain ID syntax and field-specific kinds, fixed package filenames and version, supported GeoJSON geometry types and exactly two coordinate ordinates, text-map language-tag keys, temporal/uncertainty/evidence structural requirements, and `additionalProperties: false` on contract records. Ordering, identifier uniqueness, references, default-language membership, boundary ordering, coordinate range/ring semantics, and cross-feature hypothesis semantics remain semantic validation work for Task 4.

## TDD evidence

RED (before any schema or fixture existed):

```text
$ uv lock && uv run pytest tests/test_schemas.py -q
FFFFFFFFFF                                                               [100%]
10 failed in 2.04s
```

The first failure was the expected empty `schemas/v1` assertion; all remaining failures were expected `FileNotFoundError` errors for absent schema files.

GREEN:

```text
$ uv run pytest tests/test_schemas.py -q
..........                                                               [100%]
10 passed in 0.55s
```

Final verification:

```text
$ uv lock --check && uv run pytest tests/test_schemas.py -q && git diff --check
Resolved 13 packages in 4ms
..........                                                               [100%]
10 passed in 0.55s
```

`git diff --check` exited successfully with no output.

## Decision notes

JSON Schema Draft 2020-12 cannot express the dynamic requirement that an arbitrary `defaultLanguage` value must also be a key in each associated text map. The schemas validate all language tags and text-map shape; enforcement of that cross-field invariant is intentionally left for the Task 4 semantic validator, along with the other rules explicitly reserved for semantic validation.
