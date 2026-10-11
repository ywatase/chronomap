# Chronomap 歴史データ規範モデル

作成日: 2026-09-16

この文書はChronomapの歴史データパッケージの規範契約である。スキーマ、検証器、公開バンドル、利用者向け表示は、ここで定めるフィールド名、列挙値、制約に従う。実在の歴史記録や地物の収録範囲は定めない。

## 共通規約

- データセット形式の`schemaVersion`は正確に`1.0.0`とする。JSON Schemaの方言はDraft 2020-12とする。
- `Dataset.id`、`HistoricalEntity.id`、`Source.id`、`Evidence.id`、Featureの`id`はリソースIDであり、パッケージ全体で一意とする。リソースIDを指す参照値は同じリソースを複数回参照してよい。`hypothesisGroupId`は独立したレコードのIDではなく、一つの論理的な仮説グループが所有するIDを各メンバーが参照する値であり、同じグループのメンバー間で意図して反復する。
- すべてのIDとID参照は、ASCII小文字、数字、単一ハイフンだけを用い、正規表現`^[a-z0-9]+(?:-[a-z0-9]+)*:(dataset|entity|version|source|evidence|hypothesis):[a-z0-9]+(?:-[a-z0-9]+)*$`に一致しなければならない。ID値のkindはフィールドが期待するkindと一致させる。
- テキストの言語別値はBCP 47の言語タグをキーにした空でないオブジェクト（以下、テキストマップ）で表す。`defaultLanguage`はデータセットの既定のBCP 47タグである。`Dataset.title`、`Dataset.description`、`HistoricalEntity.labels`、FeatureVersionの`labels`は`defaultLanguage`の値を必ず含む。その他のテキストマップは`defaultLanguage`を省略でき、その場合の利用者向け表示は辞書順で最初の言語タグの値にフォールバックする。
- 年は天文学的年番号で表す。すなわち、1 BCEは`0`、2 BCEは`-1`である。
- すべての座標位置は、二次元WGS84の経度、緯度の順の、ちょうど二つの有限なJSON数値で表す。経度は`[-180, 180]`、緯度は`[-90, 90]`の範囲内とする。GeometryCollectionは使用しない。

## パッケージ

一つのデータセットは次の5ファイルだけから成る。ファイル名は固定であり、`dataset.json`の`files`は後者4ファイルを指す。

| ファイル | 内容 | ルート値 |
| --- | --- | --- |
| `dataset.json` | 配布単位のマニフェスト | `Dataset` |
| `entities.json` | 歴史対象の索引 | `HistoricalEntity`の配列 |
| `sources.json` | 根拠資料の索引 | `Source`の配列 |
| `evidence.json` | 資料と表現の利用関係 | `Evidence`の配列 |
| `feature-versions.geojson` | 時代・仮説ごとの空間表現 | GeoJSON `FeatureCollection`の`FeatureVersion`群 |

著者用パッケージでは、トップレベルのレコード配列とID参照配列を任意の順序で記述できる。正規の公開直列化では、トップレベルのレコード配列をID昇順にし、`feature-versions.geojson`の`features`もFeature ID昇順にする。すべてのID参照配列もID昇順にする一方、座標配列と`supports`のような非IDの意味配列は著者が与えた順序を保持する。パッケージは、`Dataset.files`が4つの固定ファイル名をそれぞれ指し、各参照IDが同じパッケージ内に存在するときだけ完全である。

## レコード

### Dataset

`Dataset`は次のフィールドをすべて持つ。

| フィールド | 値 | 制約 |
| --- | --- | --- |
| `schemaVersion` | 文字列 | `1.0.0` |
| `id` | ID | kindは`dataset` |
| `title` | テキストマップ | `defaultLanguage`の値を含む |
| `description` | テキストマップ | `defaultLanguage`の値を含む |
| `defaultLanguage` | BCP 47タグ | パッケージの既定言語 |
| `bbox` | `[west, south, east, north]` | WGS84の範囲内で、`west <= east`かつ`south <= north` |
| `temporalExtent` | `Temporal` | データセット全体の可能な時間範囲 |
| `rights` | `Rights` | 公開データセットではpublishableであること |
| `files` | オブジェクト | `entities`、`sources`、`evidence`、`featureVersions`を持ち、それぞれ固定ファイル名を値にする |
| `historicalMapAssets` | `HistoricalMapAsset[]` | 任意。出典・権利・対象範囲・測位限界を持つ古地図／歴史画像コンテキスト |
| `display` | オブジェクト | 任意。`minZoom`（0〜12の整数、既定4）だけを持ち、全国タイルでこのDatasetの地物を表示し始めるズームを指定する |

