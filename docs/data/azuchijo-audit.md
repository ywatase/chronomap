# データ監査: 安土城・琵琶湖東岸パイロット

- データセットID: `azuchijo:dataset:pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 14
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `azuchijo:version:azuchi-settlement-1576` | 安土城下町（推定範囲・1576〜1582年頃） | Polygon | 1576–1582年 | open-license |
| `azuchijo:version:castle-1576` | 安土城（1576年・築城開始） | Point | 1576年 | open-license |
| `azuchijo:version:castle-1579` | 安土城（1579年・完成） | Point | 1579年 | open-license |
| `azuchijo:version:castle-1582` | 安土城（1582年・主郭部焼失後） | Point | 1582年 | open-license |
| `azuchijo:version:jyorakuji-port-1576` | 常楽寺湊（安土城下の港・1576年頃） | Point | 1576–1582年 | open-license |
| `azuchijo:version:lakeshore-1576` | 琵琶湖東岸（安土付近・概略） | LineString | 1576年以降 | open-license |
| `azuchijo:version:mountain-1576` | 安土山（1576年・代表点） | Point | 1576年以降 | open-license |
| `azuchijo:version:omi-polity-1576-azuchi` | 織田信長の近江支配・安土政治中枢（1576〜1582年頃・安土城中心案） | Polygon | 1576–1582年 | open-license |
| `azuchijo:version:omi-polity-1576-townshore` | 織田信長の近江支配・安土政治中枢（1576〜1582年頃・城下町・湖岸を含む案） | Polygon | 1576–1582年 | open-license |
| `azuchijo:version:omi-sphere-1576-broad` | 織田信長の近江支配の拠点網（1576〜1582年頃・概略） | Polygon | 1576–1582年 | open-license |
| `azuchijo:version:omi-sphere-1576-lakeshore` | 織田信長の近江支配の拠点網（湖岸拠点案・1576〜1582年頃・概略） | Polygon | 1576–1582年 | open-license |
| `azuchijo:version:shizugatake-battlefield-1583` | 賤ヶ岳古戦場（1583年・代表点） | Point | 1583年 | open-license |
| `azuchijo:version:water-transport-1576` | 安土城と湖上交通の関係（1576年頃・概略） | LineString | 1576年以降 | open-license |
| `azuchijo:version:yogo-lake-1576` | 余呉湖（歴史文脈・1576〜1583年頃） | Polygon | 1576年以降 | open-license |

### `azuchijo:version:azuchi-settlement-1576`

- 地物: 安土城下町（推定範囲・1576〜1582年頃） (`azuchijo:entity:azuchi-settlement`)
- geometry: `Polygon`
- 年代: 1576–1582年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県（引用メタデータ） — 外部本文・図版・地図画像は再現しない。城下町の街区・屋敷・道路・集落境界の精密な面ではない。
- 不確実性:
  - `temporal`: `approximate` — 安土城築城開始から本能寺の変までの城下町形成を概略期間で示します。前史・廃城後・現在の市街地は含めません。 (Evidence: `azuchijo:evidence:omi-settlement`)
  - `location`: `approximate` — 安土山西麓、城下町、常楽寺湊の相対関係を示す概略面です。 (Evidence: `azuchijo:evidence:omi-settlement`, `azuchijo:evidence:omi-settlement-shape`)
  - `geometry`: `approximate` — 城下町の街区・屋敷・道路・集落境界や遺構の精密な面ではなく、Chronomap独自の低頂点Polygonです。 (Evidence: `azuchijo:evidence:omi-settlement-shape`)
  - `identity`: `well-supported` — 滋賀県資料が説明する安土城下町跡（推定）の関係を示します。 (Evidence: `azuchijo:evidence:omi-settlement`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:omi-settlement` | citation | identity, location, temporal | 安土城築城に伴う城下町跡（推定）の範囲と周辺集落の説明 | `azuchijo:source:jyorakuji-port` |
  - `azuchijo:evidence:omi-settlement` — 滋賀県資料が説明する安土城下町跡（推定）の範囲と、安土山西麓・常楽寺・下豊浦の関係。城下町の街区や集落境界の精密な面を示す資料ではありません。
