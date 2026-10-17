# 全国統合タイルの公開契約

作成日: 2026-10-11

この文書は、[ADR 0008](../adr/0008-seamless-national-map-with-temporal-vector-tiles.md) で生成するPMTilesと詳細JSON索引の規範契約である。M1で定め、2026-10-12にM2〜M6のため改訂した（[設計書](../superpowers/specs/2026-10-12-adr0008-m2-m6-design.md)）。生成コマンドと運用手順は[README](../../README.md)を参照する。

## 入力と安全性

`chronomap-data build-tiles <package-root>... --output <directory>` は、1つ以上の `<package-root>` の直下にあるパッケージディレクトリをすべて集め、slugの昇順で処理する。手作業のパッケージは `data/`、取込コマンドの生成物は `imports/`（Git対象外）に置く。ディレクトリ名は `dataset.json` の `id` の最初の `:` より前のslugと一致しなければならず、slugはルートをまたいでも重複できない。

全入力を `public` プロファイルで検証し、1件でも失敗すれば出力ディレクトリに触れず終了する。成功物は出力先と同じ親ディレクトリの一時ディレクトリへすべて生成してから、既存出力を原子的に置き換える。入出力エラーやTippecanoeの欠如・失敗は終了コード2、公開検証失敗は1、成功は0とする。

## 出力

```text
<output>/
  chronomap.pmtiles
  manifest.json
  details/<slug>/<shard>.json
```

`web/public/chronomap/` は生成物であり、Gitへコミットしない。

### PMTiles

- Tippecanoe 2.79.0で生成する。入力は決定順の改行区切りGeoJSONとし、ツールは一時ディレクトリを作業ディレクトリにして相対パスで起動する。
- ベクタータイルレイヤーは `features` の1つ、ズーム範囲は0〜12とする。
- Datasetの `display.seaMask` が `true` なら、その海岸線テーマの面は「当時の海」として背景地図の海の色で不透明に塗る（[江戸末期の海岸線・湖沼](edo.md)）。
- 地物は、Datasetの `display.minZoom`（未指定なら4）から `display.maxZoom`（未指定なら12）までのタイルにだけ入る。GeoJSONSeqの各地物に `tippecanoe.minzoom`・`tippecanoe.maxzoom` を付けて指定する。世界規模の概略データを高ズームまで切り出すとアーカイブが数百MBに膨らむため、世界データは `maxZoom` 6とする。
- 地物数・タイルサイズによる間引きを無効にし、`-r1` で低ズームのPoint地物も間引かない。形状簡略化はTippecanoeの既定値を使う。
- 各地物の属性は次の9項目だけとする。

| 属性 | 型 | 内容 |
| --- | --- | --- |
| `feature_version_id` | string | FeatureVersionのID |
| `entity_id` | string | `properties.entityId` |
| `dataset` | string | データセットslug |
| `theme` | string | Entity typeから決まるテーマID |
| `name` | string | FeatureVersion `labels` のdefaultLanguage値 |
| `from_year` | int | `start.earliestYear`。未指定なら `-999999` |
| `to_year` | int | 表示期間の終わり。原則 `end.latestYear`（未指定なら `999999`）で、スナップショットの継続（下記）で延びることがある |
| `hue` | int | `entity_id` のFNV-1a 32bitハッシュ（UTF-8）を12で割った余り。塗り分け用 |
| `ref_from_year` | int | 参考表示の始まり。参考表示がなければ `from_year` と同じ（下記） |

選択年 `y` の表示条件は `from_year <= y <= to_year` である。

#### 表示期間（スナップショットの継続）

資料の多くはある年の状態（スナップショット）だけを示すため、可能期間どおりに表示すると、次の資料の年まで地物が消えてしまう。そこで `to_year` は可能期間の終わりではなく、次の規則で決める表示期間の終わりとする。

- 同じEntityに属し、`hypothesisGroupId` を持たないFeatureVersionを `from_year` 順に並べる。
- 終了境界が有限な各FeatureVersionの表示は、次のFeatureVersionの `from_year` の前年まで続く（自分の可能期間の終わりより後なら延ばし、前なら縮めない）。
- 最後のFeatureVersionは延ばさない。並行仮説、終了が開いているもの、同じ年に始まる次の版がないものもそのままとする。

