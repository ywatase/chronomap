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

### Task 5: 実データの勢力圏縦切り

**Files:**
- Modify: `data/azuchijo/dataset.json`, `entities.json`, `sources.json`, `evidence.json`, `feature-versions.geojson`
- Create: `docs/data/azuchijo-omi-sphere-shape-notes.md`, `tests/test_azuchijo_package.py`
- Modify: `web/public/data/azuchijo/`, `web/tests/browser/azuchijo-data.spec.ts`, `docs/data/azuchijo-audit.md`, `docs/product/japan-coverage-matrix.md`

**Interfaces:**
- Consumes: Task 2の領域Entity表示契約と、滋賀県『近江戦国探訪ガイドブック』の引用メタデータ。
- Produces: `sphere-of-influence` Entity、重なる2案のPolygon、時代境界・仮説ラベル・4次元不確実性・出典到達性を持つ安土城公開bundle。

- [x] **Step 1: Write the failing test** — `tests/test_azuchijo_package.py` と安土城desktop／mobile E2Eで、勢力圏Entity、2案のPolygon、仮説ラベル、証拠、UI表示を固定した。
- [x] **Step 2: Run test to verify it fails** — 実データ追加前にPythonのEntity参照とPlaywrightの一覧件数／領域ボタンが失敗することを確認した。
- [x] **Step 3: Add only source-backed public records** — 滋賀県資料の引用メタデータのみを収録し、2案とも行政境界・確定国境ではない独自概略復元として公開した。
- [x] **Step 4: Run the quality gate** — `validate --profile public`、公開bundle生成、Python監査・カバレッジ・安土城packageテスト、安土城desktop／mobile E2Eを通過させた。

### Task 6: 実データの境界縦切り

**Files:**
- Modify: `data/heijokyo/dataset.json`, `entities.json`, `evidence.json`, `feature-versions.geojson`
- Create: `tests/test_heijokyo_package.py`
- Modify: `data/heijokyo/`, `web/public/data/heijokyo/`, `web/tests/browser/heijokyo-data.spec.ts`, `docs/data/heijokyo-audit.md`, `docs/data/heijokyo-shape-notes.md`, `docs/product/japan-coverage-matrix.md`

**Interfaces:**
- Consumes: Task 2の領域Entity表示契約と、奈良市『奈良のあゆみ－明治以前－』の平城京・外京説明。
- Produces: `boundary` Entity、内京中心／外京を含む2案のPolygon、仮説グループ・時代・4次元不確実性・出典到達性を持つ平城京公開bundle。

- [x] **Step 1: Write the failing test** — Python監査テストと平城京mobile E2Eで、boundary Entity、2案、仮説ラベル、根拠、領域切替を固定した。
- [x] **Step 2: Run test to verify it fails** — 境界Entity未収録によるKeyErrorと、公開地物3件に対する5件期待の失敗を確認した。
- [x] **Step 3: Add only source-backed public records** — 奈良市の規模・外京説明を引用メタデータに限定し、Polygonは独自概略復元、確定した羅城・行政境界ではないと明示した。
- [x] **Step 4: Run the focused quality gate** — `validate --profile public`、公開bundle生成、Python packageテスト、平城京mobile E2Eを通過させた。

### Task 7: 実データの政治中枢`polity`縦切り

**Files:**
- Modify: `data/azuchijo/dataset.json`, `entities.json`, `sources.json`, `evidence.json`, `feature-versions.geojson`
- Create: `docs/data/azuchijo-omi-polity-shape-notes.md`, `tests/test_azuchijo_package.py`
- Modify: `web/public/data/azuchijo/`, `web/tests/browser/azuchijo-data.spec.ts`, `docs/data/azuchijo-audit.md`, `docs/product/core-acceptance.md`, `docs/product/japan-coverage-matrix.md`, `docs/product/overview.md`, `docs/product/roadmap.md`

