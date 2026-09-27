"""Deterministic, public-facing audit projections for dataset packages.

The audit deliberately exposes only normalized metadata that has already been
validated by the package contract.  It is therefore safe to check the report
into the repository or hand it to a teacher without copying source material.
"""

from collections.abc import Mapping
from dataclasses import dataclass

from .models import DatasetPackage, JsonValue, ValidationProfile


_UNCERTAINTY_DIMENSIONS = ("temporal", "location", "geometry", "identity")


def _mapping(value: JsonValue) -> Mapping[str, JsonValue]:
    return value if isinstance(value, Mapping) else {}


def _records(value: JsonValue) -> tuple[Mapping[str, JsonValue], ...]:
    if not isinstance(value, tuple):
        return ()
    return tuple(item for item in value if isinstance(item, Mapping))


def _strings(value: JsonValue) -> tuple[str, ...]:
    if not isinstance(value, tuple):
        return ()
    return tuple(item for item in value if isinstance(item, str))


def _string(value: JsonValue) -> str:
    return value if isinstance(value, str) else ""


def _integer(value: JsonValue) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None


def _text(value: JsonValue, language: str) -> str:
    if isinstance(value, str):
        return value
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


def _boundary(value: JsonValue) -> tuple[int | None, int | None, str, str]:
    boundary = _mapping(value)
    return (
        _integer(boundary.get("earliestYear")),
        _integer(boundary.get("latestYear")),
        _string(boundary.get("precision")),
        _string(boundary.get("qualifier")),
    )


def _range_text(earliest: int | None, latest: int | None) -> str:
    if earliest is None and latest is None:
        return "不詳"
    if earliest is None:
        return f"?–{latest}"
    if latest is None:
        return f"{earliest}–?"
    if earliest == latest:
        return str(earliest)
    return f"{earliest}–{latest}"


@dataclass(frozen=True, slots=True)
class AuditPeriod:
    """Temporal bounds copied into the audit without changing their meaning."""

    start_earliest_year: int | None
    start_latest_year: int | None
    end_earliest_year: int | None
    end_latest_year: int | None
    start_precision: str
    start_qualifier: str
    end_precision: str
    end_qualifier: str

    @property
    def display(self) -> str:
        start = _range_text(self.start_earliest_year, self.start_latest_year)
        end = _range_text(self.end_earliest_year, self.end_latest_year)
        if start == end and start != "不詳":
            return f"{start}年"
        if end == "不詳":
            return f"{start}年以降"
        if start == "不詳":
            return f"{end}年まで"
        return f"{start}–{end}年"


@dataclass(frozen=True, slots=True)
class AuditUncertainty:
    dimension: str
    assessment: str
    note: str
    evidence_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class AuditEvidence:
    id: str
    source_id: str
    locator: str
    usage: str
    supports: tuple[str, ...]
    note: str
    publication_basis: str


@dataclass(frozen=True, slots=True)
class AuditSource:
    id: str
    citation: str
    title: str
    creators: tuple[str, ...]
    published_year: int | None
    url: str
    accessed_date: str
    rights_status: str
    rights_attribution: str
    rights_terms: str


@dataclass(frozen=True, slots=True)
class AuditFeature:
    id: str
    label: str
    entity_id: str
    geometry_type: str
    period: AuditPeriod
    uncertainty: tuple[AuditUncertainty, ...]
    evidence: tuple[AuditEvidence, ...]
    sources: tuple[AuditSource, ...]
    rights_status: str
    rights_attribution: str
    rights_terms: str


@dataclass(frozen=True, slots=True)
class AuditReport:
    dataset_id: str
    dataset_title: str
    default_language: str
    feature_count: int
    features: tuple[AuditFeature, ...]
    sources: tuple[AuditSource, ...]


def _period(value: JsonValue) -> AuditPeriod:
    temporal = _mapping(value)
    start = _boundary(temporal.get("start"))
    end = _boundary(temporal.get("end"))
    return AuditPeriod(
        start_earliest_year=start[0],
        start_latest_year=start[1],
        end_earliest_year=end[0],
        end_latest_year=end[1],
        start_precision=start[2],
        start_qualifier=start[3],
        end_precision=end[2],
        end_qualifier=end[3],
    )


def _source(record: Mapping[str, JsonValue], language: str) -> AuditSource:
    rights = _mapping(record.get("rights"))
    return AuditSource(
        id=_string(record.get("id")),
        citation=_string(record.get("citation")),
        title=_text(record.get("title"), language),
        creators=_strings(record.get("creators")),
        published_year=_integer(record.get("publishedYear")),
        url=_string(record.get("url")),
        accessed_date=_string(record.get("accessedDate")),
        rights_status=_string(rights.get("status")),
        rights_attribution=_string(rights.get("attribution")),
        rights_terms=_string(rights.get("terms")),
    )


