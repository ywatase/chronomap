# データ監査: 名古屋・伊勢湾奥の海岸線（縄文〜江戸初期）

- データセットID: `nagoya-coast:dataset:pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 4
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `nagoya-coast:version:edo` | 伊勢湾奥の海（江戸時代初期（新田開発の前）・概略） | Polygon | 1600–1600–1700年 | open-license |
| `nagoya-coast:version:jomon` | 伊勢湾奥の海（約6000年前（縄文時代前期）・概略） | Polygon | -4000年 | open-license |
| `nagoya-coast:version:kofun` | 伊勢湾奥の海（古墳時代後期・概略） | Polygon | 550年 | open-license |
| `nagoya-coast:version:yayoi` | 伊勢湾奥の海（弥生時代・概略） | Polygon | -100年 | open-license |

### `nagoya-coast:version:edo`

- 地物: 伊勢湾奥の海（江戸時代初期（新田開発の前）・概略） (`nagoya-coast:entity:ise-bay-head`)
- geometry: `Polygon`
- 年代: 1600–1600–1700年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「江戸時代初期（新田開発の前）」の海岸線を代表年に置いた。 (Evidence: `nagoya-coast:evidence:edo-temporal`)
  - `location`: `approximate` — 小縮尺の推定図と本文の地名から置いた概略で、数km程度ずれうる。 (Evidence: `nagoya-coast:evidence:edo-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。入江・干潟・河口の形は表さない。南端は伊勢湾内で切っている。 (Evidence: `nagoya-coast:evidence:edo-geometry`)
  - `identity`: `well-supported` (Evidence: `nagoya-coast:evidence:edo-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `nagoya-coast:evidence:edo-geometry` | derived-geometry | geometry, location | 『江戸時代初期（新田開発の前）』の節 | `nagoya-coast:source:shape-notes` |
  - `nagoya-coast:evidence:edo-geometry` — 資料の推定海岸線と本文の地名を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `nagoya-coast:evidence:edo-temporal` | citation | identity, temporal | 「江戸時代初期の海岸線は東海道（現在の国道1号線）付近」の記述 | `nagoya-coast:source:fujimae-history` |
  - `nagoya-coast:evidence:edo-temporal` — 江戸初期と後期（国道23号付近）の海岸線の位置を確認する引用メタデータ。本文は再現しない。

- Source:

  - `nagoya-coast:source:fujimae-history`: 環境省中部地方環境事務所『藤前干潟の歴史』 — 藤前干潟の歴史; 作成者: 環境省中部地方環境事務所; 2010年; 参照日: 2026-10-17 — rights: `restricted` — https://chubu.env.go.jp/wildlife/mat/m_1_1_11_1.html
  - `nagoya-coast:source:shape-notes`: Chronomap『名古屋・伊勢湾奥の海岸線 形状作成メモ』 — 名古屋・伊勢湾奥の海岸線 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/nagoya-coast-shape-notes.md

### `nagoya-coast:version:jomon`

- 地物: 伊勢湾奥の海（約6000年前（縄文時代前期）・概略） (`nagoya-coast:entity:ise-bay-head`)
- geometry: `Polygon`
- 年代: -4000年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「約6000年前（縄文時代前期）」の海岸線を代表年に置いた。 (Evidence: `nagoya-coast:evidence:jomon-temporal`)
  - `location`: `approximate` — 小縮尺の推定図と本文の地名から置いた概略で、数km程度ずれうる。 (Evidence: `nagoya-coast:evidence:jomon-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。入江・干潟・河口の形は表さない。南端は伊勢湾内で切っている。 (Evidence: `nagoya-coast:evidence:jomon-geometry`)
  - `identity`: `well-supported` (Evidence: `nagoya-coast:evidence:jomon-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `nagoya-coast:evidence:jomon-geometry` | derived-geometry | geometry, location | 『約6000年前（縄文時代前期）』の節 | `nagoya-coast:source:shape-notes` |
  - `nagoya-coast:evidence:jomon-geometry` — 資料の推定海岸線と本文の地名を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `nagoya-coast:evidence:jomon-temporal` | citation | identity, temporal | p.3 図2『濃尾平野の各時代の推定海岸線』（出典: 上田篤・中村良夫・樋口忠彦『日本人はどのように国土をつくったか』） | `nagoya-coast:source:env-chubu-history` |
  - `nagoya-coast:evidence:jomon-temporal` — 縄文前期・弥生・古墳後期の推定海岸線と近世以降の干拓地を示す図の引用メタデータ。図は再現しない。
| `nagoya-coast:evidence:nagoya-jomon-text` | citation | location | p.7『地形』 | `nagoya-coast:source:nagoya-city-history` |
  - `nagoya-coast:evidence:nagoya-jomon-text` — 縄文前期の海岸線が名古屋台地に沿ってゾウの鼻のような形だったことの確認。

- Source:

  - `nagoya-coast:source:env-chubu-history`: 環境省中部地方環境事務所『伊勢・三河湾流域における土地の履歴』 — 伊勢・三河湾流域における土地の履歴; 作成者: 環境省中部地方環境事務所; 2010年; 参照日: 2026-10-17 — rights: `restricted` — https://chubu.env.go.jp/to_2010/data/0518b_4.pdf
  - `nagoya-coast:source:nagoya-city-history`: 名古屋市『第2章 名古屋のまちの成り立ち』 — 名古屋のまちの成り立ち; 作成者: 名古屋市; 2015年; 参照日: 2026-10-17 — rights: `restricted` — https://www.city.nagoya.jp/_res/projects/default_project/_page_/001/017/243/02honpen2.pdf
  - `nagoya-coast:source:shape-notes`: Chronomap『名古屋・伊勢湾奥の海岸線 形状作成メモ』 — 名古屋・伊勢湾奥の海岸線 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/nagoya-coast-shape-notes.md

### `nagoya-coast:version:kofun`

- 地物: 伊勢湾奥の海（古墳時代後期・概略） (`nagoya-coast:entity:ise-bay-head`)
- geometry: `Polygon`
- 年代: 550年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「古墳時代後期」の海岸線を代表年に置いた。 (Evidence: `nagoya-coast:evidence:kofun-temporal`)
  - `location`: `approximate` — 小縮尺の推定図と本文の地名から置いた概略で、数km程度ずれうる。 (Evidence: `nagoya-coast:evidence:kofun-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。入江・干潟・河口の形は表さない。南端は伊勢湾内で切っている。 (Evidence: `nagoya-coast:evidence:kofun-geometry`)
  - `identity`: `well-supported` (Evidence: `nagoya-coast:evidence:kofun-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `nagoya-coast:evidence:kofun-geometry` | derived-geometry | geometry, location | 『古墳時代後期』の節 | `nagoya-coast:source:shape-notes` |
  - `nagoya-coast:evidence:kofun-geometry` — 資料の推定海岸線と本文の地名を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `nagoya-coast:evidence:kofun-temporal` | citation | identity, temporal | p.3 図2『濃尾平野の各時代の推定海岸線』（出典: 上田篤・中村良夫・樋口忠彦『日本人はどのように国土をつくったか』） | `nagoya-coast:source:env-chubu-history` |
  - `nagoya-coast:evidence:kofun-temporal` — 縄文前期・弥生・古墳後期の推定海岸線と近世以降の干拓地を示す図の引用メタデータ。図は再現しない。

- Source:

  - `nagoya-coast:source:env-chubu-history`: 環境省中部地方環境事務所『伊勢・三河湾流域における土地の履歴』 — 伊勢・三河湾流域における土地の履歴; 作成者: 環境省中部地方環境事務所; 2010年; 参照日: 2026-10-17 — rights: `restricted` — https://chubu.env.go.jp/to_2010/data/0518b_4.pdf
  - `nagoya-coast:source:shape-notes`: Chronomap『名古屋・伊勢湾奥の海岸線 形状作成メモ』 — 名古屋・伊勢湾奥の海岸線 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/nagoya-coast-shape-notes.md

### `nagoya-coast:version:yayoi`

- 地物: 伊勢湾奥の海（弥生時代・概略） (`nagoya-coast:entity:ise-bay-head`)
- geometry: `Polygon`
- 年代: -100年
- 権利: `open-license` — 表示: Chronomap contributors（概略復元） — 形はChronomapの概略復元。出典資料の図・本文は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 資料が示す「弥生時代」の海岸線を代表年に置いた。 (Evidence: `nagoya-coast:evidence:yayoi-temporal`)
  - `location`: `approximate` — 小縮尺の推定図と本文の地名から置いた概略で、数km程度ずれうる。 (Evidence: `nagoya-coast:evidence:yayoi-geometry`)
  - `geometry`: `approximate` — 少ない頂点の概略面。入江・干潟・河口の形は表さない。南端は伊勢湾内で切っている。 (Evidence: `nagoya-coast:evidence:yayoi-geometry`)
  - `identity`: `well-supported` (Evidence: `nagoya-coast:evidence:yayoi-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `nagoya-coast:evidence:yayoi-geometry` | derived-geometry | geometry, location | 『弥生時代』の節 | `nagoya-coast:source:shape-notes` |
  - `nagoya-coast:evidence:yayoi-geometry` — 資料の推定海岸線と本文の地名を、地理院の住所検索で得た基準点に当てはめて手作業で置いた概略面。図の画像はトレース・転載していない。 (publicationBasis: `original-reconstruction`)
| `nagoya-coast:evidence:yayoi-temporal` | citation | identity, temporal | p.3 図2『濃尾平野の各時代の推定海岸線』（出典: 上田篤・中村良夫・樋口忠彦『日本人はどのように国土をつくったか』） | `nagoya-coast:source:env-chubu-history` |
  - `nagoya-coast:evidence:yayoi-temporal` — 縄文前期・弥生・古墳後期の推定海岸線と近世以降の干拓地を示す図の引用メタデータ。図は再現しない。

- Source:

  - `nagoya-coast:source:env-chubu-history`: 環境省中部地方環境事務所『伊勢・三河湾流域における土地の履歴』 — 伊勢・三河湾流域における土地の履歴; 作成者: 環境省中部地方環境事務所; 2010年; 参照日: 2026-10-17 — rights: `restricted` — https://chubu.env.go.jp/to_2010/data/0518b_4.pdf
  - `nagoya-coast:source:shape-notes`: Chronomap『名古屋・伊勢湾奥の海岸線 形状作成メモ』 — 名古屋・伊勢湾奥の海岸線 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/nagoya-coast-shape-notes.md

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `nagoya-coast:source:env-chubu-history` | 環境省中部地方環境事務所『伊勢・三河湾流域における土地の履歴』 | 伊勢・三河湾流域における土地の履歴; 作成者: 環境省中部地方環境事務所; 2010年; 参照日: 2026-10-17; https://chubu.env.go.jp/to_2010/data/0518b_4.pdf | restricted | 引用メタデータのみ。掲載図は書籍からの転載で、図・本文は再現しない。 |
| `nagoya-coast:source:fujimae-history` | 環境省中部地方環境事務所『藤前干潟の歴史』 | 藤前干潟の歴史; 作成者: 環境省中部地方環境事務所; 2010年; 参照日: 2026-10-17; https://chubu.env.go.jp/wildlife/mat/m_1_1_11_1.html | restricted | 引用メタデータのみ。本文・図は再現しない。 |
| `nagoya-coast:source:nagoya-city-history` | 名古屋市『第2章 名古屋のまちの成り立ち』 | 名古屋のまちの成り立ち; 作成者: 名古屋市; 2015年; 参照日: 2026-10-17; https://www.city.nagoya.jp/_res/projects/default_project/_page_/001/017/243/02honpen2.pdf | restricted | 引用メタデータのみ。本文・図は再現しない。 |
| `nagoya-coast:source:shape-notes` | Chronomap『名古屋・伊勢湾奥の海岸線 形状作成メモ』 | 名古屋・伊勢湾奥の海岸線 形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-17; https://github.com/ywatase/chronomap/blob/main/docs/data/nagoya-coast-shape-notes.md | open-license; 表示: Chronomap contributors | Chronomapのオリジナルな概略復元メモ。外部資料の権利条件は個別Sourceに従う。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
