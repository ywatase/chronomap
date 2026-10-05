# データ監査: 関ケ原古戦場・中山道パイロット

- データセットID: `sekigahara:dataset:battlefield-pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 3
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `sekigahara:version:battlefield-1600` | 関ケ原古戦場（1600年・代表点） | Point | 1600年 | open-license |
| `sekigahara:version:nakasendo-1600` | 中山道・関ケ原越え（1600年頃・概略線） | LineString | 1600–1868年 | open-license |
| `sekigahara:version:sekigahara-juku-1600` | 関ケ原宿（1600年頃・代表点） | Point | 1600–1868年 | open-license |

### `sekigahara:version:battlefield-1600`

- 地物: 関ケ原古戦場（1600年・代表点） (`sekigahara:entity:battlefield`)
- geometry: `Point`
- 年代: 1600年
- 権利: `open-license` — 表示: Chronomap（概略復元）、岐阜県（引用メタデータ） — 外部資料の本文・写真・展示映像は再現しない。代表点は戦場全体や各陣地の精密位置ではない。
- 不確実性:
  - `temporal`: `well-supported` — 公式説明にある慶長5年（1600年）の合戦を表示します。 (Evidence: `sekigahara:evidence:battlefield`)
  - `location`: `approximate` — 関ケ原盆地の古戦場を読む代表位置で、戦場全体の範囲ではありません。 (Evidence: `sekigahara:evidence:battlefield`, `sekigahara:evidence:battlefield-course`, `sekigahara:evidence:battlefield-shape`)
  - `geometry`: `approximate` — 代表Pointであり、布陣、陣跡、戦線、行軍路の精密な位置や範囲ではありません。 (Evidence: `sekigahara:evidence:battlefield-shape`)
  - `identity`: `well-supported` — 岐阜県が説明する関ケ原の戦いを示します。 (Evidence: `sekigahara:evidence:battlefield`, `sekigahara:evidence:battlefield-course`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `sekigahara:evidence:battlefield` | citation | identity, location, temporal | 慶長5年（1600年）の関ケ原の戦いと、関ケ原古戦場の歴史説明 | `sekigahara:source:memorial-about` |
  - `sekigahara:evidence:battlefield` — 岐阜関ケ原古戦場記念館の公式説明を引用メタデータとして使用します。戦場全体の座標付き境界を示す資料ではありません。
| `sekigahara:evidence:battlefield-course` | citation | identity, location | 石田三成コースに示される古戦場・史跡巡りの案内 | `sekigahara:source:ishida-course` |
  - `sekigahara:evidence:battlefield-course` — 岐阜関ケ原古戦場記念館の公式コース案内を引用メタデータとして使用します。個別陣跡の座標や戦場全体の境界を示す資料ではありません。
| `sekigahara:evidence:battlefield-shape` | derived-geometry | geometry, location | 関ケ原古戦場代表Pointの作成方法と限界 | `sekigahara:source:shape-notes` |
  - `sekigahara:evidence:battlefield-shape` — 関ケ原盆地の古戦場を読むための代表Pointへ置き換えました。戦場全体、布陣、陣跡、戦線、行軍路の精密な位置や範囲ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `sekigahara:source:ishida-course`: 岐阜関ケ原古戦場記念館『石田三成コース』 — 石田三成コース｜古戦場・史跡巡り; 作成者: 岐阜県・岐阜関ケ原古戦場記念館; 2020年; 参照日: 2026-10-05 — rights: `restricted` — https://sekigahara.pref.gifu.lg.jp/ishida-mitsunari/
  - `sekigahara:source:memorial-about`: 岐阜関ケ原古戦場記念館『岐阜関ケ原古戦場記念館について』 — 岐阜関ケ原古戦場記念館について; 作成者: 岐阜県・岐阜関ケ原古戦場記念館; 2020年; 参照日: 2026-10-05 — rights: `restricted` — https://sekigahara.pref.gifu.lg.jp/about/
  - `sekigahara:source:shape-notes`: Chronomap『関ケ原古戦場・中山道形状作成メモ』 — 関ケ原古戦場・中山道形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-05 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/sekigahara-shape-notes.md

### `sekigahara:version:nakasendo-1600`

- 地物: 中山道・関ケ原越え（1600年頃・概略線） (`sekigahara:entity:nakasendo-route`)
- geometry: `LineString`
- 年代: 1600–1868年
- 権利: `open-license` — 表示: Chronomap（概略復元）、関ケ原町（引用メタデータ） — 外部資料の本文・図版・地図画像は再現しない。LineStringは街道中心線ではない。
- 不確実性:
  - `temporal`: `approximate` — 中山道整備後の近世交通を1600年頃から明治初期までの比較用期間で示します。 (Evidence: `sekigahara:evidence:route`)
  - `location`: `approximate` — 東西の交通軸と関ケ原の峠越えを概略線で示します。 (Evidence: `sekigahara:evidence:route`, `sekigahara:evidence:route-shape`)
  - `geometry`: `approximate` — 少数頂点の概略線で、歴史的な街道中心線、道幅、宿駅間距離ではありません。 (Evidence: `sekigahara:evidence:route-shape`)
  - `identity`: `well-supported` — 関ケ原町が説明する中山道・東西交通の関係を示します。 (Evidence: `sekigahara:evidence:route`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `sekigahara:evidence:route` | citation | identity, location, temporal | 南北の山の隙間を通る街道と、中山道・関ケ原宿が東西交通をつないだという歴史説明 | `sekigahara:source:town-plan` |
  - `sekigahara:evidence:route` — 関ケ原町の公式計画を引用メタデータとして使用します。街道の現地測量線や当時の道幅を示す資料ではありません。
| `sekigahara:evidence:route-shape` | derived-geometry | geometry, location | 中山道・関ケ原越え概略LineStringの作成方法と限界 | `sekigahara:source:shape-notes` |
  - `sekigahara:evidence:route-shape` — 東西の交通軸と関ケ原の峠越えを少数頂点の概略線へ置き換えました。歴史的な街道中心線、道幅、宿駅間距離ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `sekigahara:source:shape-notes`: Chronomap『関ケ原古戦場・中山道形状作成メモ』 — 関ケ原古戦場・中山道形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-05 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/sekigahara-shape-notes.md
  - `sekigahara:source:town-plan`: 関ケ原町『関ケ原町過疎地域持続的発展計画』 — 関ケ原町過疎地域持続的発展計画; 作成者: 関ケ原町; 2021年; 参照日: 2026-10-05 — rights: `restricted` — https://www.town.sekigahara.gifu.jp/secure/6543/R7keikaku.pdf

### `sekigahara:version:sekigahara-juku-1600`

- 地物: 関ケ原宿（1600年頃・代表点） (`sekigahara:entity:sekigahara-juku`)
- geometry: `Point`
- 年代: 1600–1868年
- 権利: `open-license` — 表示: Chronomap（概略復元）、関ケ原町（引用メタデータ） — 外部資料の本文・図版・地図画像は再現しない。代表点は宿場町の精密範囲ではない。
- 不確実性:
  - `temporal`: `approximate` — 中山道の宿場としての近世関ケ原宿を1600年頃から明治初期までの比較用期間で示します。 (Evidence: `sekigahara:evidence:settlement`)
  - `location`: `approximate` — 現在の関ケ原駅周辺を宿場の相対位置を読む代表点へ置き換えています。 (Evidence: `sekigahara:evidence:settlement`, `sekigahara:evidence:settlement-shape`)
  - `geometry`: `approximate` — 代表Pointであり、宿場町の街区、屋敷、道幅、町域境界の精密な位置ではありません。 (Evidence: `sekigahara:evidence:settlement-shape`)
  - `identity`: `well-supported` — 関ケ原町が説明する中山道の関ケ原宿を示します。 (Evidence: `sekigahara:evidence:settlement`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `sekigahara:evidence:settlement` | citation | identity, location, temporal | 中山道の58番目の関ケ原宿と、今須宿が東西をつなぐ宿場だったという説明 | `sekigahara:source:town-plan` |
  - `sekigahara:evidence:settlement` — 関ケ原町の公式計画を引用メタデータとして使用します。宿場町の街区・屋敷・町域境界を示す資料ではありません。
| `sekigahara:evidence:settlement-shape` | derived-geometry | geometry, location | 関ケ原宿代表Pointの作成方法と限界 | `sekigahara:source:shape-notes` |
  - `sekigahara:evidence:settlement-shape` — 関ケ原駅周辺を宿場の相対位置を読む代表Pointへ置き換えました。街区、屋敷、道幅、町域境界の精密な位置ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `sekigahara:source:shape-notes`: Chronomap『関ケ原古戦場・中山道形状作成メモ』 — 関ケ原古戦場・中山道形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-05 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/sekigahara-shape-notes.md
  - `sekigahara:source:town-plan`: 関ケ原町『関ケ原町過疎地域持続的発展計画』 — 関ケ原町過疎地域持続的発展計画; 作成者: 関ケ原町; 2021年; 参照日: 2026-10-05 — rights: `restricted` — https://www.town.sekigahara.gifu.jp/secure/6543/R7keikaku.pdf

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `sekigahara:source:ishida-course` | 岐阜関ケ原古戦場記念館『石田三成コース』 | 石田三成コース｜古戦場・史跡巡り; 作成者: 岐阜県・岐阜関ケ原古戦場記念館; 2020年; 参照日: 2026-10-05; https://sekigahara.pref.gifu.lg.jp/ishida-mitsunari/ | restricted | 引用メタデータのみ。本文・写真・ダウンロード地図は再現しない。 |
| `sekigahara:source:memorial-about` | 岐阜関ケ原古戦場記念館『岐阜関ケ原古戦場記念館について』 | 岐阜関ケ原古戦場記念館について; 作成者: 岐阜県・岐阜関ケ原古戦場記念館; 2020年; 参照日: 2026-10-05; https://sekigahara.pref.gifu.lg.jp/about/ | restricted | 引用メタデータのみ。ページ本文・写真・展示映像は再現しない。 |
| `sekigahara:source:shape-notes` | Chronomap『関ケ原古戦場・中山道形状作成メモ』 | 関ケ原古戦場・中山道形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-05; https://github.com/ywatase/chronomap/blob/main/docs/data/sekigahara-shape-notes.md | open-license; 表示: Chronomap contributors | 公開メタデータから作成した概略復元メモ。 |
| `sekigahara:source:town-plan` | 関ケ原町『関ケ原町過疎地域持続的発展計画』 | 関ケ原町過疎地域持続的発展計画; 作成者: 関ケ原町; 2021年; 参照日: 2026-10-05; https://www.town.sekigahara.gifu.jp/secure/6543/R7keikaku.pdf | restricted | 引用メタデータのみ。PDF本文・図版・地図画像は再現しない。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
