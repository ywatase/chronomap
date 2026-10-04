# データ監査: 安土城・琵琶湖東岸パイロット

- データセットID: `azuchijo:dataset:pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 10
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `azuchijo:version:castle-1576` | 安土城（1576年・築城開始） | Point | 1576年 | open-license |
| `azuchijo:version:castle-1579` | 安土城（1579年・完成） | Point | 1579年 | open-license |
| `azuchijo:version:castle-1582` | 安土城（1582年・主郭部焼失後） | Point | 1582年 | open-license |
| `azuchijo:version:lakeshore-1576` | 琵琶湖東岸（安土付近・概略） | LineString | 1576年以降 | open-license |
| `azuchijo:version:mountain-1576` | 安土山（1576年・代表点） | Point | 1576年以降 | open-license |
| `azuchijo:version:omi-polity-1576-azuchi` | 織田信長の近江支配・安土政治中枢（1576〜1582年頃・安土城中心案） | Polygon | 1576–1582年 | open-license |
| `azuchijo:version:omi-polity-1576-townshore` | 織田信長の近江支配・安土政治中枢（1576〜1582年頃・城下町・湖岸を含む案） | Polygon | 1576–1582年 | open-license |
| `azuchijo:version:omi-sphere-1576-broad` | 織田信長の近江支配の拠点網（1576〜1582年頃・概略） | Polygon | 1576–1582年 | open-license |
| `azuchijo:version:omi-sphere-1576-lakeshore` | 織田信長の近江支配の拠点網（湖岸拠点案・1576〜1582年頃・概略） | Polygon | 1576–1582年 | open-license |
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

### `azuchijo:version:omi-polity-1576-azuchi`

- 地物: 織田信長の近江支配・安土政治中枢（1576〜1582年頃・安土城中心案） (`azuchijo:entity:omi-polity`)
- geometry: `Polygon`
- 年代: 1576–1582年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県（引用メタデータ） — 外部本文・図版・地図画像は再現しない。政治中枢の概略であり、行政境界・国境・実効支配面ではない。
- 不確実性:
  - `temporal`: `approximate` — 安土城築城開始から本能寺の変までの政治中枢という資料上の文脈を概略期間で示します。 (Evidence: `azuchijo:evidence:omi-polity`)
  - `location`: `approximate` — 安土城を中心とする政治中枢の相対位置を示す概略面です。 (Evidence: `azuchijo:evidence:omi-polity`, `azuchijo:evidence:omi-polity-shape`)
  - `geometry`: `approximate` — 行政境界・国境・実効支配の精密な面ではなく、Chronomap独自の低頂点Polygonです。 (Evidence: `azuchijo:evidence:omi-polity-shape`)
  - `identity`: `approximate` — 政治中枢の仮説表示であり、近江全域の行政主体・支配領域を確定しません。 (Evidence: `azuchijo:evidence:omi-polity`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:omi-polity` | citation | identity, location, temporal | 信長による近江支配と安土城・拠点城郭に関する解説 | `azuchijo:source:omi-control` |
  - `azuchijo:evidence:omi-polity` — 滋賀県資料が説明する信長による近江支配、1576年の安土城、近江全体の支配を目的とした拠点城郭。政治中枢の正確な範囲や行政境界を示す資料ではありません。
| `azuchijo:evidence:omi-polity-shape` | derived-geometry | geometry, location | 政治中枢Polygonの作成方法と限界 | `azuchijo:source:omi-polity-shape` |
  - `azuchijo:evidence:omi-polity-shape` — 安土城を中心とする政治中枢という解釈を、少数頂点の2案Polygonへ置き換えたChronomap独自の概略復元。近江全域の行政境界・国境・実効支配面ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `azuchijo:source:omi-control`: 滋賀県『近江戦国探訪ガイドブック』 — 近江戦国探訪ガイドブック; 作成者: 滋賀県; 2018年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.shiga.lg.jp/documents/2540/5161509_1.pdf
  - `azuchijo:source:omi-polity-shape`: Chronomap『安土城・近江支配政治中枢形状作成メモ』 — 安土城・近江支配政治中枢形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-omi-polity-shape-notes.md

### `azuchijo:version:omi-polity-1576-townshore`

