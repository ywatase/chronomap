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

## Fix round 1 — BCP 47 and structural coverage

Changed files:

- `pyproject.toml` and `uv.lock`: use `jsonschema[format-nongpl]` so the test validator has registered `uri` and `date` format checkers.
- `schemas/v1/common.schema.json`: replace the narrowed language-tag expression with an anchored RFC 5646 lexical expression that covers language/script/region/variant sequences, extensions, private use, and registered grandfathered forms.
- `tests/test_schemas.py`: add focused, path-asserting mutations for language syntax, fixed version and filenames, each root-record required/additional-property boundary, every enum family, and source URI/date formats.

RED for the review cases:

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_schemas.py -q
..........FFFF......................FF.F.                                [100%]
7 failed, 34 passed in 1.36s
```

The first four failures were the required valid RFC 5646 tags (`en-u-ca-gregory`, `x-private`, `i-klingon`, and an extended tag with extension/private use) rejected by the old narrowed pattern. The URI case also proved that the previous dependency set had no registered `uri` checker. The two temporal enum cases identified that `anyOf` reports its detailed enum locations in nested validation contexts; the test assertion was updated to inspect those real contexts.

GREEN after the schema pattern and format dependency change:

```text
$ uv lock
Resolved 27 packages in 274ms
Added arrow v1.4.0
Added fqdn v1.5.1
Added idna v3.19
Added isoduration v20.11.0
Added jsonpointer v3.1.1
Added lark v1.3.1
Added python-dateutil v2.9.0.post0
Added rfc3339-validator v0.1.4
Added rfc3986-validator v0.1.1
Added rfc3987-syntax v1.1.0
Added six v1.17.0
Added tzdata v2026.4
Added uri-template v1.3.0
Added webcolors v25.10.0
Installed 14 packages in 578ms

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_schemas.py -q
.........................................                                [100%]
41 passed in 8.59s
```

Final verification before commit:

```text
$ uv lock --check
Resolved 27 packages in 3ms

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_schemas.py -q -p no:cacheprovider
.........................................                                [100%]
41 passed in 6.10s

$ git diff --check
```

`git diff --check` exited successfully with no output. The repository-level pytest cache was removed and no cache directories remain outside `.venv`.

## Fix round 2 — RFC 5646 casing and duplicate subtags

Changed files:

- `schemas/v1/common.schema.json`: make every grandfathered literal case-insensitive using portable ASCII character classes and add anchored, JSON Schema `not` guards for exact duplicate variants and extension singletons.
- `tests/test_schemas.py`: cover mixed-case grandfathered forms, exact duplicate variants/singletons, and document the mixed-case duplicate limitation as strict expected failures.

RED before the schema change:

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_schemas.py -q -p no:cacheprovider
..............FFFFxx...........................                          [100%]
4 failed, 41 passed, 2 xfailed in 7.02s
```

The failures were `I-KLINGON` and `EN-gb-OED` rejected by case-sensitive grandfathered alternatives, plus accepted exact duplicate variant (`de-1901-1901`) and extension singleton (`en-a-foo-a-bar`) tags. The two mixed-case duplicate tests are intentionally strict expected failures, described below.

GREEN for the portable schema subset:

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_schemas.py -q -p no:cacheprovider
..................xx...........................                          [100%]
45 passed, 2 xfailed in 6.82s
```

### Standards limitation and semantic split

JSON Schema Draft 2020-12 patterns use ECMA-262 regular expressions and do not provide a portable case-insensitive flag or case-folding transform. An ECMA-262 backreference can reject an exact repeat, but cannot compare an arbitrary captured subtag with a differently cased repeat. The schema therefore accepts BCP 47 syntax case-insensitively, rejects exact duplicate variants and extension singletons at schema level, and deliberately does **not** claim full case-insensitive duplicate detection. The two strict expected-failure tests (`sl-rozaj-ROZAJ` and `en-a-foo-A-bar`) preserve this visible boundary. Task 4 semantic validation must case-fold variants and singleton keys before enforcing RFC 5646 uniqueness.

Final verification before commit:

```text
$ uv lock --check
Resolved 27 packages in 4ms

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_schemas.py -q -p no:cacheprovider
..................xx...........................                          [100%]
45 passed, 2 xfailed in 6.42s

$ git diff --check
```

`git diff --check` exited successfully with no output. The cache scan, excluding `.venv`, produced no paths.
