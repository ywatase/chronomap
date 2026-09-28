# データ監査: 利根川東遷パイロットデータ

- データセットID: `tonegawa:dataset:eastward-pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 3
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `tonegawa:version:kawamata-closure-1594` | 会の川締切地点（1594年・代表点） | Point | 1594年以降 | open-license |
| `tonegawa:version:river-1590` | 利根川（1590年・東遷初期） | LineString | 1590年 | open-license |
| `tonegawa:version:river-1654` | 利根川（1654年・東遷後） | LineString | 1654年 | open-license |

### `tonegawa:version:kawamata-closure-1594`

- 地物: 会の川締切地点（1594年・代表点） (`tonegawa:entity:kawamata-closure`)
- geometry: `Point`
- 年代: 1594年以降
- 権利: `open-license` — 表示: Chronomap（代表点加工）、埼玉県（引用） — 外部資料の本文・図版は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 1594年の事業として資料に示されます。 (Evidence: `tonegawa:evidence:closure-citation`)
  - `location`: `approximate` — 小数第3位に丸めた代表位置です。 (Evidence: `tonegawa:evidence:closure-citation`, `tonegawa:evidence:closure-geometry`)
  - `geometry`: `approximate` — 地点を示す代表点であり、施設形状ではありません。 (Evidence: `tonegawa:evidence:closure-geometry`)
  - `identity`: `well-supported` — 会の川締切として資料に示されます。 (Evidence: `tonegawa:evidence:closure-citation`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `tonegawa:evidence:closure-citation` | citation | identity, location, temporal | 会の川締切に関する文化財解説 | `tonegawa:source:saitama-cultural-pdf` |
  - `tonegawa:evidence:closure-citation` — 会の川締切と1594年の関係を確認する引用メタデータ。本文・図版は再現しない。
| `tonegawa:evidence:closure-geometry` | derived-geometry | geometry, location | 1594年Point | `tonegawa:source:shape-notes` |
  - `tonegawa:evidence:closure-geometry` — 現在地図上の代表位置を小数第3位に丸めた点であり、施設の精密位置ではない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `tonegawa:source:saitama-cultural-pdf`: 埼玉県『埼玉県の文化財』 — 埼玉県の文化財; 作成者: 埼玉県; 2025年; 参照日: 2026-09-18 — rights: `restricted` — https://www.pref.saitama.lg.jp/documents/27121/saitamaken_bunkazai_r7.pdf
  - `tonegawa:source:shape-notes`: Chronomap『利根川東遷パイロット形状作成メモ』 — 利根川東遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-18 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/tonegawa-shape-notes.md

### `tonegawa:version:river-1590`

- 地物: 利根川（1590年・東遷初期） (`tonegawa:entity:river`)
- geometry: `LineString`
- 年代: 1590年
- 権利: `open-license` — 表示: Chronomap（概略加工）、国土交通省（引用） — 外部資料の本文・図版は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 東遷開始年として資料に示されます。 (Evidence: `tonegawa:evidence:river-1590-citation`)
  - `location`: `approximate` — 現在地図と資料の相対関係を対応させた概略です。 (Evidence: `tonegawa:evidence:river-1590-citation`, `tonegawa:evidence:river-1590-geometry`)
  - `geometry`: `approximate` — 少数の折れ点による概略復元です。 (Evidence: `tonegawa:evidence:river-1590-geometry`)
  - `identity`: `well-supported` — 利根川水系としての同一性を示します。 (Evidence: `tonegawa:evidence:river-1590-citation`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `tonegawa:evidence:river-1590-citation` | citation | identity, location, temporal | 利根川東遷の解説 | `tonegawa:source:mlit-river-guide` |
  - `tonegawa:evidence:river-1590-citation` — 東遷事業の対象となる利根川と1590年の開始時期を確認する引用メタデータ。本文・図版は再現しない。
| `tonegawa:evidence:river-1590-geometry` | derived-geometry | geometry, location | 1590年LineString | `tonegawa:source:shape-notes` |
  - `tonegawa:evidence:river-1590-geometry` — 資料の相対関係を少数の折れ点にした概略線であり、精密な河道中心線ではない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `tonegawa:source:mlit-river-guide`: 国土交通省『利根川』日本の川 — 利根川（日本の川）; 作成者: 国土交通省; 2006年; 参照日: 2026-09-18 — rights: `restricted` — https://www.mlit.go.jp/river/toukei_chousa/kasen/jiten/nihon_kawa/0316_tonegawa/0316_tonegawa_01.html
  - `tonegawa:source:shape-notes`: Chronomap『利根川東遷パイロット形状作成メモ』 — 利根川東遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-18 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/tonegawa-shape-notes.md

### `tonegawa:version:river-1654`

- 地物: 利根川（1654年・東遷後） (`tonegawa:entity:river`)
- geometry: `LineString`
- 年代: 1654年
- 権利: `open-license` — 表示: Chronomap（概略加工）、国土交通省（引用） — 外部資料の本文・図版は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 資料が示す1654年の段階を採用します。 (Evidence: `tonegawa:evidence:river-1654-citation`)
  - `location`: `approximate` — 現在地図と資料の相対関係を対応させた概略です。 (Evidence: `tonegawa:evidence:river-1654-citation`, `tonegawa:evidence:river-1654-geometry`)
  - `geometry`: `approximate` — 少数の折れ点による概略復元です。 (Evidence: `tonegawa:evidence:river-1654-geometry`)
  - `identity`: `well-supported` — 利根川水系としての同一性を示します。 (Evidence: `tonegawa:evidence:river-1654-citation`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `tonegawa:evidence:river-1654-citation` | citation | identity, location, temporal | 利根川東遷に関する概要図・解説 | `tonegawa:source:mlit-plan-pdf` |
  - `tonegawa:evidence:river-1654-citation` — 1654年までの東遷後の利根川水系の説明を確認する引用メタデータ。PDF本文・図版は再現しない。
| `tonegawa:evidence:river-1654-geometry` | derived-geometry | geometry, location | 1654年LineString | `tonegawa:source:shape-notes` |
  - `tonegawa:evidence:river-1654-geometry` — 資料の相対関係を少数の折れ点にした概略線であり、精密な河道中心線ではない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `tonegawa:source:mlit-plan-pdf`: 国土交通省『利根川水系河川整備基本方針』 — 利根川水系河川整備基本方針（概要）; 作成者: 国土交通省; 2006年; 参照日: 2026-09-18 — rights: `restricted` — https://www.mlit.go.jp/river/basic_info/jigyo_keikaku/gaiyou/seibi/pdf/tonegawa/12_H18_gaiyou_tonegawa.pdf
  - `tonegawa:source:shape-notes`: Chronomap『利根川東遷パイロット形状作成メモ』 — 利根川東遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-18 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/tonegawa-shape-notes.md

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `tonegawa:source:mlit-plan-pdf` | 国土交通省『利根川水系河川整備基本方針』 | 利根川水系河川整備基本方針（概要）; 作成者: 国土交通省; 2006年; 参照日: 2026-09-18; https://www.mlit.go.jp/river/basic_info/jigyo_keikaku/gaiyou/seibi/pdf/tonegawa/12_H18_gaiyou_tonegawa.pdf | restricted | 引用メタデータのみ。PDF本文、図版、地図画像は再現しない。 |
| `tonegawa:source:mlit-river-guide` | 国土交通省『利根川』日本の川 | 利根川（日本の川）; 作成者: 国土交通省; 2006年; 参照日: 2026-09-18; https://www.mlit.go.jp/river/toukei_chousa/kasen/jiten/nihon_kawa/0316_tonegawa/0316_tonegawa_01.html | restricted | 引用メタデータのみ。ページ本文、図版、地図画像は再現しない。 |
| `tonegawa:source:saitama-cultural-pdf` | 埼玉県『埼玉県の文化財』 | 埼玉県の文化財; 作成者: 埼玉県; 2025年; 参照日: 2026-09-18; https://www.pref.saitama.lg.jp/documents/27121/saitamaken_bunkazai_r7.pdf | restricted | 引用メタデータのみ。PDF本文、図版、地図画像は再現しない。 |
| `tonegawa:source:shape-notes` | Chronomap『利根川東遷パイロット形状作成メモ』 | 利根川東遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-18; https://github.com/ywatase/chronomap/blob/main/docs/data/tonegawa-shape-notes.md | open-license; 表示: Chronomap contributors | Chronomapのオリジナルな概略復元メモ。外部資料の権利条件は個別Sourceに従う。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
