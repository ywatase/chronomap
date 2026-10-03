# Chronomap のビジュアル品質バー

Chronomap は、地図を主役にした公共データの体験として、受賞作の「派手さ」だけでなく、根拠・読みやすさ・操作の確実さまで含めた品質を目標にする。これは受賞を保証するものではなく、公開前に同じ視点でセルフレビューを繰り返すためのチェックリストである。

## 評価軸

- **Design / Visual design**: 地形図の線・海の青・古地図の金を一貫した視覚言語として使い、主役の地図、次の行動、根拠の順に視線が流れる。
- **Usability / Structure**: `/` では地図を先に表示し、主CTAを1つ、補助CTAを1つに絞る。カタログでは「調べる」「教材を作る」「下書きを再開する」を作業単位で選べる。
- **Content / Voice**: 出典、不確実性、概略復元の限界、無料パイロットと相談中の有料案を、短く具体的に伝える。価格・納期・精度を未確定のまま断定しない。
- **Functionality / Interactivity**: 年代操作、地物検索、比較、完成見本、印刷範囲、QR、相談文を、キーボード・モバイル・失敗時の導線まで含めて成立させる。
- **Craft / Innovation**: 公開geometryから生成する観察用概略図、根拠付きの地図→教材→印刷の連続体験、静的サイトでも壊れないポータブル下書きを、目的のための技術として磨く。

## スクリーンショットによる反復

1. 1440×900 と 390×844 でルート、カタログ、完成見本、相談ハンドオフを撮る。
2. 次の問いで画面を自己採点する。
   - 初見5秒で「何を見るか」と「次に押す場所」が分かるか。
   - 地図・CTA・カードのどれが主役かが、色・余白・動きで迷いなく伝わるか。
   - 文字、ボタン、ダイアログ、印刷出力に横overflowや重なりがないか。
   - hover/focus/reduced-motion の各状態に、同じ意味の手がかりがあるか。
   - スクリーンショットだけで、無料で確認できる範囲と相談が必要な範囲を誤解しないか。
3. 最も大きい違和感を1つだけ修正し、同じ画面を再撮影する。視覚効果を足す場合も、地図の可読性、操作領域44px、印刷境界を優先する。

## 再現コマンド

```sh
cd web
npm run test:browser -- tests/browser/quick-start.spec.ts --project=desktop-chromium --project=mobile-chromium --workers=2 --trace=off
npm run test:browser -- tests/browser/start-hub.spec.ts --project=desktop-chromium --project=mobile-chromium --grep "surfaces the public evidence audit" --workers=2 --trace=off
```

## 2026-10-03 セルフレビュー記録

価格カードから完成見本・相談文へ進む画面を1440×900／390×844で再撮影した。最も大きかった違和感は、価格と納品物を読んだ後の次の行動がカードごとに明示されていなかったことだったため、「完成見本を開く」「授業条件を選び相談文を確認」「地域条件を選び相談文を確認」を各カードへ追加した。相談で確定する価格・範囲・納期の境界、メール窓口未設定時の手動ハンドオフ、横overflowなしは再確認済みである。

同日の品質ゲートは、unit 32 files / 180 tests、対象catalog E2E 2 projects、production build成功。buildのchunk-size warningは既存のMapLibre／アプリバンドルサイズに関する警告で、機能失敗ではない。

既存の全E2E、unit、`npm run build` が通ることを品質ゲートとする。`prefers-reduced-motion: reduce`、キーボードフォーカス、公開データの出典・不確実性、相談文の個人情報非漏洩は、視覚改善で後退させない。

## 参照した公開評価観点

- [Awwwards](https://www.awwwards.com/sites/finely-crafted): Design / Usability / Creativity / Content、および Semantics / Animations / Accessibility / WPO / Responsive Design。
- [The Webby Awards](https://www.webbyawards.com/judging-criteria/): Content / Structure and Navigation / Visual Design / Functionality / Interactivity / Innovation / Overall Experience。
- [FWA](https://www.thefwa.org/): 実験性、レスポンシブなライブ体験、技術と表現の結びつきを重視する公開アーカイブの考え方。
