# M1 タイルパイプライン 実装指示書

作成日: 2026-10-11
対象: [ADR 0008](../../adr/0008-seamless-national-map-with-temporal-vector-tiles.md) のマイルストーンM1（[ロードマップ](../../product/roadmap.md)）
実装担当: Codex

## 目的

`data/` 配下の全データパッケージの公開FeatureVersionを、全国1つのPMTilesと、データセットごとの詳細JSONへ統合する `build-tiles` コマンドを追加する。M2の新ビューアーは、この出力だけを読んで地図・年フィルタ・テーマ別レイヤー・詳細パネルを実装できる状態にする。

## 前提（2026-10-11時点）

- `data/` には7パッケージ（azuchijo, heijokyo, kinugawa, ogurike, osaka, sekigahara, tonegawa）があり、すべて `validate --profile public` を通る。
- 公開投影は `src/chronomap_data/public_builder.py` の `_project()` が担い、`build_public_bundle()` が一時ディレクトリへ書いてからアトミックに置換する。
- 可能な活動期間は、`start.earliestYear`（`start` か値がnullなら負の無限大）から `end.latestYear`（同じく正の無限大）までの両端を含む区間である（[データモデル](../../data/model.md)）。
- 既存のWebビューアー（`web/`）と `web/public/data/<slug>/` はM1では変更しない。撤去はM5で行う。

## 進め方（AGENTS.mdのサイクル）

1. **資料を更新する**: 「資料」の節を先に反映し、矛盾がないことを確認する。
2. **テストを書く**: 「テスト」の節をTDDで先に書き、失敗を確認する。
3. **最小実装する**: 「実装」の節。
4. **最終確認する**: 不要コード、資料の矛盾、受け入れ基準を確認する。

後方互換は考えない。既存の内部関数は必要に応じて名前・シグネチャを変えてよい。

## 出力の契約

### コマンド

```sh
uv run chronomap-data build-tiles data --output web/public/chronomap
```

- 第1引数は、パッケージディレクトリ（`dataset.json` を持つ直下のディレクトリ）を並べた親ディレクトリである。パッケージはディレクトリ名の昇順で処理する。
- 終了コードは既存コマンドに合わせる。成功は0、検証失敗は1、入出力エラーや外部ツールの欠如は2。
- 1つでもpublic検証に失敗したら何も書かない（fail-closed）。既存の出力は残す。
- 出力は、一時ディレクトリに全部を生成してから置換する。既存の `_swap_output` を共用する。
- 成功時は、データセット数、地物数、出力先を1行で標準出力に出す。

### 出力ディレクトリ

```
web/public/chronomap/
  chronomap.pmtiles
  manifest.json
  details/<slug>.json
```

`<slug>` は `dataset.id` の最初の `:` より前の部分（例: `ogurike:dataset:pilot-2026` なら `ogurike`）。パッケージのディレクトリ名と一致しなければ検証エラーにする。slugの重複もエラーにする。

`web/public/chronomap/` はビルドの生成物なので `.gitignore` に追加し、コミットしない（M3以降に全国データでMB単位になるため）。

### PMTiles

- ベクタータイルのレイヤーは `features` の1つだけ。
- ズームは4〜12（`-Z4 -z12`）。M2では12より上をオーバーズームで表示する。
- M1では地物を間引かない（`--no-feature-limit --no-tile-size-limit -r1`。`-r1` は低ズームでのPoint地物の間引きを止める）。形状の簡略化はtippecanoeの既定に任せる。
- 各地物の属性は次に限る（詳細はタイルに入れない）。

| 属性 | 型 | 内容 |
| --- | --- | --- |
| `feature_version_id` | string | `FeatureVersion.id` |
| `entity_id` | string | `properties.entityId` |
| `dataset` | string | slug |
| `theme` | string | 下表のテーマID |
| `name` | string | データセットの `defaultLanguage` のラベル |
| `from_year` | int | `start.earliestYear`。不明なら `-999999` |
| `to_year` | int | `end.latestYear`。不明なら `999999` |

M2での年フィルタは `["all", ["<=", ["get","from_year"], y], [">=", ["get","to_year"], y]]` になる。

#### テーマ

テーマは `HistoricalEntity.type` から決める。スキーマは変更しない。

