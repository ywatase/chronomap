# ADR 0003: MapLibre GL JSと地理院タイル

Date: 2026-09-14

Status: Accepted

Superseded by: なし

## Context

日本MVPでは、歴史データを現在の地図と重ねて比較する。描画エンジンと背景地図は、静的クライアント構成、GeoJSONレイヤー、出典表示の方針と整合する必要がある。

## Decision

描画エンジンにMapLibre GL JSを採用し、日本MVPの背景地図に地理院タイルを採用する。利用条件を実装前に確認し、地図の出典表示を利用者に常時確認できる形で提供することを必須結果とする。

## Alternatives

- Leafletは採用候補になり得るが、本MVPではMapLibre GL JSに統一する。
- OpenLayersは高機能だが、MVPで必要な共通表示エンジンの範囲を超えるため採用しない。
- 商用地図SDKは利用条件と費用の依存を増やすため、MVPでは採用しない。

## Consequences

Map AdapterはMapLibre GL JSへの依存を閉じ込める。地理院タイルの出典・利用条件の確認は、データ制作と公開前確認の両方に含める。

## References

- [MapLibre GL JS 公式ドキュメント](https://maplibre.org/maplibre-gl-js/docs/)
- [地理院タイル一覧（国土地理院）](https://maps.gsi.go.jp/development/ichiran.html)
- [アーキテクチャ概要](../architecture/overview.md)
