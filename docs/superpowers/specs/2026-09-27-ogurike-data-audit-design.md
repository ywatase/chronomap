# 巨椋池データ信頼性ゲート 設計

## 目的

Chronomapの次のレビューで、教材パックが「出典と不確実性を確認できる実データ」に基づいていることを、コードと人間が読める監査資料の両方で確認できるようにする。対象は既存の巨椋池パイロットであり、新しい課金・認証・保存・分析機能は含めない。

## 成功条件

- `data/ogurike` は既存の authoring／public validation を通過し続ける。
- 公開FeatureVersionごとに、地物ID、年代、geometry種別、4次元の不確実性、Evidence locator、参照Source、権利状態を決定的な監査レポートで確認できる。
- 監査レポートは原資料本文・画像・碑文を転載せず、引用メタデータ、locator、権利条件、概略復元の注意だけを含む。
- `chronomap-data audit data/ogurike` で同じレポートを再生成でき、検証エラーがある場合はレポートを出さず終了コード1になる。
- 日本語Web UIの実利用導線で、少なくとも代表的な線・面・点を選択し、不確実性・根拠・出典・権利を確認できることをPlaywrightで固定する。

## 非目標

- 外部Sourceの本文、画像、図版、碑文全文の取得・転載
- Source URLの死活監視や外部ネットワーク取得
- 新しいデータセット、認証、クラウド保存、決済、checkout、分析
- 監査結果のサーバー送信、ブラウザ保存、個人情報収集

## 設計

### 1. 監査モデルとレンダラー

`src/chronomap_data/audit.py` に、ロード済みの `DatasetPackage` から公開データだけを取り出す純粋な監査モデルを置く。監査行はFeatureVersion単位で、公開featureに到達可能なEvidenceとSourceをID順にたどる。Featureの説明本文や編集入力は監査モデルへコピーせず、ラベル、年代、geometry種別、不確実性assessment/note、Evidenceのlocator/supports/usage/publicationBasis、Sourceのcitation/URL/rightsだけを投影する。

`render_audit_markdown(report)` は日本語見出しの決定的Markdownを返す。Feature、Evidence、SourceはID順に並べ、同じ入力からバイト単位で同じ出力になるように日時や環境値を含めない。

### 2. CLI

既存の `chronomap-data` に `audit DATASET_DIR [--profile authoring|public]` を追加する。既定profileは `public` とし、ロード失敗は既存どおり終了コード2、validation issueはstderrへ既存形式で出して終了コード1、成功時だけ監査Markdownをstdoutへ出す。出力先のファイル操作はCLI外のリダイレクトに任せ、CLI自身は入力パッケージを変更しない。

### 3. チェックイン監査資料

成功した `chronomap-data audit data/ogurike` の出力を `docs/data/ogurike-audit.md` としてチェックインする。このファイルはレビュー用の静的スナップショットであり、原資料本文の代替ではない。データ更新時はCLIを再実行して差分をレビューする。

### 4. Web確認

既存のOgurike Playwrightテストを拡張し、1590年の宇治川（線）、1910年の巨椋池（面）、1942年の巨椋池干拓之碑（点）を選択して、選択地物の不確実性・Evidence locator・Source・権利表示が見えることを確認する。UIの外部通信や保存は追加しない。

## エラー境界

- 監査前のvalidationは `ValidationProfile.PUBLIC` で行い、公開FeatureのEvidence／Source参照欠落、権利不足、不確実性の根拠不足は既存validatorにより拒否する。
- レンダラーはvalidation済みの参照だけを読むが、欠落参照を空文字で隠さず、内部APIでは欠落を例外として扱う。
- restricted／unknown Sourceはcitation-onlyの既存投影境界を監査資料にも適用し、本文・画像・碑文を出力しない。

## テスト戦略

- Python unit: 監査モデルの公開Feature絞り込み、ID順決定性、locator・権利・不確実性の投影、CLI成功／validation失敗。
- Python package: 巨椋池の4公開Featureが各4次元のassessmentとEvidenceを持ち、監査資料の行数が一致すること。
- Web Playwright: 代表的な点・線・面のmetadata panelで不確実性・Evidence・Source・権利を確認する（mobile／desktop）。
- 既存のWeb unit、production build、全Playwright E2Eを回帰確認する。