| `azuchijo:evidence:omi-settlement-shape` | derived-geometry | geometry, location | 安土城下町推定Polygonの作成方法と限界 | `azuchijo:source:azuchi-settlement-shape` |
  - `azuchijo:evidence:omi-settlement-shape` — 安土山・城下町・常楽寺湊の相対関係と公開資料の推定範囲を、少数頂点のPolygonへ置き換えたChronomap独自の概略復元。行政境界、町割、屋敷地、道路、遺構の精密な範囲ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `azuchijo:source:azuchi-settlement-shape`: Chronomap『安土城下町推定範囲形状作成メモ』 — 安土城下町推定範囲形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-settlement-shape-notes.md
  - `azuchijo:source:jyorakuji-port`: 滋賀県（安土城跡周辺の城下町ゾーン資料） — 安土城跡周辺の城下町ゾーン資料; 作成者: 滋賀県; 2022年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.shiga.lg.jp/file/attachment/5310843.pdf

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

### `azuchijo:version:jyorakuji-port-1576`

- 地物: 常楽寺湊（安土城下の港・1576年頃） (`azuchijo:entity:jyorakuji-port`)
- geometry: `Point`
- 年代: 1576–1582年
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県（引用メタデータ） — 外部本文・図版・地図画像は再現しない。港域・岸線・船着場・航路の精密な位置ではない。
- 不確実性:
  - `temporal`: `approximate` — 安土城築城開始から本能寺の変までの港の役割を概略期間で示します。常楽寺湊の全歴史期間ではありません。 (Evidence: `azuchijo:evidence:omi-port`)
  - `location`: `approximate` — 安土城下と常楽寺湊の相対関係を示す代表点です。 (Evidence: `azuchijo:evidence:omi-port`, `azuchijo:evidence:omi-port-shape`)
  - `geometry`: `approximate` — 港域、岸線、船着場、航路の精密な位置ではない代表Pointです。 (Evidence: `azuchijo:evidence:omi-port-shape`)
  - `identity`: `well-supported` — 滋賀県資料が説明する安土城下の常楽寺湊を示します。 (Evidence: `azuchijo:evidence:omi-port`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:omi-port` | citation | identity, location, temporal | 常楽寺湊の城下町・物資輸送・交易・軍事上の位置づけ | `azuchijo:source:jyorakuji-port` |
  - `azuchijo:evidence:omi-port` — 滋賀県資料が説明する、安土城築城に伴う常楽寺湊の物資輸送・交易・軍事の拠点性と、琵琶湖水運との結節関係。港域や船着場の正確な座標を示す資料ではありません。
| `azuchijo:evidence:omi-port-shape` | derived-geometry | geometry, location | 常楽寺湊代表Pointの作成方法と限界 | `azuchijo:source:jyorakuji-port-shape` |
  - `azuchijo:evidence:omi-port-shape` — 安土城・城下町・西の湖／常楽寺湊の相対関係を、港の代表Pointへ置き換えたChronomap独自の概略復元。港域、岸線、船着場、航路の精密な位置ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `azuchijo:source:jyorakuji-port`: 滋賀県（安土城跡周辺の城下町ゾーン資料） — 安土城跡周辺の城下町ゾーン資料; 作成者: 滋賀県; 2022年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.shiga.lg.jp/file/attachment/5310843.pdf
  - `azuchijo:source:jyorakuji-port-shape`: Chronomap『常楽寺湊代表点形状作成メモ』 — 常楽寺湊代表点形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-jyorakuji-port-shape-notes.md

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

### `azuchijo:version:shizugatake-battlefield-1583`

- 地物: 賤ヶ岳古戦場（1583年・代表点） (`azuchijo:entity:shizugatake-battlefield`)
- geometry: `Point`
- 年代: 1583年
- 権利: `open-license` — 表示: Chronomap（概略復元）、長浜市（引用メタデータ） — 外部本文・図版・地図画像は再現しない。戦場全体・陣地・戦線の精密な位置ではない。
- 不確実性:
  - `temporal`: `well-supported` — 長浜市資料が説明する天正11年（1583年）の合戦を単年で表示します。 (Evidence: `azuchijo:evidence:shizugatake`)
  - `location`: `approximate` — 賤ヶ岳古戦場の広域コンテキストを読み始める代表点で、戦場全体や各砦の位置ではありません。 (Evidence: `azuchijo:evidence:shizugatake`, `azuchijo:evidence:shizugatake-shape`)
  - `geometry`: `approximate` — 余呉湖周辺の賤ヶ岳付近へ置いた代表Pointで、戦線・陣地・交戦範囲の精密な形状ではありません。 (Evidence: `azuchijo:evidence:shizugatake-shape`)
  - `identity`: `well-supported` — 長浜市資料が説明する賤ヶ岳古戦場を示します。 (Evidence: `azuchijo:evidence:shizugatake`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:shizugatake` | citation | identity, location, temporal | 余呉湖周辺の賤ヶ岳城塞群と古戦場、天正11年（1583年）の羽柴秀吉・柴田勝家の合戦 | `azuchijo:source:shizugatake-battlefield` |
  - `azuchijo:evidence:shizugatake` — 長浜市資料が説明する、余呉湖周辺から木之本・柳ヶ瀬に広がる賤ヶ岳古戦場と1583年の合戦。単一の戦線・陣地配置・戦場境界の精密な位置を示す資料ではありません。
| `azuchijo:evidence:shizugatake-shape` | derived-geometry | geometry, location | 賤ヶ岳古戦場代表Pointの作成方法と限界 | `azuchijo:source:shizugatake-shape` |
  - `azuchijo:evidence:shizugatake-shape` — 公開資料が示す賤ヶ岳・余呉湖周辺の相対関係を、古戦場を読み始めるための代表Pointへ置き換えたChronomap独自の概略復元。戦場全体、陣地、砦、行軍路、交戦範囲の精密な位置ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `azuchijo:source:shizugatake-battlefield`: 長浜市『長浜市歴史文化基本構想 第4章』 — 長浜市歴史文化基本構想 第4章; 作成者: 長浜市; 2019年; 参照日: 2026-10-04 — rights: `restricted` — https://www.city.nagahama.lg.jp/cmsfiles/contents/0000008/8691/4s2-1.pdf
  - `azuchijo:source:shizugatake-shape`: Chronomap『賤ヶ岳古戦場代表点形状作成メモ』 — 賤ヶ岳古戦場代表点形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shizugatake-battlefield-shape-notes.md

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

### `azuchijo:version:yogo-lake-1576`

- 地物: 余呉湖（歴史文脈・1576〜1583年頃） (`azuchijo:entity:yogo-lake`)
- geometry: `Polygon`
- 年代: 1576年以降
- 権利: `open-license` — 表示: Chronomap（概略復元）、滋賀県（引用メタデータ） — 外部本文・写真・図版・地図画像は再現しない。歴史的な湖岸線・湖面積・水深・堤体・水位の精密な形状ではない。
- 不確実性:
  - `temporal`: `approximate` — 現在の余呉湖を1576〜1583年頃の教材上の地理文脈へ置いています。余呉湖自体の形成・利用史や1583年の水面を確定しません。 (Evidence: `azuchijo:evidence:yogo-lake`)
  - `location`: `approximate` — 余呉湖と賤ヶ岳古戦場の相対関係を読むための概略面です。 (Evidence: `azuchijo:evidence:yogo-lake`, `azuchijo:evidence:yogo-lake-shape`)
  - `geometry`: `approximate` — 現在位置を少数頂点へ置いたPolygonで、歴史的な湖岸線・湖面積・水深・堤体・水位の精密な形状ではありません。 (Evidence: `azuchijo:evidence:yogo-lake-shape`)
  - `identity`: `well-supported` — 滋賀県資料が説明する余呉湖の現在位置と周辺地形を示します。 (Evidence: `azuchijo:evidence:yogo-lake`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `azuchijo:evidence:yogo-lake` | citation | identity, location, temporal | 余呉湖の自然湖としての位置、賤ヶ岳によって琵琶湖と隔てられた地形、余呉川からの導水・放水路の説明 | `azuchijo:source:yogo-lake` |
  - `azuchijo:evidence:yogo-lake` — 滋賀県資料が説明する現在の余呉湖と周辺地形・水利用。1576〜1583年頃という表示は教材上の地理文脈であり、1583年の水面や過去の湖岸線を特定する資料ではありません。
| `azuchijo:evidence:yogo-lake-shape` | derived-geometry | geometry, location | 余呉湖歴史文脈Polygonの作成方法と限界 | `azuchijo:source:yogo-lake-shape` |
  - `azuchijo:evidence:yogo-lake-shape` — 余呉湖の現在位置と賤ヶ岳・余呉川周辺の相対関係を、教材上の歴史文脈で読む低頂点Polygonへ置き換えたChronomap独自の概略復元。歴史的な湖岸線、湖面積、水深、堤体、水位、治水施設の精密な形状ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `azuchijo:source:yogo-lake`: 滋賀県『余呉湖（よごこ）』 — 余呉湖（よごこ）; 作成者: 滋賀県; 2026年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.shiga.lg.jp/ha04/1427.html
  - `azuchijo:source:yogo-lake-shape`: Chronomap『余呉湖歴史文脈形状作成メモ』 — 余呉湖歴史文脈形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-yogo-lake-shape-notes.md

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `azuchijo:source:azuchi-settlement-shape` | Chronomap『安土城下町推定範囲形状作成メモ』 | 安土城下町推定範囲形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-settlement-shape-notes.md | open-license; 表示: Chronomap contributors | 独自の概略復元メモ。 |
| `azuchijo:source:jyorakuji-port` | 滋賀県（安土城跡周辺の城下町ゾーン資料） | 安土城跡周辺の城下町ゾーン資料; 作成者: 滋賀県; 2022年; 参照日: 2026-10-04; https://www.pref.shiga.lg.jp/file/attachment/5310843.pdf | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |
| `azuchijo:source:jyorakuji-port-shape` | Chronomap『常楽寺湊代表点形状作成メモ』 | 常楽寺湊代表点形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-jyorakuji-port-shape-notes.md | open-license; 表示: Chronomap contributors | 独自の概略復元メモ。 |
| `azuchijo:source:omi-control` | 滋賀県『近江戦国探訪ガイドブック』 | 近江戦国探訪ガイドブック; 作成者: 滋賀県; 2018年; 参照日: 2026-10-04; https://www.pref.shiga.lg.jp/documents/2540/5161509_1.pdf | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |
| `azuchijo:source:omi-polity-shape` | Chronomap『安土城・近江支配政治中枢形状作成メモ』 | 安土城・近江支配政治中枢形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-omi-polity-shape-notes.md | open-license; 表示: Chronomap contributors | 独自の概略復元メモ。 |
| `azuchijo:source:omi8-castle` | 近江八幡市観光物産協会『安土城跡』 | 安土城跡; 作成者: 近江八幡市観光物産協会; 2026年; 参照日: 2026-10-02; https://www.omi8.com/spot/detail_1217.html | restricted | 引用メタデータのみ。本文・写真・地図画像は再現しない。 |
| `azuchijo:source:shape-notes` | Chronomap『安土城・琵琶湖東岸パイロット形状作成メモ』 | 安土城・琵琶湖東岸パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-02; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shape-notes.md | open-license; 表示: Chronomap contributors | 公開メタデータから作成した概略復元メモ。 |
| `azuchijo:source:shiga-biwako-human` | 滋賀県『琵琶湖と人の長いつきあい』 | 琵琶湖と人の長いつきあい; 作成者: 滋賀県; 2018年; 参照日: 2026-10-02; https://www.pref.shiga.lg.jp/biwakatsu/20521.html | restricted | 引用メタデータのみ。本文・写真・図版は再現しない。 |
| `azuchijo:source:shiga-castle` | 滋賀県『特別史跡安土城跡の調査と整備』 | 特別史跡安土城跡の調査と整備; 作成者: 滋賀県; 2026年; 参照日: 2026-10-02; https://www.pref.shiga.lg.jp/sd00/2591.html | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |
| `azuchijo:source:shizugatake-battlefield` | 長浜市『長浜市歴史文化基本構想 第4章』 | 長浜市歴史文化基本構想 第4章; 作成者: 長浜市; 2019年; 参照日: 2026-10-04; https://www.city.nagahama.lg.jp/cmsfiles/contents/0000008/8691/4s2-1.pdf | restricted | 引用メタデータのみ。本文・図版・地図画像は再現しない。 |
| `azuchijo:source:shizugatake-shape` | Chronomap『賤ヶ岳古戦場代表点形状作成メモ』 | 賤ヶ岳古戦場代表点形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-shizugatake-battlefield-shape-notes.md | open-license; 表示: Chronomap contributors | 独自の概略復元メモ。 |
| `azuchijo:source:yogo-lake` | 滋賀県『余呉湖（よごこ）』 | 余呉湖（よごこ）; 作成者: 滋賀県; 2026年; 参照日: 2026-10-04; https://www.pref.shiga.lg.jp/ha04/1427.html | restricted | 引用メタデータのみ。本文・写真・地図画像は再現しない。 |
| `azuchijo:source:yogo-lake-shape` | Chronomap『余呉湖歴史文脈形状作成メモ』 | 余呉湖歴史文脈形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04; https://github.com/ywatase/chronomap/blob/main/docs/data/azuchijo-yogo-lake-shape-notes.md | open-license; 表示: Chronomap contributors | 独自の概略復元メモ。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