| テーマID | 表示名 | Entity type |
| --- | --- | --- |
| `coast` | 海岸線・海域 | `coastline` |
| `lake` | 湖沼 | `waterbody` |
| `river` | 河川・水路 | `watercourse` |
| `polity` | 国・郡・境界 | `polity`, `boundary` |
| `sphere` | 勢力圏 | `sphere-of-influence` |
| `castle` | 城郭 | `fortification` |
| `battlefield` | 古戦場 | `battlefield` |
| `settlement` | 集落・街・港 | `settlement`, `port` |
| `route` | 街道 | `route` |
| `other` | その他 | `archaeological-site`, `other` |

対応表はPythonの定数1か所に置き、`manifest.json` にも出す。未知のtypeはスキーマで弾かれるので、ここでの扱いは不要。

### manifest.json

```json
{
  "schemaVersion": 1,
  "tiles": "chronomap.pmtiles",
  "sourceLayer": "features",
  "openYear": { "min": -999999, "max": 999999 },
  "yearRange": { "min": 710, "max": 2020 },
  "years": [710, 1576, 1590, "..."],
  "themes": [{ "id": "coast", "labels": { "ja": "海岸線・海域", "en": "Coastline and sea" } }, "..."],
  "datasets": [
    {
      "slug": "ogurike",
      "id": "ogurike:dataset:pilot-2026",
      "title": { "ja": "..." },
      "defaultLanguage": "ja",
      "bbox": [135.7, 34.88, 135.8, 34.95],
      "attribution": "...",
      "details": "details/ogurike.json",
      "features": 8
    }
  ]
}
```

- `yearRange` と `years` は、全地物の `from_year`・`to_year` から番兵値を除いた値で作る。`years` は昇順で重複なし。M4の非線形タイムラインとイベント目盛りに使う。
- `title`、`bbox`、`attribution` は `dataset.json` の値をそのまま写す。`attribution` は `rights.attribution`。
- 配列とキーの順序は決定的にする（`datasets` はslug順、`themes` は上表の順）。JSONの書き出しは既存の `_canonical_json` を使う。

### details/<slug>.json

クリックした地物の詳細を表示するための、ジオメトリを含まないJSON。既存の公開投影（`_project()`）の結果から作る。

```json
{
  "dataset": "ogurike",
  "features": { "<FeatureVersion.id>": { "entityId": "...", "labels": {}, "description": {}, "temporal": {}, "uncertainty": {}, "evidenceIds": [], "rights": {}, "hypothesisGroupId": "...", "hypothesisLabel": {} } },
  "entities": { "<id>": { "...": "..." } },
  "evidence": { "<id>": { "...": "..." } },
  "sources": { "<id>": { "...": "..." } }
}
```

- `features` の値は公開FeatureVersionの `properties` から `publicationStatus` を除いたもの。
- `evidence` は `_project_evidence()` を通した結果（citation-onlyの置換を含む）を使い、restricted/unknownの資料の本文を漏らさない。
- どれもid順のオブジェクトとし、`_canonical_json` で書き出す。

## 外部ツール

