# 巨椋池パイロットデータ設計

作成日: 2026-09-17

## 目的

合成 fixture だけで動いている Chronomap に、巨椋池周辺の小規模な実在データを接続する。初回公開は、面・線・点を含む最小構成とし、各表示に資料、locator、権利、不確実性を結び付ける。資料にない連続年代、精密境界、優先仮説は作成しない。

## 設計上の位置づけ

本工程はデータ制作、公開投影、Web の既定データセット切替をまたぐ architectural change である。既存の5ファイル契約と fail-closed な `validate → build-public` 経路を利用し、合成 fixture は契約テスト用として保持する。

## 目標

- `data/ogurike/` に検証可能な著者用5ファイルパッケージを追加する。
- 公開状態のFeatureVersionを面・線・点の3種類で提供する。
- 1590年、1596年、1910年、1942年の資料が示すスナップショットを、資料が示す範囲でのみ表現する。
- すべての公開FeatureVersionに、時間・位置・形状・同一性の不確実性と到達可能なEvidenceを付ける。
- restricted/unknown の資料は citation-only とし、本文・画像・碑文・第三者写真を公開バンドルへ複製しない。
- `web/public/data/ogurike/` を公開投影の生成物として追加し、Web がこのバンドルを読み込める状態にする。
- 同じ著者用パッケージからの公開投影が決定的であり、再生成でバイト一致することを確認する。

## 非目標

- 巨椋池の全歴史、全地物、完全な行政境界・水域境界の再現。
- 1590年から1596年、1910年から1933年など、資料にない連続期間の補間。
- GSI旧版地図のトレース、旧版地図・航空写真の画像配布、第三者図版の複製。
- 太閤堤、槇島堤、旧宇治川の精密な中心線・現地測量。
- 旧山田家住宅、東一口漁業集落など、初回に座標と時代境界を確定できない追加点。
- この工程でのUI文言全面日本語化、Playwright E2E全導線、スクリーンショットによるUI/UX改修。

## 採用するデータ範囲

パッケージは3 Entity / 4 FeatureVersionとする。宇治川は同一Entityの時系列版であり、並行仮説ではないため `hypothesisGroupId` を付けない。

| 形状 | Entity | FeatureVersion | 時間表現 | 役割 |
| --- | --- | --- | --- | --- |
| Polygon | 巨椋池 | 1910年版 | 1910年のスナップショット | 干拓前の水域の概略 |
| LineString | 宇治川 | 1590年版 | 1590年のスナップショット | 秀吉による河川工事前の流路概略 |
| LineString | 宇治川 | 1596年版 | 1596年のスナップショット | 秀吉による河川工事後の流路概略 |
| Point | 巨椋池干拓之碑 | 1942年版 | 1942年から開区間 | 干拓工事完成を記念する碑の代表点 |

### 面: 巨椋池（1910年版）

国土交通省近畿地方整備局「流域及び河川の概要について」p.2-22の図2.2-1④「淀川改良工事完成時（1910年）」を主資料とする。図を手動で簡略化したPolygonを作成し、現在の地図上での精密な境界や794haから逆算した境界とは扱わない。京都府RDBの「巨椋池」は、久御山町・宇治市にまたがる地域、面積794ha、1933–1941年の干拓、1917年発行図の存在を補強する citation-only 資料とする。

FeatureVersionの時間は1910年のスナップショットに限定する。時間の同定は資料に基づき `well-supported`、位置と形状は概略図の手動デジタイズであるため `approximate` とする。説明には「1910年の資料図をもとにした概略復元であり、精密な境界を示さない」と明記する。

### 線: 宇治川（1590年版・1596年版）

同じEntityに二つの時系列FeatureVersionを作る。近畿地方整備局資料p.2-21末尾からp.2-22の図2.2-1①「秀吉による河川工事前（1590年）」と②「秀吉による河川工事後（1596年）」を主資料とし、同資料が説明する堤築造・宇治川流路変更を表現する。各LineStringは図の関係を示す概略線であり、正確な河道中心線、太閤堤・槇島堤の全長、現代の鉄道線との同一性を主張しない。

