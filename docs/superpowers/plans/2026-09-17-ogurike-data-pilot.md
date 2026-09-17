# 巨椋池パイロットデータ実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 承認済みの巨椋池データ設計を、検証済み著者用パッケージ・決定的な公開バンドル・既定Web表示まで実装する。

**Architecture:** `data/ogurike/` を正規の著者用5ファイルとして追加し、既存のPython validator/public builderで `web/public/data/ogurike/` に投影する。Webは合成fixtureをテスト用に残したまま、実行時の既定URLだけを巨椋池バンドルへ切り替える。図形は近似形状として記録し、外部資料のcitationとChronomapの加工メモをEvidenceで分離する。

**Tech Stack:** Python 3.12、uv、JSON Schema Draft 2020-12、既存 `chronomap-data` CLI、TypeScript/Vite、Vitest、Playwright、MapLibre GL JS。

**Spec:** `docs/superpowers/specs/2026-09-17-ogurike-data-pilot-design.md`

## Global Constraints

- データパッケージは `dataset.json`、`entities.json`、`sources.json`、`evidence.json`、`feature-versions.geojson` の5ファイルだけにする。
- `schemaVersion` は `1.0.0`、IDは既存契約のASCII小文字・単一ハイフン規則、座標はWGS84経度・緯度順とする。
- データセットの `defaultLanguage` は `ja`。Dataset、Entity、FeatureVersionの必須テキストマップには日本語値を必ず入れる。
- 公開FeatureVersionは4件（1910 Polygon、1590 LineString、1596 LineString、1942 Point）、Entityは3件とする。
- 1590/1596/1910は単年スナップショットであり、未資料の連続期間を補間しない。1942年の碑は終了境界を持たない。
- 京都府・京都市のSourceは `restricted` のcitation-only、近畿地方整備局図はPDL1.0の出典・加工表示付き、Chronomap形状メモは公開可能な `original-reconstruction` とする。
- restricted/unknown Sourceを参照するEvidenceは `usage: "citation"` に限定し、本文・画像・碑文・第三者写真を保存しない。
- 位置・形状は概略であることを説明し、FeatureVersionの `uncertainty` の4次元をすべて埋める。
- 合成fixture、既存の障害時挙動、既存の安全なSource URL表示を壊さない。
- すべての変更はテストを先に追加し、対象テスト、全Pythonテスト、Web unit/build/browserを順に実行してからコミットする。

---

### Task 1: 形状作成メモと著者用データパッケージ

**Files:**
- Create: `docs/data/ogurike-shape-notes.md`
- Create: `data/ogurike/dataset.json`
- Create: `data/ogurike/entities.json`
- Create: `data/ogurike/sources.json`
- Create: `data/ogurike/evidence.json`
- Create: `data/ogurike/feature-versions.geojson`
- Create: `tests/test_ogurike_package.py`

**Interfaces:**
- Consumes: `docs/data/model.md`、承認済み設計、`chronomap_data.loader.load_package`、`validate_package`。
- Produces: CLIで読み込める `data/ogurike/` と、後続タスクが参照するID固定値・4 FeatureVersion。

- [ ] **Step 1: 期待するパッケージの失敗テストを書く**

`tests/test_ogurike_package.py` に次のテストを作る。

```python
from pathlib import Path

from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics


ROOT = Path(__file__).parents[1]
PACKAGE = ROOT / "data" / "ogurike"


def test_ogurike_package_has_three_entities_and_four_public_versions():
    package = load_package(PACKAGE)
    assert package.dataset["defaultLanguage"] == "ja"
    assert len(package.entities) == 3
    features = package.feature_versions["features"]
    assert len(features) == 4
    assert {feature["geometry"]["type"] for feature in features} == {"Point", "LineString", "Polygon"}
    assert all(feature["properties"]["publicationStatus"] == "public" for feature in features)


def test_ogurike_package_passes_authoring_and_public_profiles():
    package = load_package(PACKAGE)
    assert validate_package(package, ValidationProfile.AUTHORING) == []
    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []


def test_ogurike_restricted_sources_are_citation_only():
    package = load_package(PACKAGE)
    restricted = {
        source["id"]
        for source in package.sources
        if source["rights"]["status"] == "restricted"
    }
    assert restricted
    for evidence in package.evidence:
        if evidence["sourceId"] in restricted:
            assert evidence["usage"] == "citation"
```

- [ ] **Step 2: テストがファイル不足で失敗することを確認する**

Run: `uv run pytest tests/test_ogurike_package.py -q`

Expected: FAIL with a missing `data/ogurike` package error.

- [ ] **Step 3: 形状作成メモを書く**