`historicalMapAssets` はFeatureVersionのgeometryやEvidenceを代替しない。各アセットは`tileTemplate`（HTTPSのXYZテンプレート）または`imageUrl`（HTTPS画像URL）の一方だけを持ち、`bbox`、資料の`date`、取得日、`georeference.method`／`error`、出典URL、表示用帰属、権利、ズーム範囲を記録する。クライアントは不正なアセットだけを除外し、現在地図・歴史geometry・詳細・根拠を維持する。

### HistoricalEntity

`HistoricalEntity`は時代や仮説をまたぐ対象の同一性である。`id`、`type`、`labels`、`description`をすべて持つ。`id`のkindは`entity`、`labels`と`description`はテキストマップであり、`labels`は`defaultLanguage`の値を含む。`type`は次のいずれかとし、geometry typeを拘束しない。

`waterbody`、`watercourse`、`coastline`、`fortification`、`settlement`、`port`、`battlefield`、`route`、`boundary`、`polity`、`sphere-of-influence`、`archaeological-site`、`other`

### Source

`Source`は独立して再利用可能な資料・研究・地図などの根拠である。`id`、`type`、`citation`、`title`、`creators`、`publishedYear`、`url`、`accessedDate`、`rights`をすべて持つ。`id`のkindは`source`、`title`はテキストマップ、`creators`は文字列配列、`publishedYear`は天文学的年番号、`url`はURI、`accessedDate`はISO 8601の暦日である。`citation`は引用に必要な人間可読の書誌情報である。

### Evidence

`Evidence`は`Source`を、ある表現の根拠としてどのように使ったかを表す。`id`、`sourceId`、`locator`、`usage`、`supports`、`note`をすべて持ち、`publicationBasis`は任意とする。`id`のkindは`evidence`、`sourceId`は`Source.id`を参照する。`locator`は資料中の特定可能な箇所であり、空にしてはならない。`supports`は`temporal`、`location`、`geometry`、`identity`からなる空でない重複なしの配列である。

`usage`は`citation`または`derived-geometry`とする。`citation`は資料を出典として示すだけであり、資料内容を複製しない。`derived-geometry`は資料に基づく形状を公開する利用であり、`publicationBasis`を必須とする。`publicationBasis`は`open-license`、`public-domain`、`permission`、`original-reconstruction`のいずれかでなければならない。この場合、`note`は導出内容を説明する空でない文とし、帰属又は利用条件が適用されるときは`Source.rights`に記録する。

### GeoJSON FeatureVersion

`FeatureVersion`はGeoJSON `Feature`であり、Featureの`id`にkindが`version`のIDを置く。`geometry`はPoint、MultiPoint、LineString、MultiLineString、Polygon、MultiPolygonのいずれかとする。JSON Schemaは`type`と`coordinates`配列の形だけを検査し、位置の要素数・WGS84範囲・リングの閉合・Dataset bboxへの包含は意味検証で1回だけ検査する。`properties`は次のフィールドを持つ。

| フィールド | 値 | 制約 |
| --- | --- | --- |
| `entityId` | ID | `HistoricalEntity.id`を参照する |
| `labels` | テキストマップ | 当該版で用いる名称。`defaultLanguage`の値を含む |
| `description` | テキストマップ | 当該版の説明 |
| `temporal` | `Temporal` | 可能な活動期間 |
| `uncertainty` | `Uncertainty` | 4次元すべてを評価する |
| `evidenceIds` | ID配列 | `Evidence.id`を参照する空でない重複なしの配列 |
| `publicationStatus` | 文字列 | 任意。`public`又は`private`。省略時は`private` |
| `rights` | `Rights` | `public`ならpublishableであること |
| `hypothesisGroupId` | ID | 任意。kindが`hypothesis`のID |
| `hypothesisLabel` | テキストマップ | `hypothesisGroupId`があるとき必須 |

FeatureVersionの`evidenceIds`は、時間・位置・形状・同一性の主張を支えるEvidenceだけを参照する。各`Evidence.supports`と不確実性評価の`evidenceIds`は、この配列の部分集合でなければならない。

## 時間

`Temporal`は`start`と`end`から成る。各値は`TemporalBoundary`又は`null`である。一方だけを`null`にして開区間にできるが、両方を`null`にしてはならない。