延ばしたのは表示だけで、その間に形が変わらなかったとは主張しない。世界の国境のように、資料自体が時点の系列で次の時点に消える地物もあるものは、取込コマンドが可能期間を次の時点の前年までとして記録する（この規則と矛盾しない）。詳細索引の `features` には、延ばしたFeatureVersionに限り `display: {"toYear": <表示の終わり>, "nextVersionYear": <次の版の開始年>}` を加え、ビューアーは「次の資料まで表示を継続」と示す。新しい資料（空中写真、古地図など）から同じEntityの新しい版を作れば、継続表示はその前年で自動的に止まる。

#### 最古の版の参考表示

湖沼・河川・海岸線（Entity typeが `waterbody`・`watercourse`・`coastline`）は、資料の最古の時点より前にも存在していたことが多い。何も描かないと、その年に現代の地形が当時の姿のように見えてしまう。そこで、同じEntityの並行仮説でない版のうち `from_year` が最も早い版は、`ref_from_year` を `-999999` とし、`from_year` より前の年に参考として表示する。それ以外の地物は `ref_from_year = from_year` で、参考表示はない。

ビューアーは `ref_from_year <= y < from_year` の地物を、通常の表示と区別できる破線・半透明で描き、詳細では「これより前の形を示す資料はなく、最古の資料の形を参考に表示している」と示す。城・集落など人が作った地物は、作られる前に存在しないので対象にしない。

manifestの `years`（タイムラインの目盛り）は、延ばす前の可能期間の年から作る。`defaultYear` は延ばした後の表示期間で数える。

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
| `artificial` | 干拓地・埋立地（現代） | Modern drained and reclaimed land | `artificial-land` |
| `other` | その他 | Other | `archaeological-site`, `other` |

### Manifest

`manifest.json` は `schemaVersion: 2`、`tiles: "chronomap.pmtiles"`、`sourceLayer: "features"`、`openYear: {"min": -999999, "max": 999999}`、`yearRange`、`years`、`defaultYear`、`themes`、`rasters`、`datasets` を持つ。

- `yearRange` と `years` は、全地物の `from_year`・`to_year` から番兵値を除いて導出する。`years` は昇順・重複なしとする。有限な年が1つもなければ `yearRange` の `min` と `max` は `null`、`years` は空配列とする。
- `defaultYear` は `years` のうち、その年に表示される地物（`from_year <= y <= to_year`）が最も多い年とする。同数なら古い年。`years` が空なら `null`。
- `datasets` はslug昇順。各項目は `slug`、Dataset `id`、`title`、`defaultLanguage`、`bbox`、`rights.attribution`、`minZoom`、`maxZoom`、`seaMask`（真偽値）、詳細索引のシャード数 `detailShards`、公開地物数 `features` を持つ。
- `rasters` は、Datasetの `historicalMapAssets` のうち `tileTemplate` を持つものを、slug順・Dataset内の記載順に並べる。各項目は `id`、`dataset`、`title`、`description`、`date`、`tileTemplate`、`attribution`、`bbox`、`minZoom`、`maxZoom` を持つ。
- キーは既存の `_canonical_json` で直列化する。配列順はここで定めた順序とする。

### 詳細索引

詳細索引はDatasetごとに `detailShards = max(1, ceil(公開地物数 / 200))` 個のシャードへ分ける。FeatureVersionは `fnv1a32(feature_version_id) % detailShards` 番目のシャード `details/<slug>/<shard>.json` に入る。ビューアーは同じ計算でシャードを決める。

各シャードは `dataset`、`features`、`entities`、`evidence`、`sources` を持ち、すべてIDをキーにした辞書順オブジェクトとする。`entities`・`evidence`・`sources` は、そのシャードのFeatureVersionから到達できるものだけを含む。Geometryは含めない。

- `features` は公開FeatureVersionの `properties` を格納し、`publicationStatus` だけを除く。
- `entities`、`evidence`、`sources` は共有公開投影の結果を使う。
- `evidence` は権利が `restricted` または `unknown` のSourceに対するcitation-only置換を含み、資料本文を公開しない。
- JSONはUTF-8、キー昇順、2スペースインデント、末尾改行の `_canonical_json` 形式とする。

## 決定性

同じ入力とTippecanoe 2.79.0から、PMTilesとすべてのJSONを含む出力全体がバイト単位で一致しなければならない。`generator_options` に一時絶対パスが入らないようTippecanoeには相対パスを渡す。バイト一致が実現できない場合は理由を実装指示書に記録し、テストはデコード後の内容を比較する。
