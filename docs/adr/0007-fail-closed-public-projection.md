# ADR 0007: fail-closedな公開投影

Date: 2026-09-16

Status: Accepted

Superseded by: なし

## Context

編集用パッケージには未公開の表現や、公開できない資料を引用した根拠があり得る。公開処理が参照・権利の不整合を見落とすと、私的な内容又は公開権限のない内容を静的配布物に含める危険がある。

## Decision

公開バンドルは、公開指定かつpublishableなFeatureVersionから到達可能なレコードだけを決定的に投影する。公開対象の権利、参照、Evidenceが規範契約を満たさない場合は生成を失敗させ、既存の正常な出力を置き換えない。公開投影と直列化の詳細は[歴史データ規範モデル](../data/model.md)に定める。

## Alternatives

- 問題のある公開対象だけを黙って除外する案は、欠落に気付かない不完全な公開物を作るため採用しない。
- 権利状態を問わず編集用パッケージをそのまま公開する案は、私的内容と権利上のリスクを分離できないため採用しない。
- 公開可否を利用者操作で上書きする案は、再現可能な公開判断を損なうため採用しない。

## Consequences

公開処理は失敗を明示し、出力を原子的に更新する必要がある。`publicationStatus`が省略されたFeatureVersionはprivateとして扱われ、手動の公開上書きは提供しない。

## References

- [歴史データ規範モデル](../data/model.md)
- [ADR 0005: 正規化されたデータパッケージ](0005-normalized-data-package.md)
- [ADR 0006: 可能性優先の時間と並行仮説](0006-possible-time-and-parallel-hypotheses.md)
- [アーキテクチャ概要](../architecture/overview.md)
