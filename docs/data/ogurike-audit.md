# データ監査: 巨椋池パイロットデータ

- データセットID: `ogurike:dataset:pilot-2026`
- 既定言語: `ja`
- 公開FeatureVersion: 8
- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ

## FeatureVersion監査

| FeatureVersion | 地物 | geometry | 年代 | 権利 |
|---|---|---|---|---|
| `ogurike:version:reclamation-monument-1942` | 巨椋池干拓之碑（1942年） | Point | 1942年以降 | open-license |
| `ogurike:version:ujigawa-1590` | 宇治川（1590年・工事前） | LineString | 1590年 | open-license |
| `ogurike:version:ujigawa-1596` | 宇治川（1596年・工事後） | LineString | 1596年 | open-license |
| `ogurike:version:waterbody-1590` | 巨椋池（1590年・工事前の概略） | Polygon | 1590年 | open-license |
| `ogurike:version:waterbody-1596` | 巨椋池（1596年・工事後の概略） | Polygon | 1596年 | open-license |
| `ogurike:version:waterbody-1885` | 巨椋池（1885年・工事前の概略） | MultiPolygon | 1885年 | open-license |
| `ogurike:version:waterbody-1910` | 巨椋池（1910年・概略） | Polygon | 1910年 | open-license |
| `ogurike:version:waterbody-1933` | 巨椋池（1933年・概略） | MultiPolygon | 1933年 | open-license |

### `ogurike:version:reclamation-monument-1942`

- 地物: 巨椋池干拓之碑（1942年） (`ogurike:entity:reclamation-monument`)
- geometry: `Point`
- 年代: 1942年以降
- 権利: `open-license` — 表示: 京都市（引用）、Chronomap（代表点加工） — 京都市Sourceは引用メタデータのみ。代表点はChronomapの概略復元です。
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

  - `ogurike:source:kyoto-city-monument`: 京都市『巨椋池干拓碑』GA015 — 巨椋池干拓碑; 作成者: 京都市; 2014年; 参照日: 2026-09-17 — rights: `restricted` — https://www2.city.kyoto.lg.jp/html/somu/rekishi/fm/ishibumi/html/ga015.html
  - `ogurike:source:shape-notes`: Chronomap『巨椋池パイロット形状作成メモ』 — 巨椋池パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-17 — rights: `open-license`; 表示: Chronomap contributors — https://github.com/ywatase/chronomap/blob/main/docs/data/ogurike-shape-notes.md

### `ogurike:version:ujigawa-1590`

