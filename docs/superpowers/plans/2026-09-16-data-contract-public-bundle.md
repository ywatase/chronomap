# Chronomap Data Contract and Public Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define Chronomap's versioned historical-data contract and ship a Python validator plus a fail-closed public-bundle builder.

**Architecture:** Each dataset is a normalized five-file package: a manifest, entity/source/evidence indexes, and GeoJSON FeatureVersions. Draft 2020-12 JSON Schemas validate file shape; Python performs cross-file semantics and projects authoring data into a deterministic public bundle.

**Tech Stack:** Python 3.12, uv, jsonschema >=4.26,<5, pytest >=9.1,<10, JSON Schema Draft 2020-12, GeoJSON/WGS84.

**Spec:** This plan is the executable form of the user-approved design. Task 1 writes its normative repository copy to `docs/data/model.md`; after Task 1 that document is binding.

## Global Constraints

- The phase covers the data contract, validation, and public projection only; do not add real historical data, Web UI, or deployment.
- Use synthetic fixtures clearly marked as non-historical test data.
- Preserve the decision bodies of accepted ADRs 0001-0004 unchanged.
- Dataset format version is exactly `1.0.0`; schema dialect is Draft 2020-12.
- Package filenames are exactly `dataset.json`, `entities.json`, `sources.json`, `evidence.json`, and `feature-versions.geojson`.
- IDs use `<namespace>:<kind>:<slug>` with globally unique IDs and kinds `dataset`, `entity`, `version`, `source`, `evidence`, or `hypothesis`.
- Text maps use BCP 47 keys. Geometry is two-dimensional WGS84 longitude/latitude and excludes GeometryCollection.
- Astronomical year numbering is used: 1 BCE is 0 and 2 BCE is -1. Temporal filtering is inclusive and possibility-first.
- Missing `publicationStatus` means `private`. There is no manual publication override.
- Public builds exclude private FeatureVersions and prune unreachable entities, evidence, and sources; public-marked records with invalid references, evidence, or rights fail the build.
- Citation-only use of restricted/unknown sources is allowed when rights metadata and locators are present; reproduced content is never stored.
- Every production function is introduced through a witnessed red-green TDD cycle. Tests exercise real filesystem/package behavior without mocks.
- Python API names, CLI syntax, exit codes, error codes, and serialization rules below are public contracts.

---

### Task 1: Write the normative model and architecture decisions

**Files:**
- Create: `docs/data/model.md`
- Create: `docs/adr/0005-normalized-data-package.md`
- Create: `docs/adr/0006-possible-time-and-parallel-hypotheses.md`
- Create: `docs/adr/0007-fail-closed-public-projection.md`
- Modify: `docs/adr/README.md`
- Modify: `docs/architecture/overview.md`

**Interfaces:**
- Produces the normative field names and invariants consumed by every later task.

- [ ] Document the five-file package and these records:
  - `Dataset`: `schemaVersion`, `id`, `title`, `description`, `defaultLanguage`, `bbox`, `temporalExtent`, `rights`, `files`.
  - `HistoricalEntity`: `id`, `type`, `labels`, `description`.
  - `Source`: `id`, `type`, `citation`, `title`, `creators`, `publishedYear`, `url`, `accessedDate`, `rights`.
  - `Evidence`: `id`, `sourceId`, `locator`, `usage`, `supports`, `note`, optional `publicationBasis`.
  - GeoJSON FeatureVersion: Feature `id` plus properties `entityId`, `labels`, `description`, `temporal`, `uncertainty`, `evidenceIds`, optional `publicationStatus`, `rights`, optional `hypothesisGroupId` and `hypothesisLabel`.
