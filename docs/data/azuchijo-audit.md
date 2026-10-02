# データ監査: 安土城・琵琶湖東岸パイロット

- データセットID: `azuchijo:dataset:pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 6
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `azuchijo:version:castle-1576` | 安土城（1576年・築城開始） | Point | 1576年 | open-license |
| `azuchijo:version:castle-1579` | 安土城（1579年・完成） | Point | 1579年 | open-license |
| `azuchijo:version:castle-1582` | 安土城（1582年・主郭部焼失後） | Point | 1582年 | open-license |
| `azuchijo:version:lakeshore-1576` | 琵琶湖東岸（安土付近・概略） | LineString | 1576年以降 | open-license |
| `azuchijo:version:mountain-1576` | 安土山（1576年・代表点） | Point | 1576年以降 | open-license |
| `azuchijo:version:water-transport-1576` | 安土城と湖上交通の関係（1576年頃・概略） | LineString | 1576年以降 | open-license |

### `azuchijo:version:castle-1576`

- 地物: 安土城（1576年・築城開始） (`azuchijo:entity:castle`)
- geometry: `Point`
- 年代: 1576年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県・近江八幡市（引用） — 外部本文・写真・地図画像は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 築城開始年を単年で表示します。 (Evidence: `azuchijo:evidence:timeline`)
  - `location`: `approximate` — 安土山上の代表点です。 (Evidence: `azuchijo:evidence:location`, `azuchijo:evidence:shape`)
  - `geometry`: `approximate` — 城郭全体ではなく表示用の代表点です。 (Evidence: `azuchijo:evidence:shape`)
  - `identity`: `well-supported` — 安土城の築城開始を示す地物です。 (Evidence: `azuchijo:evidence:location`, `azuchijo:evidence:timeline`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:location` | citation | identity, location | 安土山・琵琶湖東岸にある安土城跡の所在地と概要 | `azuchijo:source:omi8-castle` |
  - `azuchijo:evidence:location` — 安土城が安土山にあり、琵琶湖東岸の安土付近に位置するという引用メタデータ。本文・写真は再現しない。
| `azuchijo:evidence:shape` | derived-geometry | geometry, location | 代表点・東岸概略線の作成方法と限界 | `azuchijo:source:shape-notes` |
  - `azuchijo:evidence:shape` — 公開された所在地の相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。現在・過去の正確な境界や湖岸線ではない。 (publicationBasis: `original-reconstruction`)
| `azuchijo:evidence:timeline` | citation | identity, temporal | 安土城の築城開始（1576年）と焼失・廃城の経緯 | `azuchijo:source:shiga-castle` |
  - `azuchijo:evidence:timeline` — 1576年に築城が始まり、1582年の本能寺の変後に主郭部が焼失したという引用メタデータ。本文は再現しない。

- Source:

  - `azuchijo:source:omi8-castle`: 近江八幡市観光物産協会『安土城跡』 — 安土城跡; 作成者: 近江八幡市観光物産協会; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.omi8.com/spot/detail_1217.html
  - `azuchijo:source:shape-notes`: Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 — 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md
  - `azuchijo:source:shiga-castle`: 滋賀県『特別史跡安土城跡の調査と整備』 — 特別史跡安土城跡の調査と整備; 作成者: 滋賀県; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.pref.shiga.lg.jp/sd00/2591.html

### `azuchijo:version:castle-1579`

