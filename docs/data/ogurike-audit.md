# データ監査: 巨椋池パイロットデータ

- データセットID: `ogurike:dataset:pilot-2026`
- 既定言語: `ja`
- 公開FeatureVersion: 4
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `ogurike:version:reclamation-monument-1942` | 巨椋池干拓之碑（1942年） | Point | 1942年以降 | open-license |
| `ogurike:version:ujigawa-1590` | 宇治川（1590年・工事前） | LineString | 1590年 | open-license |
| `ogurike:version:ujigawa-1596` | 宇治川（1596年・工事後） | LineString | 1596年 | open-license |
| `ogurike:version:waterbody-1910` | 巨椋池（1910年・概略） | Polygon | 1910年 | open-license |

### `ogurike:version:reclamation-monument-1942`

- 地物: 巨椋池干拓之碑（1942年） (`ogurike:entity:reclamation-monument`)
- geometry: `Point`
- 年代: 1942年以降
- 権利: `open-license` — 京都市Sourceは引用メタデータのみ。代表点はChronomapの概略復元です。
- 不確実性:
  - `temporal`: `well-supported` (Evidence: `ogurike:evidence:monument-citation`)
  - `location`: `approximate` — 所在地をもとに小数第3位へ丸めた代表位置です。 (Evidence: `ogurike:evidence:monument-citation`, `ogurike:evidence:monument-geometry`)
  - `geometry`: `approximate` — 碑の形状ではなく所在地の代表点だけを表示しています。 (Evidence: `ogurike:evidence:monument-geometry`)
  - `identity`: `well-supported` (Evidence: `ogurike:evidence:monument-citation`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:monument-citation` | citation | identity, location, temporal | 『所在地』『位置座標』『建立年』欄 | `ogurike:source:kyoto-city-monument` |
  - `ogurike:evidence:monument-citation` — 碑の同一性、所在地、建立年1942年を確認する引用メタデータ。ページ本文・画像・碑文全文は再現しない。
| `ogurike:evidence:monument-geometry` | derived-geometry | geometry, location | 『作成方法』の1942年Pointに関する記録 | `ogurike:source:shape-notes` |
  - `ogurike:evidence:monument-geometry` — 所在地をもとに小数第3位へ丸めた代表点をChronomapが作成した。原座標や画像を転載していない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `ogurike:source:kyoto-city-monument`: 京都市『巨椋池干拓碑』GA015 — rights: `restricted` — https://www2.city.kyoto.lg.jp/html/somu/rekishi/fm/ishibumi/html/ga015.html
  - `ogurike:source:shape-notes`: Chronomap『巨椋池パイロット形状作成メモ』 — rights: `open-license` — https://github.com/ywatase/chronomap/blob/main/docs/data/ogurike-shape-notes.md

### `ogurike:version:ujigawa-1590`

- 地物: 宇治川（1590年・工事前） (`ogurike:entity:ujigawa`)
- geometry: `LineString`
- 年代: 1590年
- 権利: `open-license` — PDL1.0の出典表示と編集・加工表示を含みます。
- 不確実性:
  - `temporal`: `well-supported` (Evidence: `ogurike:evidence:ujigawa-1590-temporal`)
  - `location`: `approximate` — 資料図の相対位置を概略線にしたものです。 (Evidence: `ogurike:evidence:ujigawa-1590-temporal`)
  - `geometry`: `approximate` — 少数の折れ点による概略復元であり、精密な河道中心線ではありません。 (Evidence: `ogurike:evidence:ujigawa-1590-geometry`)
  - `identity`: `well-supported` (Evidence: `ogurike:evidence:ujigawa-1590-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:ujigawa-1590-geometry` | derived-geometry | geometry | PDF p.2-22 図2.2-1①『秀吉による河川工事前（1590年）』 | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:ujigawa-1590-geometry` — 図の相対的な流路関係を少数の折れ点へ手動加工した概略線であり、正確な河道中心線ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:ujigawa-1590-temporal` | citation | identity, location, temporal | PDF p.2-21末尾–p.2-22 図2.2-1① | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:ujigawa-1590-temporal` — 資料図が河川工事前の1590年スナップショットとして示すことを確認する。

- Source:

  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — rights: `open-license` — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

### `ogurike:version:ujigawa-1596`

- 地物: 宇治川（1596年・工事後） (`ogurike:entity:ujigawa`)
- geometry: `LineString`
- 年代: 1596年
- 権利: `open-license` — PDL1.0の出典表示と編集・加工表示を含みます。
- 不確実性:
  - `temporal`: `well-supported` (Evidence: `ogurike:evidence:ujigawa-1596-temporal`)
  - `location`: `approximate` — 資料図の相対位置を概略線にしたものです。 (Evidence: `ogurike:evidence:ujigawa-1596-temporal`)
  - `geometry`: `approximate` — 少数の折れ点による概略復元であり、太閤堤の精密線形ではありません。 (Evidence: `ogurike:evidence:ujigawa-1596-geometry`)
  - `identity`: `well-supported` (Evidence: `ogurike:evidence:ujigawa-1596-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:ujigawa-1596-geometry` | derived-geometry | geometry | PDF p.2-22 図2.2-1②『秀吉による河川工事後（1596年）』 | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:ujigawa-1596-geometry` — 図の相対的な流路関係を少数の折れ点へ手動加工した概略線であり、太閤堤の精密線形ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:ujigawa-1596-temporal` | citation | identity, location, temporal | PDF p.2-21末尾–p.2-22 図2.2-1② | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:ujigawa-1596-temporal` — 資料図が河川工事後の1596年スナップショットとして示すことを確認する。

- Source:

  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — rights: `open-license` — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

### `ogurike:version:waterbody-1910`

- 地物: 巨椋池（1910年・概略） (`ogurike:entity:waterbody`)
- geometry: `Polygon`
- 年代: 1910年
- 権利: `open-license` — 各Sourceの出典表示・引用条件・編集加工表示を適用します。
- 不確実性:
  - `temporal`: `well-supported` (Evidence: `ogurike:evidence:waterbody-temporal`)
  - `location`: `approximate` — 京都府RDBの地域情報と資料図の相対位置をもとにした概略です。 (Evidence: `ogurike:evidence:waterbody-region`)
  - `geometry`: `approximate` — 資料図を少数頂点へ手動加工した概略面であり、精密な境界ではありません。 (Evidence: `ogurike:evidence:waterbody-geometry`)
  - `identity`: `well-supported` (Evidence: `ogurike:evidence:waterbody-region`, `ogurike:evidence:waterbody-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:waterbody-geometry` | derived-geometry | geometry | PDF p.2-22 図2.2-1④『淀川改良工事完成時（1910年）』 | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-geometry` — 図の水域の相対的な位置・向きを少数頂点へ手動加工した概略面であり、精密な境界や面積逆算ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-region` | citation | identity, location, temporal | 『概要』および『5万分の1 京都東南部・京都西南部（大正6年発行）』 | `ogurike:source:kyoto-prefecture-rdb` |
  - `ogurike:evidence:waterbody-region` — 巨椋池の地域、面積、干拓時期、1917年発行図の所在を補強する引用メタデータ。掲載画像は再現しない。
| `ogurike:evidence:waterbody-temporal` | citation | identity, temporal | PDF p.2-22 図2.2-1④ | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-temporal` — 資料図が淀川改良工事完成時の1910年スナップショットとして示すことを確認する。

- Source:

  - `ogurike:source:kyoto-prefecture-rdb`: 京都府レッドデータブック2015『巨椋池』 — rights: `restricted` — https://www.pref.kyoto.jp/kankyo/rdb/geo/db/sur0005.html
  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — rights: `open-license` — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

## Source一覧

| Source | citation | rights | terms |
|---|---|---|---|
| `ogurike:source:kyoto-city-monument` | 京都市『巨椋池干拓碑』GA015 | restricted | 引用メタデータのみ。ページ本文、画像、碑文全文は再現しない。 |
| `ogurike:source:kyoto-prefecture-rdb` | 京都府レッドデータブック2015『巨椋池』 | restricted | 引用メタデータのみ。掲載された本文・地図画像・写真は再現しない。 |
| `ogurike:source:mlit-ogurike-transition` | 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 | open-license | PDL1.0。出典を記載し、編集・加工したことを別途表示する。 |
| `ogurike:source:shape-notes` | Chronomap『巨椋池パイロット形状作成メモ』 | open-license | Chronomapのオリジナルな概略復元メモ。外部資料の権利条件は個別Sourceに従う。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