- タイルは [tippecanoe](https://github.com/felt/tippecanoe) で生成する。バージョンは固定し（実装時点の最新安定版で、公開から2週間以上経ったもの）、`README.md` とCIに同じバージョンを書く。
- 地物は改行区切りGeoJSON（GeoJSONSeq）として一時ディレクトリへ書き、tippecanoeに渡す。
- `tippecanoe` がPATHになければ終了コード2と、インストール方法の案内を出す。
- **決定性**: 同じ入力から2回ビルドしたとき、`chronomap.pmtiles` を含む全ファイルがバイト単位で一致すること。tippecanoeが書くメタデータ（`generator_options` のコマンドライン）に一時パスが入らないよう、一時ディレクトリをカレントにした相対パスで起動する。スレッド数などで揺れる場合は、揺れを止めるオプションを探して使う。どうしてもバイト一致にできない場合だけ、理由を本書に追記し、テストをデコード後の内容の一致に切り替える。
- テストでの読み戻しには、Pythonの `pmtiles` と `mapbox-vector-tile` をdev依存として追加してよい。本体の依存には加えない。

実装時点の固定バージョンは **2.79.0**（2026-07-24公開）とする。出力契約は[全国統合タイルの公開契約](../../data/tiles.md)を規範文書とする。有限な年が1つもない場合の `yearRange` は `min`/`max` とも `null`、`years` は空配列とする。

## 実装

1. `public_builder.py` の `_project()` と `_project_evidence()` を、公開関数（例: `project_public(package) -> PublicProjection`）として切り出す。`build_public_bundle()` はそれを使う形に変える。
2. 新モジュール `src/chronomap_data/tile_builder.py` を作る。
   - パッケージの列挙、読み込み、public検証、slug検証
   - 公開投影からタイル用の地物（GeoJSONSeq）、manifest、detailsを組み立てる純粋関数
   - tippecanoeの起動
   - 一時ディレクトリへの書き出しと `_swap_output` による置換
3. `cli.py` に `build-tiles` サブコマンドを追加する。既存のコマンドは「1パッケージを読み込んでから分岐する」構造なので、`build-tiles` が親ディレクトリを受け取れるように分岐を整理する。
4. `.gitignore` に `web/public/chronomap/` を追加する。
5. CIの `python` ジョブで、tippecanoeを固定バージョンでインストールし、検証対象を7パッケージすべてに広げ、`build-tiles` を2回実行して出力が一致することを確認する。

## テスト（TDDで先に書く）

`tests/test_tile_builder.py` に置く。純粋関数の単体テストを中心にし、tippecanoeを使う統合テストは、tippecanoeがない環境ではskipする（CIでは必ず実行する）。

純粋関数:

- 期間の変換: `start`/`end` がnull、`earliestYear`/`latestYear` がnullの各組み合わせから、`from_year`/`to_year` と番兵値が正しく出る
- テーマの対応: 全Entity typeが表のテーマに1対1で決まる
- privateのFeatureVersionはタイルにもdetailsにも入らない
- detailsのEvidenceがcitation-onlyに置き換わる（`tests/fixtures/valid/synthetic-package` を使う）
- slugがディレクトリ名と合わないとき、slugが重複するときは検証エラー
- manifestの `yearRange`・`years`・`datasets` の順序と値

統合（`data/` の7パッケージを入力）:

- 終了コード0で、`manifest.json`・`details/*.json` 7件・`chronomap.pmtiles` ができる
- 全ての公開FeatureVersionが、z4とz12の両方でいずれかのタイルに現れる（間引かれていない）
- タイル上の属性が上表の7つだけで、値が公開投影と一致する
- 2回のビルドでバイト一致する
- 1パッケージをpublic検証に失敗させると終了コード1で、既存の出力が変わらない
- `tippecanoe` がPATHにないと終了コード2

## 資料（実装の前に更新する）

- `README.md`: `build-tiles` の使い方、tippecanoeの固定バージョンとインストール方法を追加する。各パイロットの `build-public` の説明は、M5で旧ビューアーを撤去するまで残す。
- `docs/data/tiles.md`（新規）: 本書の「出力の契約」を規範文書として移す。本書からはそこへリンクする。
- `docs/architecture/overview.md`: 移行後のデータフロー図の `PMTiles統合` と `詳細・出典JSON索引` から `docs/data/tiles.md` へリンクする。
- `docs/product/roadmap.md`: M1の完了時に、状態と残りの課題を追記する。

## 非目標

- Webビューアーの変更（M2）
- 外部データの取り込み、旧版地図ラスター（M3）
- 非線形タイムラインのUI（M4。M1ではmanifestの `years` を出すまで）
- 既存の `build-public` と `web/public/data/` の撤去（M5）
- データのスキーマ変更

## 受け入れ基準

1. `uv run pytest -q` が通り、tippecanoeのある環境で統合テストがskipされずに通る。
2. `uv run chronomap-data build-tiles data --output web/public/chronomap` が、7データセットすべての公開地物を含むPMTiles・manifest・detailsを生成する。
3. 同じコマンドを2回実行した出力がバイト単位で一致する（例外とする場合は理由が本書に記録されている）。
4. 検証に失敗する入力では何も書かず、既存の出力を残す。
5. CIで7パッケージの検証と `build-tiles` の決定性確認が走る。
6. 資料の節の更新が終わっていて、ADR 0008・ロードマップ・`docs/data/tiles.md` の間に矛盾がない。