- [ ] Define entity types: `waterbody`, `watercourse`, `coastline`, `fortification`, `settlement`, `port`, `battlefield`, `route`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`, `other`. Do not bind entity type to geometry type.
- [ ] Define `TemporalBoundary` with nullable `earliestYear`/`latestYear`, `precision` (`year|decade|century|period|unknown`), and `qualifier` (`exact|circa|before|after|unknown`). Start or end may be open, but not both; when present a boundary has at least one year. Possible activity is from start.earliestYear or negative infinity through end.latestYear or positive infinity, inclusively.
- [ ] Define uncertainty dimensions `temporal`, `location`, `geometry`, `identity` and assessments `well-supported|approximate|disputed|unknown|not-applicable`, including note/evidence requirements.
- [ ] Define parallel hypotheses: a group has at least two versions for one entity with overlapping possible periods; every grouped version has a hypothesis label; no preferred flag exists.
- [ ] Define `Rights.status` as `public-domain|open-license|permission|restricted|unknown`. Public Dataset and FeatureVersion rights must be publishable. Evidence `usage` is `citation|derived-geometry`; derived geometry requires `publicationBasis` in `open-license|public-domain|permission|original-reconstruction` plus an explanatory note and attribution/terms where applicable.
- [ ] Define publication projection and deterministic serialization: arrays by ID, GeoJSON Features by Feature ID, JSON keys sorted, UTF-8, two-space indentation, trailing newline, coordinate order preserved.
- [ ] Add ADRs 0005-0007 as Accepted with Date `2026-09-16` and `Superseded by: なし`; extend ADR index and architecture data flow/concept model without editing accepted ADR bodies.
- [ ] Verify relative links, run the repository placeholder scan without embedding its literal tokens in documentation, and run `git diff --check`; then commit `docs: specify the historical data contract`.

### Task 2: Add versioned JSON Schemas and synthetic fixtures

**Files:**
- Create: `pyproject.toml`, `uv.lock`, `.python-version`
- Create: `schemas/v1/*.schema.json`
- Create: `tests/fixtures/valid/**`, `tests/fixtures/invalid/**`
- Create: `tests/test_schemas.py`

**Interfaces:**
- Consumes `docs/data/model.md`.
- Produces Draft 2020-12 schemas addressable by filename and reusable fixture package directories.

- [ ] Configure Python >=3.12, console script `chronomap-data = chronomap_data.cli:main`, runtime `jsonschema>=4.26,<5`, dev `pytest>=9.1,<10`, and commit `uv.lock`.
- [ ] Write failing tests that load every schema, call `Draft202012Validator.check_schema`, accept the complete valid synthetic package, and reject one fixture per structural rule.
- [ ] Confirm RED because schemas do not exist, then create common, dataset, entities, sources, evidence, and FeatureVersion GeoJSON schemas with `additionalProperties: false` for contract records.
- [ ] Restrict geometry to two-dimensional Point/MultiPoint, LineString/MultiLineString, Polygon/MultiPolygon; Schema handles structure while semantic ring/coordinate checks remain Task 4.
- [ ] Include valid point/line/polygon, BCE, open boundary, parallel-hypothesis, private, citation-only restricted-source, and derived-geometry cases. Never use real place names or historical claims.
- [ ] Run `uv run pytest tests/test_schemas.py -q`, verify GREEN with pristine output, run `git diff --check`, then commit `feat: add versioned historical data schemas`.

### Task 3: Implement package loading, schema validation, and CLI diagnostics

**Files:**
- Create: `src/chronomap_data/__init__.py`, `models.py`, `loader.py`, `schema_validation.py`, `cli.py`
- Create: `tests/test_loader.py`, `tests/test_cli_validate.py`

**Interfaces:**
- `load_package(path: Path) -> DatasetPackage`
- `validate_package(package: DatasetPackage, profile: ValidationProfile) -> list[ValidationIssue]`
- `ValidationProfile`: `authoring`, `public`
- `ValidationIssue`: `code`, `file`, `pointer`, `message`; order by `(file, pointer, code, message)`.
- CLI: `chronomap-data validate DATASET_DIR --profile authoring|public`; default authoring; exits 0 success, 1 validation issues, 2 usage/I/O/JSON parsing errors.
- Diagnostic text: `<file>:<json-pointer> [<code>] <message>`.

- [ ] Write failing loader tests for five-file loading and actionable missing-file/malformed-JSON failures; confirm RED, implement immutable dataclasses and real filesystem loading, confirm GREEN.
- [ ] Write failing CLI tests for default authoring profile, explicit public profile, sorted diagnostics, and exit codes; confirm RED.
- [ ] Implement schema dispatch and JSON Pointer conversion with stable `schema.invalid` and `schema.unsupported_version` diagnostics; map invocation/I/O/parser errors to exit 2 without tracebacks.
- [ ] Run Task 3 tests and the complete suite with pristine output, run `git diff --check`, then commit `feat: validate dataset package structure`.

### Task 4: Implement cross-file and historical-domain validation

**Files:**
- Create: `src/chronomap_data/semantic_validation.py`, `geometry.py`
- Create: `tests/test_semantic_validation.py`, `tests/test_geometry.py`
- Extend: invalid fixtures only as each test requires.

**Interfaces:**
- Extend `validate_package` after schema validation; if structural validation fails, do not run semantic rules that depend on invalid shapes.
- Stable codes: `id.duplicate`, `id.invalid_kind`, `ref.missing`, `temporal.invalid`, `geometry.invalid`, `hypothesis.invalid`, `uncertainty.invalid`, `publication.rights`, `publication.evidence`.

- [ ] Add one failing behavior test at a time for global ID uniqueness/kind, references, bbox containment, longitude/latitude limits, LineString length, Polygon ring length/closure, temporal boundary ordering, possibility overlap, hypothesis membership, uncertainty notes/evidence, and evidence subsets; witness RED before each implementation group.
- [ ] Implement pure validation functions returning issues instead of raising, and keep deterministic issue ordering in the public facade.
- [ ] Add public-profile tests requiring publishable Dataset/FeatureVersion rights, temporal and geometry evidence, complete source rights metadata, derived-geometry publication basis, and at least two public alternatives per hypothesis group. Confirm citation-only restricted/unknown sources remain valid.
- [ ] Run focused tests after each red-green cycle, then `uv run pytest -q` and `git diff --check`; commit `feat: validate historical data semantics`.

### Task 5: Build deterministic, rights-safe public bundles

**Files:**
- Create: `src/chronomap_data/public_builder.py`
- Create: `tests/test_public_builder.py`
- Modify: `src/chronomap_data/cli.py`, repository `README.md`, `.gitignore`

**Interfaces:**
- `build_public_bundle(package: DatasetPackage, output: Path) -> BuildSummary`
- `BuildSummary`: public version/entity/evidence/source counts and output path.
- CLI: `chronomap-data build-public DATASET_DIR --output OUTPUT_DIR`; exits 0 success, 1 validation rejection, 2 I/O/usage failure.

- [ ] Write failing tests showing omitted/private versions are excluded, referenced records are retained, unreachable records are pruned, references remain closed, output is byte-identical across two builds, and private IDs/content never appear.
- [ ] Write failing tests showing a public rights/evidence error produces no new output and leaves an existing output directory byte-for-byte unchanged.
- [ ] Implement projection and deterministic JSON/GeoJSON serialization by reusing public-profile validation; never mutate the loaded authoring package.
- [ ] Build in a sibling temporary directory. On success swap it into place with backup/rollback so any failure preserves the previous output; remove temporary/backup directories after successful completion.
- [ ] Add concise setup and command documentation; ignore `.venv/`, caches, and generated public bundles, but track schemas, fixtures, and `uv.lock`.
- [ ] Run `uv run pytest -q`, validate the valid fixture in both profiles, build a temporary public bundle twice and compare it, scan output for private fixture IDs, run documentation link/placeholder checks and `git diff --check`, then commit `feat: build public historical data bundles`.

## Final Acceptance

- A new contributor can author a package from `docs/data/model.md` without reading Python internals.
- All schemas meta-validate and all positive/negative fixtures produce the intended outcomes.
- The complete test suite passes with no warnings or errors.
- Public output contains only public FeatureVersions and their reachable dependencies, is deterministic, and cannot overwrite a prior good output on failure.
- No real historical records, UI code, server API, authentication, or deployment configuration is introduced.
