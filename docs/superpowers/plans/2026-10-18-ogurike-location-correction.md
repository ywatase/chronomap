# 巨椋池の位置・形状補正 実施計画

> 実装はこの計画を主スレッドで順に進め、各コード変更の前に失敗するテストを追加する。

## 目的

`data/ogurike` の5時点の水域と宇治川を現代の巨椋池位置へ揃え、CODH湖沼データ・国土地理院の干拓地データとの二重表示をなくす。スキーマは変更しない。

## 制約

- 1885年の水域形状はCODH「江戸末期湖沼データセット」ID `26007` を使う。
- 1933年の水域形状は国土地理院「地形分類（人工地形）」の巨椋池干拓地を融合して使う。GSI形状は空間上の代理であり、1933年という年代は近畿地整図⑤に基づく。
- 1590・1596年の形状と1910年の近畿地整図④の相対形状を新しい位置へ移し、1910年は1885年と1933年の規模の間に置く。
- 1590年の宇治川代表線を湖面へ接続させ、1596年線は水面と交差させない。
- 公開形状の出典・加工Evidenceに利用条件と `publicationBasis=open-license` を記録する。
- CODH湖沼ID `26007` は `imports/edo-lakes` から除外し、`data/ogurike` の時系列を唯一の表示元にする。
- `data/ogurike` の監査資料と日本カバレッジ表を再生成する。Web UIの実装や外部データ取り込み機能は追加しない。

## 作業順

1. 先に `docs/data/ogurike-shape-notes.md` と `docs/data/edo.md` を更新し、利用する形状と近似の限界、出典、除外理由を記録する。
2. `tests/test_importers.py` にID `26007` 除外の失敗テストを追加し、`tests/test_ogurike_package.py` に形状位置・出典・湖面と1596年河川の非交差テストを追加する。実装前に失敗を確認する。
3. Edo importerにID除外を実装し、CODH/GSI形状と図④の概略形状を位置合わせして `data/ogurike` を更新する。スキーマは変えない。
4. 指示どおり `chronomap-data import edo` を実行して `imports/edo-lakes` を再生成し、巨椋池監査とカバレッジ表をCLIから再生成する。
5. Python全テスト、7パッケージの公開検証、PMTiles決定性確認、Webテストを実行する。1590/1596/1885/1910/1933/1941年の画面を撮影して形状位置と重複表示を確認する。
6. 差分・資料整合・出力状態を最終確認し、変更をコミットする。リモートへはpushしない。

## 完了条件

- CODH湖沼ID `26007` が `imports/edo-lakes` に存在せず、別の湖沼は残る。
- `data/ogurike` の1885年形状がCODH、1933年形状がGSIの干拓地融合形状と一致する。
- 5時点の湖面が同じ現在位置にあり、1596年宇治川線が湖面と交差しない。
- Source/Evidence、監査資料、カバレッジ表が更新され、指定されたテストと画面確認が通る。

## 実施結果

- `chronomap-data import edo` を実行し、`imports/edo-lakes` は572件となった。CODH ID `26007` は含まず、他の湖沼は残る。
- `chronomap-data build-tiles data imports --output web/public/chronomap` は19データセット・85,972地物で成功した。PMTilesは36,016,259 bytes。詳細ShardにもCODH ID `26007` は含まれず、指定の完全一致引用が格納された。
- Pythonテストはwheelインストールテストを除く312件が成功した。wheelテストは隔離環境へ依存パッケージをインストールする段階で、実行環境からPyPIへ接続できず失敗した。
- Web単体テストは8ファイル・37件が成功し、`npm run build` も成功した。
- `npm run test:browser` と年別スクリーンショットは、実行環境がlocalhostの待受を `EPERM` で拒否し、Chromium起動もサンドボックスで拒否されたため未完了。再現操作を含む画面確認はこの環境では実施できなかった。
- `docs/data/ogurike-audit.md` と `docs/product/japan-coverage-matrix.md` を再生成した。スキーマ変更はない。