- 地物: 宇治川（1590年・工事前） (`ogurike:entity:ujigawa`)
- geometry: `LineString`
- 年代: 1590年
- 権利: `open-license` — 表示: 国土交通省近畿地方整備局（原資料）、Chronomap（概略加工）、CODH（位置参照）、国土地理院（位置参照） — PDL1.0の出典表示と編集・加工表示を含みます。 CODH形状はCC BY 4.0。国土地理院コンテンツ利用規約に従う。
- 不確実性:
  - `temporal`: `well-supported` (Evidence: `ogurike:evidence:ujigawa-1590-temporal`)
  - `location`: `approximate` — 近畿地整図①の代表線を水域の移動量だけ移し、主水面との概略的な接続関係を保ちました。正確な河道位置ではありません。 (Evidence: `ogurike:evidence:ujigawa-1590-geometry`, `ogurike:evidence:waterbody-location-codh`, `ogurike:evidence:waterbody-location-gsi`)
  - `geometry`: `approximate` — 主水面への流路網の接続関係を示す少数折れ点の代表線であり、完全な網状流路・枝数・正確な河道中心線を示しません。 (Evidence: `ogurike:evidence:ujigawa-1590-geometry`)
  - `identity`: `well-supported` (Evidence: `ogurike:evidence:ujigawa-1590-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:ujigawa-1590-geometry` | derived-geometry | geometry, location | PDF p.2-22 図2.2-1①『秀吉による河川工事前（1590年）』 | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:ujigawa-1590-geometry` — 図①が示す、宇治川・流路網と主水面の接続関係を少数の折れ点へ手動加工した代表線である。周囲の網状河道全体、枝数、正確な河道中心線は示さない。 (publicationBasis: `open-license`)
| `ogurike:evidence:ujigawa-1590-temporal` | citation | identity, location, temporal | PDF p.2-21末尾–p.2-22 図2.2-1① | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:ujigawa-1590-temporal` — 資料図が河川工事前の1590年スナップショットとして示すことを確認する。
| `ogurike:evidence:waterbody-location-codh` | derived-geometry | location | lake_polygon.geojson のID 26007 | `ogurike:source:codh` |
  - `ogurike:evidence:waterbody-location-codh` — CODH ID 26007の推定湖面重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。厳密な歴史位置ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-location-gsi` | derived-geometry | location | drained-01472〜drained-01480（imports/gsi-artificial-land） | `ogurike:source:gsi-artificial-land` |
  - `ogurike:evidence:waterbody-location-gsi` — 巨椋池周辺の干拓地形状の融合重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。GSIデータは歴史位置を直接示さない。 (publicationBasis: `open-license`)

- Source:

  - `ogurike:source:codh`: 『江戸末期湖沼データセット』doi:10.20676/00000467 — 江戸末期湖沼データセット; 作成者: ROIS-DS人文学オープンデータ共同利用センター, 株式会社平凡社地図出版; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 『江戸末期湖沼データセット』doi:10.20676/00000467 — https://codh.rois.ac.jp/historical-gis/edo-lake/
  - `ogurike:source:gsi-artificial-land`: 国土地理院 ベクトルタイル提供実験「地形分類（人工地形）」experimental_landformclassification2 — 地形分類（人工地形）; 作成者: 国土地理院; 2022年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 国土地理院 — https://github.com/gsi-cyberjapan/experimental_landformclassification
  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — 巨椋池周辺の変遷（国土交通省近畿地方整備局）; 作成者: 国土交通省近畿地方整備局; 2012年; 参照日: 2026-09-17 — rights: `open-license`; 表示: 国土交通省近畿地方整備局 — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

### `ogurike:version:ujigawa-1596`

- 地物: 宇治川（1596年・工事後） (`ogurike:entity:ujigawa`)
- geometry: `LineString`
- 年代: 1596年
- 権利: `open-license` — 表示: 国土交通省近畿地方整備局（原資料）、Chronomap（概略加工）、CODH（位置参照）、国土地理院（位置参照） — PDL1.0の出典表示と編集・加工表示を含みます。 CODH形状はCC BY 4.0。国土地理院コンテンツ利用規約に従う。
- 不確実性:
  - `temporal`: `well-supported` (Evidence: `ogurike:evidence:ujigawa-1596-temporal`)
  - `location`: `approximate` — 近畿地整図②に基づき、新しい水域位置の北側へ引き直した概略線です。湖面とは交差せず、正確な河道位置ではありません。 (Evidence: `ogurike:evidence:ujigawa-1596-geometry`, `ogurike:evidence:waterbody-location-codh`, `ogurike:evidence:waterbody-location-gsi`)
  - `geometry`: `approximate` — 主湖面の北～北東側を通る関係だけを示す少数折れ点の概略線であり、精密な河道中心線や堤防線形ではありません。 (Evidence: `ogurike:evidence:ujigawa-1596-geometry`)
  - `identity`: `well-supported` (Evidence: `ogurike:evidence:ujigawa-1596-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:ujigawa-1596-geometry` | derived-geometry | geometry, location | PDF p.2-22 図2.2-1②『秀吉による河川工事後（1596年）』 | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:ujigawa-1596-geometry` — 図②が示す、主湖面から分離して北側を通る流路関係を少数の折れ点へ手動加工した概略線である。精密な河道中心線、堤防線形、接続位置は示さない。 (publicationBasis: `open-license`)
| `ogurike:evidence:ujigawa-1596-temporal` | citation | identity, location, temporal | PDF p.2-21末尾–p.2-22 図2.2-1② | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:ujigawa-1596-temporal` — 資料図が河川工事後の1596年スナップショットとして示すことを確認する。
| `ogurike:evidence:waterbody-location-codh` | derived-geometry | location | lake_polygon.geojson のID 26007 | `ogurike:source:codh` |
  - `ogurike:evidence:waterbody-location-codh` — CODH ID 26007の推定湖面重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。厳密な歴史位置ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-location-gsi` | derived-geometry | location | drained-01472〜drained-01480（imports/gsi-artificial-land） | `ogurike:source:gsi-artificial-land` |
  - `ogurike:evidence:waterbody-location-gsi` — 巨椋池周辺の干拓地形状の融合重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。GSIデータは歴史位置を直接示さない。 (publicationBasis: `open-license`)

- Source:

  - `ogurike:source:codh`: 『江戸末期湖沼データセット』doi:10.20676/00000467 — 江戸末期湖沼データセット; 作成者: ROIS-DS人文学オープンデータ共同利用センター, 株式会社平凡社地図出版; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 『江戸末期湖沼データセット』doi:10.20676/00000467 — https://codh.rois.ac.jp/historical-gis/edo-lake/
  - `ogurike:source:gsi-artificial-land`: 国土地理院 ベクトルタイル提供実験「地形分類（人工地形）」experimental_landformclassification2 — 地形分類（人工地形）; 作成者: 国土地理院; 2022年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 国土地理院 — https://github.com/gsi-cyberjapan/experimental_landformclassification
  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — 巨椋池周辺の変遷（国土交通省近畿地方整備局）; 作成者: 国土交通省近畿地方整備局; 2012年; 参照日: 2026-09-17 — rights: `open-license`; 表示: 国土交通省近畿地方整備局 — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

### `ogurike:version:waterbody-1590`

- 地物: 巨椋池（1590年・工事前の概略） (`ogurike:entity:waterbody`)
- geometry: `Polygon`
- 年代: 1590年
- 権利: `open-license` — 表示: 国土交通省近畿地方整備局（原資料）、Chronomap（概略加工）、CODH（位置参照）、国土地理院（位置参照） — PDL1.0の出典表示と編集・加工表示を含みます。 CODH形状はCC BY 4.0。国土地理院コンテンツ利用規約に従う。
- 不確実性:
  - `temporal`: `well-supported` — 資料図①の年代区分に基づく。 (Evidence: `ogurike:evidence:waterbody-1590-temporal`)
  - `location`: `approximate` — 近畿地整図①の相対形状をCODHとGSIの参照形状の中間位置へ移した概略です。精密な湖岸座標ではありません。 (Evidence: `ogurike:evidence:waterbody-1590-geometry`, `ogurike:evidence:waterbody-location-codh`, `ogurike:evidence:waterbody-location-gsi`)
  - `geometry`: `approximate` — 図①に見える広い主水面の丸みある肩、北縁の複数の入り込み、南岸の凹凸を手動で再構成した概略形状です。表示用の補間頂点は測量精度を意味せず、周囲の網状河道・島・砂州、精密な湖岸・面積・深度も表しません。 (Evidence: `ogurike:evidence:waterbody-1590-geometry`)
  - `identity`: `well-supported` — 資料図①の巨椋池として扱う。 (Evidence: `ogurike:evidence:waterbody-1590-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:waterbody-1590-geometry` | derived-geometry | geometry, location | PDF p.2-22 図2.2-1①『秀吉による河川工事前（1590年）』 | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-1590-geometry` — 図①に見える広い主水面の丸みある肩、北縁の複数の入り込み、南岸の凹凸を手動で再構成した概略形状である。表示用の補間頂点は測量精度を意味しない。周囲の網状河道・島・砂州、精密な湖岸・面積・深度は表さない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-1590-temporal` | citation | identity, temporal | PDF p.2-21末尾–p.2-22 図2.2-1① | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-1590-temporal` — 資料図が河川工事前の1590年スナップショットとして示すことを確認する。
| `ogurike:evidence:waterbody-location-codh` | derived-geometry | location | lake_polygon.geojson のID 26007 | `ogurike:source:codh` |
  - `ogurike:evidence:waterbody-location-codh` — CODH ID 26007の推定湖面重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。厳密な歴史位置ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-location-gsi` | derived-geometry | location | drained-01472〜drained-01480（imports/gsi-artificial-land） | `ogurike:source:gsi-artificial-land` |
  - `ogurike:evidence:waterbody-location-gsi` — 巨椋池周辺の干拓地形状の融合重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。GSIデータは歴史位置を直接示さない。 (publicationBasis: `open-license`)

- Source:

  - `ogurike:source:codh`: 『江戸末期湖沼データセット』doi:10.20676/00000467 — 江戸末期湖沼データセット; 作成者: ROIS-DS人文学オープンデータ共同利用センター, 株式会社平凡社地図出版; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 『江戸末期湖沼データセット』doi:10.20676/00000467 — https://codh.rois.ac.jp/historical-gis/edo-lake/
  - `ogurike:source:gsi-artificial-land`: 国土地理院 ベクトルタイル提供実験「地形分類（人工地形）」experimental_landformclassification2 — 地形分類（人工地形）; 作成者: 国土地理院; 2022年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 国土地理院 — https://github.com/gsi-cyberjapan/experimental_landformclassification
  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — 巨椋池周辺の変遷（国土交通省近畿地方整備局）; 作成者: 国土交通省近畿地方整備局; 2012年; 参照日: 2026-09-17 — rights: `open-license`; 表示: 国土交通省近畿地方整備局 — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

### `ogurike:version:waterbody-1596`

- 地物: 巨椋池（1596年・工事後の概略） (`ogurike:entity:waterbody`)
- geometry: `Polygon`
- 年代: 1596年
- 権利: `open-license` — 表示: 国土交通省近畿地方整備局（原資料）、Chronomap（概略加工）、CODH（位置参照）、国土地理院（位置参照） — PDL1.0の出典表示と編集・加工表示を含みます。 CODH形状はCC BY 4.0。国土地理院コンテンツ利用規約に従う。
- 不確実性:
  - `temporal`: `well-supported` — 資料図②の年代区分に基づく。 (Evidence: `ogurike:evidence:waterbody-1596-temporal`)
  - `location`: `approximate` — 近畿地整図②の相対形状をCODHとGSIの参照形状の中間位置へ移した概略です。精密な湖岸座標ではありません。 (Evidence: `ogurike:evidence:waterbody-1596-geometry`, `ogurike:evidence:waterbody-location-codh`, `ogurike:evidence:waterbody-location-gsi`)
  - `geometry`: `approximate` — 資料図の相対配置と湾入を残した手動加工の概略面であり、精密な湖岸線ではない。 (Evidence: `ogurike:evidence:waterbody-1596-geometry`)
  - `identity`: `well-supported` — 資料図②の巨椋池として扱う。 (Evidence: `ogurike:evidence:waterbody-1596-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:waterbody-1596-geometry` | derived-geometry | geometry, location | PDF p.2-22 図2.2-1②『秀吉による河川工事後（1596年）』 | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-1596-geometry` — 変遷図②に示される巨椋池周辺の相対的な水域範囲と湾入を、現在の地図上へ手動加工した概略面である。工事後の正確な湖岸線ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-1596-temporal` | citation | identity, temporal | PDF p.2-22 図2.2-1② | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-1596-temporal` — 資料図が河川工事後の1596年スナップショットとして示すことを確認する。
| `ogurike:evidence:waterbody-location-codh` | derived-geometry | location | lake_polygon.geojson のID 26007 | `ogurike:source:codh` |
  - `ogurike:evidence:waterbody-location-codh` — CODH ID 26007の推定湖面重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。厳密な歴史位置ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-location-gsi` | derived-geometry | location | drained-01472〜drained-01480（imports/gsi-artificial-land） | `ogurike:source:gsi-artificial-land` |
  - `ogurike:evidence:waterbody-location-gsi` — 巨椋池周辺の干拓地形状の融合重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。GSIデータは歴史位置を直接示さない。 (publicationBasis: `open-license`)

- Source:

  - `ogurike:source:codh`: 『江戸末期湖沼データセット』doi:10.20676/00000467 — 江戸末期湖沼データセット; 作成者: ROIS-DS人文学オープンデータ共同利用センター, 株式会社平凡社地図出版; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 『江戸末期湖沼データセット』doi:10.20676/00000467 — https://codh.rois.ac.jp/historical-gis/edo-lake/
  - `ogurike:source:gsi-artificial-land`: 国土地理院 ベクトルタイル提供実験「地形分類（人工地形）」experimental_landformclassification2 — 地形分類（人工地形）; 作成者: 国土地理院; 2022年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 国土地理院 — https://github.com/gsi-cyberjapan/experimental_landformclassification
  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — 巨椋池周辺の変遷（国土交通省近畿地方整備局）; 作成者: 国土交通省近畿地方整備局; 2012年; 参照日: 2026-09-17 — rights: `open-license`; 表示: 国土交通省近畿地方整備局 — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

### `ogurike:version:waterbody-1885`

- 地物: 巨椋池（1885年・工事前の概略） (`ogurike:entity:waterbody`)
- geometry: `MultiPolygon`
- 年代: 1885年
- 権利: `open-license` — 表示: CODH（形状）、国土交通省近畿地方整備局（年代・同定）、Chronomap（再利用・加工） — CODH形状はCC BY 4.0、近畿地方整備局資料はPDL1.0。Chronomapが1885年図の空間参照として利用・加工した。
- 不確実性:
  - `temporal`: `well-supported` — 資料図③の年代区分に基づく。 (Evidence: `ogurike:evidence:waterbody-1885-temporal`)
  - `location`: `approximate` — CODH ID 26007の推定湖面を空間参照として使用しました。位置と形状は概略で、1885年の測量成果ではありません。 (Evidence: `ogurike:evidence:waterbody-1885-geometry`)
  - `geometry`: `approximate` — CODH ID 26007の推定湖面形状を利用しています。年代・幾何精度は特定されず、1885年の正確な湖岸・面積・深度を示しません。 (Evidence: `ogurike:evidence:waterbody-1885-geometry`)
  - `identity`: `well-supported` — 資料図③の巨椋池として扱う。 (Evidence: `ogurike:evidence:waterbody-1885-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:waterbody-1885-geometry` | derived-geometry | geometry, location | lake_polygon.geojson のID 26007 | `ogurike:source:codh` |
  - `ogurike:evidence:waterbody-1885-geometry` — CODH ID 26007の推定湖面を1885年スナップショットの空間参照として採用した。CODH形状自体は1885年の測量成果を示さない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-1885-temporal` | citation | identity, temporal | PDF p.2-22 図2.2-1③ | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-1885-temporal` — 資料図が淀川改良工事前の1885年スナップショットとして示すことを確認する。

- Source:

  - `ogurike:source:codh`: 『江戸末期湖沼データセット』doi:10.20676/00000467 — 江戸末期湖沼データセット; 作成者: ROIS-DS人文学オープンデータ共同利用センター, 株式会社平凡社地図出版; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 『江戸末期湖沼データセット』doi:10.20676/00000467 — https://codh.rois.ac.jp/historical-gis/edo-lake/
  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — 巨椋池周辺の変遷（国土交通省近畿地方整備局）; 作成者: 国土交通省近畿地方整備局; 2012年; 参照日: 2026-09-17 — rights: `open-license`; 表示: 国土交通省近畿地方整備局 — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

### `ogurike:version:waterbody-1910`

- 地物: 巨椋池（1910年・概略） (`ogurike:entity:waterbody`)
- geometry: `Polygon`
- 年代: 1910年
- 権利: `open-license` — 表示: 国土交通省近畿地方整備局（原資料）、京都府（引用）、Chronomap（概略加工）、CODH（位置参照）、国土地理院（位置参照） — 各Sourceの出典表示・引用条件・編集加工表示を適用します。 CODH形状はCC BY 4.0。国土地理院コンテンツ利用規約に従う。
- 不確実性:
  - `temporal`: `well-supported` (Evidence: `ogurike:evidence:waterbody-temporal`)
  - `location`: `approximate` — 近畿地整図④の相対形状をCODHとGSI参照形状の重心の中間へ移し、両参照の規模の間になるよう拡大しました。精密位置・面積ではありません。 (Evidence: `ogurike:evidence:waterbody-location-codh`, `ogurike:evidence:waterbody-location-gsi`, `ogurike:evidence:waterbody-region`)
  - `geometry`: `approximate` — 資料図④をもとに北西側の入り込み、東側の肩、南岸の湾入を残した手動加工の概略面です。外縁の精密座標・測量精度は示さず、別の河道や周辺池も輪郭へ含めていません。 (Evidence: `ogurike:evidence:waterbody-geometry`)
  - `identity`: `well-supported` (Evidence: `ogurike:evidence:waterbody-region`, `ogurike:evidence:waterbody-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:waterbody-geometry` | derived-geometry | geometry, location | PDF p.2-22 図2.2-1④『淀川改良工事完成時（1910年）』 | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-geometry` — 図2.2-1④から、北西側の入り込み、東側の張り出し、南岸の複数の凹凸を読める範囲で手動再構成した概略面である。縮尺・投影を測量成果として扱わず、精密な境界、別河道、周辺池、面積逆算を示さない。 CODHとGSIの形状を位置と規模の参照に使った。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-location-codh` | derived-geometry | location | lake_polygon.geojson のID 26007 | `ogurike:source:codh` |
  - `ogurike:evidence:waterbody-location-codh` — CODH ID 26007の推定湖面重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。厳密な歴史位置ではない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-location-gsi` | derived-geometry | location | drained-01472〜drained-01480（imports/gsi-artificial-land） | `ogurike:source:gsi-artificial-land` |
  - `ogurike:evidence:waterbody-location-gsi` — 巨椋池周辺の干拓地形状の融合重心を、手動復元形状を配置する二つの空間参照の一つとして使用した。GSIデータは歴史位置を直接示さない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-region` | citation | identity, location, temporal | 『概要』および『5万分の1 京都東南部・京都西南部（大正6年発行）』 | `ogurike:source:kyoto-prefecture-rdb` |
  - `ogurike:evidence:waterbody-region` — 巨椋池の地域、面積、干拓時期、1917年発行図の所在を補強する引用メタデータ。掲載画像は再現しない。
| `ogurike:evidence:waterbody-temporal` | citation | identity, temporal | PDF p.2-22 図2.2-1④ | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-temporal` — 資料図が淀川改良工事完成時の1910年スナップショットとして示すことを確認する。

- Source:

  - `ogurike:source:codh`: 『江戸末期湖沼データセット』doi:10.20676/00000467 — 江戸末期湖沼データセット; 作成者: ROIS-DS人文学オープンデータ共同利用センター, 株式会社平凡社地図出版; 2026年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 『江戸末期湖沼データセット』doi:10.20676/00000467 — https://codh.rois.ac.jp/historical-gis/edo-lake/
  - `ogurike:source:gsi-artificial-land`: 国土地理院 ベクトルタイル提供実験「地形分類（人工地形）」experimental_landformclassification2 — 地形分類（人工地形）; 作成者: 国土地理院; 2022年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 国土地理院 — https://github.com/gsi-cyberjapan/experimental_landformclassification
  - `ogurike:source:kyoto-prefecture-rdb`: 京都府レッドデータブック2015『巨椋池』 — 巨椋池（京都府レッドデータブック）; 作成者: 京都府; 2015年; 参照日: 2026-09-17 — rights: `restricted` — https://www.pref.kyoto.jp/kankyo/rdb/geo/db/sur0005.html
  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — 巨椋池周辺の変遷（国土交通省近畿地方整備局）; 作成者: 国土交通省近畿地方整備局; 2012年; 参照日: 2026-09-17 — rights: `open-license`; 表示: 国土交通省近畿地方整備局 — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

### `ogurike:version:waterbody-1933`

- 地物: 巨椋池（1933年・概略） (`ogurike:entity:waterbody`)
- geometry: `MultiPolygon`
- 年代: 1933年
- 権利: `open-license` — 表示: 国土地理院（形状）、国土交通省近畿地方整備局（年代・同定）、Chronomap（融合・加工） — 国土地理院コンテンツ利用規約と近畿地方整備局資料のPDL1.0に従う。Chronomapが1933年図の空間参照として利用・加工した。
- 不確実性:
  - `temporal`: `well-supported` — 資料図⑤の年代区分に基づく。 (Evidence: `ogurike:evidence:waterbody-1933-temporal`)
  - `location`: `approximate` — GSI人工地形データの巨椋池干拓地範囲を空間上の代理形状として使用しました。GSIデータは1933年の湖岸や干拓年を示しません。 (Evidence: `ogurike:evidence:waterbody-1933-geometry`)
  - `geometry`: `approximate` — GSI人工地形の干拓地9形状を融合した代理形状です。湖岸の精密位置や1933年の厳密な広さを示しません。 (Evidence: `ogurike:evidence:waterbody-1933-geometry`)
  - `identity`: `well-supported` — 資料図⑤の1933年スナップショットの主水域として扱う。 (Evidence: `ogurike:evidence:waterbody-1933-temporal`)

- Evidence:

| Evidence | 用途 | supports | locator | source |
|---|---|---|---|---|
| `ogurike:evidence:waterbody-1933-geometry` | derived-geometry | geometry, location | drained-01472〜drained-01480（imports/gsi-artificial-land） | `ogurike:source:gsi-artificial-land` |
  - `ogurike:evidence:waterbody-1933-geometry` — 国土地理院の人工地形データにある巨椋池周辺の干拓地9形状を融合し、1933年版の空間参照とした。GSIデータは1933年の湖岸や正確な干拓年を示さない。 (publicationBasis: `open-license`)
| `ogurike:evidence:waterbody-1933-temporal` | citation | identity, temporal | PDF p.2-22 図2.2-1⑤ | `ogurike:source:mlit-ogurike-transition` |
  - `ogurike:evidence:waterbody-1933-temporal` — 資料図が淀川改良工事増補完成時の1933年スナップショットとして示すことを確認する。

- Source:

  - `ogurike:source:gsi-artificial-land`: 国土地理院 ベクトルタイル提供実験「地形分類（人工地形）」experimental_landformclassification2 — 地形分類（人工地形）; 作成者: 国土地理院; 2022年; 参照日: 2026-10-17 — rights: `open-license`; 表示: 国土地理院 — https://github.com/gsi-cyberjapan/experimental_landformclassification
  - `ogurike:source:mlit-ogurike-transition`: 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 — 巨椋池周辺の変遷（国土交通省近畿地方整備局）; 作成者: 国土交通省近畿地方整備局; 2012年; 参照日: 2026-09-17 — rights: `open-license`; 表示: 国土交通省近畿地方整備局 — https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf

## Source一覧

| Source | citation | metadata | rights | terms |
|---|---|---|---|---|
| `ogurike:source:codh` | 『江戸末期湖沼データセット』doi:10.20676/00000467 | 江戸末期湖沼データセット; 作成者: ROIS-DS人文学オープンデータ共同利用センター, 株式会社平凡社地図出版; 2026年; 参照日: 2026-10-17; https://codh.rois.ac.jp/historical-gis/edo-lake/ | open-license; 表示: 『江戸末期湖沼データセット』doi:10.20676/00000467 | CC BY 4.0。Chronomapが形式変換・融合・簡略化した。 |
| `ogurike:source:gsi-artificial-land` | 国土地理院 ベクトルタイル提供実験「地形分類（人工地形）」experimental_landformclassification2 | 地形分類（人工地形）; 作成者: 国土地理院; 2022年; 参照日: 2026-10-17; https://github.com/gsi-cyberjapan/experimental_landformclassification | open-license; 表示: 国土地理院 | 国土地理院コンテンツ利用規約 |
| `ogurike:source:kyoto-city-monument` | 京都市『巨椋池干拓碑』GA015 | 巨椋池干拓碑; 作成者: 京都市; 2014年; 参照日: 2026-09-17; https://www2.city.kyoto.lg.jp/html/somu/rekishi/fm/ishibumi/html/ga015.html | restricted | 引用メタデータのみ。ページ本文、画像、碑文全文は再現しない。 |
| `ogurike:source:kyoto-prefecture-rdb` | 京都府レッドデータブック2015『巨椋池』 | 巨椋池（京都府レッドデータブック）; 作成者: 京都府; 2015年; 参照日: 2026-09-17; https://www.pref.kyoto.jp/kankyo/rdb/geo/db/sur0005.html | restricted | 引用メタデータのみ。掲載された本文・地図画像・写真は再現しない。 |
| `ogurike:source:mlit-ogurike-transition` | 国土交通省近畿地方整備局『流域及び河川の概要について』図2.2-1 巨椋池周辺の変遷 | 巨椋池周辺の変遷（国土交通省近畿地方整備局）; 作成者: 国土交通省近畿地方整備局; 2012年; 参照日: 2026-09-17; https://www.kkr.mlit.go.jp/river/iinkaikatsudou/kensyou/qgl8vl0000008nhe-att/houkokusyos_02.pdf | open-license; 表示: 国土交通省近畿地方整備局 | PDL1.0。出典を記載し、編集・加工したことを別途表示する。 |
| `ogurike:source:shape-notes` | Chronomap『巨椋池パイロット形状作成メモ』 | 巨椋池パイロット形状作成メモ; 作成者: Chronomap contributors; 2026年; 参照日: 2026-09-17; https://github.com/ywatase/chronomap/blob/main/docs/data/ogurike-shape-notes.md | open-license; 表示: Chronomap contributors | Chronomapのオリジナルな概略復元メモ。外部資料の権利条件は個別Sourceに従う。 |

## 監査上の注意

- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。
- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。
- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。
