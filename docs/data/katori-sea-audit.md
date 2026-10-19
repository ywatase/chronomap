# データ監査: 香取海の推定水域（DEM）

- データセットID: `katori-sea:dataset:dem-reconstruction`
- 既定言語: `ja`
- 公開FeatureVersion: 3
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `katori-sea:version:1200` | 香取海 | MultiPolygon | 1200年 | open-license |
| `katori-sea:version:1600` | 香取海 | MultiPolygon | 1600–1654年 | open-license |
| `katori-sea:version:700` | 香取海 | MultiPolygon | 700年 | open-license |

### `katori-sea:version:1200`

- 地物: 香取海 (`katori-sea:entity:katori-sea`)
- geometry: `MultiPolygon`
- 年代: 1200年
- 権利: `open-license` — 表示: 国土地理院 標高タイル（DEM5a・DEM10b、Chronomapが加工・補正） — 国土地理院コンテンツ利用規約に従う。形状はChronomapのモデル推定で、引用元の図形は含まない。
- 不確実性:
  - `temporal`: `approximate` — 代表時点または代表期間であり、古地図の測量年や当時の水位を示しません。 (Evidence: `katori-sea:evidence:katori-city-vol148`, `katori-sea:evidence:mlit-tone-eastward`)
  - `location`: `approximate` — 現在のDEMタイルと国土地理院住所検索の位置基準から作成しました。 (Evidence: `katori-sea:evidence:dem-model`, `katori-sea:evidence:gsi-address-search`)
  - `geometry`: `approximate` — 閾値3m、4近傍連結、100m簡略化と入り江・水路の概略補正を使いました。 (Evidence: `katori-sea:evidence:choshi-outlet`, `katori-sea:evidence:dem-model`, `katori-sea:evidence:inbanuma-inlet`, `katori-sea:evidence:outer-ocean-cut`, `katori-sea:evidence:sawara-tone-channel`, `katori-sea:evidence:teganuma-inlet`)
  - `identity`: `well-supported` — 自治体・博物館資料が香取の海として記載する地域の概略水域です。 (Evidence: `katori-sea:evidence:chiba-museum-figure`, `katori-sea:evidence:katori-city-vol208-map`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `katori-sea:evidence:chiba-museum-figure` | citation | geometry, identity, location | 「古代・中世の香取の海と水陸交通」の資料図。 | `katori-sea:source:chiba-museum-figure` |
  - `katori-sea:evidence:chiba-museum-figure` — 古代・中世の水域と水陸交通の比較に使った。図の画像・形は公開パッケージへ含めない。
| `katori-sea:evidence:choshi-outlet` | derived-geometry | geometry, location | 形状メモの『銚子口』補正、1200年・1600年。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:choshi-outlet` — 銚子市川口町の住所検索点からDEM境界までに幅300mの短い回廊を加えた。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:dem-model` | derived-geometry | geometry, location | DEM5a z13→DEM10b z13→DEM10b z12。700年4m・1200年3m・1600年2m。入り江用局所DEMは印旛沼4m・手賀沼5m。取得タイルは.cache/raw/dem/katori-sea/に保存。 | `katori-sea:source:gsi-dem` |
  - `katori-sea:evidence:dem-model` — RGB標高から外洋連結した閾値以下セルをポリゴン化し、外洋・銚子口・入り江・佐原水路補正後にも面積1ha未満の穴と断片を除去した。入り江成分は史料で範囲を確認した2地点だけを対象とする。 (publicationBasis: `open-license`)
| `katori-sea:evidence:gsi-address-search` | citation | location | 土浦市大岩田・行方市玉造甲・潮来市潮来・香取市佐原・一ノ分目新田・印西市師戸・我孫子市高野山・銚子市川口町・犬吠埼・鹿嶋市宮中・成田市花崎町・佐倉市海隣寺町・鉾田市鉾田・大竹・つくば市研究学園・霞ヶ浦・北浦の検索応答。 | `katori-sea:source:gsi-address-search` |
  - `katori-sea:evidence:gsi-address-search` — 住所検索応答を位置基準と外洋seed・外洋カットに使った。入り江・佐原水路のPM指定検査点は別の作業指定座標として区別した。
| `katori-sea:evidence:inbanuma-inlet` | derived-geometry | geometry, location | 形状メモの『印旛沼の入り江』補正。PM指定点(140.20,35.77)、DEM局所成分4m以下、全3年代。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:inbanuma-inlet` — 香取市Vol.208は中世頃の香取海が印旛沼を含むと説明する。指定点を含む局所DEM低地成分を抽出し、個別の接続水路は資料で特定できないため主水域との回廊を作らず保持した。各代表年へ適用することは長期的な水域範囲を用いたモデル推定であり、各年の正確な湖岸を示さない。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:katori-city-vol148` | citation | geometry, identity, temporal | Vol.148「香取の海と新島十六島 利根川が流れる前と後」、約1000年前の流域想定図。 | `katori-sea:source:katori-city-vol148` |
  - `katori-sea:evidence:katori-city-vol148` — 霞ヶ浦・印旛沼にまたがる広大な内海と銚子への流路変更を確認した。図はトレースしない。
| `katori-sea:evidence:katori-city-vol208-map` | citation | geometry, identity, location | Vol.208「香取の海と新田開発」、掲載模式図208-2。 | `katori-sea:source:katori-city-vol208` |
  - `katori-sea:evidence:katori-city-vol208-map` — 中世頃の内海が霞ヶ浦・印旛沼・手賀沼を含むという説明と、模式図を形状比較に使った。図はトレースしない。
| `katori-sea:evidence:mlit-tone-eastward` | citation | geometry, temporal | 利根川東遷 1594〜1654年、銚子から太平洋へ流下する説明。 | `katori-sea:source:mlit-tone-eastward` |
  - `katori-sea:evidence:mlit-tone-eastward` — 銚子口が太平洋側の流路終端であることと1600〜1654年の期間を確認した。
| `katori-sea:evidence:outer-ocean-cut` | derived-geometry | geometry, location | 形状メモの『鹿島灘・銚子沖の外洋側』補正。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:outer-ocean-cut` — 鹿嶋市宮中・銚子市川口町・犬吠埼の住所検索応答をつないだ概略カットで、外洋側のNoData面を除いた。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:sawara-tone-channel` | derived-geometry | geometry, location | 形状メモの『佐原の利根川出口』補正。PM指定点(140.50,35.90)、1200年幅300m、1600年幅700m。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:sawara-tone-channel` — 香取市Vol.208・Vol.148と国土交通省の利根川東遷資料にある銚子方面への流路を保つ。DEM下地で切れた区間を指定点から最大主水域まで接続した。回廊幅は表示用モデルで、歴史上の河幅測量値ではない。700年はDEM下地が検査点を含み銚子まで連結する。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:teganuma-inlet` | derived-geometry | geometry, location | 形状メモの『手賀沼の入り江』補正。PM指定点(140.06,35.86)、DEM局所成分5m以下、全3年代。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:teganuma-inlet` — 香取市Vol.208は中世頃の香取海が手賀沼を含むと説明する。指定点を含む局所DEM低地成分を抽出し、個別の接続水路は資料で特定できないため主水域との回廊を作らず保持した。各代表年へ適用することは長期的な水域範囲を用いたモデル推定であり、各年の正確な湖岸を示さない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `katori-sea:source:chiba-museum-figure`: 千葉県立中央博物館『古代・中世の香取の海と水陸交通』 — 古代・中世の香取の海と水陸交通; 作成者: 千葉県立中央博物館; 2026年; 参照日: 2026-10-19 — rights: `restricted` — https://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2026/03/katorijinguten_zuroku.pdf
  - `katori-sea:source:chronomap-notes`: Chronomap『香取海 形状作成メモ』 — 香取海 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/katori-sea-shape-notes.md
  - `katori-sea:source:gsi-address-search`: 国土地理院 住所検索API（県名・市名付き検索、2026年10月19日） — 地理院地図 住所検索API; 作成者: 国土地理院; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: 国土地理院 — https://msearch.gsi.go.jp/address-search/AddressSearch?q=
  - `katori-sea:source:gsi-dem`: 国土地理院 地理院タイル「標高データ」（DEM5a・DEM10b、2026年10月取得） — 地理院タイル 標高データ; 作成者: 国土地理院; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: 国土地理院 — https://cyberjapandata.gsi.go.jp/development/demtile.html
  - `katori-sea:source:katori-city-vol148`: 香取市『香取遺産 Vol.148 香取の海と新島十六島』広報かとり 平成30年4月号 — 香取の海と新島十六島; 作成者: 香取市; 2018年; 参照日: 2026-10-19 — rights: `restricted` — https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/141-150.html
  - `katori-sea:source:katori-city-vol208`: 香取市『香取遺産 Vol.208 香取の海と新田開発』広報かとり 令和5年12月号 — 香取の海と新田開発; 作成者: 香取市; 2023年; 参照日: 2026-10-19 — rights: `restricted` — https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/201-210.html
  - `katori-sea:source:mlit-tone-eastward`: 国土交通省 関東地方整備局『「利根川の東遷」と「荒川の西遷」』 — 利根川の東遷と荒川の西遷; 作成者: 国土交通省 関東地方整備局; 2013年; 参照日: 2026-10-19 — rights: `restricted` — https://www.ktr.mlit.go.jp/ktr_content/content/000853737.pdf

### `katori-sea:version:1600`

- 地物: 香取海 (`katori-sea:entity:katori-sea`)
- geometry: `MultiPolygon`
- 年代: 1600–1654年
- 権利: `open-license` — 表示: 国土地理院 標高タイル（DEM5a・DEM10b、Chronomapが加工・補正） — 国土地理院コンテンツ利用規約に従う。形状はChronomapのモデル推定で、引用元の図形は含まない。
- 不確実性:
  - `temporal`: `approximate` — 代表時点または代表期間であり、古地図の測量年や当時の水位を示しません。 (Evidence: `katori-sea:evidence:katori-city-vol148`, `katori-sea:evidence:mlit-tone-eastward`)
  - `location`: `approximate` — 現在のDEMタイルと国土地理院住所検索の位置基準から作成しました。 (Evidence: `katori-sea:evidence:dem-model`, `katori-sea:evidence:gsi-address-search`)
  - `geometry`: `approximate` — 閾値2m、4近傍連結、100m簡略化と入り江・水路の概略補正を使いました。 (Evidence: `katori-sea:evidence:choshi-outlet`, `katori-sea:evidence:dem-model`, `katori-sea:evidence:inbanuma-inlet`, `katori-sea:evidence:outer-ocean-cut`, `katori-sea:evidence:sawara-tone-channel`, `katori-sea:evidence:teganuma-inlet`)
  - `identity`: `well-supported` — 自治体・博物館資料が香取の海として記載する地域の概略水域です。 (Evidence: `katori-sea:evidence:chiba-museum-figure`, `katori-sea:evidence:katori-city-vol208-map`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `katori-sea:evidence:chiba-museum-figure` | citation | geometry, identity, location | 「古代・中世の香取の海と水陸交通」の資料図。 | `katori-sea:source:chiba-museum-figure` |
  - `katori-sea:evidence:chiba-museum-figure` — 古代・中世の水域と水陸交通の比較に使った。図の画像・形は公開パッケージへ含めない。
| `katori-sea:evidence:choshi-outlet` | derived-geometry | geometry, location | 形状メモの『銚子口』補正、1200年・1600年。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:choshi-outlet` — 銚子市川口町の住所検索点からDEM境界までに幅300mの短い回廊を加えた。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:dem-model` | derived-geometry | geometry, location | DEM5a z13→DEM10b z13→DEM10b z12。700年4m・1200年3m・1600年2m。入り江用局所DEMは印旛沼4m・手賀沼5m。取得タイルは.cache/raw/dem/katori-sea/に保存。 | `katori-sea:source:gsi-dem` |
  - `katori-sea:evidence:dem-model` — RGB標高から外洋連結した閾値以下セルをポリゴン化し、外洋・銚子口・入り江・佐原水路補正後にも面積1ha未満の穴と断片を除去した。入り江成分は史料で範囲を確認した2地点だけを対象とする。 (publicationBasis: `open-license`)
| `katori-sea:evidence:gsi-address-search` | citation | location | 土浦市大岩田・行方市玉造甲・潮来市潮来・香取市佐原・一ノ分目新田・印西市師戸・我孫子市高野山・銚子市川口町・犬吠埼・鹿嶋市宮中・成田市花崎町・佐倉市海隣寺町・鉾田市鉾田・大竹・つくば市研究学園・霞ヶ浦・北浦の検索応答。 | `katori-sea:source:gsi-address-search` |
  - `katori-sea:evidence:gsi-address-search` — 住所検索応答を位置基準と外洋seed・外洋カットに使った。入り江・佐原水路のPM指定検査点は別の作業指定座標として区別した。
| `katori-sea:evidence:inbanuma-inlet` | derived-geometry | geometry, location | 形状メモの『印旛沼の入り江』補正。PM指定点(140.20,35.77)、DEM局所成分4m以下、全3年代。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:inbanuma-inlet` — 香取市Vol.208は中世頃の香取海が印旛沼を含むと説明する。指定点を含む局所DEM低地成分を抽出し、個別の接続水路は資料で特定できないため主水域との回廊を作らず保持した。各代表年へ適用することは長期的な水域範囲を用いたモデル推定であり、各年の正確な湖岸を示さない。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:katori-city-vol148` | citation | geometry, identity, temporal | Vol.148「香取の海と新島十六島 利根川が流れる前と後」、約1000年前の流域想定図。 | `katori-sea:source:katori-city-vol148` |
  - `katori-sea:evidence:katori-city-vol148` — 霞ヶ浦・印旛沼にまたがる広大な内海と銚子への流路変更を確認した。図はトレースしない。
| `katori-sea:evidence:katori-city-vol208-map` | citation | geometry, identity, location | Vol.208「香取の海と新田開発」、掲載模式図208-2。 | `katori-sea:source:katori-city-vol208` |
  - `katori-sea:evidence:katori-city-vol208-map` — 中世頃の内海が霞ヶ浦・印旛沼・手賀沼を含むという説明と、模式図を形状比較に使った。図はトレースしない。
| `katori-sea:evidence:mlit-tone-eastward` | citation | geometry, temporal | 利根川東遷 1594〜1654年、銚子から太平洋へ流下する説明。 | `katori-sea:source:mlit-tone-eastward` |
  - `katori-sea:evidence:mlit-tone-eastward` — 銚子口が太平洋側の流路終端であることと1600〜1654年の期間を確認した。
| `katori-sea:evidence:outer-ocean-cut` | derived-geometry | geometry, location | 形状メモの『鹿島灘・銚子沖の外洋側』補正。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:outer-ocean-cut` — 鹿嶋市宮中・銚子市川口町・犬吠埼の住所検索応答をつないだ概略カットで、外洋側のNoData面を除いた。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:sawara-tone-channel` | derived-geometry | geometry, location | 形状メモの『佐原の利根川出口』補正。PM指定点(140.50,35.90)、1200年幅300m、1600年幅700m。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:sawara-tone-channel` — 香取市Vol.208・Vol.148と国土交通省の利根川東遷資料にある銚子方面への流路を保つ。DEM下地で切れた区間を指定点から最大主水域まで接続した。回廊幅は表示用モデルで、歴史上の河幅測量値ではない。700年はDEM下地が検査点を含み銚子まで連結する。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:teganuma-inlet` | derived-geometry | geometry, location | 形状メモの『手賀沼の入り江』補正。PM指定点(140.06,35.86)、DEM局所成分5m以下、全3年代。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:teganuma-inlet` — 香取市Vol.208は中世頃の香取海が手賀沼を含むと説明する。指定点を含む局所DEM低地成分を抽出し、個別の接続水路は資料で特定できないため主水域との回廊を作らず保持した。各代表年へ適用することは長期的な水域範囲を用いたモデル推定であり、各年の正確な湖岸を示さない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `katori-sea:source:chiba-museum-figure`: 千葉県立中央博物館『古代・中世の香取の海と水陸交通』 — 古代・中世の香取の海と水陸交通; 作成者: 千葉県立中央博物館; 2026年; 参照日: 2026-10-19 — rights: `restricted` — https://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2026/03/katorijinguten_zuroku.pdf
  - `katori-sea:source:chronomap-notes`: Chronomap『香取海 形状作成メモ』 — 香取海 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/katori-sea-shape-notes.md
  - `katori-sea:source:gsi-address-search`: 国土地理院 住所検索API（県名・市名付き検索、2026年10月19日） — 地理院地図 住所検索API; 作成者: 国土地理院; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: 国土地理院 — https://msearch.gsi.go.jp/address-search/AddressSearch?q=
  - `katori-sea:source:gsi-dem`: 国土地理院 地理院タイル「標高データ」（DEM5a・DEM10b、2026年10月取得） — 地理院タイル 標高データ; 作成者: 国土地理院; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: 国土地理院 — https://cyberjapandata.gsi.go.jp/development/demtile.html
  - `katori-sea:source:katori-city-vol148`: 香取市『香取遺産 Vol.148 香取の海と新島十六島』広報かとり 平成30年4月号 — 香取の海と新島十六島; 作成者: 香取市; 2018年; 参照日: 2026-10-19 — rights: `restricted` — https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/141-150.html
  - `katori-sea:source:katori-city-vol208`: 香取市『香取遺産 Vol.208 香取の海と新田開発』広報かとり 令和5年12月号 — 香取の海と新田開発; 作成者: 香取市; 2023年; 参照日: 2026-10-19 — rights: `restricted` — https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/201-210.html
  - `katori-sea:source:mlit-tone-eastward`: 国土交通省 関東地方整備局『「利根川の東遷」と「荒川の西遷」』 — 利根川の東遷と荒川の西遷; 作成者: 国土交通省 関東地方整備局; 2013年; 参照日: 2026-10-19 — rights: `restricted` — https://www.ktr.mlit.go.jp/ktr_content/content/000853737.pdf

### `katori-sea:version:700`

- 地物: 香取海 (`katori-sea:entity:katori-sea`)
- geometry: `MultiPolygon`
- 年代: 700年
- 権利: `open-license` — 表示: 国土地理院 標高タイル（DEM5a・DEM10b、Chronomapが加工・補正） — 国土地理院コンテンツ利用規約に従う。形状はChronomapのモデル推定で、引用元の図形は含まない。
- 不確実性:
  - `temporal`: `approximate` — 代表時点または代表期間であり、古地図の測量年や当時の水位を示しません。 (Evidence: `katori-sea:evidence:katori-city-vol148`, `katori-sea:evidence:mlit-tone-eastward`)
  - `location`: `approximate` — 現在のDEMタイルと国土地理院住所検索の位置基準から作成しました。 (Evidence: `katori-sea:evidence:dem-model`, `katori-sea:evidence:gsi-address-search`)
  - `geometry`: `approximate` — 閾値4m、4近傍連結、100m簡略化と入り江・水路の概略補正を使いました。 (Evidence: `katori-sea:evidence:dem-model`, `katori-sea:evidence:inbanuma-inlet`, `katori-sea:evidence:outer-ocean-cut`, `katori-sea:evidence:sawara-tone-channel`, `katori-sea:evidence:teganuma-inlet`)
  - `identity`: `well-supported` — 自治体・博物館資料が香取の海として記載する地域の概略水域です。 (Evidence: `katori-sea:evidence:chiba-museum-figure`, `katori-sea:evidence:katori-city-vol208-map`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `katori-sea:evidence:chiba-museum-figure` | citation | geometry, identity, location | 「古代・中世の香取の海と水陸交通」の資料図。 | `katori-sea:source:chiba-museum-figure` |
  - `katori-sea:evidence:chiba-museum-figure` — 古代・中世の水域と水陸交通の比較に使った。図の画像・形は公開パッケージへ含めない。
| `katori-sea:evidence:dem-model` | derived-geometry | geometry, location | DEM5a z13→DEM10b z13→DEM10b z12。700年4m・1200年3m・1600年2m。入り江用局所DEMは印旛沼4m・手賀沼5m。取得タイルは.cache/raw/dem/katori-sea/に保存。 | `katori-sea:source:gsi-dem` |
  - `katori-sea:evidence:dem-model` — RGB標高から外洋連結した閾値以下セルをポリゴン化し、外洋・銚子口・入り江・佐原水路補正後にも面積1ha未満の穴と断片を除去した。入り江成分は史料で範囲を確認した2地点だけを対象とする。 (publicationBasis: `open-license`)
| `katori-sea:evidence:gsi-address-search` | citation | location | 土浦市大岩田・行方市玉造甲・潮来市潮来・香取市佐原・一ノ分目新田・印西市師戸・我孫子市高野山・銚子市川口町・犬吠埼・鹿嶋市宮中・成田市花崎町・佐倉市海隣寺町・鉾田市鉾田・大竹・つくば市研究学園・霞ヶ浦・北浦の検索応答。 | `katori-sea:source:gsi-address-search` |
  - `katori-sea:evidence:gsi-address-search` — 住所検索応答を位置基準と外洋seed・外洋カットに使った。入り江・佐原水路のPM指定検査点は別の作業指定座標として区別した。
| `katori-sea:evidence:inbanuma-inlet` | derived-geometry | geometry, location | 形状メモの『印旛沼の入り江』補正。PM指定点(140.20,35.77)、DEM局所成分4m以下、全3年代。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:inbanuma-inlet` — 香取市Vol.208は中世頃の香取海が印旛沼を含むと説明する。指定点を含む局所DEM低地成分を抽出し、個別の接続水路は資料で特定できないため主水域との回廊を作らず保持した。各代表年へ適用することは長期的な水域範囲を用いたモデル推定であり、各年の正確な湖岸を示さない。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:katori-city-vol148` | citation | geometry, identity, temporal | Vol.148「香取の海と新島十六島 利根川が流れる前と後」、約1000年前の流域想定図。 | `katori-sea:source:katori-city-vol148` |
  - `katori-sea:evidence:katori-city-vol148` — 霞ヶ浦・印旛沼にまたがる広大な内海と銚子への流路変更を確認した。図はトレースしない。
| `katori-sea:evidence:katori-city-vol208-map` | citation | geometry, identity, location | Vol.208「香取の海と新田開発」、掲載模式図208-2。 | `katori-sea:source:katori-city-vol208` |
  - `katori-sea:evidence:katori-city-vol208-map` — 中世頃の内海が霞ヶ浦・印旛沼・手賀沼を含むという説明と、模式図を形状比較に使った。図はトレースしない。
| `katori-sea:evidence:mlit-tone-eastward` | citation | geometry, temporal | 利根川東遷 1594〜1654年、銚子から太平洋へ流下する説明。 | `katori-sea:source:mlit-tone-eastward` |
  - `katori-sea:evidence:mlit-tone-eastward` — 銚子口が太平洋側の流路終端であることと1600〜1654年の期間を確認した。
| `katori-sea:evidence:outer-ocean-cut` | derived-geometry | geometry, location | 形状メモの『鹿島灘・銚子沖の外洋側』補正。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:outer-ocean-cut` — 鹿嶋市宮中・銚子市川口町・犬吠埼の住所検索応答をつないだ概略カットで、外洋側のNoData面を除いた。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:sawara-tone-channel` | derived-geometry | geometry, location | 形状メモの『佐原の利根川出口』補正。PM指定点(140.50,35.90)、1200年幅300m、1600年幅700m。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:sawara-tone-channel` — 香取市Vol.208・Vol.148と国土交通省の利根川東遷資料にある銚子方面への流路を保つ。DEM下地で切れた区間を指定点から最大主水域まで接続した。回廊幅は表示用モデルで、歴史上の河幅測量値ではない。700年はDEM下地が検査点を含み銚子まで連結する。 (publicationBasis: `original-reconstruction`)
| `katori-sea:evidence:teganuma-inlet` | derived-geometry | geometry, location | 形状メモの『手賀沼の入り江』補正。PM指定点(140.06,35.86)、DEM局所成分5m以下、全3年代。 | `katori-sea:source:chronomap-notes` |
  - `katori-sea:evidence:teganuma-inlet` — 香取市Vol.208は中世頃の香取海が手賀沼を含むと説明する。指定点を含む局所DEM低地成分を抽出し、個別の接続水路は資料で特定できないため主水域との回廊を作らず保持した。各代表年へ適用することは長期的な水域範囲を用いたモデル推定であり、各年の正確な湖岸を示さない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `katori-sea:source:chiba-museum-figure`: 千葉県立中央博物館『古代・中世の香取の海と水陸交通』 — 古代・中世の香取の海と水陸交通; 作成者: 千葉県立中央博物館; 2026年; 参照日: 2026-10-19 — rights: `restricted` — https://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2026/03/katorijinguten_zuroku.pdf
  - `katori-sea:source:chronomap-notes`: Chronomap『香取海 形状作成メモ』 — 香取海 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/katori-sea-shape-notes.md
  - `katori-sea:source:gsi-address-search`: 国土地理院 住所検索API（県名・市名付き検索、2026年10月19日） — 地理院地図 住所検索API; 作成者: 国土地理院; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: 国土地理院 — https://msearch.gsi.go.jp/address-search/AddressSearch?q=
  - `katori-sea:source:gsi-dem`: 国土地理院 地理院タイル「標高データ」（DEM5a・DEM10b、2026年10月取得） — 地理院タイル 標高データ; 作成者: 国土地理院; 2026年; 参照日: 2026-10-19 — rights: `open-license`; 表示: 国土地理院 — https://cyberjapandata.gsi.go.jp/development/demtile.html
  - `katori-sea:source:katori-city-vol148`: 香取市『香取遺産 Vol.148 香取の海と新島十六島』広報かとり 平成30年4月号 — 香取の海と新島十六島; 作成者: 香取市; 2018年; 参照日: 2026-10-19 — rights: `restricted` — https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/141-150.html
  - `katori-sea:source:katori-city-vol208`: 香取市『香取遺産 Vol.208 香取の海と新田開発』広報かとり 令和5年12月号 — 香取の海と新田開発; 作成者: 香取市; 2023年; 参照日: 2026-10-19 — rights: `restricted` — https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/201-210.html
  - `katori-sea:source:mlit-tone-eastward`: 国土交通省 関東地方整備局『「利根川の東遷」と「荒川の西遷」』 — 利根川の東遷と荒川の西遷; 作成者: 国土交通省 関東地方整備局; 2013年; 参照日: 2026-10-19 — rights: `restricted` — https://www.ktr.mlit.go.jp/ktr_content/content/000853737.pdf

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `katori-sea:source:chiba-museum-figure` | 千葉県立中央博物館『古代・中世の香取の海と水陸交通』 | 古代・中世の香取の海と水陸交通; 作成者: 千葉県立中央博物館; 2026年; 参照日: 2026-10-19; https://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2026/03/katorijinguten_zuroku.pdf | restricted | 引用メタデータのみ。掲載図は再配布・トレースしない。 |
| `katori-sea:source:chronomap-notes` | Chronomap『香取海 形状作成メモ』 | 香取海 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-19; https://github.com/ywatase/chronomap/blob/main/docs/data/katori-sea-shape-notes.md | open-license; 表示: Chronomap contributors | Chronomapのモデル手法・概略補正。外部資料の権利条件は個別Sourceに従う。 |
| `katori-sea:source:gsi-address-search` | 国土地理院 住所検索API（県名・市名付き検索、2026年10月19日） | 地理院地図 住所検索API; 作成者: 国土地理院; 2026年; 参照日: 2026-10-19; https://msearch.gsi.go.jp/address-search/AddressSearch?q= | open-license; 表示: 国土地理院 | 国土地理院コンテンツ利用規約。住所検索の応答座標を位置基準に使用。 |
| `katori-sea:source:gsi-dem` | 国土地理院 地理院タイル「標高データ」（DEM5a・DEM10b、2026年10月取得） | 地理院タイル 標高データ; 作成者: 国土地理院; 2026年; 参照日: 2026-10-19; https://cyberjapandata.gsi.go.jp/development/demtile.html | open-license; 表示: 国土地理院 | 国土地理院コンテンツ利用規約。出典と加工内容を表示。 |
| `katori-sea:source:katori-city-vol148` | 香取市『香取遺産 Vol.148 香取の海と新島十六島』広報かとり 平成30年4月号 | 香取の海と新島十六島; 作成者: 香取市; 2018年; 参照日: 2026-10-19; https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/141-150.html | restricted | 引用メタデータのみ。掲載図は再配布・トレースしない。 |
| `katori-sea:source:katori-city-vol208` | 香取市『香取遺産 Vol.208 香取の海と新田開発』広報かとり 令和5年12月号 | 香取の海と新田開発; 作成者: 香取市; 2023年; 参照日: 2026-10-19; https://www.city.katori.lg.jp/culture_sport/bunkazai/isan/201-210.html | restricted | 引用メタデータのみ。掲載図は再配布・トレースしない。 |
| `katori-sea:source:mlit-tone-eastward` | 国土交通省 関東地方整備局『「利根川の東遷」と「荒川の西遷」』 | 利根川の東遷と荒川の西遷; 作成者: 国土交通省 関東地方整備局; 2013年; 参照日: 2026-10-19; https://www.ktr.mlit.go.jp/ktr_content/content/000853737.pdf | restricted | 引用メタデータのみ。本文・図は再配布しない。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
