# M1 Tile Pipeline Implementation Plan

> **For agentic workers:** Use this plan task by task in the primary thread. Each implementation task follows TDD.

**Goal:** Build one deterministic national PMTiles archive and per-dataset public detail indexes from all public packages under a directory.

**Architecture:** Reuse the public projection as the only source of publishable records. A pure tile-document builder produces seven-property GeoJSON features, manifest metadata, and detail indexes; a writer validates every package before staging files, invokes pinned Tippecanoe, then replaces the output with the existing atomic swap helper.

**Tech Stack:** Python 3.12+, pytest, uv, Tippecanoe 2.79.0, PMTiles, GeoJSONSeq.

**Spec:** `docs/superpowers/specs/2026-10-11-m1-tile-pipeline-design.md`

## Global Constraints

- Process direct child package directories in ascending directory-name order.
- Validate all inputs with the public profile before writing any output.
- Emit only `feature_version_id`, `entity_id`, `dataset`, `theme`, `name`, `from_year`, and `to_year` as tile properties.
- Use one `features` layer at zooms 4–12 with no feature or tile-size limits and point drop rate `-r1`.
- Keep Tippecanoe fixed at 2.79.0 and make every output file byte-identical across rebuilds.
- Do not change schemas or the existing web viewer, external-data ingestion, or `build-public` scope.

## Review Focus

- A missing or unreadable package must fail with exit 2 before output changes.
- A package root with no child packages must fail without creating output.
- Output paths overlapping any source package must be rejected before staging.
- An empty set of finite temporal endpoints produces `yearRange: {"min": null, "max": null}` and `years: []`.
- A Tippecanoe subprocess failure must clean staging and preserve the old output.

---

### Task 1: Update the data contract and project documentation

**Files:** Create `docs/data/tiles.md`; modify `README.md`, `docs/architecture/overview.md`, `docs/product/roadmap.md`, and this implementation spec.

- [x] Add the full output contract, the fixed 2.79.0 install instructions, and the `build-tiles` command to the docs before changing tests or production code.
- [x] Link the architecture data-flow outputs to `docs/data/tiles.md` and mark M1 in progress in the roadmap.
- [x] Confirm the contract and scope are consistent across the spec, ADR 0008, roadmap, and normative tile document.

### Task 2: Expose and test the shared public projection and tile documents

**Files:** Modify `src/chronomap_data/public_builder.py`; create `src/chronomap_data/tile_builder.py`; create `tests/test_tile_builder.py`; modify `pyproject.toml` and `uv.lock` for tile-reading test dependencies.

**Interfaces:**

- `PublicProjection(dataset, entities, sources, evidence, feature_collection)` is returned by `project_public(package: DatasetPackage) -> PublicProjection`.
- `TileDataset(slug: str, package: DatasetPackage, projection: PublicProjection)` is accepted by `build_tile_documents(datasets: Sequence[TileDataset]) -> TileDocuments`.
- `feature_period(properties: Mapping[str, object]) -> tuple[int, int]` returns endpoint years with the two open-year sentinels.
- `TileDocuments` contains a manifest object, a slug-keyed details object, and ordered GeoJSON feature objects.
- `THEME_DEFINITIONS` is the one ordered theme/type/label table.

- [x] Write `test_feature_period_uses_open_endpoint_sentinels`, parametrized for null boundaries and null `earliestYear`/`latestYear` values.
- [x] Write `test_theme_definitions_cover_every_entity_type` and assert the complete type-to-theme map and manifest order.
- [x] Write `test_tile_documents_exclude_private_features_from_tiles_and_details` and assert exactly the seven tile properties.
- [x] Write `test_details_keep_the_safe_citation_only_evidence_projection` using the synthetic package.
- [x] Write `test_tile_documents_reject_slug_mismatch_and_duplicates` and `test_manifest_uses_sorted_unique_years_and_datasets`, including an empty finite-year case.
- [x] Run `uv run pytest -q tests/test_tile_builder.py tests/test_public_builder.py`; collection failed because `project_public` and `tile_builder` were not implemented yet.
- [x] Extract the projection into the public dataclass/function and implement the pure document builder minimally.
- [x] Run `uv run pytest -q tests/test_tile_builder.py tests/test_public_builder.py`; all focused tests passed.

### Task 3: Add the fail-closed build command and real PMTiles coverage

**Files:** Modify `src/chronomap_data/tile_builder.py`, `src/chronomap_data/cli.py`; create or extend `tests/test_tile_builder.py` and `tests/test_cli_validate.py`; modify `.gitignore`.

- [x] Write CLI/integration tests for seven-package output, z4/z12 feature coverage and exact properties, whole-output byte determinism, validation failure preserving a prior output, missing Tippecanoe, source/output overlap, and subprocess failure cleanup.
- [x] Run `uv run pytest -q tests/test_tile_builder.py tests/test_cli_validate.py`; expected missing command/API failures were observed, with external-binary tests skipped until Tippecanoe was installed.
- [x] Implement sorted package loading, public validation, directory/slug checks, deterministic GeoJSONSeq, relative-path Tippecanoe invocation, staging, cleanup, and `_swap_output` replacement.
- [x] Add `build-tiles <package-root> --output <directory>` with exit status 0/1/2 behavior and ignore `web/public/chronomap/`.
- [x] Run the same focused command with Tippecanoe installed; all integration tests passed.
- [x] Run `uv run pytest -q`; all 285 tests passed with Tippecanoe available.

### Task 4: Pin CI tooling and verify all public packages

**Files:** Modify `.github/workflows/ci.yml` and `README.md` if command details need correction.

- [x] Add a CI source build from official tag `2.79.0` and assert `tippecanoe --version` reports `2.79.0`.
- [x] Replace the four hand-written public validation steps with a loop over all seven `data/*/` directories.
- [x] Run `build-tiles` twice into separate temporary output directories and `diff -r` every generated file; all 9 files matched.
- [x] Run the Python CI checks locally; all 285 tests and all seven public package validations passed with Tippecanoe integration tests enabled.

### Task 5: Final consistency review

**Files:** Review all files listed above.

- [x] Confirm the six acceptance criteria in the implementation spec and check the final data flow, docs, and ignore rules for contradictions or leftover code.
- [x] Mark M1 complete in the roadmap only after the checks pass; the repeated output comparison matched byte-for-byte, so no determinism exception is needed.
