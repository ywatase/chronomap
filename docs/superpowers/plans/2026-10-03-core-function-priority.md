# Core Function Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 原要求へ戻し、日本の歴史地理データ、領域表現、古地図表現を、出典と不確実性を保った縦切りで検証できる状態にする。

**Architecture:** 既存の静的クライアント、正規化5ファイルデータパッケージ、fail-closed公開投影を維持する。先にデータ契約とUIの意味を固定し、実在する公開資料が揃った地域だけを追加する。古地図アセットは、権利・取得・欠落時のフォールバックを検証してから恒久的な公開物へ入れる。

**Tech Stack:** Python `chronomap-data`、JSON Schema、GeoJSON、TypeScript、MapLibre GL JS、Vite、Vitest、Playwright Chromium。

**Spec:** [コア機能受け入れ基準](../../product/core-acceptance.md)

## Global Constraints

- 価格・相談導線・決済の新規機能は、P1日本データ縦切りとP2の領域または古地図縦切りが完了するまで追加しない。
- 公開データは `validate --profile public` と fail-closed public projection を通す。
- Source本文・画像・碑文・非公開編集記録を無断で再配布しない。
- 概略geometry、代表点、境界、georeference誤差を精密な事実として表示しない。
- URL、Cookie、localStorage、sessionStorageへ利用者の編集内容を保存しない。
- 既存の教材、印刷scope、QR、下書き、相談文のprivacy boundaryを後退させない。
- 1440×900、390×844、キーボード、reduced-motion、横overflowなしを各UI変更の対象にする。

## Review Focus

- 既存のPolygon表示を政治領域として誤認させず、Entity typeと不確実性を同時に表示する（Task 2の領域UIテスト）。
- 時代境界が開いている領域、重なる仮説、隣接領域を単一の確定国境へ丸めない（Task 1のデータ契約テスト）。
- 古地図アセットの権利・取得失敗・georeference誤差が、現在地図と根拠の利用を妨げない（Task 3のasset fallback E2E）。
- 巨大なPolygon、hole、MultiPolygon、非有限座標がブラウザでクラッシュや横overflowを起こさない（Task 2のgeometry fail-closed test）。
- 不足する日本題材を増やすとき、資料の少ない港・古戦場・勢力圏を推測で埋めない（Task 4の公開監査ゲート）。

### Task 1: 日本データのカバレッジ契約

**Files:**
- Create: `docs/product/japan-coverage-matrix.md`
- Modify: `docs/product/core-acceptance.md`
- Test: `tests/test_dataset_audits.py`, `tests/test_audit.py` (既存監査テストを、カバレッジ記録の検証に拡張)

**Interfaces:**
- Consumes: `data/*/dataset.json`, `entities.json`, `sources.json`, `evidence.json`, `feature-versions.geojson`。
- Produces: 地域ごとの必須データ種別、出典到達性、欠落理由、公開可否を決定的に確認できる監査表。

- [x] **Step 1: Write the failing test**

  5地域の公開bundleについて、全FeatureVersionのEntity typeが許可enumにあり、EvidenceからSourceとRightsへ到達できること、カバレッジ行が実数と一致することを検証するテスト名を追加する。

- [x] **Step 2: Run test to verify it fails**

  Run: `uv run pytest tests/test_dataset_audits.py tests/test_audit.py -q`

  Expected: 新しいカバレッジ assertion が、まだ監査表を生成していないためFAILする。

- [x] **Step 3: Implement the deterministic coverage audit**

  既存のPythonデータ検証ロジックを再利用し、地域、Entity type、FeatureVersion数、Source/Evidence到達数、欠落理由をMarkdownへ決定的に投影する。公開対象を黙って除外せず、未達を明示する。

- [x] **Step 4: Run test to verify it passes**

  Run: `uv run pytest tests/test_dataset_audits.py tests/test_audit.py -q` と `uv run chronomap-data validate data/<dataset> --profile public`（5地域）。

  Expected: PASS。監査表と公開bundleの件数が一致する。

- [x] **Step 5: Commit**

  `git add docs/product/japan-coverage-matrix.md docs/product/core-acceptance.md tests/test_dataset_audits.py tests/test_audit.py` でコミットする。

### Task 2: 領域Entityの表示縦切り

**Files:**
- Modify: `web/src/domain/types.ts`, `web/src/domain/data-loader.ts`
- Modify: `web/src/ui/copy.ts`, `web/src/ui/metadata-panel.ts`, `web/src/ui/feature-list.ts`, `web/src/map/map-style.ts`
- Test: `web/tests/data-loader.test.ts`, `web/tests/map-style.test.ts`, `web/tests/metadata.test.ts`, `web/tests/browser/ui-mvp.spec.ts`

**Interfaces:**
- Consumes: `Entity.type` の `boundary | polity | sphere-of-influence` と、Polygon/MultiPolygon FeatureVersion。
- Produces: `entityTypeLabel(type: EntityType, language: "ja" | "en")`、領域レイヤーの表示切替、詳細・凡例・印刷での種別表示。

