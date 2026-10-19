# 香取海 DEM推定データ再作成 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 標高下地と根拠資料の比較から、香取海を再生成できる取込処理と公開データを追加する。

**Architecture:** 標準ライブラリで国土地理院PNG標高タイルを取得・復号し、4近傍の連結判定で標高マスクを作る。Shapelyで面化し、資料比較から定めた期間別の追加・除外補正を適用して、既存の5ファイルデータ契約へ出力する。

**Tech Stack:** Python 3.12、urllib、zlib、array、Shapely、pytest、既存のChronomap CLIとMapLibre viewer。

**Spec:** `docs/superpowers/specs/2026-10-19-katori-sea-dem-design.md`

## Global Constraints

- 作業は`c03ee49`から切った`feat/katori-sea-rebuild`ブランチで行い、mainへマージ・pushしない。
- 先に資料を更新し、次に失敗するテストを書き、最小実装する。
- 標高閾値は700年4m、1200年3m、1600〜1654年2mを初期値とする。
- 出力範囲は139.95〜140.95E、35.65〜36.25N、表示契約は`{"minZoom":6,"seaMask":true}`。
- 外洋から連結する低標高セルだけを海とし、追加・除外補正は資料根拠と場所を付ける。
- 第三者図は`restricted`・引用メタデータのみとし、標高由来のモデル推定である不確実性を記録する。
- 指定されたPython、tile build、web unit/browser検証を実行し、作業ブランチにcommitする。

## Review Focus

- DEM欠測値と取得不能タイルの混同 — 欠測値は外洋へつながる場合だけ候補、取得不能範囲は未知。
- 斜め接触での誤連結 — flood fillは4近傍。
- 台地・尾根を横切る誤接続 — 閾値を超える1セルが経路を遮断する合成DEMテスト。
- 東端の外洋面が研究範囲外へ広がる — 出力を指定bboxに切る。
- 古地図画像の再配布 — 比較用コピーは`.cache/raw/katori-sea/`に限定し、パッケージとcommitには入れない。
- 補正回廊が台地を横切る誤接続 — 指定水域点を個別に検査し、史料が裏付けない湖間接続は加えない。
- 外洋カット後の孤立NoData成分 — 指定された水域点を含まない成分を除き、bbox内の無関係な外洋を残さない。

---

### Task 1: DEMタイル復号と外洋連結マスク

**Files:**
- Create: `src/chronomap_data/importers/katori.py`
- Modify: `tests/test_importers.py`
- Create: `docs/data/katori-sea-import.md`

**Interfaces:**
- Produces: `decode_dem_png(data: bytes) -> list[array]`, `flood_fill(elevation_rows, threshold_m, seeds) -> list[bytearray]`。
- Produces: XYZ tile-range, DEM5a→DEM10b→z12 DEM10b取得、missing/NoDataを区別するraw cache。

- [x] **Step 1: Write failing tests** for PNG height decoding and a small nested-array DEM where only below-threshold cells connected to an ocean seed are selected; cover a high cell barrier and diagonal-only contact.
- [x] **Step 2: Run `uv run pytest -q tests/test_importers.py -k katori_dem`** and confirm it fails because the decoder/flood fill do not exist.
- [x] **Step 3: Implement** PNG filters 0–4, the GSI RGB elevation formula, tile cache/fallback, and four-neighbor flood fill with unknown tiles excluded.
- [x] **Step 4: Run the focused tests** and confirm the expected mask and decoded elevations.
- [x] **Step 5: Commit** the DEM primitives and importer procedure.

### Task 2: DEM面化と根拠に基づく形状補正

**Files:**
- Modify: `src/chronomap_data/importers/katori.py`
- Modify: `tests/test_importers.py`
- Modify: `docs/data/katori-sea-shape-notes.md`

**Interfaces:**
- Consumes: Task 1's nested elevation rows, `flood_fill`, and tile-range output.
- Produces: one eastern-offshore seed on the GSI-geocoded Choshi Kawaguchi row; `polygonize_mask(mask, grid_transform, bbox)`, where the affine grid transform is in Web Mercator metres and output geometry is WGS84; and `apply_corrections(base, additions, exclusions)`.
- Correction records carry a named place, period, operation, explanation, and source/evidence ID.

