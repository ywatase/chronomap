# データ監査: 鬼怒川・小貝川の河道変遷パイロット

- データセットID: `kinugawa:dataset:river-history`
- 既定言語: `ja`
- 公開FeatureVersion: 4
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `kinugawa:version:river-1629` | 鬼怒川・小貝川分離前の河道（1629年・概略） | LineString | 1629年 | open-license |
| `kinugawa:version:river-2020` | 鬼怒川（2020年・現在流路の概略） | LineString | 2020年以降 | open-license |
| `kinugawa:version:river-768` | 鬼怒川（768年・流路開削の概略） | LineString | 768年 | open-license |
| `kinugawa:version:separation-1629` | 鬼怒川・小貝川分離（1629年・代表点） | Point | 1629年以降 | open-license |

### `kinugawa:version:river-1629`

- 地物: 鬼怒川・小貝川分離前の河道（1629年・概略） (`kinugawa:entity:old-channel`)
- geometry: `LineString`
- 年代: 1629年
- 権利: `open-license` — 表示: Chronomap（概略復元）、国土交通省・国土地理院（引用） — 外部資料の本文・図版は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 1629年の分離事業として資料に示されます。 (Evidence: `kinugawa:evidence:history`)
  - `location`: `approximate` — 分離関係を現在地図上の概略線へ置き換えています。 (Evidence: `kinugawa:evidence:change-map`, `kinugawa:evidence:history`, `kinugawa:evidence:old-geometry`)
  - `geometry`: `approximate` — 少数の折れ点による概略復元で、旧河道の精密な中心線ではありません。 (Evidence: `kinugawa:evidence:old-geometry`)
  - `identity`: `well-supported` — 鬼怒川・小貝川分離前の河道関係を示す比較用地物です。 (Evidence: `kinugawa:evidence:change-map`, `kinugawa:evidence:history`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `kinugawa:evidence:change-map` | citation | identity, location, temporal | 旧版地形図と米軍写真による河道変遷の説明 | `kinugawa:source:river-change` |
  - `kinugawa:evidence:change-map` — 旧版地形図と米軍写真で河道変遷を把握できることを確認する引用メタデータ。図版は再現しない。
| `kinugawa:evidence:history` | citation | identity, location, temporal | 鬼怒川・小貝川の河道分離と江戸時代初期の治水史 | `kinugawa:source:history` |
  - `kinugawa:evidence:history` — 鬼怒川・小貝川の分離と河道変遷に関する引用メタデータ。本文・図版は再現しない。
| `kinugawa:evidence:old-geometry` | derived-geometry | geometry, location | 768年・1629年LineString | `kinugawa:source:shape-notes` |
  - `kinugawa:evidence:old-geometry` — 資料が示す接続関係を少数の折れ点で表した概略線。旧河道の精密な位置・幅・全区間を復元しない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `kinugawa:source:history`: 国土交通省関東地方整備局『鬼怒川・小貝川の歴史（治水）』 — 鬼怒川・小貝川の歴史（治水）; 作成者: 国土交通省関東地方整備局 下館河川事務所; 2016年; 参照日: 2026-10-03 — rights: `restricted` — https://www.ktr.mlit.go.jp/shimodate/shimodate_know020.html
  - `kinugawa:source:river-change`: 国土地理院『鬼怒川の河道変遷（旧版地形図と米軍写真による把握）』 — 鬼怒川の河道変遷; 作成者: 国土地理院; 2014年; 参照日: 2026-10-03 — rights: `restricted` — https://www.gsi.go.jp/common/000061425.pdf
  - `kinugawa:source:shape-notes`: Chronomap『鬼怒川・小貝川河道変遷パイロット形状作成メモ』 — 鬼怒川・小貝川河道変遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-03 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/kinugawa-shape-notes.md

### `kinugawa:version:river-2020`

- 地物: 鬼怒川（2020年・現在流路の概略） (`kinugawa:entity:river`)
- geometry: `LineString`
- 年代: 2020年以降
- 権利: `open-license` — 表示: Chronomap（概略復元）、国土交通省（引用） — 外部資料の本文・図版は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 河川概要を比較するための2020年スナップショットとして扱います。 (Evidence: `kinugawa:evidence:current-temporal`)
  - `location`: `approximate` — 水源から利根川合流までの相対関係を概略線へ置き換えています。 (Evidence: `kinugawa:evidence:current-geometry`, `kinugawa:evidence:overview`)
  - `geometry`: `approximate` — 少数の折れ点による概略復元で、現在の河道中心線ではありません。 (Evidence: `kinugawa:evidence:current-geometry`)
  - `identity`: `well-supported` — 利根川水系鬼怒川としての同一性を示します。 (Evidence: `kinugawa:evidence:current-temporal`, `kinugawa:evidence:overview`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `kinugawa:evidence:current-geometry` | derived-geometry | geometry, location | 2020年LineString | `kinugawa:source:shape-notes` |
  - `kinugawa:evidence:current-geometry` — 公式河川概要の相対位置を少数の折れ点へ置いた概略線で、精密な河道中心線ではない。 (publicationBasis: `original-reconstruction`)
| `kinugawa:evidence:current-temporal` | citation | identity, temporal | 現行河川概要を2020年比較時点として扱う記録 | `kinugawa:source:mlit-overview` |
  - `kinugawa:evidence:current-temporal` — 現行の河川概要を本パイロットの2020年比較時点へ対応づける引用メタデータ。将来の現況更新を意味しない。
| `kinugawa:evidence:overview` | citation | identity, location | 鬼怒川の水源・流路・利根川への合流に関する河川概要 | `kinugawa:source:mlit-overview` |
  - `kinugawa:evidence:overview` — 鬼怒川の水系と現在の流域関係を確認する引用メタデータ。本文・図版は再現しない。

- Source:

  - `kinugawa:source:mlit-overview`: 国土交通省『日本の川・鬼怒川』 — 日本の川 - 関東 - 鬼怒川; 作成者: 国土交通省 水管理・国土保全局; 2006年; 参照日: 2026-10-03 — rights: `restricted` — https://www.mlit.go.jp/river/toukei_chousa/kasen/jiten/nihon_kawa/0303_kinugawa/0303_kinugawa_00.html
  - `kinugawa:source:shape-notes`: Chronomap『鬼怒川・小貝川河道変遷パイロット形状作成メモ』 — 鬼怒川・小貝川河道変遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-03 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/kinugawa-shape-notes.md

### `kinugawa:version:river-768`

- 地物: 鬼怒川（768年・流路開削の概略） (`kinugawa:entity:old-channel`)
- geometry: `LineString`
- 年代: 768年
- 権利: `open-license` — 表示: Chronomap（概略復元）、国土交通省（引用） — 外部資料の本文・図版は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 768年の流路開削として資料に示されます。 (Evidence: `kinugawa:evidence:history`)
  - `location`: `approximate` — 資料の相対関係を現在地図上の概略線に置き換えています。 (Evidence: `kinugawa:evidence:history`, `kinugawa:evidence:old-geometry`)
  - `geometry`: `approximate` — 少数の折れ点による概略復元で、旧河道の精密な中心線ではありません。 (Evidence: `kinugawa:evidence:old-geometry`)
  - `identity`: `well-supported` — 鬼怒川の河道変遷を示す比較用の地物です。 (Evidence: `kinugawa:evidence:history`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `kinugawa:evidence:history` | citation | identity, location, temporal | 鬼怒川・小貝川の河道分離と江戸時代初期の治水史 | `kinugawa:source:history` |
  - `kinugawa:evidence:history` — 鬼怒川・小貝川の分離と河道変遷に関する引用メタデータ。本文・図版は再現しない。
| `kinugawa:evidence:old-geometry` | derived-geometry | geometry, location | 768年・1629年LineString | `kinugawa:source:shape-notes` |
  - `kinugawa:evidence:old-geometry` — 資料が示す接続関係を少数の折れ点で表した概略線。旧河道の精密な位置・幅・全区間を復元しない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `kinugawa:source:history`: 国土交通省関東地方整備局『鬼怒川・小貝川の歴史（治水）』 — 鬼怒川・小貝川の歴史（治水）; 作成者: 国土交通省関東地方整備局 下館河川事務所; 2016年; 参照日: 2026-10-03 — rights: `restricted` — https://www.ktr.mlit.go.jp/shimodate/shimodate_know020.html
  - `kinugawa:source:shape-notes`: Chronomap『鬼怒川・小貝川河道変遷パイロット形状作成メモ』 — 鬼怒川・小貝川河道変遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-03 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/kinugawa-shape-notes.md

### `kinugawa:version:separation-1629`

- 地物: 鬼怒川・小貝川分離（1629年・代表点） (`kinugawa:entity:separation`)
- geometry: `Point`
- 年代: 1629年以降
- 権利: `open-license` — 表示: Chronomap（代表点加工）、国土交通省（引用） — 外部資料の本文・図版は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 1629年の分離として資料に示されます。 (Evidence: `kinugawa:evidence:history`)
  - `location`: `approximate` — 分離関係を比較するための代表位置で、史跡の精密位置ではありません。 (Evidence: `kinugawa:evidence:history`, `kinugawa:evidence:separation-geometry`)
  - `geometry`: `approximate` — 一点の代表表示で、工事線や施設形状を示しません。 (Evidence: `kinugawa:evidence:separation-geometry`)
  - `identity`: `well-supported` — 鬼怒川・小貝川分離事業を示す比較用地物です。 (Evidence: `kinugawa:evidence:history`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `kinugawa:evidence:history` | citation | identity, location, temporal | 鬼怒川・小貝川の河道分離と江戸時代初期の治水史 | `kinugawa:source:history` |
  - `kinugawa:evidence:history` — 鬼怒川・小貝川の分離と河道変遷に関する引用メタデータ。本文・図版は再現しない。
| `kinugawa:evidence:separation-geometry` | derived-geometry | geometry, location | 1629年Point | `kinugawa:source:shape-notes` |
  - `kinugawa:evidence:separation-geometry` — 分離事業の比較用代表点で、工事区間・施設・旧河道の正確な位置ではない。 (publicationBasis: `original-reconstruction`)

- Source:

  - `kinugawa:source:history`: 国土交通省関東地方整備局『鬼怒川・小貝川の歴史（治水）』 — 鬼怒川・小貝川の歴史（治水）; 作成者: 国土交通省関東地方整備局 下館河川事務所; 2016年; 参照日: 2026-10-03 — rights: `restricted` — https://www.ktr.mlit.go.jp/shimodate/shimodate_know020.html
  - `kinugawa:source:shape-notes`: Chronomap『鬼怒川・小貝川河道変遷パイロット形状作成メモ』 — 鬼怒川・小貝川河道変遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-03 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/kinugawa-shape-notes.md

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `kinugawa:source:history` | 国土交通省関東地方整備局『鬼怒川・小貝川の歴史（治水）』 | 鬼怒川・小貝川の歴史（治水）; 作成者: 国土交通省関東地方整備局 下館河川事務所; 2016年; 参照日: 2026-10-03; https://www.ktr.mlit.go.jp/shimodate/shimodate_know020.html | restricted | 引用メタデータのみ。本文、図版、地図画像は再現しない。 |
| `kinugawa:source:mlit-overview` | 国土交通省『日本の川・鬼怒川』 | 日本の川 - 関東 - 鬼怒川; 作成者: 国土交通省 水管理・国土保全局; 2006年; 参照日: 2026-10-03; https://www.mlit.go.jp/river/toukei_chousa/kasen/jiten/nihon_kawa/0303_kinugawa/0303_kinugawa_00.html | restricted | 引用メタデータのみ。本文、図版、地図画像は再現しない。 |
| `kinugawa:source:river-change` | 国土地理院『鬼怒川の河道変遷（旧版地形図と米軍写真による把握）』 | 鬼怒川の河道変遷; 作成者: 国土地理院; 2014年; 参照日: 2026-10-03; https://www.gsi.go.jp/common/000061425.pdf | restricted | 引用メタデータのみ。旧版地形図・写真・図版は再現しない。 |
| `kinugawa:source:shape-notes` | Chronomap『鬼怒川・小貝川河道変遷パイロット形状作成メモ』 | 鬼怒川・小貝川河道変遷パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-03; https://github.com/ywatase/chronomap/blob/main/docs/data/kinugawa-shape-notes.md | open-license; 表示: Chronomap contributors | Chronomapのオリジナルな概略復元メモ。外部資料の権利条件は個別Sourceに従う。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