- [x] **Step 1: Write the failing test**

  政治領域のEntity typeが日本語・英語で表示され、領域visibilityを切り替えても点・線の表示と根拠が残ること、重なる仮説と巨大／不正geometryがfail-closedになることを固定する。

- [x] **Step 2: Run test to verify it fails**

  Run: `cd web && npm run test -- --run tests/data-loader.test.ts tests/map-style.test.ts tests/metadata.test.ts` と対象Playwright。

  Expected: Entity type labelsまたは領域visibilityのassertionがFAILする。

- [x] **Step 3: Implement the minimal type-safe path**

  Schema enumをTypeScriptのallow-listへ反映し、既存のgeometry layerへEntity type filterを追加する。領域は現在地図・歴史geometry・根拠と別の操作対象として表示するが、領域の優先順位や確定国境の推測は追加しない。

- [x] **Step 4: Run test to verify it passes**

  Run: `cd web && npm run test -- --run`、対象E2Eをdesktop/mobileで実行する。

  Expected: PASS。画面幅、reduced-motion、失敗復帰、印刷scopeに退行がない。

- [x] **Step 5: Commit**

  `git add web/src web/tests` でコミットする。

### Task 3: 古地図アセットの安全な縦切り

**Files:**
- Create: `docs/product/historical-map-assets.md`
- Modify: `web/src/domain/types.ts`, `web/src/domain/data-loader.ts`, `web/src/map/map-style.ts`, `web/src/ui/map-settings.ts`
- Test: `web/tests/browser/map-display.spec.ts`, `web/tests/data-loader.test.ts`

**Interfaces:**
- Consumes: 出典・権利・取得日・georeference情報付きの1地域1アセット。
- Produces: `HistoricalMapAsset` の検証済み表現、個別toggle/opacity、asset unavailable時のfallback。

- [ ] **Step 1: Write the failing test**

  許可済みアセットが表示設定へ現れ、無効URL・権利不明・取得失敗では非表示のまま現在地図と歴史geometryが利用できることを固定する。

- [ ] **Step 2: Run test to verify it fails**

  Run: `cd web && npm run test -- --run tests/data-loader.test.ts` と `npm run test:browser -- tests/browser/map-display.spec.ts --workers=1`。

  Expected: `HistoricalMapAsset` が未実装でFAILする。

- [ ] **Step 3: Implement the asset contract and fallback**

  まず外部画像を無検証で配信せず、公開bundleの任意manifestから安全なHTTP(S) assetだけを検証する。失敗時は既存のMapLibre source/layerを変更せず、出典と理由をテキスト表示する。

- [ ] **Step 4: Run test to verify it passes**

  Run: `cd web && npm run test -- --run`、build、対象E2E、スクリーンショット。

  Expected: PASS。現在地図・歴史geometry・根拠の既存導線を維持する。

- [ ] **Step 5: Commit**

  `git add docs/product/historical-map-assets.md web/src web/tests` でコミットする。

### Task 4: 最初の不足題材を公開データ化

**Files:**
- Create: `data/<new-japan-pilot>/dataset.json`, `entities.json`, `sources.json`, `evidence.json`, `feature-versions.geojson`
- Create: `data/<new-japan-pilot>-audit.md`, `data/<new-japan-pilot>-shape-notes.md`
- Modify: `web/src/domain/dataset-catalog.ts`, `web/tests/browser/*-data.spec.ts`

**Interfaces:**
- Consumes: Task 1のカバレッジ表、公式・公開資料、Task 2/3の表示契約。
- Produces: 1地域の水域／交通、地点、可能なら領域を含むallow-list済み公開bundleとlesson。

- [x] **Step 1: Write the failing test**

  新地域のcatalog到達、データ検証、少なくとも1つの水域／交通と1つの地点、根拠・不確実性、直接URL復元を固定する。

- [x] **Step 2: Run test to verify it fails**

  Run: `uv run pytest -q` と対象E2E。

  Expected: 新しいslugが未登録のためFAILする。

- [x] **Step 3: Add only source-backed public records**

  公開根拠と権利を確認できるFeatureVersionだけを追加し、概略復元・代表点・未確認の境界を明示する。資料がない種別は作らず、監査記録に未達理由を残す。

- [x] **Step 4: Run the full quality gate**

  Run: 5地域の `validate --profile public`、`uv run pytest -q`、`cd web && npm run test -- --run`、`npm run build`、`npm run test:browser -- --workers=2 --trace=off`。

  Expected: 既存5地域を含む全テストがPASSする。

- [x] **Step 5: Commit**

  `data/kinugawa/`、`web/public/data/kinugawa/`、`web/public/lessons/kinugawa-history.json`、catalog、監査、E2Eを1つの縦切りコミットとして保存する。

## Execution order

Task 1で欠落を数値化し、Task 2で領域の意味をUIに固定する。Task 3は権利と取得方式が確認できた場合だけ進め、Task 4は題材の出典が揃った候補から1つだけ選ぶ。価格・相談導線の追加はTask 2またはTask 3とTask 4の受け入れ後に再評価する。
