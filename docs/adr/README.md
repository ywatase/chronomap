# Architecture Decision Records

作成日: 2026-09-14

ADRは、長期的に影響する設計判断、その背景、代替案、結果を追跡する文書である。ファイル名は`NNNN-kebab-case-title.md`とし、番号は4桁の連番にする。新規ADRは「Context」「Decision」「Alternatives」「Consequences」「References」を含める。

状態はProposedからAccepted、Rejected、またはSupersededへ遷移する。Acceptedの判断を変更するときは本文を上書きせず、新しいADRを作成して旧ADRをSupersededとし、新旧の相互参照を置く。誤字など判断を変えない編集は、変更履歴を明記して修正できる。

## 初期ADR

| 番号 | 題名 | 状態 | 要約 |
| --- | --- | --- | --- |
| [0001](0001-single-shared-web-application.md) | 共通Webアプリと地域別データセット | Accepted | 日本・中国・世界でコードを分けない。 |
| [0002](0002-static-client-side-mvp.md) | 静的クライアントMVP | Accepted | GeoJSONをブラウザで読み込み・絞り込む。 |
| [0003](0003-maplibre-and-gsi-basemap.md) | MapLibre GL JSと地理院タイル | Accepted | 日本MVPの描画・背景地図を定める。 |
| [0004](0004-versioned-historical-features.md) | 版管理された歴史地物 | Accepted | 対象の同一性と時代ごとの表現を分離する。 |