各版の時間はそれぞれ1590年、1596年のスナップショットに限定し、1591–1595年や1597年以後の形状を補間しない。工事と流路変更の存在・同一性は `well-supported`、位置と形状は `approximate` とする。

### 点: 巨椋池干拓之碑（1942年版）

京都市「巨椋池干拓碑」の「所在地」「位置座標」「建立年」を根拠とする。干拓工事が昭和8年から昭和16年に行われ、碑が完成記念として建立されたこと、および建立年1942年を表示する。京都市ページの碑文全文、写真、画像は保存・再配布しない。

位置座標は著者用の確認に使うが、公開GeoJSONには座標をそのまま転載せず、所在地をもとに小数第3位へ丸めた代表点をChronomapの `original-reconstruction` として記録する。したがって位置は公開表示では `approximate` とする。時間は1942年を開始境界とし、碑の存続終了は資料が示さないため `end: null` とする。Entity typeは碑そのものを表せる `other` とする。

## 出典と権利

### 外部資料

| Source | 用途 | 権利の扱い | 主なlocator |
| --- | --- | --- | --- |
| 国土交通省近畿地方整備局「流域及び河川の概要について」 | 1590/1596/1910の時間・同一性・概略形状 | PDL1.0。出典と「図をもとにChronomapが手動加工した」旨を表示 | PDF p.2-21末尾–p.2-22、図2.2-1①②④ |
| 京都府RDB「巨椋池」 | 地域、794ha、干拓時期、1917年図の補強 | ページ本文・画像は転載せず citation-only | 「概要」「5万分の1…大正6年発行」 |
| 京都市「巨椋池干拓碑」 | 碑の同一性、所在地、建立年、位置の確認 | citation-only。本文・画像・碑文を複製しない | 「所在地」「位置座標」「建立年」 |

近畿地方整備局のコンテンツは、特記がない限りPDL1.0で、編集・加工時は出典とは別に加工を明示する必要がある。図版に第三者権利の個別注記がないことを公開前レビューで確認する。個別注記が見つかった場合、その図由来の `derived-geometry` を取り下げ、Chronomapの粗い `original-reconstruction` に切り替える。

京都府・京都市の一般ウェブページは、個別のオープンデータライセンスをこのパッケージで確認できないため、Source.rightsを `restricted` とし、利用条件とlocatorを記録する。公開投影器はこれらを citation-only の証拠として残し、本文・画像・碑文の再現を防ぐ。

### Chronomapの形状根拠

手動デジタイズと丸めた代表点の方法を、リポジトリ内の `docs/data/ogurike-shape-notes.md` と、そのURLを指すパッケージ内の `Source` として「Chronomap巨椋池パイロット形状作成メモ」に記録する。これは公開可能な `original-reconstruction` 根拠であり、図の概略をそのままコピーしたデータではないこと、丸め・簡略化の規則、採用しなかった精密主張を説明する。図からの面・線は近畿地整Sourceの `derived-geometry` としても記録し、Sourceの権利と加工表示を満たす。碑の点は京都市Sourceをcitation-onlyで参照し、geometry EvidenceはChronomapの形状作成メモだけから到達可能にする。

### FeatureVersionの権利

公開FeatureVersionの `rights` は `open-license` とし、帰属に「国土交通省近畿地方整備局（原資料）、Chronomap（概略加工）」を含める。Sourceごとの条件を詳細に `sources.json` に記録する。データセット全体の権利表示は、外部資料の条件を上書きせず、個別Sourceの条件に従うことを明記する。

## パッケージと公開フロー

### 著者用パッケージ

`data/ogurike/` に次の固定ファイルを追加する。