`TemporalBoundary`は`earliestYear`、`latestYear`、`precision`、`qualifier`を持つ。年フィールドは有限なJSON整数又は`null`であり、境界が存在するときは少なくとも一方の年を持つ。両方が有限なら`earliestYear <= latestYear`でなければならない。

`precision`は`year`、`decade`、`century`、`period`、`unknown`のいずれか、`qualifier`は`exact`、`circa`、`before`、`after`、`unknown`のいずれかとする。可能な活動期間は、開始境界の`earliestYear`（なければ負の無限大）から終了境界の`latestYear`（なければ正の無限大）までを両端を含めて評価する。`start.earliestYear`と`end.latestYear`の両方が有限なら、可能な活動期間には`start.earliestYear <= end.latestYear`を要求する。時間フィルタはこの可能性優先の範囲と選択年が重なるときにFeatureVersionを対象にする。

## 不確実性

`Uncertainty`は`temporal`、`location`、`geometry`、`identity`の4フィールドをすべて持つ。各フィールドの値は`UncertaintyAssessment`であり、`assessment`、`note`、`evidenceIds`を持つ。`assessment`は`well-supported`、`approximate`、`disputed`、`unknown`、`not-applicable`のいずれかである。

- `well-supported`、`approximate`、`disputed`は、根拠を示す空でない`evidenceIds`を必要とする。
- `approximate`、`disputed`、`unknown`、`not-applicable`は、評価理由を説明する空でない`note`を必要とする。
- `unknown`は既知の根拠がないことを、`not-applicable`はその次元が対象外であることを`note`で明示する。これらは空の`evidenceIds`を許す。
- `evidenceIds`の各IDはFeatureVersionの`evidenceIds`に含まれ、そのEvidenceの`supports`が当該次元を含まなければならない。

## 並行仮説

並行仮説グループは、同じ`entityId`を持つ少なくとも2件のFeatureVersionをまとめる。グループのIDは、一つの論理的グループが所有し、そのメンバーの`hypothesisGroupId`で反復して参照するkindが`hypothesis`のIDである。すべての参加FeatureVersionは`hypothesisLabel`を持つ。参加するFeatureVersionの可能な活動期間は少なくとも一部で重ならなければならない。グループ外の版や別のEntityを混在させてはならない。仮説間に優劣を示すフラグは存在せず、`preferred`その他の同等の手動優先指定を設けない。

## 権利と公開投影

`Rights`は少なくとも`status`を持つ。`status`は`public-domain`、`open-license`、`permission`、`restricted`、`unknown`のいずれかである。帰属又は利用条件が適用される場合は、それぞれ`attribution`と`terms`に文字列で記録する。`public-domain`、`open-license`、`permission`をpublishableと呼ぶ。`restricted`と`unknown`はpublishableではない。

公開投影は、`publicationStatus`が`public`のFeatureVersionだけを出力し、そのFeatureVersionから到達可能なHistoricalEntity、Evidence、Sourceだけを残す。私的なFeatureVersion、到達不能な索引レコード、私的な識別子又は内容は出力しない。公開対象のDataset又はFeatureVersionの`rights`がpublishableでない場合、又は公開対象の参照・Evidence・権利がこの契約を満たさない場合は、公開バンドルの生成を失敗させる。`restricted`又は`unknown`のSourceは、権利メタデータと`locator`を伴う`citation`利用に限り公開FeatureVersionから参照できる。資料本文などの再製内容は保存しない。

## 決定的な直列化

公開バンドルは同じ入力から同一バイト列を生成しなければならない。すべてのJSONはキーを辞書順にし、UTF-8、2スペースのインデント、末尾の改行で直列化する。トップレベルのレコード配列とすべてのID参照配列はID順、GeoJSON `features`はFeature ID順にする。座標配列と非IDの意味配列は並べ替えず、入力時の順序を保持する。

## 診断コード

構造を通過した言語タグの意味検査で、重複したvariant又はextension singletonを検出した場合は`language.invalid`を報告する。`defaultLanguage`の値そのものは`/defaultLanguage`、テキストマップのキーはエスケープ済みの当該キーのJSON Pointerを指す。`ref.missing`は参照先又は必須の既定言語値が存在しない場合に限る。

## 関連する判断

- [ADR 0005: 正規化されたデータパッケージ](../adr/0005-normalized-data-package.md)
- [ADR 0006: 可能性優先の時間と並行仮説](../adr/0006-possible-time-and-parallel-hypotheses.md)
- [ADR 0007: fail-closedな公開投影](../adr/0007-fail-closed-public-projection.md)
