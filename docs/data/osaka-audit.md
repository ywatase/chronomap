# データ監査: 大坂・石山本願寺と河内湾パイロット

- データセットID: `osaka:dataset:ishiyama-pilot`
- 既定言語: `ja`
- 公開FeatureVersion: 5
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `osaka:version:ishiyama-honganji-1533` | 石山（大坂）本願寺（1533〜1580年・代表点） | Point | 1533–1580年 | open-license |
| `osaka:version:ishiyama-teramachi-1533` | 石山本願寺寺内町（1533〜1580年・概略） | Polygon | 1533–1580年 | open-license |
| `osaka:version:kawachi-bay-300` | 河内湾・河内湖（古代・概略面） | Polygon | -1000–300年 | open-license |
| `osaka:version:watanabe-port-1496` | 渡辺津（中世・代表点） | Point | 1400–1580年 | open-license |
| `osaka:version:yodo-watercourse-1533` | 淀川水運（1533年頃・概略線） | LineString | 1533–1580年 | open-license |

### `osaka:version:ishiyama-honganji-1533`

- 地物: 石山（大坂）本願寺（1533〜1580年・代表点） (`osaka:entity:ishiyama-honganji`)
- geometry: `Point`
- 年代: 1533–1580年
- 権利: `open-license` — 表示: Chronomap（概略復元）、大阪市中央区（引用メタデータ） — 外部資料の本文・写真・図版は再現しない。代表点は精密な寺域境界ではない。
- 不確実性:
  - `temporal`: `well-supported` — 大阪市中央区の公式説明にある1533年開山と1580年退去を表示します。 (Evidence: `osaka:evidence:ishiyama`)
  - `location`: `approximate` — 現在の大阪城周辺にあたる石山の代表点です。 (Evidence: `osaka:evidence:ishiyama`, `osaka:evidence:ishiyama-shape`)
  - `geometry`: `approximate` — 代表Pointであり、寺域・濠・土居の精密な境界ではありません。 (Evidence: `osaka:evidence:ishiyama-shape`)
  - `identity`: `well-supported` — 公式説明が扱う石山（大坂）本願寺を示します。 (Evidence: `osaka:evidence:ishiyama`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka:evidence:ishiyama` | citation | identity, location, temporal | 石山（大坂）本願寺の1533年開山、濠・土居に囲まれた寺内町、1580年退去の説明 | `osaka:source:ishiyama-site` |
  - `osaka:evidence:ishiyama` — 大阪市中央区の公式説明を引用メタデータとして使用します。現在の大阪城周辺で地形が改変され、当時の精密な境界が残らないことも含みます。
| `osaka:evidence:ishiyama-shape` | derived-geometry | geometry, location | 石山本願寺代表点・寺内町Polygonの作成方法と限界 | `osaka:source:shape-notes` |
  - `osaka:evidence:ishiyama-shape` — 公式ページの現在地住所と上町台地の説明を、代表点と低頂点Polygonへ置き換えました。寺域、濠、土居、町割の精密な範囲ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `osaka:source:ishiyama-site`: 大阪市中央区『石山（大坂）本願寺推定地』 — 石山（大坂）本願寺推定地; 作成者: 大阪市中央区; 2026年; 参照日: 2026-10-04 — rights: `restricted` — https://www.city.osaka.lg.jp/chuo/page/0000641506.html
  - `osaka:source:shape-notes`: Chronomap『大坂・石山本願寺と河内湾形状作成メモ』 — 大坂・石山本願寺と河内湾形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-shape-notes.md

### `osaka:version:ishiyama-teramachi-1533`

- 地物: 石山本願寺寺内町（1533〜1580年・概略） (`osaka:entity:ishiyama-teramachi`)
- geometry: `Polygon`
- 年代: 1533–1580年
- 権利: `open-license` — 表示: Chronomap（概略復元）、大阪市中央区（引用メタデータ） — 外部資料の本文・写真・図版は再現しない。Polygonは寺内町の精密境界ではない。
- 不確実性:
  - `temporal`: `approximate` — 本願寺の開山から退去までの寺内町の活動時期を、同じ概略期間で示します。 (Evidence: `osaka:evidence:ishiyama`)
  - `location`: `approximate` — 上町台地北端の寺内町という相対位置を概略面で示します。 (Evidence: `osaka:evidence:ishiyama`, `osaka:evidence:ishiyama-shape`)
  - `geometry`: `approximate` — 低頂点Polygonで、寺内町の町割・屋敷・道路・境界を精密復元しません。 (Evidence: `osaka:evidence:ishiyama-shape`)
  - `identity`: `well-supported` — 石山本願寺に付随する寺内町という歴史文脈を示します。 (Evidence: `osaka:evidence:ishiyama`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka:evidence:ishiyama` | citation | identity, location, temporal | 石山（大坂）本願寺の1533年開山、濠・土居に囲まれた寺内町、1580年退去の説明 | `osaka:source:ishiyama-site` |
  - `osaka:evidence:ishiyama` — 大阪市中央区の公式説明を引用メタデータとして使用します。現在の大阪城周辺で地形が改変され、当時の精密な境界が残らないことも含みます。
| `osaka:evidence:ishiyama-shape` | derived-geometry | geometry, location | 石山本願寺代表点・寺内町Polygonの作成方法と限界 | `osaka:source:shape-notes` |
  - `osaka:evidence:ishiyama-shape` — 公式ページの現在地住所と上町台地の説明を、代表点と低頂点Polygonへ置き換えました。寺域、濠、土居、町割の精密な範囲ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `osaka:source:ishiyama-site`: 大阪市中央区『石山（大坂）本願寺推定地』 — 石山（大坂）本願寺推定地; 作成者: 大阪市中央区; 2026年; 参照日: 2026-10-04 — rights: `restricted` — https://www.city.osaka.lg.jp/chuo/page/0000641506.html
  - `osaka:source:shape-notes`: Chronomap『大坂・石山本願寺と河内湾形状作成メモ』 — 大坂・石山本願寺と河内湾形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-shape-notes.md

### `osaka:version:kawachi-bay-300`

- 地物: 河内湾・河内湖（古代・概略面） (`osaka:entity:kawachi-bay`)
- geometry: `Polygon`
- 年代: -1000–300年
- 権利: `open-license` — 表示: Chronomap（概略復元）、大阪府（引用メタデータ） — 外部資料の本文・図版・地図画像は再現しない。概略面は正確な古代海岸線ではない。
- 不確実性:
  - `temporal`: `approximate` — 河内湾・河内湖の形成と縮小を、古代の広い時期を代表する表示年で示します。 (Evidence: `osaka:evidence:kawachi-bay`)
  - `location`: `approximate` — 上町台地東側の水域という相対位置を概略面で示します。 (Evidence: `osaka:evidence:kawachi-bay`, `osaka:evidence:kawachi-bay-shape`)
  - `geometry`: `approximate` — 少数頂点で作った概略面で、古代の正確な海岸線・水深・水面ではありません。 (Evidence: `osaka:evidence:kawachi-bay-shape`)
  - `identity`: `well-supported` — 大阪府資料が説明する河内湾・河内湖の地形文脈を示します。 (Evidence: `osaka:evidence:kawachi-bay`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka:evidence:kawachi-bay` | citation | identity, location, temporal | 大阪湾・河内湾・河内湖の形成と古代の海岸線に関する歴史説明 | `osaka:source:bay-vision` |
  - `osaka:evidence:kawachi-bay` — 大阪府資料が説明する、海水面変化と河内湾・河内湖の地形変化を引用メタデータとして使用します。正確な古代海岸線や水深を示す資料ではありません。
| `osaka:evidence:kawachi-bay-shape` | derived-geometry | geometry, location | 河内湾・河内湖Polygonの作成方法と限界 | `osaka:source:shape-notes` |
  - `osaka:evidence:kawachi-bay-shape` — 大阪府の地形説明と上町台地・東部大阪の相対関係を、少数頂点の概略面へ置き換えました。古代の正確な海岸線・水深・水面ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `osaka:source:bay-vision`: 大阪府『大阪広域ベイエリアまちづくりビジョン（素案）』 — 大阪広域ベイエリアまちづくりビジョン（素案）; 作成者: 大阪府; 2021年; 参照日: 2026-10-04 — rights: `restricted` — https://www.pref.osaka.lg.jp/documents/2275/0520shiryou1-2_2.pdf
  - `osaka:source:shape-notes`: Chronomap『大坂・石山本願寺と河内湾形状作成メモ』 — 大坂・石山本願寺と河内湾形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-shape-notes.md

### `osaka:version:watanabe-port-1496`

- 地物: 渡辺津（中世・代表点） (`osaka:entity:watanabe-port`)
- geometry: `Point`
- 年代: 1400–1580年
- 権利: `open-license` — 表示: Chronomap（概略復元）、大阪市（引用メタデータ） — 外部資料の本文・写真・図版は再現しない。代表点は港域や岸線の精密位置ではない。
- 不確実性:
  - `temporal`: `approximate` — 中世の水運拠点を1496年前後の表示年で読むための代表期間です。港の全歴史期間を確定しません。 (Evidence: `osaka:evidence:watanabe`)
  - `location`: `approximate` — 天満橋から北浜南岸という公式説明の相対位置を代表点で示します。 (Evidence: `osaka:evidence:watanabe`, `osaka:evidence:watanabe-shape`)
  - `geometry`: `approximate` — 代表Pointであり、港域・岸線・船着場・航路の精密な位置ではありません。 (Evidence: `osaka:evidence:watanabe-shape`)
  - `identity`: `well-supported` — 大阪市の歴史説明が扱う渡辺津を示します。 (Evidence: `osaka:evidence:watanabe`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka:evidence:watanabe` | citation | identity, location, temporal | 天満橋から北浜南岸にあった渡辺津と、熊野詣・水運の説明 | `osaka:source:city-history` |
  - `osaka:evidence:watanabe` — 大阪市の歴史説明にある渡辺津の位置関係と交通上の役割を引用メタデータとして使用します。港域や船着場の正確な位置は示しません。
| `osaka:evidence:watanabe-shape` | derived-geometry | geometry, location | 渡辺津代表Pointの作成方法と限界 | `osaka:source:shape-notes` |
  - `osaka:evidence:watanabe-shape` — 天満橋・北浜南岸という説明の相対位置を代表Pointへ置き換えました。港域、岸線、船着場、航路の精密な位置ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `osaka:source:city-history`: 大阪市『大阪市の歴史－タイムトリップ20,000年（飛鳥・奈良時代以降）』 — 大阪市の歴史－タイムトリップ20,000年（飛鳥・奈良時代以降）; 作成者: 大阪市; 2026年; 参照日: 2026-10-04 — rights: `restricted` — https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000010252.html
  - `osaka:source:shape-notes`: Chronomap『大坂・石山本願寺と河内湾形状作成メモ』 — 大坂・石山本願寺と河内湾形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-shape-notes.md

### `osaka:version:yodo-watercourse-1533`

- 地物: 淀川水運（1533年頃・概略線） (`osaka:entity:yodo-watercourse`)
- geometry: `LineString`
- 年代: 1533–1580年
- 権利: `open-license` — 表示: Chronomap（概略復元）、大阪市（引用メタデータ） — 外部資料の本文・写真・図版は再現しない。LineStringは歴史河道・航路の精密復元ではない。
- 不確実性:
  - `temporal`: `approximate` — 石山本願寺期の大阪と京都をつなぐ水運文脈を、1533年頃の表示年に置きます。 (Evidence: `osaka:evidence:yodo`)
  - `location`: `approximate` — 大阪から淀川上流へ向かう相対関係を概略線で示します。 (Evidence: `osaka:evidence:yodo`, `osaka:evidence:yodo-shape`)
  - `geometry`: `approximate` — 少数頂点の概略線で、歴史的な河道中心線・航路・距離ではありません。 (Evidence: `osaka:evidence:yodo-shape`)
  - `identity`: `well-supported` — 大阪市の歴史説明が扱う淀川水運と京都への交通関係を示します。 (Evidence: `osaka:evidence:yodo`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `osaka:evidence:yodo` | citation | identity, location, temporal | 淀川・大和川による水運と、京都へつながる交通の要所という説明 | `osaka:source:city-history` |
  - `osaka:evidence:yodo` — 大阪市の歴史説明を引用メタデータとして使用します。表示線は実際の河道中心線・航路・距離を示しません。
| `osaka:evidence:yodo-shape` | derived-geometry | geometry, location | 淀川水運概略LineStringの作成方法と限界 | `osaka:source:shape-notes` |
  - `osaka:evidence:yodo-shape` — 大阪市の交通説明を上町台地北端と淀川の相対関係に置き換えた概略線です。歴史的な河道中心線・航路ではありません。 (publicationBasis: `original-reconstruction`)

- Source:

  - `osaka:source:city-history`: 大阪市『大阪市の歴史－タイムトリップ20,000年（飛鳥・奈良時代以降）』 — 大阪市の歴史－タイムトリップ20,000年（飛鳥・奈良時代以降）; 作成者: 大阪市; 2026年; 参照日: 2026-10-04 — rights: `restricted` — https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000010252.html
  - `osaka:source:shape-notes`: Chronomap『大坂・石山本願寺と河内湾形状作成メモ』 — 大坂・石山本願寺と河内湾形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-shape-notes.md

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `osaka:source:bay-vision` | 大阪府『大阪広域ベイエリアまちづくりビジョン（素案）』 | 大阪広域ベイエリアまちづくりビジョン（素案）; 作成者: 大阪府; 2021年; 参照日: 2026-10-04; https://www.pref.osaka.lg.jp/documents/2275/0520shiryou1-2_2.pdf | restricted | 引用メタデータのみ。PDF本文・図版・地図画像は再現しない。 |
| `osaka:source:city-history` | 大阪市『大阪市の歴史－タイムトリップ20,000年（飛鳥・奈良時代以降）』 | 大阪市の歴史－タイムトリップ20,000年（飛鳥・奈良時代以降）; 作成者: 大阪市; 2026年; 参照日: 2026-10-04; https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000010252.html | restricted | 引用メタデータのみ。ページ本文・写真・図版は再現しない。 |
| `osaka:source:ishiyama-site` | 大阪市中央区『石山（大坂）本願寺推定地』 | 石山（大坂）本願寺推定地; 作成者: 大阪市中央区; 2026年; 参照日: 2026-10-04; https://www.city.osaka.lg.jp/chuo/page/0000641506.html | restricted | 引用メタデータのみ。本文・写真・説明板画像は再現しない。 |
| `osaka:source:shape-notes` | Chronomap『大坂・石山本願寺と河内湾形状作成メモ』 | 大坂・石山本願寺と河内湾形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-10-04; https://github.com/ywatase/chronomap/blob/main/docs/data/osaka-shape-notes.md | open-license; 表示: Chronomap contributors | 公開メタデータから作成した概略復元メモ。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
