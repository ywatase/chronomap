"""Deterministic coverage projections for public Chronomap datasets.

The projection contains counts and identifiers from normalized metadata only.
It never copies source bodies, images, or other third-party material into the
checked-in coverage snapshot.
"""

from collections.abc import Mapping
from dataclasses import dataclass

from .models import DatasetPackage, JsonValue


# Keep this in schema order so the report makes every allowed type visible,
# including types that have not yet been supported by a public pilot.
ALLOWED_ENTITY_TYPES = (
    "waterbody",
    "watercourse",
    "coastline",
    "fortification",
    "settlement",
    "port",
    "battlefield",
    "route",
    "boundary",
    "polity",
    "sphere-of-influence",
    "archaeological-site",
    "other",
)


def _mapping(value: JsonValue) -> Mapping[str, JsonValue]:
    return value if isinstance(value, Mapping) else {}


def _records(value: JsonValue) -> tuple[Mapping[str, JsonValue], ...]:
    if not isinstance(value, tuple):
        return ()
    return tuple(item for item in value if isinstance(item, Mapping))


def _string(value: JsonValue) -> str:
    return value if isinstance(value, str) else ""


def _strings(value: JsonValue) -> tuple[str, ...]:
    if not isinstance(value, tuple):
        return ()
    return tuple(item for item in value if isinstance(item, str))


def _text(value: JsonValue, language: str) -> str:
    text_map = _mapping(value)
    preferred = language.casefold()
    for tag, text in text_map.items():
        if tag.casefold() == preferred and isinstance(text, str):
            return text
    for tag in sorted(text_map):
        text = text_map[tag]
        if isinstance(text, str):
            return text
    return ""


@dataclass(frozen=True, slots=True)
class CoverageRow:
    """One public dataset's reachable metadata and Entity-type coverage."""

    slug: str
    dataset_id: str
    title: str
    entity_count: int
    feature_count: int
    evidence_count: int
    source_count: int
    source_with_rights_count: int
    entity_type_counts: tuple[tuple[str, int], ...]
    missing_entity_types: tuple[str, ...]


def _coverage_row(slug: str, package: DatasetPackage) -> CoverageRow:
    dataset = _mapping(package.dataset)
    default_language = _string(dataset.get("defaultLanguage"))
    entities_by_id = {
        _string(record.get("id")): record for record in _records(package.entities)
    }
    evidence_by_id = {
        _string(record.get("id")): record for record in _records(package.evidence)
    }
    sources_by_id = {
        _string(record.get("id")): record for record in _records(package.sources)
    }

    public_features = tuple(
        feature
        for feature in _records(_mapping(package.feature_versions).get("features"))
        if _mapping(feature.get("properties")).get("publicationStatus") == "public"
    )
    reachable_entities: set[str] = set()
    reachable_evidence: set[str] = set()
    reachable_sources: set[str] = set()
    entity_type_counts: dict[str, int] = {}

    for feature in public_features:
        feature_id = _string(feature.get("id"))
        properties = _mapping(feature.get("properties"))
        entity_id = _string(properties.get("entityId"))
        entity = entities_by_id.get(entity_id)
        if entity is None:
            raise ValueError(
                f"public feature {feature_id!r} references unknown entity {entity_id!r}"
            )
        entity_type = _string(entity.get("type"))
        if entity_type not in ALLOWED_ENTITY_TYPES:
            raise ValueError(
                f"entity {entity_id!r} has unsupported type {entity_type!r}"
            )
        if entity_id not in reachable_entities:
            entity_type_counts[entity_type] = entity_type_counts.get(entity_type, 0) + 1
            reachable_entities.add(entity_id)

        for evidence_id in _strings(properties.get("evidenceIds")):
            evidence = evidence_by_id.get(evidence_id)
            if evidence is None:
                raise ValueError(
                    f"public feature {feature_id!r} references unknown evidence {evidence_id!r}"
                )
            source_id = _string(evidence.get("sourceId"))
            source = sources_by_id.get(source_id)
            if source is None:
                raise ValueError(
                    f"evidence {evidence_id!r} references unknown source {source_id!r}"
                )
            rights_status = _string(_mapping(source.get("rights")).get("status"))
            if not rights_status:
                raise ValueError(f"source {source_id!r} has no rights status")
            reachable_evidence.add(evidence_id)
            reachable_sources.add(source_id)

    present_types = tuple(
        entity_type for entity_type in ALLOWED_ENTITY_TYPES if entity_type in entity_type_counts
    )
    return CoverageRow(
        slug=slug,
        dataset_id=_string(dataset.get("id")),
        title=_text(dataset.get("title"), default_language),
        entity_count=len(reachable_entities),
        feature_count=len(public_features),
        evidence_count=len(reachable_evidence),
        source_count=len(reachable_sources),
        source_with_rights_count=len(reachable_sources),
        entity_type_counts=tuple(
            (entity_type, entity_type_counts[entity_type]) for entity_type in present_types
        ),
        missing_entity_types=tuple(
            entity_type for entity_type in ALLOWED_ENTITY_TYPES if entity_type not in entity_type_counts
        ),
    )