`docs/data/ogurike-shape-notes.md` に、次を具体的に記録する。

1. 近畿地整PDFの図2.2-1①②④を参照し、1590・1596・1910を単年スナップショットとして手動簡略化したこと。
2. PolygonとLineStringは精密境界・河道中心線ではなく、図の相対関係を示す概略形状であること。
3. Polygonは図に合わせた少数頂点の閉リング、LineStringは図の流路関係を示す折れ線とし、現代の鉄道線を旧堤線としてコピーしないこと。
4. 碑のPointは京都市ページの所在地を確認し、小数第3位へ丸めた代表点を作成したこと。原座標、写真、碑文はファイルに保存しないこと。
5. PDL1.0の出典・加工表示、京都府/京都市Sourceのcitation-only扱い、採用しなかったGSI旧版地図・航空写真・精密線形を記録すること。

- [ ] **Step 4: 5ファイルを作成する**

以下の固定IDで相互参照を作る。

```text
Dataset: ogurike:dataset:pilot-2026
Entities:
  ogurike:entity:waterbody
  ogurike:entity:ujigawa
  ogurike:entity:reclamation-monument
Versions:
  ogurike:version:waterbody-1910
  ogurike:version:ujigawa-1590
  ogurike:version:ujigawa-1596
  ogurike:version:reclamation-monument-1942
Sources:
  ogurike:source:mlit-ogurike-transition
  ogurike:source:kyoto-prefecture-rdb
  ogurike:source:kyoto-city-monument
  ogurike:source:shape-notes
```

`dataset.json` は `defaultLanguage: "ja"`、Dataset rights `open-license`、時間範囲1590–1942、巨椋池周辺のWGS84 bbox、5ファイル参照を持つ。`sources.json` のURLは次の4つを使い、PDL1.0の近畿地整Sourceには帰属・termsを、restricted Sourceにはcitation-only termsを入れる。

```text
https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf
https://www.pref.kyoto.jp/kankyo/rdb/geo/db/sur0005.html
https://www2.city.kyoto.lg.jp/html/somu/rekishi/fm/ishibumi/html/ga015.html
https://github.com/ywatase/chronomap/blob/main/docs/data/ogurike-shape-notes.md
```

`evidence.json` は、各FeatureVersionについて少なくとも時間を支えるcitation、形状を支えるderived-geometry/original-reconstruction、同一性・位置を支えるcitationまたはreconstructionを用意する。restricted SourceのEvidenceに `publicationBasis` を付けず、shape-notes Evidenceには `publicationBasis: "original-reconstruction"`、近畿地整の図由来形状には `publicationBasis: "open-license"` を付ける。

`feature-versions.geojson` は、FeatureVersionのラベル・説明・時間・4次元uncertainty・evidenceIds・公開権利をそろえる。1910年面と1590/1596年線のlocation/geometryは `approximate`、1942年点のlocationは小数第3位への丸めを理由に `approximate` とする。identityは資料により `well-supported`、根拠がない次元は `unknown` ではなく、該当する資料または明示的な説明を付ける。

- [ ] **Step 5: 対象テストを通す**

Run: `uv run pytest tests/test_ogurike_package.py -q`

Expected: PASS. 次に `uv run chronomap-data validate data/ogurike --profile public` を実行し、標準出力・標準エラーとも空で終了コード0であることを確認する。

- [ ] **Step 6: コミットする**

```bash
git add docs/data/ogurike-shape-notes.md data/ogurike tests/test_ogurike_package.py
git commit -m "feat: add ogurike authoring package"
```

### Task 2: 公開投影とデータ契約回帰

**Files:**
- Modify: `tests/test_public_builder.py`（既存のsynthetic builderテストの後ろに実データ投影テストを追加）
- Modify: `tests/test_cli_validate.py`（インストール済みCLIでの実データ検証を追加）
- Create: `tests/test_ogurike_public_bundle.py`
- Create: `web/public/data/ogurike/dataset.json`
- Create: `web/public/data/ogurike/entities.json`
- Create: `web/public/data/ogurike/sources.json`
- Create: `web/public/data/ogurike/evidence.json`
- Create: `web/public/data/ogurike/feature-versions.geojson`

**Interfaces:**
- Consumes: Task 1の `data/ogurike/`。
- Produces: 公開投影5ファイル、決定性・到達可能性・restricted Sourceのcitation-onlyを確認するテスト。

- [ ] **Step 1: 公開投影の失敗テストを書く**

`tests/test_ogurike_public_bundle.py` に、`build_public_bundle(load_package(DATA), output)` 後の5ファイルを読み、次を検証するテストを書く。