- `dataset.json`: `defaultLanguage: "ja"`、巨椋池周辺を含むbbox、start/endをそれぞれ1590年/1942年とする時間範囲、公開可能なデータセット権利、固定ファイル参照。
- `entities.json`: 3 Entity（巨椋池、宇治川、巨椋池干拓之碑）。
- `sources.json`: 外部3資料と、`https://github.com/ywatase/chronomap/blob/main/docs/data/ogurike-shape-notes.md` を指すChronomap形状作成メモ。すべてのURLはhttp/httpsのみとする。
- `evidence.json`: FeatureVersionごとの時間・位置・形状・同一性の根拠。restricted Sourceを参照する証拠は必ず `usage: "citation"` とする。
- `feature-versions.geojson`: Polygon 1件、LineString 2件、Point 1件。全件 `publicationStatus: "public"` とし、GeoJSON座標はWGS84経度・緯度の順とする。

### 検証と公開投影

1. `uv run chronomap-data validate data/ogurike` でスキーマ・意味検証を行う。
2. `uv run chronomap-data validate data/ogurike --profile public` で公開条件を検証する。
3. `uv run chronomap-data build-public data/ogurike --output web/public/data/ogurike` で公開投影を生成する。
4. `dataset.json`、到達可能Entity、Evidence、Sourceだけが出力され、citation-only Evidenceのnoteが安全な引用注記に投影されることを確認する。
5. 同じ入力から一時ディレクトリへ再生成し、`web/public/data/ogurike/` と5ファイルがバイト一致することを確認する。

公開投影が失敗した場合は既存の公開ディレクトリを置換しない。restricted/unknown Sourceに紐づく `derived-geometry`、根拠のない公開FeatureVersion、権利メタデータ不足は公開前に失敗させる。

## Web接続

データ制作工程の完了条件として、`web/src/main.ts` の既定バンドルURLを `/data/ogurike/` に切り替える。既存の `/data/synthetic/` は単体テストと契約テスト用に残す。ロード失敗、MapLibre失敗、選択・詳細パネルの既存動作は変更しない。

今回のWeb接続ではデータ由来の日本語ラベルを表示可能にするが、操作ラベル、エラー、出典欄、アクセシビリティ名の全面日本語化は次工程とする。次工程の日本語化で、`defaultLanguage: "ja"` のラベルを既定表示し、英語が存在する場合のフォールバックを保持する。

## テストと受入条件

### Python

- `data/ogurike` の通常プロファイルとpublicプロファイルが成功する。
- 公開投影が4 FeatureVersion、3 Entity、および到達可能なEvidence/Sourceだけを含む。
- 1590、1596、1910、1942の境界で時間フィルタが対象版を選べる。
- Polygon、LineString、PointがそれぞれWGS84の有効座標である。
- restricted SourceからのEvidenceはcitation-onlyであり、derived geometryになっていない。
- 公開FeatureVersionの4次元不確実性がすべて根拠と説明を持つ。
- 再生成した公開バンドルがチェックイン済みバンドルとバイト一致する。

### Web

- 公開アセット同期テストが `data/ogurike` からのbuilder出力と `web/public/data/ogurike` の一致を確認する。
- データローダーが `/data/ogurike/` の5ファイルを読み込み、Entity・Source・Evidenceを参照できる。
- ブラウザで1590年と1596年の線の切替、1910年の面、1942年の点を一覧・地図・詳細で確認できる。
- 既存のsynthetic fixtureを使うデータローダー単体テストと公開投影テストを壊さない。

## 除外・再評価条件

- 近畿地整PDFに図2.2-1の第三者権利注記が見つかった場合、図からのderived geometryを公開せず、形状をoriginal reconstructionへ切り替える。
- 精密な旧版地図トレース、第三者航空写真、現代の鉄道線を旧堤線とみなす形状は、別途権利・測地・史料レビューを承認するまで追加しない。
- データ量が増えて静的GeoJSONの性能目標を超えた場合は、PMTiles/APIの判断を別工程で行う。

## 完了条件

- この仕様に対応する実装計画が作成され、各作業が独立したテストサイクルを持つ。
- `data/ogurike/` が通常/public検証を通過する。
- `web/public/data/ogurike/` が決定的な公開投影として生成される。
- Webが巨椋池バンドルを読み込み、既存の障害時挙動を維持する。
- データ出典、権利、locator、不確実性、加工表示が詳細パネルおよびパッケージに追跡可能である。