**Interfaces:**
- Consumes: Task 2の領域Entity表示契約と、滋賀県『近江戦国探訪ガイドブック』の近江支配・安土城・拠点城郭の引用メタデータ。
- Produces: `polity` Entity、安土城中心／城下町・湖岸を含む2案のPolygon、`sphere-of-influence`と意味を分けた時代境界・仮説ラベル・4次元不確実性・出典到達性を持つ安土城公開bundle。

- [x] **Step 1: Write the failing test** — Python package testと安土城mobile E2Eで、`polity` Entity、2案のPolygon、仮説ラベル、政治中枢の注意書き、根拠を固定した。
- [x] **Step 2: Run test to verify it fails** — Entity参照のKeyErrorと、公開地物に政治中枢FeatureVersionがないE2E失敗を確認した。
- [x] **Step 3: Add only source-backed public records** — 公式ガイドブックの引用メタデータと独自形状メモを登録し、政治中枢は行政境界・近江全域の実効支配面ではないと明示した。既存の広域`sphere-of-influence`は変更せず意味を分離した。
- [x] **Step 4: Run the focused quality gate** — `validate --profile public`、公開bundle生成、Azuchi package test、polity mobile E2Eを通過させ、監査・カバレッジ・ドキュメントを26 FeatureVersion／18 Entityへ同期した。

### Task 8: 実データの港`port`縦切り

**Files:**
- Modify: `data/azuchijo/dataset.json`, `entities.json`, `sources.json`, `evidence.json`, `feature-versions.geojson`
- Create: `docs/data/azuchijo-jyorakuji-port-shape-notes.md`, `tests/test_azuchijo_package.py`
- Modify: `web/public/data/azuchijo/`, `web/tests/browser/azuchijo-data.spec.ts`, `docs/data/azuchijo-audit.md`, `docs/product/core-acceptance.md`, `docs/product/japan-coverage-matrix.md`, `docs/product/overview.md`, `docs/product/roadmap.md`

**Interfaces:**
- Consumes: 安土城の点・線・領域表示契約と、滋賀県の安土城跡周辺城下町ゾーン資料にある常楽寺湊の引用メタデータ。
- Produces: `port` Entity、常楽寺湊の代表Point、1576〜1582年頃の時代境界、位置・形状の概略不確実性、港域・岸線・船着場・航路を復元しない出典付き公開bundle。

- [x] **Step 1: Write the failing test** — Python package testと安土城mobile E2Eで、`port` Entity、常楽寺湊代表Point、根拠、概略表示を固定した。
- [x] **Step 2: Run test to verify it fails** — Entity参照のKeyErrorと、公開地物に港FeatureVersionがないE2E失敗を確認した。
- [x] **Step 3: Add only source-backed public records** — 滋賀県資料の常楽寺湊に関する引用メタデータと独自形状メモを登録し、Pointは港域・岸線・船着場・航路の精密復元ではないと明示した。
- [x] **Step 4: Run the focused quality gate** — `validate --profile public`、公開bundle生成、Azuchi package test、port mobile E2Eを通過させ、監査・カバレッジ・ドキュメントを27 FeatureVersion／19 Entityへ同期した。

### Task 9: 実データの城下町`settlement`縦切り

**Files:**
- Modify: `data/azuchijo/dataset.json`, `entities.json`, `sources.json`, `evidence.json`, `feature-versions.geojson`
- Create: `docs/data/azuchijo-settlement-shape-notes.md`, `tests/test_azuchijo_package.py`
- Modify: `web/public/data/azuchijo/`, `web/tests/browser/azuchijo-data.spec.ts`, `docs/data/azuchijo-audit.md`, `docs/product/core-acceptance.md`, `docs/product/japan-coverage-matrix.md`, `docs/product/overview.md`, `docs/product/roadmap.md`