- 地物: 織田信長の近江支配・安土政治中枢（1576〜1582年頃・城下町・湖岸を含む案） (`azuchijo:entity:omi-polity`)
- geometry: `Polygon`
- 年代: 1576–1582年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県（引用メタデータ） — 外部本文・図版・地図画像は再現しない。政治中枢の概略であり、行政境界・国境・実効支配面ではない。
- 不確実性:
  - `temporal`: `approximate` — 安土城築城開始から本能寺の変までの政治中枢という資料上の文脈を概略期間で示します。 (Evidence: `azuchijo:evidence:omi-polity`)
  - `location`: `approximate` — 安土城、城下町、琵琶湖東岸の相対関係を含める概略面です。 (Evidence: `azuchijo:evidence:omi-polity`, `azuchijo:evidence:omi-polity-shape`)
  - `geometry`: `approximate` — 行政境界・国境・実効支配の精密な面ではなく、Chronomap独自の低頂点Polygonです。 (Evidence: `azuchijo:evidence:omi-polity-shape`)
  - `identity`: `approximate` — 政治中枢の仮説表示であり、近江全域の行政主体・支配領域を確定しません。 (Evidence: `azuchijo:evidence:omi-polity`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:omi-polity` | citation | identity, location, temporal | 信長による近江支配と安土城・拠点城郭に関する解説 | `azuchijo:source:omi-control` |
  - `azuchijo:evidence:omi-polity` — 滋賀県資料が説明する信長による近江支配、1576年の安土城、近江全体の支配を目的とした拠点城郭。政治中枢の正確な範囲や行政境界を示す資料ではありません。
| `azuchijo:evidence:omi-polity-shape` | derived-geometry | geometry, location | 政治中枢Polygonの作成方法と限界 | `azuchijo:source:omi-polity-shape` |
  - `azuchijo:evidence:omi-polity-shape` — 安土城を中心とする政治中枢という解釈を、少数頂点の2案Polygonへ置き換えたChronomap独自の概略復元。近江全域の行政境界・国境・実効支配面ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `azuchijo:source:omi-control`: 滋賀県『近江戦国探訪ガイドブック』 — 近江戦国探訪ガイドブック; 作成者: 滋賀県; 2018年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.shiga.lg.jp/documents/2540/5161509_1.pdf
  - `azuchijo:source:omi-polity-shape`: Chronomap『安土城・近江支配政治中枢形状作成メモ』 — 安土城・近江支配政治中枢形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-omi-polity-shape-notes.md

### `azuchijo:version:omi-sphere-1576-broad`

- 地物: 織田信長の近江支配の拠点網（1576〜1582年頃・概略） (`azuchijo:entity:omi-sphere`)
- geometry: `Polygon`
- 年代: 1576–1582年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県（引用メタデータ） — 外部本文・図版・地図画像は再現しない。領域は行政境界・国境の確定図ではない。
- 不確実性:
  - `temporal`: `approximate` — 安土城築城開始から本能寺の変までの、信長を中心とする近江支配の拠点網を概略期間で示します。 (Evidence: `azuchijo:evidence:omi-control`)
  - `location`: `approximate` — 近江全体という説明と琵琶湖岸の拠点城郭の相対関係を囲む概略面です。 (Evidence: `azuchijo:evidence:omi-control`, `azuchijo:evidence:omi-shape`)
  - `geometry`: `approximate` — 行政境界・国境・実効支配の精密な面ではなく、Chronomap独自の低頂点 Polygon です。 (Evidence: `azuchijo:evidence:omi-shape`)
  - `identity`: `approximate` — 拠点城郭網から推定した勢力圏の仮説表示であり、単一の確定領域を主張しません。 (Evidence: `azuchijo:evidence:omi-control`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:omi-control` | citation | identity, location, temporal | 近江支配と琵琶湖岸の拠点城郭に関する解説 | `azuchijo:source:omi-control` |
  - `azuchijo:evidence:omi-control` — 信長の上洛後の近江支配、1576年の安土城築城、琵琶湖岸の拠点城郭網が近江全体の支配を目的としたという引用メタデータ。行政境界や精密な実効支配範囲を示す資料ではありません。
| `azuchijo:evidence:omi-shape` | derived-geometry | geometry, location | 近江支配の拠点網 Polygon の作成方法と限界 | `azuchijo:source:shape-notes` |
  - `azuchijo:evidence:omi-shape` — 滋賀県の拠点城郭・近江全体という説明を、琵琶湖岸の拠点網を囲む少数の頂点へ置き換えたChronomap独自の概略復元。行政境界・国境・実効支配の精密な面ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `azuchijo:source:omi-control`: 滋賀県『近江戦国探訪ガイドブック』 — 近江戦国探訪ガイドブック; 作成者: 滋賀県; 2018年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.shiga.lg.jp/documents/2540/5161509_1.pdf
  - `azuchijo:source:shape-notes`: Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 — 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md

### `azuchijo:version:omi-sphere-1576-lakeshore`

- 地物: 織田信長の近江支配の拠点網（湖岸拠点案・1576〜1582年頃・概略） (`azuchijo:entity:omi-sphere`)
- geometry: `Polygon`
- 年代: 1576–1582年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県（引用メタデータ） — 外部本文・図版・地図画像は再現しない。領域は行政境界・国境の確定図ではない。
- 不確実性:
  - `temporal`: `approximate` — 安土城築城開始から本能寺の変までの、信長を中心とする近江支配の拠点網を概略期間で示します。 (Evidence: `azuchijo:evidence:omi-control`)
  - `location`: `approximate` — 琵琶湖岸の拠点城郭の相対関係を重視した概略面です。 (Evidence: `azuchijo:evidence:omi-control`, `azuchijo:evidence:omi-shape`)
  - `geometry`: `approximate` — 行政境界・国境・実効支配の精密な面ではなく、Chronomap独自の低頂点 Polygon です。 (Evidence: `azuchijo:evidence:omi-shape`)
  - `identity`: `approximate` — 拠点城郭網から推定した勢力圏の別仮説であり、単一の確定領域を主張しません。 (Evidence: `azuchijo:evidence:omi-control`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:omi-control` | citation | identity, location, temporal | 近江支配と琵琶湖岸の拠点城郭に関する解説 | `azuchijo:source:omi-control` |
  - `azuchijo:evidence:omi-control` — 信長の上洛後の近江支配、1576年の安土城築城、琵琶湖岸の拠点城郭網が近江全体の支配を目的としたという引用メタデータ。行政境界や精密な実効支配範囲を示す資料ではありません。
| `azuchijo:evidence:omi-shape` | derived-geometry | geometry, location | 近江支配の拠点網 Polygon の作成方法と限界 | `azuchijo:source:shape-notes` |
  - `azuchijo:evidence:omi-shape` — 滋賀県の拠点城郭・近江全体という説明を、琵琶湖岸の拠点網を囲む少数の頂点へ置き換えたChronomap独自の概略復元。行政境界・国境・実効支配の精密な面ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `azuchijo:source:omi-control`: 滋賀県『近江戦国探訪ガイドブック』 — 近江戦国探訪ガイドブック; 作成者: 滋賀県; 2018年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.shiga.lg.jp/documents/2540/5161509_1.pdf
  - `azuchijo:source:shape-notes`: Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 — 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md

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
| `azuchijo:source:omi-control` | 滋賀県『近江戦国探訪ガイドブック』 | 近江戦国探訪ガイドブック; 作成者: 滋賀県; 2018年; 参照日: 2026-10-04; https://www.pref.shiga.lg.jp/documents/2540/5161509_1.pdf | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |
| `azuchijo:source:omi-polity-shape` | Chronomap『安土城・近江支配政治中枢形状作成メモ』 | 安土城・近江支配政治中枢形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-omi-polity-shape-notes.md | open-license; 表示: Chronomap contributors | 独自の概略復元メモ。 |
| `azuchijo:source:omi8-castle` | 近江八幡市観光物産協会『安土城跡』 | 安土城跡; 作成者: 近江八幡市観光物産協会; 2026年; 参照日: 2026-10-02; https://www.omi8.com/spot/detail_1217.html | restricted | 引用メタデータのみ。本文・写真・地図画像は再現しない。 |
| `azuchijo:source:shape-notes` | Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 | 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md | open-license; 表示: Chronomap contributors | 公開メタデータから作成した概略復元メモ。 |
| `azuchijo:source:shiga-biwako-human` | 滋賀県『琵琶湖と人の長いつきあい』 | 琵琶湖と人の長いつきあい; 作成者: 滋賀県; 2018年; 参照日: 2026-10-02; https://www.pref.shiga.lg.jp/biwakatsu/20521.html | restricted | 引用メタデータのみ。本文・写真・図版は再現しない。 |
| `azuchijo:source:shiga-castle` | 滋賀県『特別史跡安土城跡の調査と整備』 | 特別史跡安土城跡の調査と整備; 作成者: 滋賀県; 2026年; 参照日: 2026-10-02; https://www.pref.shiga.lg.jp/sd00/2591.html | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