```python
def test_ogurike_public_bundle_has_only_reachable_public_records(tmp_path):
    output = tmp_path / "public"
    build_public_bundle(load_package(DATA), output)
    features = json.loads((output / "feature-versions.geojson").read_text())
    assert len(features["features"]) == 4
    assert {feature["properties"]["entityId"] for feature in features["features"]} == {
        "ogurike:entity:waterbody",
        "ogurike:entity:ujigawa",
        "ogurike:entity:reclamation-monument",
    }
    sources = json.loads((output / "sources.json").read_text())
    evidence = json.loads((output / "evidence.json").read_text())
    restricted_ids = {source["id"] for source in sources if source["rights"]["status"] == "restricted"}
    assert all(record["usage"] == "citation" for record in evidence if record["sourceId"] in restricted_ids)


def test_ogurike_public_bundle_is_deterministic(tmp_path):
    first = tmp_path / "first"
    second = tmp_path / "second"
    package = load_package(DATA)
    build_public_bundle(package, first)
    build_public_bundle(package, second)
    assert [(name, (first / name).read_bytes()) for name in FILES] == [
        (name, (second / name).read_bytes()) for name in FILES
    ]
```

- [ ] **Step 2: 失敗を確認する**

Run: `uv run pytest tests/test_ogurike_public_bundle.py -q`

Expected: FAIL because the checked-in public directory does not exist.

- [ ] **Step 3: 公開バンドルを生成する**

```bash
rm -rf /tmp/chronomap-ogurike-public
uv run chronomap-data build-public data/ogurike --output /tmp/chronomap-ogurike-public
mkdir -p web/public/data/ogurike
cp /tmp/chronomap-ogurike-public/{dataset.json,entities.json,sources.json,evidence.json,feature-versions.geojson} web/public/data/ogurike/
```

入力ディレクトリは削除・上書きせず、既存のpublic builderの原子的置換を利用する。生成後、コピー元・コピー先に5ファイル以外を置かない。

- [ ] **Step 4: 投影テストと全Python検証を通す**

Run: `uv run pytest tests/test_ogurike_public_bundle.py tests/test_public_builder.py tests/test_cli_validate.py -q`

Expected: PASS. 次に `uv run pytest -q` を実行し、既存テストを含めて全件PASSを確認する。

- [ ] **Step 5: コミットする**

```bash
git add tests/test_ogurike_public_bundle.py tests/test_public_builder.py tests/test_cli_validate.py web/public/data/ogurike
git commit -m "feat: build ogurike public bundle"
```

### Task 3: Webの既定データセット切替とアセット同期

**Files:**
- Modify: `web/src/main.ts:36-52`（既定URLと失敗メッセージのデータセット名を切替）
- Modify: `web/tests/public-asset-sync.test.ts`（ogurike公開投影同期テストを追加）
- Create: `web/tests/ogurike-data.test.ts`
- Modify: `web/README.md`（実データバンドルとsynthetic fixtureの役割を記載）

**Interfaces:**
- Consumes: Task 2の `web/public/data/ogurike/`。
- Produces: 実行時 `/data/ogurike/` を読み込むWebと、5ファイル同期テスト。

- [ ] **Step 1: URLの失敗テストを書く**

`web/tests/ogurike-data.test.ts` で、`loadPublicBundle("/data/ogurike/")` が5回のfetchを行い、日本語Dataset title、4 features、3 entitiesを返すことをテストする。既存 `data-loader.test.ts` のsynthetic payloadテストは変更しない。

- [ ] **Step 2: 失敗を確認する**

Run: `cd web && npm test -- --run tests/ogurike-data.test.ts`

Expected: FAIL because the new test payload/asset path is not wired yet.

- [ ] **Step 3: 既定URLを切り替える**

`web/src/main.ts` の `loadPublicBundle("/data/synthetic/")` を `loadPublicBundle("/data/ogurike/")` に置き換え、dataset failure messageを「巨椋池データを読み込めませんでした。再試行してください。」相当の日本語へ変更する。操作ラベル全面日本語化は後続Taskに残す。

- [ ] **Step 4: アセット同期を一般化する**

`web/tests/public-asset-sync.test.ts` に、builder出力と `public/data/ogurike` の比較を追加する。synthetic同期テストは残し、共通の `files` 配列を使って重複を避ける。

- [ ] **Step 5: Web unit/buildを通す**

Run: `cd web && npm test -- --run && npm run build`

Expected: 全Web unit PASS、Vite build成功（既存のchunk-size warning以外の警告なし）。

- [ ] **Step 6: コミットする**