def _evidence(record: Mapping[str, JsonValue]) -> AuditEvidence:
    return AuditEvidence(
        id=_string(record.get("id")),
        source_id=_string(record.get("sourceId")),
        locator=_string(record.get("locator")),
        usage=_string(record.get("usage")),
        supports=tuple(sorted(_strings(record.get("supports")))),
        note=_string(record.get("note")),
        publication_basis=_string(record.get("publicationBasis")),
    )


def _uncertainty(properties: Mapping[str, JsonValue]) -> tuple[AuditUncertainty, ...]:
    result = []
    uncertainty = _mapping(properties.get("uncertainty"))
    for dimension in _UNCERTAINTY_DIMENSIONS:
        assessment = _mapping(uncertainty.get(dimension))
        result.append(
            AuditUncertainty(
                dimension=dimension,
                assessment=_string(assessment.get("assessment")),
                note=_string(assessment.get("note")),
                evidence_ids=tuple(sorted(_strings(assessment.get("evidenceIds")))),
            )
        )
    return tuple(result)


def audit_package(
    package: DatasetPackage, profile: ValidationProfile = ValidationProfile.PUBLIC
) -> AuditReport:
    """Project public FeatureVersions and their reachable audit metadata.

    Validation is intentionally performed by :func:`validate_package` before
    this projection (the CLI does this automatically).  Missing references
    still raise a clear ``ValueError`` so callers using the API directly do not
    receive a silently incomplete report.
    """

    _ = profile
    dataset = _mapping(package.dataset)
    default_language = _string(dataset.get("defaultLanguage"))
    entities_by_id = {
        _string(record.get("id")): record for record in _records(package.entities)
    }
    sources_by_id = {
        _string(record.get("id")): record for record in _records(package.sources)
    }
    evidence_by_id = {
        _string(record.get("id")): record for record in _records(package.evidence)
    }

    features = []
    reachable_sources: dict[str, AuditSource] = {}
    for feature_record in sorted(
        _records(_mapping(package.feature_versions).get("features")),
        key=lambda record: _string(record.get("id")),
    ):
        properties = _mapping(feature_record.get("properties"))
        if properties.get("publicationStatus") != "public":
            continue
        evidence_ids = tuple(sorted(_strings(properties.get("evidenceIds"))))
        evidence_records = []
        for evidence_id in evidence_ids:
            record = evidence_by_id.get(evidence_id)
            if record is None:
                raise ValueError(
                    f"feature {_string(feature_record.get('id'))!r} references unknown evidence {evidence_id!r}"
                )
            evidence_records.append(_evidence(record))

        source_records: list[AuditSource] = []
        for source_id in sorted({evidence.source_id for evidence in evidence_records}):
            record = sources_by_id.get(source_id)
            if record is None:
                raise ValueError(
                    f"feature {_string(feature_record.get('id'))!r} references unknown source {source_id!r}"
                )
            source = _source(record, default_language)
            source_records.append(source)
            reachable_sources[source.id] = source

        entity_id = _string(properties.get("entityId"))
        entity = entities_by_id.get(entity_id, {})
        label = _text(properties.get("labels"), default_language) or _text(
            entity.get("labels"), default_language
        )
        rights = _mapping(properties.get("rights"))
        geometry = _mapping(feature_record.get("geometry"))
        features.append(
            AuditFeature(
                id=_string(feature_record.get("id")),
                label=label,
                entity_id=entity_id,
                geometry_type=_string(geometry.get("type")),
                period=_period(properties.get("temporal")),
                uncertainty=_uncertainty(properties),
                evidence=tuple(evidence_records),
                sources=tuple(source_records),
                rights_status=_string(rights.get("status")),
                rights_attribution=_string(rights.get("attribution")),
                rights_terms=_string(rights.get("terms")),
            )
        )

    return AuditReport(
        dataset_id=_string(dataset.get("id")),
        dataset_title=_text(dataset.get("title"), default_language),
        default_language=default_language,
        feature_count=len(features),
        features=tuple(features),
        sources=tuple(reachable_sources[source_id] for source_id in sorted(reachable_sources)),
    )


def _markdown_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("|", "\\|").replace("\r", " ").replace("\n", " ")


def _source_label(source: AuditSource) -> str:
    return source.citation or source.title or source.id