- 地物: 安土城（1579年・完成） (`azuchijo:entity:castle`)
- geometry: `Point`
- 年代: 1579年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県・近江八幡市（引用） — 外部本文・写真・地図画像は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 天主・本丸御殿の完成時期を単年で表示します。 (Evidence: `azuchijo:evidence:timeline`)
  - `location`: `approximate` — 安土山上の代表点です。 (Evidence: `azuchijo:evidence:location`, `azuchijo:evidence:shape`)
  - `geometry`: `approximate` — 完成した城郭の境界や建物配置は表示しません。 (Evidence: `azuchijo:evidence:shape`)
  - `identity`: `well-supported` — 安土城の完成時期を示す地物です。 (Evidence: `azuchijo:evidence:location`, `azuchijo:evidence:timeline`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:location` | citation | identity, location | 安土山・琵琶湖東岸にある安土城跡の所在地と概要 | `azuchijo:source:omi8-castle` |
  - `azuchijo:evidence:location` — 安土城が安土山にあり、琵琶湖東岸の安土付近に位置するという引用メタデータ。本文・写真は再現しない。
| `azuchijo:evidence:shape` | derived-geometry | geometry, location | 代表点・東岸概略線の作成方法と限界 | `azuchijo:source:shape-notes` |
  - `azuchijo:evidence:shape` — 公開された所在地の相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。現在・過去の正確な境界や湖岸線ではない。 (publicationBasis: `original-reconstruction`)
| `azuchijo:evidence:timeline` | citation | identity, temporal | 安土城の築城開始（1576年）と焼失・廃城の経緯 | `azuchijo:source:shiga-castle` |
  - `azuchijo:evidence:timeline` — 1576年に築城が始まり、1582年の本能寺の変後に主郭部が焼失したという引用メタデータ。本文は再現しない。

- Source:

  - `azuchijo:source:omi8-castle`: 近江八幡市観光物産協会『安土城跡』 — 安土城跡; 作成者: 近江八幡市観光物産協会; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.omi8.com/spot/detail_1217.html
  - `azuchijo:source:shape-notes`: Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 — 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md
  - `azuchijo:source:shiga-castle`: 滋賀県『特別史跡安土城跡の調査と整備』 — 特別史跡安土城跡の調査と整備; 作成者: 滋賀県; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.pref.shiga.lg.jp/sd00/2591.html

### `azuchijo:version:castle-1582`

- 地物: 安土城（1582年・主郭部焼失後） (`azuchijo:entity:castle`)
- geometry: `Point`
- 年代: 1582年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県・近江八幡市（引用） — 外部本文・写真・地図画像は再現しない。
- 不確実性:
  - `temporal`: `well-supported` — 1582年の焼失時期を単年で表示します。 (Evidence: `azuchijo:evidence:timeline`)
  - `location`: `approximate` — 焼失した主郭部を含む安土山上の代表点です。 (Evidence: `azuchijo:evidence:location`, `azuchijo:evidence:shape`)
  - `geometry`: `approximate` — 焼失範囲を表す面ではなく代表点です。 (Evidence: `azuchijo:evidence:shape`)
  - `identity`: `well-supported` — 安土城の焼失経緯を示す地物です。 (Evidence: `azuchijo:evidence:location`, `azuchijo:evidence:timeline`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:location` | citation | identity, location | 安土山・琵琶湖東岸にある安土城跡の所在地と概要 | `azuchijo:source:omi8-castle` |
  - `azuchijo:evidence:location` — 安土城が安土山にあり、琵琶湖東岸の安土付近に位置するという引用メタデータ。本文・写真は再現しない。
| `azuchijo:evidence:shape` | derived-geometry | geometry, location | 代表点・東岸概略線の作成方法と限界 | `azuchijo:source:shape-notes` |
  - `azuchijo:evidence:shape` — 公開された所在地の相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。現在・過去の正確な境界や湖岸線ではない。 (publicationBasis: `original-reconstruction`)
| `azuchijo:evidence:timeline` | citation | identity, temporal | 安土城の築城開始（1576年）と焼失・廃城の経緯 | `azuchijo:source:shiga-castle` |
  - `azuchijo:evidence:timeline` — 1576年に築城が始まり、1582年の本能寺の変後に主郭部が焼失したという引用メタデータ。本文は再現しない。

- Source:

  - `azuchijo:source:omi8-castle`: 近江八幡市観光物産協会『安土城跡』 — 安土城跡; 作成者: 近江八幡市観光物産協会; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.omi8.com/spot/detail_1217.html
  - `azuchijo:source:shape-notes`: Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 — 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md
  - `azuchijo:source:shiga-castle`: 滋賀県『特別史跡安土城跡の調査と整備』 — 特別史跡安土城跡の調査と整備; 作成者: 滋賀県; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.pref.shiga.lg.jp/sd00/2591.html

### `azuchijo:version:lakeshore-1576`

- 地物: 琵琶湖東岸（安土付近・概略） (`azuchijo:entity:lakeshore`)
- geometry: `LineString`
- 年代: 1576年以降
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県・近江八幡市（引用） — 外部本文・写真・地図画像は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 安土の位置関係を1576年前後の表示年へ置いています。 (Evidence: `azuchijo:evidence:timeline`)
  - `location`: `approximate` — 東岸の相対位置を示す概略線です。 (Evidence: `azuchijo:evidence:location`, `azuchijo:evidence:shape`)
  - `geometry`: `approximate` — 少数の頂点で作った表示用の線で、湖岸の精密な復元ではありません。 (Evidence: `azuchijo:evidence:shape`)
  - `identity`: `well-supported` — 安土が琵琶湖東岸に位置するという関係を示します。 (Evidence: `azuchijo:evidence:location`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:location` | citation | identity, location | 安土山・琵琶湖東岸にある安土城跡の所在地と概要 | `azuchijo:source:omi8-castle` |
  - `azuchijo:evidence:location` — 安土城が安土山にあり、琵琶湖東岸の安土付近に位置するという引用メタデータ。本文・写真は再現しない。
| `azuchijo:evidence:shape` | derived-geometry | geometry, location | 代表点・東岸概略線の作成方法と限界 | `azuchijo:source:shape-notes` |
  - `azuchijo:evidence:shape` — 公開された所在地の相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。現在・過去の正確な境界や湖岸線ではない。 (publicationBasis: `original-reconstruction`)
| `azuchijo:evidence:timeline` | citation | identity, temporal | 安土城の築城開始（1576年）と焼失・廃城の経緯 | `azuchijo:source:shiga-castle` |
  - `azuchijo:evidence:timeline` — 1576年に築城が始まり、1582年の本能寺の変後に主郭部が焼失したという引用メタデータ。本文は再現しない。

- Source:

  - `azuchijo:source:omi8-castle`: 近江八幡市観光物産協会『安土城跡』 — 安土城跡; 作成者: 近江八幡市観光物産協会; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.omi8.com/spot/detail_1217.html
  - `azuchijo:source:shape-notes`: Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 — 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md
  - `azuchijo:source:shiga-castle`: 滋賀県『特別史跡安土城跡の調査と整備』 — 特別史跡安土城跡の調査と整備; 作成者: 滋賀県; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.pref.shiga.lg.jp/sd00/2591.html

### `azuchijo:version:mountain-1576`

- 地物: 安土山（1576年・代表点） (`azuchijo:entity:mountain`)
- geometry: `Point`
- 年代: 1576年以降
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県・近江八幡市（引用） — 外部本文・写真・地図画像は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 安土城の築城開始時期に合わせた表示です。 (Evidence: `azuchijo:evidence:timeline`)
  - `location`: `approximate` — 山域を一点で示しています。 (Evidence: `azuchijo:evidence:location`, `azuchijo:evidence:shape`)
  - `geometry`: `approximate` — 山域の範囲・標高モデルではありません。 (Evidence: `azuchijo:evidence:shape`)
  - `identity`: `well-supported` — 安土城が築かれた安土山を示します。 (Evidence: `azuchijo:evidence:location`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:location` | citation | identity, location | 安土山・琵琶湖東岸にある安土城跡の所在地と概要 | `azuchijo:source:omi8-castle` |
  - `azuchijo:evidence:location` — 安土城が安土山にあり、琵琶湖東岸の安土付近に位置するという引用メタデータ。本文・写真は再現しない。
| `azuchijo:evidence:shape` | derived-geometry | geometry, location | 代表点・東岸概略線の作成方法と限界 | `azuchijo:source:shape-notes` |
  - `azuchijo:evidence:shape` — 公開された所在地の相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。現在・過去の正確な境界や湖岸線ではない。 (publicationBasis: `original-reconstruction`)
| `azuchijo:evidence:timeline` | citation | identity, temporal | 安土城の築城開始（1576年）と焼失・廃城の経緯 | `azuchijo:source:shiga-castle` |
  - `azuchijo:evidence:timeline` — 1576年に築城が始まり、1582年の本能寺の変後に主郭部が焼失したという引用メタデータ。本文は再現しない。

- Source:

  - `azuchijo:source:omi8-castle`: 近江八幡市観光物産協会『安土城跡』 — 安土城跡; 作成者: 近江八幡市観光物産協会; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.omi8.com/spot/detail_1217.html
  - `azuchijo:source:shape-notes`: Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 — 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md
  - `azuchijo:source:shiga-castle`: 滋賀県『特別史跡安土城跡の調査と整備』 — 特別史跡安土城跡の調査と整備; 作成者: 滋賀県; 2026年; 参照日: 2026-10-02 — rights: `restricted` — https://www.pref.shiga.lg.jp/sd00/2591.html

### `azuchijo:version:water-transport-1576`

- 地物: 安土城と湖上交通の関係（1576年頃・概略） (`azuchijo:entity:water-transport`)
- geometry: `LineString`
- 年代: 1576年以降
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県（引用） — 外部本文・写真・図版は再現しない。
- 不確実性:
  - `temporal`: `approximate` — 安土桃山期の湖上交通という文脈を1576年頃に置いています。個別の運航年ではありません。 (Evidence: `azuchijo:evidence:transport`)
  - `location`: `approximate` — 安土城の代表点と東岸概略線の関係を示す接続線です。港の位置ではありません。 (Evidence: `azuchijo:evidence:shape`, `azuchijo:evidence:transport`)
  - `geometry`: `approximate` — 直線的な概略接続線で、実際の航路・距離・船着場を表しません。 (Evidence: `azuchijo:evidence:shape`)
  - `identity`: `well-supported` — 安土城と琵琶湖を利用する移動・物資輸送の関係を考えるための表示です。 (Evidence: `azuchijo:evidence:transport`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:shape` | derived-geometry | geometry, location | 代表点・東岸概略線の作成方法と限界 | `azuchijo:source:shape-notes` |
  - `azuchijo:evidence:shape` — 公開された所在地の相対関係を少数の頂点へ置き換えたChronomap独自の概略復元。現在・過去の正確な境界や湖岸線ではない。 (publicationBasis: `original-reconstruction`)
| `azuchijo:evidence:transport` | citation | identity, location, temporal | 安土城などの湖岸拠点と、琵琶湖を利用する人の移動・物資輸送を行う湖上交通の概要 | `azuchijo:source:shiga-biwako-human` |
  - `azuchijo:evidence:transport` — 安土桃山期の湖上交通と安土城の位置関係を示す引用メタデータ。個別の航路、港、船着場、運航日を特定する資料ではありません。

- Source:

  - `azuchijo:source:shape-notes`: Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 — 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md
  - `azuchijo:source:shiga-biwako-human`: 滋賀県『琵琶湖と人の長いつきあい』 — 琵琶湖と人の長いつきあい; 作成者: 滋賀県; 2018年; 参照日: 2026-10-02 — rights: `restricted` — https://www.pref.shiga.lg.jp/biwakatsu/20521.html

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `azuchijo:source:omi8-castle` | 近江八幡市観光物産協会『安土城跡』 | 安土城跡; 作成者: 近江八幡市観光物産協会; 2026年; 参照日: 2026-10-02; https://www.omi8.com/spot/detail_1217.html | restricted | 引用メタデータのみ。本文・写真・地図画像は再現しない。 |
| `azuchijo:source:shape-notes` | Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 | 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md | open-license; 表示: Chronomap contributors | 公開メタデータから作成した概略復元メモ。 |
| `azuchijo:source:shiga-biwako-human` | 滋賀県『琵琶湖と人の長いつきあい』 | 琵琶湖と人の長いつきあい; 作成者: 滋賀県; 2018年; 参照日: 2026-10-02; https://www.pref.shiga.lg.jp/biwakatsu/20521.html | restricted | 引用メタデータのみ。本文・写真・図版は再現しない。 |
| `azuchijo:source:shiga-castle` | 滋賀県『特別史跡安土城跡の調査と整備』 | 特別史跡安土城跡の調査と整備; 作成者: 滋賀県; 2026年; 参照日: 2026-10-02; https://www.pref.shiga.lg.jp/sd00/2591.html | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
