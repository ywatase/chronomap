# ADR 0004: 版管理された歴史地物

作成日: 2026-09-14

Status: Accepted

## Context

歴史地物は、同じ対象でも時代や採用する仮説により形状・名称・属性が変わる。根拠の異なる表現を一つの地物に上書きすると、対象の同一性、出典、不確実性を説明できなくなる。

## Decision

歴史対象の同一性を`HistoricalEntity`、時代・仮説ごとの形状と属性を`FeatureVersion`として分離する。`Source`は独立した根拠として保持し、`FeatureVersion`から参照する。具体的なスキーマは後続ADRで定める。

## Alternatives

- 単一Featureを時代ごとに上書きする案は、過去の表現と根拠を失うため採用しない。
- 年代ごとに完全なデータを複製する案は、同一対象の追跡と更新整合性を損なうため採用しない。
- 確度を一つの数値だけで表す案は、不確実性の種類や根拠の差を十分に表せないため採用しない。

## Consequences

Temporal Filterは`FeatureVersion`の有効期間を評価する。Metadata Panelは`HistoricalEntity`の説明と、選択した`FeatureVersion`の出典・不確実性を区別して表示する。

## References

- [アーキテクチャ概要](../architecture/overview.md)
- [ADR一覧](README.md)