def build_coverage_matrix(
    packages: Mapping[str, DatasetPackage],
) -> tuple[CoverageRow, ...]:
    """Build coverage rows in the caller's explicit dataset order.

    Mapping insertion order is treated as the requested presentation order.
    Each row is otherwise derived from sorted, canonical Entity-type order and
    set-based reachability counts, so source file record order cannot affect it.
    """

    return tuple(_coverage_row(slug, package) for slug, package in packages.items())


def _markdown_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("|", "\\|").replace("\r", " ").replace("\n", " ")


def _type_counts(row: CoverageRow) -> str:
    return ", ".join(f"`{entity_type}` × {count}" for entity_type, count in row.entity_type_counts)


def _missing_types(row: CoverageRow) -> str:
    if not row.missing_entity_types:
        return "なし"
    return ", ".join(f"`{entity_type}`" for entity_type in row.missing_entity_types)


def render_coverage_matrix(report: tuple[CoverageRow, ...]) -> str:
    """Render a stable, source-safe Japanese Markdown coverage snapshot."""

    total_entities = sum(row.entity_count for row in report)
    total_features = sum(row.feature_count for row in report)
    total_evidence = sum(row.evidence_count for row in report)
    total_sources = sum(row.source_count for row in report)
    lines = [
        "# 日本公開データ・カバレッジ監査",
        "",
        "この表は、公開FeatureVersionから到達できる正規化メタデータだけを決定的に集計する。Source本文・画像・碑文などの第三者コンテンツは複製しない。",
        "",
        f"- 対象地域: {len(report)}",
        f"- 公開Entity: {total_entities}",
        f"- 公開FeatureVersion: {total_features}",
        f"- 到達可能Evidence: {total_evidence}",
        f"- 到達可能Source: {total_sources}",
        "- 不足型の扱い: 資料・権利・不確実性を確認できるまで推測で補完しない",
        "",
        "## 地域別集計",
        "",
        "| 地域 | dataset ID | Entity | FeatureVersion | Evidence | Source | Source Rights | 収録Entity type |",
        "|---|---|---:|---:|---:|---:|---:|---|",
    ]
    for row in report:
        lines.append(
            "| "
            + " | ".join(
                (
                    _markdown_text(row.title),
                    f"`{_markdown_text(row.dataset_id)}`",
                    str(row.entity_count),
                    str(row.feature_count),
                    str(row.evidence_count),
                    str(row.source_count),
                    f"{row.source_with_rights_count}/{row.source_count}",
                    _type_counts(row),
                )
            )
            + " |"
        )

    lines.extend(("", "## 不足する許可Entity type", ""))
    for row in report:
        lines.extend(
            (
                f"### {_markdown_text(row.title)} (`{_markdown_text(row.slug)}`)",
                "",
                f"- 未収録: {_missing_types(row)}",
                "- 欠落理由: 現行の公開bundleに、公開可能な根拠・権利・4次元不確実性を備えた該当Entityがないため。未確認資料から推測して追加しない。",
                "",
            )
        )

    lines.extend(
        (
            "## 許可Entity type",
            "",
            ", ".join(f"`{entity_type}`" for entity_type in ALLOWED_ENTITY_TYPES),
            "",
            "この監査表の件数は公開範囲の広さを示す指標であり、歴史的正確性や日本全体の網羅を保証するものではない。詳細なEvidence、Source、Rights、不確実性は各地域のデータ監査を参照する。",
            "",
        )
    )
    return "\n".join(lines)