```bash
git add web/src/main.ts web/tests/ogurike-data.test.ts web/tests/public-asset-sync.test.ts web/README.md
git commit -m "feat: connect web to ogurike dataset"
```

### Task 4: 巨椋池データのブラウザ受入テスト

**Files:**
- Modify: `web/tests/browser/ui-mvp.spec.ts`（synthetic固有の期待値をogurikeシナリオへ分離）
- Create: `web/tests/browser/ogurike-data.spec.ts`
- Modify: `web/playwright.config.ts`（既存の390×844・1440×900プロジェクトを維持）

**Interfaces:**
- Consumes: Task 3の既定Web URL、MapLibre/GSI adapter、既存のmobile/desktop browser projects。
- Produces: 日本語データ表示、年切替、面・線・点の選択、出典・不確実性表示の実ブラウザ受入証拠。

- [ ] **Step 1: 4時点の表示テストを書く**

`ogurike-data.spec.ts` で以下を固定する。

```ts
test("shows the 1590 river snapshot", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /宇治川/ })).toBeVisible();
  await page.getByLabel(/Year|年/).fill("1590");
  await page.getByLabel(/Year|年/).press("Tab");
  await expect(page.getByRole("button", { name: /工事前|宇治川/ })).toBeVisible();
});

test("shows the 1910 pond polygon and 1942 monument point", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/Year|年/).fill("1910");
  await page.getByLabel(/Year|年/).press("Tab");
  await expect(page.getByRole("button", { name: /巨椋池/ })).toBeVisible();
  await page.getByLabel(/Year|年/).fill("1942");
  await page.getByLabel(/Year|年/).press("Tab");
  await expect(page.getByRole("button", { name: /干拓碑/ })).toBeVisible();
});
```

追加で、FeatureVersion選択後に `Evidence`、`Source`、`Rights` と近似形状の説明が見えること、mobileでは詳細タブへ移ること、keyboardで一覧→詳細→閉じるが動くことを確認する。

- [ ] **Step 2: データ固有の失敗を確認する**

Run: `cd web && npm run test:browser -- tests/browser/ogurike-data.spec.ts`

Expected: labelがまだ実装されていない場合はFAILし、現在のDOMのaria名とデータラベルを整合させる。

- [ ] **Step 3: 最小限の表示調整を実装する**

データラベルの日本語表示、年代表示、詳細パネルのEvidence/Source参照を既存コンポーネントで確認する。Map adapterの色・レイヤー構成をデータ固有に変更しない。

- [ ] **Step 4: 2 viewportで実行する**

Run: `cd web && npm run test:browser`

Expected: 390×844と1440×900の全シナリオPASS。

- [ ] **Step 5: コミットする**

```bash
git add web/tests/browser/ogurike-data.spec.ts web/tests/browser/ui-mvp.spec.ts web/playwright.config.ts
git commit -m "test: cover ogurike browser flows"
```

### Task 5: ドキュメント、品質ゲート、引き継ぎ

**Files:**
- Modify: `README.md`（ogurike validate/build-public/Web確認コマンド）
- Modify: `web/README.md`（既定データセット、synthetic fixture、browser testの説明）
- Modify: `docs/product/overview.md`（データ制作項目の完了状態と次工程へのリンク）

**Interfaces:**
- Consumes: Task 1–4のパッケージ、公開生成物、Web、テスト。
- Produces: 明日のレビューで再現できるコマンド列と、次の日本語化・UX改善へ接続する記録。

- [ ] **Step 1: 再現コマンドを文書化する**

READMEに次の順序を記載する。

```bash
uv run chronomap-data validate data/ogurike
uv run chronomap-data validate data/ogurike --profile public
uv run chronomap-data build-public data/ogurike --output web/public/data/ogurike
cd web && npm test -- --run
cd web && npm run build
cd web && npm run test:browser
```

データは概略復元であり、出典と不確実性を確認すること、syntheticは契約テスト用であることを明記する。

- [ ] **Step 2: 全品質ゲートを実行する**

Run:

```bash
uv run pytest -q
uv run chronomap-data validate data/ogurike --profile public
cd web && npm test -- --run && npm run build && npm run test:browser
```

Expected: Python全件、Web unit、build、browserがPASS。失敗時は原因を修正して同じコマンドを再実行する。

- [ ] **Step 3: private markerと差分を確認する**

Run: `git diff --check` と公開バンドル5ファイルの `rg` により、private fixtureの内容、碑文全文、画像データ、不要な第三者コンテンツが混入していないことを確認する。

- [ ] **Step 4: まとめてコミットする**

```bash
git add README.md web/README.md docs/product/overview.md
git commit -m "docs: document ogurike data workflow"
```

