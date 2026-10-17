# データ監査: 大阪湾奥・河内湖（縄文〜江戸初期）

- データセットID: `osaka-coast:dataset:pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 7
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `osaka-coast:version:lake-edo` | 河内湖（中世〜江戸初期（大和川付け替え前）・概略） | MultiPolygon | 1600–1600–1704年 | open-license |
| `osaka-coast:version:lake-kofun` | 河内湖（古墳時代〜古代・概略） | Polygon | 500年 | open-license |
| `osaka-coast:version:lake-yayoi` | 河内湖（弥生時代中期（約2000年前）・概略） | Polygon | -100年 | open-license |
| `osaka-coast:version:sea-edo` | 大阪湾・河内湾の海（中世〜江戸初期（大和川付け替え前）・概略） | Polygon | 1600–1600–1704年 | open-license |
| `osaka-coast:version:sea-jomon` | 大阪湾・河内湾の海（縄文時代前期〜中期（約7000〜5500年前）・概略） | Polygon | -4000年 | open-license |
| `osaka-coast:version:sea-kofun` | 大阪湾・河内湾の海（古墳時代〜古代・概略） | Polygon | 500年 | open-license |
| `osaka-coast:version:sea-yayoi` | 大阪湾・河内湾の海（弥生時代中期（約2000年前）・概略） | Polygon | -100年 | open-license |

### `osaka-coast:version:lake-edo`

- 地物: 河内湖（中世〜江戸初期（大和川付け替え前）・概略） (`osaka-coast:entity:kawachi-lake`)
- geometry: `MultiPolygon`
- 年代: 1600–1600–1704年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「中世〜江戸初期（大和川付け替え前）」を代表年に置いた。 (Evidence: `osaka-coast:evidence:lake-edo-temporal`)
  - `location`: `approximate` — 本文の地名（生駒山麓・八尾・高槻・天満・長柄など）と小さな図から置いた概略で、数km程度ずれうる。 (Evidence: `osaka-coast:evidence:lake-edo-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。砂州・三角州・河道は表さない。 (Evidence: `osaka-coast:evidence:lake-edo-geometry`)
  - `identity`: `well-supported` (Evidence: `osaka-coast:evidence:lake-edo-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka-coast:evidence:lake-edo-geometry` | derived-geometry | geometry, location | 『中世〜江戸初期（大和川付け替え前）』の節 | `osaka-coast:source:shape-notes` |
  - `osaka-coast:evidence:lake-edo-geometry` — 資料の本文の地名と図の相対位置を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `osaka-coast:evidence:lake-edo-temporal` | citation | identity, temporal | 『安治川を開削した河村瑞賢と大和川付け替えを実現させた中甚兵衛』の本文と中世の河川図 | `osaka-coast:source:mlit-yodogawa-history` |
  - `osaka-coast:evidence:lake-edo-temporal` — 各時代の河内湾・河内湖・大阪湾岸の状態を確認する引用メタデータ。本文・図は再現しない。

- Source:

  - `osaka-coast:source:mlit-yodogawa-history`: 国土交通省近畿地方整備局 淀川河川事務所『淀川の成り立ちと人とのかかわり』 — 淀川の成り立ちと人とのかかわり; 作成者: 国土交通省近畿地方整備局 淀川河川事務所; 2020年; 参照日: 2026-10-17 — rights: `restricted` — https://www.kkr.mlit.go.jp/yodogawa/know/history/now_and_then/kakawari.html
  - `osaka-coast:source:shape-notes`: Chronomap『大阪湾奥・河内湖 形状作成メモ』 — 大阪湾奥・河内湖 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-coast-shape-notes.md

### `osaka-coast:version:lake-kofun`

- 地物: 河内湖（古墳時代〜古代・概略） (`osaka-coast:entity:kawachi-lake`)
- geometry: `Polygon`
- 年代: 500年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「古墳時代〜古代」を代表年に置いた。 (Evidence: `osaka-coast:evidence:lake-kofun-temporal`)
  - `location`: `approximate` — 本文の地名（生駒山麓・八尾・高槻・天満・長柄など）と小さな図から置いた概略で、数km程度ずれうる。 (Evidence: `osaka-coast:evidence:lake-kofun-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。砂州・三角州・河道は表さない。 (Evidence: `osaka-coast:evidence:lake-kofun-geometry`)
  - `identity`: `well-supported` (Evidence: `osaka-coast:evidence:lake-kofun-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka-coast:evidence:lake-kofun-geometry` | derived-geometry | geometry, location | 『古墳時代〜古代』の節 | `osaka-coast:source:shape-notes` |
  - `osaka-coast:evidence:lake-kofun-geometry` — 資料の本文の地名と図の相対位置を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `osaka-coast:evidence:lake-kofun-temporal` | citation | identity, temporal | 『海と湖の底にあった大阪平野（古代）』の本文と図（松田順一郎氏原図） | `osaka-coast:source:mlit-yodogawa-history` |
  - `osaka-coast:evidence:lake-kofun-temporal` — 各時代の河内湾・河内湖・大阪湾岸の状態を確認する引用メタデータ。本文・図は再現しない。

- Source:

  - `osaka-coast:source:mlit-yodogawa-history`: 国土交通省近畿地方整備局 淀川河川事務所『淀川の成り立ちと人とのかかわり』 — 淀川の成り立ちと人とのかかわり; 作成者: 国土交通省近畿地方整備局 淀川河川事務所; 2020年; 参照日: 2026-10-17 — rights: `restricted` — https://www.kkr.mlit.go.jp/yodogawa/know/history/now_and_then/kakawari.html
  - `osaka-coast:source:shape-notes`: Chronomap『大阪湾奥・河内湖 形状作成メモ』 — 大阪湾奥・河内湖 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-coast-shape-notes.md

### `osaka-coast:version:lake-yayoi`

- 地物: 河内湖（弥生時代中期（約2000年前）・概略） (`osaka-coast:entity:kawachi-lake`)
- geometry: `Polygon`
- 年代: -100年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「弥生時代中期（約2000年前）」を代表年に置いた。 (Evidence: `osaka-coast:evidence:lake-yayoi-temporal`)
  - `location`: `approximate` — 本文の地名（生駒山麓・八尾・高槻・天満・長柄など）と小さな図から置いた概略で、数km程度ずれうる。 (Evidence: `osaka-coast:evidence:lake-yayoi-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。砂州・三角州・河道は表さない。 (Evidence: `osaka-coast:evidence:lake-yayoi-geometry`)
  - `identity`: `well-supported` (Evidence: `osaka-coast:evidence:lake-yayoi-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka-coast:evidence:bay-vision` | citation | identity, location | 大阪湾・河内湾・河内湖の形成と古代の海岸線に関する歴史説明 | `osaka-coast:source:bay-vision` |
  - `osaka-coast:evidence:bay-vision` — 海水面変化と河内湾・河内湖の地形変化を引用メタデータとして使う。正確な古代海岸線や水深を示す資料ではない。
| `osaka-coast:evidence:lake-yayoi-geometry` | derived-geometry | geometry, location | 『弥生時代中期（約2000年前）』の節 | `osaka-coast:source:shape-notes` |
  - `osaka-coast:evidence:lake-yayoi-geometry` — 資料の本文の地名と図の相対位置を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `osaka-coast:evidence:lake-yayoi-temporal` | citation | identity, temporal | 『海と湖の底にあった大阪平野（古代）』の本文と図（松田順一郎氏原図） | `osaka-coast:source:mlit-yodogawa-history` |
  - `osaka-coast:evidence:lake-yayoi-temporal` — 各時代の河内湾・河内湖・大阪湾岸の状態を確認する引用メタデータ。本文・図は再現しない。
| `osaka-coast:evidence:port-history` | citation | identity, location | 古代大阪の河内湖と、半島のように突き出た上町台地に関する地形説明 | `osaka-coast:source:port-history` |
  - `osaka-coast:evidence:port-history` — 上町台地と水域の相対関係を示す引用メタデータ。座標付きの古代海岸線測量ではない。

- Source:

  - `osaka-coast:source:bay-vision`: 大阪府『大阪広域ベイエリアまちづくりビジョン（素案）』 — 大阪広域ベイエリアまちづくりビジョン（素案）; 作成者: 大阪府; 2021年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.osaka.lg.jp/documents/2275/0520shiryou1-2_2.pdf
  - `osaka-coast:source:mlit-yodogawa-history`: 国土交通省近畿地方整備局 淀川河川事務所『淀川の成り立ちと人とのかかわり』 — 淀川の成り立ちと人とのかかわり; 作成者: 国土交通省近畿地方整備局 淀川河川事務所; 2020年; 参照日: 2026-10-17 — rights: `restricted` — https://www.kkr.mlit.go.jp/yodogawa/know/history/now_and_then/kakawari.html
  - `osaka-coast:source:port-history`: 大阪市『大阪港の景観特性をとらえる要素・歴史』 — 大阪港の景観特性をとらえる要素・歴史; 作成者: 大阪市港湾局; 2018年; 参照日: 2026-10-05 — rights: `restricted` — https://www.city.osaka.lg.jp/port/page/0000432129.html
  - `osaka-coast:source:shape-notes`: Chronomap『大阪湾奥・河内湖 形状作成メモ』 — 大阪湾奥・河内湖 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-coast-shape-notes.md

### `osaka-coast:version:sea-edo`

- 地物: 大阪湾・河内湾の海（中世〜江戸初期（大和川付け替え前）・概略） (`osaka-coast:entity:osaka-bay-head`)
- geometry: `Polygon`
- 年代: 1600–1600–1704年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「中世〜江戸初期（大和川付け替え前）」を代表年に置いた。 (Evidence: `osaka-coast:evidence:sea-edo-temporal`)
  - `location`: `approximate` — 本文の地名（生駒山麓・八尾・高槻・天満・長柄など）と小さな図から置いた概略で、数km程度ずれうる。 (Evidence: `osaka-coast:evidence:sea-edo-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。砂州・三角州・河道は表さない。 (Evidence: `osaka-coast:evidence:sea-edo-geometry`)
  - `identity`: `well-supported` (Evidence: `osaka-coast:evidence:sea-edo-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka-coast:evidence:sea-edo-geometry` | derived-geometry | geometry, location | 『中世〜江戸初期（大和川付け替え前）』の節 | `osaka-coast:source:shape-notes` |
  - `osaka-coast:evidence:sea-edo-geometry` — 資料の本文の地名と図の相対位置を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `osaka-coast:evidence:sea-edo-temporal` | citation | identity, temporal | 『安治川を開削した河村瑞賢と大和川付け替えを実現させた中甚兵衛』の本文と中世の河川図 | `osaka-coast:source:mlit-yodogawa-history` |
  - `osaka-coast:evidence:sea-edo-temporal` — 各時代の河内湾・河内湖・大阪湾岸の状態を確認する引用メタデータ。本文・図は再現しない。

- Source:

  - `osaka-coast:source:mlit-yodogawa-history`: 国土交通省近畿地方整備局 淀川河川事務所『淀川の成り立ちと人とのかかわり』 — 淀川の成り立ちと人とのかかわり; 作成者: 国土交通省近畿地方整備局 淀川河川事務所; 2020年; 参照日: 2026-10-17 — rights: `restricted` — https://www.kkr.mlit.go.jp/yodogawa/know/history/now_and_then/kakawari.html
  - `osaka-coast:source:shape-notes`: Chronomap『大阪湾奥・河内湖 形状作成メモ』 — 大阪湾奥・河内湖 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-coast-shape-notes.md

### `osaka-coast:version:sea-jomon`

- 地物: 大阪湾・河内湾の海（縄文時代前期〜中期（約7000〜5500年前）・概略） (`osaka-coast:entity:osaka-bay-head`)
- geometry: `Polygon`
- 年代: -4000年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「縄文時代前期〜中期（約7000〜5500年前）」を代表年に置いた。 (Evidence: `osaka-coast:evidence:sea-jomon-temporal`)
  - `location`: `approximate` — 本文の地名（生駒山麓・八尾・高槻・天満・長柄など）と小さな図から置いた概略で、数km程度ずれうる。 (Evidence: `osaka-coast:evidence:sea-jomon-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。砂州・三角州・河道は表さない。 (Evidence: `osaka-coast:evidence:sea-jomon-geometry`)
  - `identity`: `well-supported` (Evidence: `osaka-coast:evidence:sea-jomon-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka-coast:evidence:bay-vision` | citation | identity, location | 大阪湾・河内湾・河内湖の形成と古代の海岸線に関する歴史説明 | `osaka-coast:source:bay-vision` |
  - `osaka-coast:evidence:bay-vision` — 海水面変化と河内湾・河内湖の地形変化を引用メタデータとして使う。正確な古代海岸線や水深を示す資料ではない。
| `osaka-coast:evidence:port-history` | citation | identity, location | 古代大阪の河内湖と、半島のように突き出た上町台地に関する地形説明 | `osaka-coast:source:port-history` |
  - `osaka-coast:evidence:port-history` — 上町台地と水域の相対関係を示す引用メタデータ。座標付きの古代海岸線測量ではない。
| `osaka-coast:evidence:sea-jomon-geometry` | derived-geometry | geometry, location | 『縄文時代前期〜中期（約7000〜5500年前）』の節 | `osaka-coast:source:shape-notes` |
  - `osaka-coast:evidence:sea-jomon-geometry` — 資料の本文の地名と図の相対位置を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `osaka-coast:evidence:sea-jomon-temporal` | citation | identity, temporal | 『海と湖の底にあった大阪平野（古代）』の本文と図（松田順一郎氏原図） | `osaka-coast:source:mlit-yodogawa-history` |
  - `osaka-coast:evidence:sea-jomon-temporal` — 各時代の河内湾・河内湖・大阪湾岸の状態を確認する引用メタデータ。本文・図は再現しない。

- Source:

  - `osaka-coast:source:bay-vision`: 大阪府『大阪広域ベイエリアまちづくりビジョン（素案）』 — 大阪広域ベイエリアまちづくりビジョン（素案）; 作成者: 大阪府; 2021年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.osaka.lg.jp/documents/2275/0520shiryou1-2_2.pdf
  - `osaka-coast:source:mlit-yodogawa-history`: 国土交通省近畿地方整備局 淀川河川事務所『淀川の成り立ちと人とのかかわり』 — 淀川の成り立ちと人とのかかわり; 作成者: 国土交通省近畿地方整備局 淀川河川事務所; 2020年; 参照日: 2026-10-17 — rights: `restricted` — https://www.kkr.mlit.go.jp/yodogawa/know/history/now_and_then/kakawari.html
  - `osaka-coast:source:port-history`: 大阪市『大阪港の景観特性をとらえる要素・歴史』 — 大阪港の景観特性をとらえる要素・歴史; 作成者: 大阪市港湾局; 2018年; 参照日: 2026-10-05 — rights: `restricted` — https://www.city.osaka.lg.jp/port/page/0000432129.html
  - `osaka-coast:source:shape-notes`: Chronomap『大阪湾奥・河内湖 形状作成メモ』 — 大阪湾奥・河内湖 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-coast-shape-notes.md

### `osaka-coast:version:sea-kofun`

- 地物: 大阪湾・河内湾の海（古墳時代〜古代・概略） (`osaka-coast:entity:osaka-bay-head`)
- geometry: `Polygon`
- 年代: 500年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「古墳時代〜古代」を代表年に置いた。 (Evidence: `osaka-coast:evidence:sea-kofun-temporal`)
  - `location`: `approximate` — 本文の地名（生駒山麓・八尾・高槻・天満・長柄など）と小さな図から置いた概略で、数km程度ずれうる。 (Evidence: `osaka-coast:evidence:sea-kofun-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。砂州・三角州・河道は表さない。 (Evidence: `osaka-coast:evidence:sea-kofun-geometry`)
  - `identity`: `well-supported` (Evidence: `osaka-coast:evidence:sea-kofun-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka-coast:evidence:sea-kofun-geometry` | derived-geometry | geometry, location | 『古墳時代〜古代』の節 | `osaka-coast:source:shape-notes` |
  - `osaka-coast:evidence:sea-kofun-geometry` — 資料の本文の地名と図の相対位置を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `osaka-coast:evidence:sea-kofun-temporal` | citation | identity, temporal | 『海と湖の底にあった大阪平野（古代）』の本文と図（松田順一郎氏原図） | `osaka-coast:source:mlit-yodogawa-history` |
  - `osaka-coast:evidence:sea-kofun-temporal` — 各時代の河内湾・河内湖・大阪湾岸の状態を確認する引用メタデータ。本文・図は再現しない。

- Source:

  - `osaka-coast:source:mlit-yodogawa-history`: 国土交通省近畿地方整備局 淀川河川事務所『淀川の成り立ちと人とのかかわり』 — 淀川の成り立ちと人とのかかわり; 作成者: 国土交通省近畿地方整備局 淀川河川事務所; 2020年; 参照日: 2026-10-17 — rights: `restricted` — https://www.kkr.mlit.go.jp/yodogawa/know/history/now_and_then/kakawari.html
  - `osaka-coast:source:shape-notes`: Chronomap『大阪湾奥・河内湖 形状作成メモ』 — 大阪湾奥・河内湖 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-coast-shape-notes.md

### `osaka-coast:version:sea-yayoi`

- 地物: 大阪湾・河内湾の海（弥生時代中期（約2000年前）・概略） (`osaka-coast:entity:osaka-bay-head`)
- geometry: `Polygon`
- 年代: -100年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「弥生時代中期（約2000年前）」を代表年に置いた。 (Evidence: `osaka-coast:evidence:sea-yayoi-temporal`)
  - `location`: `approximate` — 本文の地名（生駒山麓・八尾・高槻・天満・長柄など）と小さな図から置いた概略で、数km程度ずれうる。 (Evidence: `osaka-coast:evidence:sea-yayoi-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。砂州・三角州・河道は表さない。 (Evidence: `osaka-coast:evidence:sea-yayoi-geometry`)
  - `identity`: `well-supported` (Evidence: `osaka-coast:evidence:sea-yayoi-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka-coast:evidence:bay-vision` | citation | identity, location | 大阪湾・河内湾・河内湖の形成と古代の海岸線に関する歴史説明 | `osaka-coast:source:bay-vision` |
  - `osaka-coast:evidence:bay-vision` — 海水面変化と河内湾・河内湖の地形変化を引用メタデータとして使う。正確な古代海岸線や水深を示す資料ではない。
| `osaka-coast:evidence:port-history` | citation | identity, location | 古代大阪の河内湖と、半島のように突き出た上町台地に関する地形説明 | `osaka-coast:source:port-history` |
  - `osaka-coast:evidence:port-history` — 上町台地と水域の相対関係を示す引用メタデータ。座標付きの古代海岸線測量ではない。
| `osaka-coast:evidence:sea-yayoi-geometry` | derived-geometry | geometry, location | 『弥生時代中期（約2000年前）』の節 | `osaka-coast:source:shape-notes` |
  - `osaka-coast:evidence:sea-yayoi-geometry` — 資料の本文の地名と図の相対位置を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `osaka-coast:evidence:sea-yayoi-temporal` | citation | identity, temporal | 『海と湖の底にあった大阪平野（古代）』の本文と図（松田順一郎氏原図） | `osaka-coast:source:mlit-yodogawa-history` |
  - `osaka-coast:evidence:sea-yayoi-temporal` — 各時代の河内湾・河内湖・大阪湾岸の状態を確認する引用メタデータ。本文・図は再現しない。

- Source:

  - `osaka-coast:source:bay-vision`: 大阪府『大阪広域ベイエリアまちづくりビジョン（素案）』 — 大阪広域ベイエリアまちづくりビジョン（素案）; 作成者: 大阪府; 2021年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.osaka.lg.jp/documents/2275/0520shiryou1-2_2.pdf
  - `osaka-coast:source:mlit-yodogawa-history`: 国土交通省近畿地方整備局 淀川河川事務所『淀川の成り立ちと人とのかかわり』 — 淀川の成り立ちと人とのかかわり; 作成者: 国土交通省近畿地方整備局 淀川河川事務所; 2020年; 参照日: 2026-10-17 — rights: `restricted` — https://www.kkr.mlit.go.jp/yodogawa/know/history/now_and_then/kakawari.html
  - `osaka-coast:source:port-history`: 大阪市『大阪港の景観特性をとらえる要素・歴史』 — 大阪港の景観特性をとらえる要素・歴史; 作成者: 大阪市港湾局; 2018年; 参照日: 2026-10-05 — rights: `restricted` — https://www.city.osaka.lg.jp/port/page/0000432129.html
  - `osaka-coast:source:shape-notes`: Chronomap『大阪湾奥・河内湖 形状作成メモ』 — 大阪湾奥・河内湖 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-coast-shape-notes.md

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `osaka-coast:source:bay-vision` | 大阪府『大阪広域ベイエリアまちづくりビジョン（素案）』 | 大阪広域ベイエリアまちづくりビジョン（素案）; 作成者: 大阪府; 2021年; 参照日: 2026-10-04; https://www.pref.osaka.lg.jp/documents/2275/0520shiryou1-2_2.pdf | restricted | 引用メタデータのみ。PDF本文・図版・地図画像は再現しない。 |
| `osaka-coast:source:mlit-yodogawa-history` | 国土交通省近畿地方整備局 淀川河川事務所『淀川の成り立ちと人とのかかわり』 | 淀川の成り立ちと人とのかかわり; 作成者: 国土交通省近畿地方整備局 淀川河川事務所; 2020年; 参照日: 2026-10-17; https://www.kkr.mlit.go.jp/yodogawa/know/history/now_and_then/kakawari.html | restricted | 引用メタデータのみ。図は第三者の原図を含むため、本文・図は再現しない。 |
| `osaka-coast:source:port-history` | 大阪市『大阪港の景観特性をとらえる要素・歴史』 | 大阪港の景観特性をとらえる要素・歴史; 作成者: 大阪市港湾局; 2018年; 参照日: 2026-10-05; https://www.city.osaka.lg.jp/port/page/0000432129.html | restricted | 引用メタデータのみ。ページ本文・写真・図版は再現しない。 |
| `osaka-coast:source:shape-notes` | Chronomap『大阪湾奥・河内湖 形状作成メモ』 | 大阪湾奥・河内湖 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17; https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-coast-shape-notes.md | open-license; 表示: Chronomap contributors | Chronomapのオリジナルな概略復元メモ。外部資料の権利条件は個別Sourceに従う。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