**Interfaces:**
- Consumes: 安土城の点・線・領域・港表示契約と、滋賀県の安土城跡周辺城下町ゾーン資料にある城下町跡（推定）の引用メタデータ。
- Produces: `settlement` Entity、安土城下町の概略Polygon、1576〜1582年頃の時代境界、集住域の推定であって政治領域・港域・街区実測面ではない不確実性と出典付き公開bundle。

- [x] **Step 1: Write the failing test** — Python package testと安土城mobile E2Eで、`settlement` Entity、城下町概略Polygon、根拠、通常Polygonとしての表示を固定した。
- [x] **Step 2: Run test to verify it fails** — Entity参照のKeyErrorと、公開地物に城下町FeatureVersionがないE2E失敗を確認した。
- [x] **Step 3: Add only source-backed public records** — 滋賀県資料の城下町跡（推定）引用メタデータと独自形状メモを登録し、街区・屋敷・道路・集落境界・遺構の精密な都市面ではないと明示した。
- [x] **Step 4: Run the focused quality gate** — `validate --profile public`、公開bundle生成、Azuchi package test、settlement mobile E2Eを通過させ、監査・カバレッジ・ドキュメントを28 FeatureVersion／20 Entityへ同期した。

### Task 10: 実データの古戦場`battlefield`縦切り

- **Goal:** 原要求に含まれる古戦場を、戦場全体を確定したように見せず、代表Pointと広域コンテキストの境界付きで公開する。
- **Source:** 長浜市『長浜市歴史文化基本構想 第4章』が説明する余呉湖周辺から木之本・柳ヶ瀬に広がる1583年の賤ヶ岳城塞群・古戦場。
- **Modify:** `data/azuchijo/`, `web/public/data/azuchijo/`, `docs/data/azuchijo-shizugatake-battlefield-shape-notes.md`, `docs/data/azuchijo-audit.md`, `docs/product/japan-coverage-matrix.md`, `docs/product/core-acceptance.md`, `docs/product/overview.md`, `docs/product/roadmap.md`, `tests/test_azuchijo_package.py`, `tests/test_dataset_audits.py`, `web/tests/browser/azuchijo-data.spec.ts`。
- **Boundary:** `battlefield` Entityは賤ヶ岳付近の代表Pointのみ。余呉湖周辺から木之本・柳ヶ瀬に及ぶ戦場全体、各砦、陣地、戦線、行軍路、史跡の個別位置を復元しない。安土城下町、常楽寺湊、`polity`、`sphere-of-influence`とは別の意味として表示する。

- [x] **Step 1: Write the failing test** — Python package testと1583年のdesktop／mobile E2Eで`battlefield` Entity、代表Point、年代、根拠、不確実性を固定した。
- [x] **Step 2: Run test to verify it fails** — 未収録EntityによるKeyErrorを確認した。
- [x] **Step 3: Implement the minimal feature** — Entity、1583年FeatureVersion、公式Source、独自形状メモ、Evidence、公開bundleを追加した。
- [x] **Step 4: Run the focused quality gate** — `validate --profile public`、公開bundle生成、監査、Azuchi package test、battlefield E2Eを通過させ、監査・カバレッジ・ドキュメントを29 FeatureVersion／21 Entityへ同期する。
- [x] **Step 5: Run the full quality gate** — 全Python 243件、Vitest 188件、asset sync 6件、production build、全Playwright 164件を通過させた。

## Execution order

Task 1で欠落を数値化し、Task 2で領域の意味をUIに固定する。Task 4で5地域目を追加し、Task 5で安土城の`sphere-of-influence`、Task 6で平城京の`boundary`、Task 7で安土城の政治中枢`polity`、Task 8で常楽寺湊の`port`、Task 9で安土城下町の`settlement`、Task 10で賤ヶ岳古戦場の`battlefield`縦切りを完了した。Task 3（古地図アセット）は対象範囲と権利が一致するbundleが揃うまで保留し、次は古地図アセットまたは別地域の領域資料へ進む。価格・相談導線の追加はコア監査継続中のため再開しない。