- [x] **Step 1: Update this plan and the import/shape notes first** to specify that only the GSI-geocoded Choshi Kawaguchi row is seeded, at its rightmost available NoData cell east of the geocoded address point (missing tile cells remain unknown), the complete tile mosaic is flood-filled, and the polygon is clipped to the geographic bbox after polygonization.
- [x] **Step 2: Write a failing test** for polygonizing a small connected raster mask, including a hole and bbox clipping.
- [x] **Step 3: Run `uv run pytest -q tests/test_importers.py -k katori_polygonize`** and confirm polygonization is missing.
- [x] **Step 4: Implement** raster boundary tracing, bbox clipping, ~100m simplification, small-hole/fragment removal, and source-supported open-ocean cuts at Kashimanada and Choshi; generate and inspect the DEM-only masks at 4m/3m/2m against the Chiba museum figure, Katori City map, and river-office materials. Use GSI address-search results as land/control points.
- [x] **Step 5: Record observed named differences and source evidence** in the shape notes before adding correction constants or tests.
- [x] **Step 6: Write failing addition/exclusion tests** for the named corrections, run `uv run pytest -q tests/test_importers.py -k katori_correction`, and confirm correction behavior is missing.
- [x] **Step 7: Implement** only documented additions/removals with period, place, operation, explanation, and evidence ID.
- [x] **Step 8: Run the focused importer tests** and confirm polygonization and correction behavior.
- [x] **Step 9: Commit** the correction notes and geometry operations.

### Task 3: Package generation and CLI

**Files:**
- Modify: `src/chronomap_data/importers/katori.py`
- Modify: `src/chronomap_data/cli.py`
- Modify: `tests/test_importers.py`
- Create: `tests/test_katori_sea_package.py`
- Create: `data/katori-sea/{dataset.json,entities.json,sources.json,evidence.json,feature-versions.geojson}`

**Interfaces:**
- Consumes: Task 2's corrected geometries and correction records.
- Produces: `import_katori(output_root, cache_dir, today=None) -> list[Path]`; `chronomap-data import katori` defaults to `data/` while explicit `--output` is respected.
- Produces: one coastline entity and 3 public FeatureVersions for 700, 1200, and 1600–1654.

- [x] **Step 1: Write failing tests** for the generated package's entity/version count, thresholds/periods, seaMask display, rights, and public schema validation; add CLI dispatch test.
- [x] **Step 2: Run focused tests** and confirm package/CLI behavior is absent.
- [x] **Step 3: Implement** package metadata, uncertainties, evidence/source rights, CLI dispatch, and generation to `data/katori-sea`.
- [x] **Step 4: Run focused package/CLI tests** and validate the downloaded-data output.
- [x] **Step 5: Commit** the importer, CLI, tests, and generated package.

### Task 4: Audit docs and browser validation

**Files:**
- Modify: `README.md`
- Modify: `tests/test_dataset_audits.py`
- Modify: `docs/data/katori-sea-shape-notes.md`
- Create: `docs/data/katori-sea-audit.md`
- Modify: `docs/product/japan-coverage-matrix.md`
- Modify: `docs/product/roadmap.md`
- Create: `docs/data/screenshots/katori-sea-{700,1200,1600,1700}.png`

**Interfaces:**
- Consumes: Task 3's package and public audit report.
- Produces: public coverage matrix and audit snapshot that match deterministic generators.
- Produces: screenshots of the four years and DEM-only/corrected/source-map comparisons, with restricted source images kept in `.cache/raw/katori-sea/`.

- [x] **Step 1: Update docs first** with import instructions, source comparisons, correction table, uncertainty/limits, accepted and rejected claims, and the visual findings.
- [x] **Step 2: Update audit/coverage tests** with slug `katori-sea` and the resulting feature/entity totals.
- [x] **Step 3: Run `uv run pytest -q`** and regenerate `docs/data/katori-sea-audit.md` and the coverage matrix from package data.
- [x] **Step 4: Run `uv run chronomap-data build-tiles data imports --output web/public/chronomap`, `cd web && npm test`, and `npm run test:browser`** on a port other than 4173; capture year views and visual comparisons.
- [x] **Step 5: Inspect screenshots** to confirm Joso, Hokuso, and Kashima plateaus remain land and the sea follows low valleys.
- [x] **Step 6: Commit** final docs, audit, tests, screenshots, and state.

## Review follow-up

Fresh reviewで、印旛沼への直線回廊が28.75mの台地を水域化すること、外洋カット後に大きな孤立NoData成分が残ることを確認した。資料を更新した後、指定点の水域包含・台地除外・未採用外洋成分の除外を失敗テストで再現し、局所入り江は主水域に接続せず保持、名前のない孤立成分は除外する。佐原〜銚子の連結は維持する。