def render_audit_markdown(report: AuditReport) -> str:
    """Render a stable Japanese Markdown snapshot of an :class:`AuditReport`."""

    lines = [
        f"# データ監査: {_markdown_text(report.dataset_title)}",
        "",
        f"- データセットID: `{_markdown_text(report.dataset_id)}`",
        f"- 既定言語: `{_markdown_text(report.default_language)}`",
        f"- 公開FeatureVersion: {report.feature_count}",
        "- 監査範囲: 公開FeatureVersionから到達できるEvidence／Sourceのメタデータ",
        "",
        "## FeatureVersion監査",
        "",
        "| FeatureVersion | 地物 | geometry | 年代 | 権利 |",
        "|---|---|---|---|---|",
    ]
    for feature in report.features:
        lines.append(
            "| "
            + " | ".join(
                (
                    f"`{_markdown_text(feature.id)}`",
                    _markdown_text(feature.label),
                    _markdown_text(feature.geometry_type),
                    _markdown_text(feature.period.display),
                    _markdown_text(feature.rights_status),
                )
            )
            + " |"
        )

    for feature in report.features:
        lines.extend(
            (
                "",
                f"### `{_markdown_text(feature.id)}`",
                "",
                f"- 地物: {_markdown_text(feature.label)} (`{_markdown_text(feature.entity_id)}`)",
                f"- geometry: `{_markdown_text(feature.geometry_type)}`",
                f"- 年代: {_markdown_text(feature.period.display)}",
                f"- 権利: `{_markdown_text(feature.rights_status)}`"
                f" — 表示: {_markdown_text(feature.rights_attribution)}"
                f" — {_markdown_text(feature.rights_terms)}",
                "- 不確実性:",
            )
        )
        for uncertainty in feature.uncertainty:
            detail = f" — {_markdown_text(uncertainty.note)}" if uncertainty.note else ""
            evidence = ", ".join(f"`{_markdown_text(item)}`" for item in uncertainty.evidence_ids)
            evidence_detail = f" (Evidence: {evidence})" if evidence else ""
            lines.append(
                f"  - `{_markdown_text(uncertainty.dimension)}`: "
                f"`{_markdown_text(uncertainty.assessment)}`{detail}{evidence_detail}"
            )
        lines.extend(("", "- Evidence:", "", "| Evidence | 用途 | supports | locator | source |", "|---|---|---|---|---|"))
        for evidence in feature.evidence:
            lines.append(
                "| "
                + " | ".join(
                    (
                        f"`{_markdown_text(evidence.id)}`",
                        _markdown_text(evidence.usage),
                        _markdown_text(", ".join(evidence.supports)),
                        _markdown_text(evidence.locator),
                        f"`{_markdown_text(evidence.source_id)}`",
                    )
                )
                + " |"
            )
            if evidence.note or evidence.publication_basis:
                note = f" — {_markdown_text(evidence.note)}" if evidence.note else ""
                basis = f" (publicationBasis: `{_markdown_text(evidence.publication_basis)}`)" if evidence.publication_basis else ""
                lines.append(f"  - `{_markdown_text(evidence.id)}`{note}{basis}")
        lines.extend(("", "- Source:", ""))
        for source in feature.sources:
            rights = f"`{_markdown_text(source.rights_status)}`"
            url = f" — {_markdown_text(source.url)}" if source.url else ""
            metadata = "; ".join(
                part
                for part in (
                    _markdown_text(source.title),
                    f"作成者: {_markdown_text(', '.join(source.creators))}" if source.creators else "",
                    f"{source.published_year}年" if source.published_year is not None else "",
                    f"参照日: {_markdown_text(source.accessed_date)}" if source.accessed_date else "",
                )
                if part
            )
            attribution = f"; 表示: {_markdown_text(source.rights_attribution)}" if source.rights_attribution else ""
            lines.append(
                f"  - `{_markdown_text(source.id)}`: {_markdown_text(_source_label(source))}"
                f" — {metadata} — rights: {rights}{attribution}{url}"
            )

    lines.extend(
        (
            "",
            "## Source一覧",
            "",
            "| Source | citation | metadata | rights | terms |",
            "|---|---|---|---|---|",
        )
    )
    for source in report.sources:
        metadata = "; ".join(
            part
            for part in (
                _markdown_text(source.title),
                f"作成者: {_markdown_text(', '.join(source.creators))}" if source.creators else "",
                f"{source.published_year}年" if source.published_year is not None else "",
                f"参照日: {_markdown_text(source.accessed_date)}" if source.accessed_date else "",
                _markdown_text(source.url) if source.url else "",
            )
            if part
        )
        rights = _markdown_text(source.rights_status)
        if source.rights_attribution:
            rights += f"; 表示: {_markdown_text(source.rights_attribution)}"
        lines.append(
            "| "
            + " | ".join(
                (
                    f"`{_markdown_text(source.id)}`",
                    _markdown_text(source.citation),
                    metadata,
                    rights,
                    _markdown_text(source.rights_terms),
                )
            )
            + " |"
        )

    lines.extend(
        (
            "",
            "## 監査上の注意",
            "",
            "- 本レポートは、既存の `public` 検証を通過したFeatureVersionだけを対象にしています。",
            "- geometryはEvidenceのlocatorとpublicationBasisを併記した概略復元です。原資料の本文・画像・碑文全文は再現しません。",
            "- Sourceの権利条件は各行に記載したtermsを優先し、授業での再利用時も出典表示と編集・加工表示を確認してください。",
            "",
        )
    )
    return "\n".join(lines)
