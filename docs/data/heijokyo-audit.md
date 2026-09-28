# データ監査: 平城京パイロットデータ

- データセットID: `heijokyo:dataset:pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 3
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `heijokyo:version:capital-710` | 平城京（710年・概略範囲） | Polygon | 710年以降 | open-license |
| `heijokyo:version:palace-710` | 平城宮（710年・代表点） | Point | 710年以降 | open-license |
| `heijokyo:version:suzaku-avenue-710` | 朱雀大路（710年・概略軸） | LineString | 710年以降 | open-license |

### `heijokyo:version:capital-710`

- 地物: 平城京（710年・概略範囲） (`heijokyo:entity:capital`)
- geometry: `Polygon`
- 年代: 710年以降
- 権利: `open-license` — 表示: Chronomap（概略加工）、奈良市（引用） — 外部本文・図版・地図画像は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 710年の単年スナップショットとして簡略化しています。 (Evidence: `heijokyo:evidence:nara`)
  - `location`: `approximate` — 都城の表示範囲を粗く置いたものです。 (Evidence: `heijokyo:evidence:shape`)
  - `geometry`: `approximate` — 正確な都城境界ではなく、Chronomapの独自概略復元です。 (Evidence: `heijokyo:evidence:shape`)
  - `identity`: `approximate` — 公式解説の相対関係を地図表示用に簡略化しています。 (Evidence: `heijokyo:evidence:nara`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `heijokyo:evidence:nara` | citation | identity, location, temporal | 奈良時代の平城京に関する解説 | `heijokyo:source:nara-heijokyo` |
  - `heijokyo:evidence:nara` — 710年の遷都、平城京の都城計画、平城宮と朱雀大路に関する引用メタデータ。本文・図版は再現しない。
| `heijokyo:evidence:shape` | derived-geometry | geometry, location | 作成方法と限界 | `heijokyo:source:shape-notes` |
  - `heijokyo:evidence:shape` — 奈良市の説明に示された相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。 (publicationBasis: `original-reconstruction`)

- Source:

  - `heijokyo:source:nara-heijokyo`: 奈良市『奈良のあゆみ－明治以前－』 — 奈良のあゆみ－明治以前－; 作成者: 奈良市; 2019年; 参照日: 2026-09-18 — rights: `restricted` — https://www.city.nara.lg.jp/soshiki/3/148230.html
  - `heijokyo:source:shape-notes`: Chronomap『平城京パイロット形状作成メモ』 — 平城京パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-18 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/heijokyo-shape-notes.md

### `heijokyo:version:palace-710`

- 地物: 平城宮（710年・代表点） (`heijokyo:entity:palace`)
- geometry: `Point`
- 年代: 710年以降
- 権利: `open-license` — 表示: Chronomap（概略加工）、奈良市（引用） — 外部本文・図版・地図画像は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 710年の単年スナップショットとして簡略化しています。 (Evidence: `heijokyo:evidence:nara`)
  - `location`: `approximate` — 平城宮の代表位置です。 (Evidence: `heijokyo:evidence:shape`)
  - `geometry`: `approximate` — 宮域を表す精密な境界ではありません。 (Evidence: `heijokyo:evidence:shape`)
  - `identity`: `approximate` — 公式解説の平城宮を地図表示用に代表点へ簡略化しています。 (Evidence: `heijokyo:evidence:nara`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `heijokyo:evidence:nara` | citation | identity, location, temporal | 奈良時代の平城京に関する解説 | `heijokyo:source:nara-heijokyo` |
  - `heijokyo:evidence:nara` — 710年の遷都、平城京の都城計画、平城宮と朱雀大路に関する引用メタデータ。本文・図版は再現しない。
| `heijokyo:evidence:shape` | derived-geometry | geometry, location | 作成方法と限界 | `heijokyo:source:shape-notes` |
  - `heijokyo:evidence:shape` — 奈良市の説明に示された相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。 (publicationBasis: `original-reconstruction`)

- Source:

  - `heijokyo:source:nara-heijokyo`: 奈良市『奈良のあゆみ－明治以前－』 — 奈良のあゆみ－明治以前－; 作成者: 奈良市; 2019年; 参照日: 2026-09-18 — rights: `restricted` — https://www.city.nara.lg.jp/soshiki/3/148230.html
  - `heijokyo:source:shape-notes`: Chronomap『平城京パイロット形状作成メモ』 — 平城京パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-18 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/heijokyo-shape-notes.md

### `heijokyo:version:suzaku-avenue-710`

- 地物: 朱雀大路（710年・概略軸） (`heijokyo:entity:suzaku-avenue`)
- geometry: `LineString`
- 年代: 710年以降
- 権利: `open-license` — 表示: Chronomap（概略加工）、奈良市（引用） — 外部本文・図版・地図画像は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 710年の単年スナップショットとして簡略化しています。 (Evidence: `heijokyo:evidence:suzaku`)
  - `location`: `approximate` — 南北軸の概略位置です。 (Evidence: `heijokyo:evidence:shape`)
  - `geometry`: `approximate` — 精密な道路線形・幅員ではなく、Chronomapの独自概略復元です。 (Evidence: `heijokyo:evidence:shape`)
  - `identity`: `approximate` — 朱雀大路の中心軸を地図表示用に簡略化しています。 (Evidence: `heijokyo:evidence:suzaku`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `heijokyo:evidence:shape` | derived-geometry | geometry, location | 作成方法と限界 | `heijokyo:source:shape-notes` |
  - `heijokyo:evidence:shape` — 奈良市の説明に示された相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。 (publicationBasis: `original-reconstruction`)
| `heijokyo:evidence:suzaku` | citation | identity, location, temporal | 平城京朱雀大路跡の解説 | `heijokyo:source:nara-suzaku` |
  - `heijokyo:evidence:suzaku` — 朱雀大路の都の中心軸としての説明に関する引用メタデータ。本文・図版は再現しない。

- Source:

  - `heijokyo:source:nara-suzaku`: 奈良市『平城京朱雀大路跡』 — 平城京朱雀大路跡; 作成者: 奈良市; 2021年; 参照日: 2026-09-18 — rights: `restricted` — https://www.city.nara.lg.jp/site/bunkazai/2438.html
  - `heijokyo:source:shape-notes`: Chronomap『平城京パイロット形状作成メモ』 — 平城京パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-18 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/heijokyo-shape-notes.md

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `heijokyo:source:nara-heijokyo` | 奈良市『奈良のあゆみ－明治以前－』 | 奈良のあゆみ－明治以前－; 作成者: 奈良市; 2019年; 参照日: 2026-09-18; https://www.city.nara.lg.jp/soshiki/3/148230.html | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |
| `heijokyo:source:nara-suzaku` | 奈良市『平城京朱雀大路跡』 | 平城京朱雀大路跡; 作成者: 奈良市; 2021年; 参照日: 2026-09-18; https://www.city.nara.lg.jp/site/bunkazai/2438.html | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |
| `heijokyo:source:shape-notes` | Chronomap『平城京パイロット形状作成メモ』 | 平城京パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-18; https://github.com/ywatase/chronomap/blob/main/docs/data/heijokyo-shape-notes.md | open-license; 表示: Chronomap contributors | 独自の概略復元メモ。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
