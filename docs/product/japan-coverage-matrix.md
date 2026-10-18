# 日本公開データ・カバレッジ監査

この表は、公開FeatureVersionから到達できる正規化メタデータだけを決定的に集計する。Source本文・画像・碑文などの第三者コンテンツは複製しない。

- 対象地域: 9
- 公開Entity: 33
- 公開FeatureVersion: 53
- 到達可能Evidence: 93
- 到達可能Source: 45
- 不足型の扱い: 資料・権利・不確実性を確認できるまで推測で補完しない

## 地域別集計

| 地域 | dataset ID | Entity | FeatureVersion | Evidence | Source | Source Rights | 収録Entity type |
|---|---|---:|---:|---:|---:|---:|---|
| 巨椋池パイロットデータ | `ogurike:dataset:pilot-2026` | 3 | 8 | 19 | 6 | 6/6 | `waterbody` × 1, `watercourse` × 1, `other` × 1 |
| 利根川東遷パイロットデータ | `tonegawa:dataset:eastward-pilot` | 2 | 3 | 6 | 4 | 4/4 | `watercourse` × 1, `other` × 1 |
| 平城京パイロットデータ | `heijokyo:dataset:pilot` | 4 | 5 | 5 | 3 | 3/3 | `settlement` × 1, `route` × 1, `boundary` × 1, `archaeological-site` × 1 |
| 安土城・琵琶湖東岸パイロット | `azuchijo:dataset:pilot` | 10 | 14 | 16 | 13 | 13/13 | `waterbody` × 1, `coastline` × 1, `fortification` × 1, `settlement` × 1, `port` × 1, `battlefield` × 1, `route` × 1, `polity` × 1, `sphere-of-influence` × 1, `archaeological-site` × 1 |
| 鬼怒川・小貝川の河道変遷パイロット | `kinugawa:dataset:river-history` | 3 | 4 | 7 | 4 | 4/4 | `watercourse` × 2, `other` × 1 |
| 大坂・石山本願寺パイロット | `osaka:dataset:ishiyama-pilot` | 5 | 5 | 8 | 3 | 3/3 | `watercourse` × 1, `fortification` × 1, `settlement` × 1, `port` × 1, `battlefield` × 1 |
| 関ケ原古戦場・中山道パイロット | `sekigahara:dataset:battlefield-pilot` | 3 | 3 | 7 | 4 | 4/4 | `settlement` × 1, `battlefield` × 1, `route` × 1 |
| 名古屋・伊勢湾奥の海岸線（縄文〜江戸初期） | `nagoya-coast:dataset:pilot` | 1 | 4 | 9 | 4 | 4/4 | `coastline` × 1 |
| 大阪湾奥・河内湖（縄文〜江戸初期） | `osaka-coast:dataset:pilot` | 2 | 7 | 16 | 4 | 4/4 | `waterbody` × 1, `coastline` × 1 |

## 不足する許可Entity type

### 巨椋池パイロットデータ (`ogurike`)

- 未収録: `coastline`, `fortification`, `settlement`, `port`, `battlefield`, `route`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

### 利根川東遷パイロットデータ (`tonegawa`)

- 未収録: `waterbody`, `coastline`, `fortification`, `settlement`, `port`, `battlefield`, `route`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

### 平城京パイロットデータ (`heijokyo`)

- 未収録: `waterbody`, `watercourse`, `coastline`, `fortification`, `port`, `battlefield`, `polity`, `sphere-of-influence`, `other`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

### 安土城・琵琶湖東岸パイロット (`azuchijo`)

- 未収録: `watercourse`, `boundary`, `other`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

### 鬼怒川・小貝川の河道変遷パイロット (`kinugawa`)

- 未収録: `waterbody`, `coastline`, `fortification`, `settlement`, `port`, `battlefield`, `route`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

### 大坂・石山本願寺パイロット (`osaka`)

- 未収録: `waterbody`, `coastline`, `route`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`, `other`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

### 関ケ原古戦場・中山道パイロット (`sekigahara`)

- 未収録: `waterbody`, `watercourse`, `coastline`, `fortification`, `port`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`, `other`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

### 名古屋・伊勢湾奥の海岸線（縄文〜江戸初期） (`nagoya-coast`)

- 未収録: `waterbody`, `watercourse`, `fortification`, `settlement`, `port`, `battlefield`, `route`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`, `other`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

### 大阪湾奥・河内湖（縄文〜江戸初期） (`osaka-coast`)

- 未収録: `watercourse`, `fortification`, `settlement`, `port`, `battlefield`, `route`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`, `other`
- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。

## 許可Entity type

`waterbody`, `watercourse`, `coastline`, `fortification`, `settlement`, `port`, `battlefield`, `route`, `boundary`, `polity`, `sphere-of-influence`, `archaeological-site`, `other`

この監査表の件数は公開範囲の広さを示す指標であり、歴史的正確性や日本全体の網羅を保証するものではない。詳細なEvidence、Source、Rights、不確実性は各地域のデータ監査を参照する。
