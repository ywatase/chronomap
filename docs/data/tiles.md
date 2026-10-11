# 全国統合タイルの公開契約

作成日: 2026-10-11

この文書は、[ADR 0008](../adr/0008-seamless-national-map-with-temporal-vector-tiles.md) のM1で生成するPMTilesと詳細JSON索引の規範契約である。生成コマンドと運用手順は[README](../../README.md)を参照する。

## 入力と安全性

`chronomap-data build-tiles <package-root> --output <directory>` は、`<package-root>` の直下にあるパッケージディレクトリを名前の昇順で処理する。ディレクトリ名は `dataset.json` の `id` の最初の `:` より前のslugと一致しなければならず、slugは重複できない。

全入力を `public` プロファイルで検証し、1件でも失敗すれば出力ディレクトリに触れず終了する。成功物は出力先と同じ親ディレクトリの一時ディレクトリへすべて生成してから、既存出力を原子的に置き換える。入出力エラーやTippecanoeの欠如・失敗は終了コード2、公開検証失敗は1、成功は0とする。

## 出力

```text
<output>/
  chronomap.pmtiles
  manifest.json
  details/<slug>.json
```

`web/public/chronomap/` は生成物であり、Gitへコミットしない。

### PMTiles

- Tippecanoe 2.79.0で生成する。入力は決定順の改行区切りGeoJSONとし、ツールは一時ディレクトリを作業ディレクトリにして相対パスで起動する。
- ベクタータイルレイヤーは `features` の1つ、ズーム範囲は4〜12とする。
- M1では地物数・タイルサイズによる間引きを無効にし、`-r1` で低ズームのPoint地物も間引かない。形状簡略化はTippecanoeの既定値を使う。
- 各地物の属性は次の7項目だけとする。

| 属性 | 型 | 内容 |
| --- | --- | --- |
| `feature_version_id` | string | FeatureVersionのID |
| `entity_id` | string | `properties.entityId` |
| `dataset` | string | データセットslug |
| `theme` | string | Entity typeから決まるテーマID |
| `name` | string | FeatureVersion `labels` のdefaultLanguage値 |
| `from_year` | int | `start.earliestYear`。未指定なら `-999999` |
| `to_year` | int | `end.latestYear`。未指定なら `999999` |

選択年 `y` の表示条件は `from_year <= y <= to_year` である。

テーマ表はコードの1か所に定義し、同じ順序とラベルで `manifest.json` に出力する。スキーマは変更しない。

| ID | 日本語表示名 | 英語表示名 | Entity type |
| --- | --- | --- | --- |
| `coast` | 海岸線・海域 | Coastline and sea | `coastline` |
| `lake` | 湖沼 | Lakes and wetlands | `waterbody` |
| `river` | 河川・水路 | Rivers and waterways | `watercourse` |
| `polity` | 国・郡・境界 | Polities and boundaries | `polity`, `boundary` |
| `sphere` | 勢力圏 | Spheres of influence | `sphere-of-influence` |
| `castle` | 城郭 | Fortifications | `fortification` |
| `battlefield` | 古戦場 | Battlefields | `battlefield` |
| `settlement` | 集落・街・港 | Settlements, towns, and ports | `settlement`, `port` |
| `route` | 街道 | Routes | `route` |
| `other` | その他 | Other | `archaeological-site`, `other` |

### Manifest

`manifest.json` は `schemaVersion: 1`、`tiles: "chronomap.pmtiles"`、`sourceLayer: "features"`、`openYear: {"min": -999999, "max": 999999}`、`yearRange`、`years`、`themes`、`datasets` を持つ。

- `yearRange` と `years` は、全地物の `from_year`・`to_year` から番兵値を除いて導出する。`years` は昇順・重複なしとする。有限な年が1つもなければ `yearRange` の `min` と `max` は `null`、`years` は空配列とする。
- `datasets` はslug昇順。各項目は `slug`、Dataset `id`、`title`、`defaultLanguage`、`bbox`、`rights.attribution`、`details`、公開地物数 `features` を持つ。
- キーは既存の `_canonical_json` で直列化する。配列順はここで定めた順序とする。

### 詳細索引

`details/<slug>.json` は `dataset`、`features`、`entities`、`evidence`、`sources` を持ち、すべてIDをキーにした辞書順オブジェクトとする。Geometryは含めない。

- `features` は公開FeatureVersionの `properties` を格納し、`publicationStatus` だけを除く。
- `entities`、`evidence`、`sources` は共有公開投影の結果を使う。
- `evidence` は権利が `restricted` または `unknown` のSourceに対するcitation-only置換を含み、資料本文を公開しない。
- JSONはUTF-8、キー昇順、2スペースインデント、末尾改行の `_canonical_json` 形式とする。

## 決定性

同じ入力とTippecanoe 2.79.0から、PMTilesとすべてのJSONを含む出力全体がバイト単位で一致しなければならない。`generator_options` に一時絶対パスが入らないようTippecanoeには相対パスを渡す。バイト一致が実現できない場合は理由を実装指示書に記録し、テストはデコード後の内容を比較する。
