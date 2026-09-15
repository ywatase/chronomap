# ADR 0005: 正規化されたデータパッケージ

Date: 2026-09-16

Status: Accepted

Superseded by: なし

## Context

版管理された歴史地物を地域別データセットとして配布するには、対象の同一性、資料、資料の利用関係、空間表現を重複なく関連付け、静的クライアントでも一貫して読める必要がある。

## Decision

データセットを`dataset.json`、`entities.json`、`sources.json`、`evidence.json`、`feature-versions.geojson`から成る正規化された5ファイルのパッケージとして配布する。フィールド、ID、参照、GeoJSON、権利の規範契約は[歴史データ規範モデル](../data/model.md)に定める。

## Alternatives

- 一つの巨大なGeoJSONにすべてのメタデータを重複して入れる案は、同じ資料と対象の更新整合性を損なうため採用しない。
- 時代ごとに完全なデータセットを複製する案は、対象・資料の再利用と参照整合性を失うため採用しない。
- サーバーAPIの内部形式だけを定める案は、静的クライアントMVPの配布単位を明確にしないため採用しない。

## Consequences

データ作成者は5ファイルを一つの整合した単位として検証する必要がある。表示側はFeatureVersionを起点に必要な索引を参照でき、資料と権利を重複なく表示できる。

## References

- [歴史データ規範モデル](../data/model.md)
- [ADR 0004: 版管理された歴史地物](0004-versioned-historical-features.md)
- [アーキテクチャ概要](../architecture/overview.md)
