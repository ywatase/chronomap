"""Pure cross-file validation for structurally valid Chronomap packages."""

from collections.abc import Mapping, Sequence
import math

from .geometry import validate_bbox, validate_geometry_with_bounds
from .models import DatasetPackage, JsonValue, ValidationIssue, ValidationProfile


RESOURCE_KINDS = {"dataset", "entity", "version", "source", "evidence", "hypothesis"}


def _pointer(*parts: object) -> str:
    return "/" + "/".join(str(part).replace("~", "~0").replace("/", "~1") for part in parts)


def _issue(code: str, file: str, pointer: str, message: str) -> ValidationIssue:
    return ValidationIssue(code=code, file=file, pointer=pointer, message=message)


def _records(value: JsonValue) -> Sequence[Mapping[str, JsonValue]]:
    return value if isinstance(value, tuple) else ()


def _mapping(value: JsonValue) -> Mapping[str, JsonValue]:
    return value if isinstance(value, Mapping) else {}


def _kind(identifier: object) -> str | None:
    if not isinstance(identifier, str):
        return None
    parts = identifier.split(":")
    return parts[1] if len(parts) == 3 else None


def _language_duplicate(tag: object) -> bool:
    """Return whether a structurally lexical BCP 47 tag repeats a semantic part."""
    if not isinstance(tag, str):
        return False
    parts = tag.split("-")
    if not parts:
        return False
    if parts[0].casefold() == "x":
        return False
    index = 1
    if index < len(parts) and len(parts[index]) == 4 and parts[index].isalpha():
        index += 1
    if index < len(parts) and ((len(parts[index]) == 2 and parts[index].isalpha()) or (len(parts[index]) == 3 and parts[index].isdigit())):
        index += 1
    variants: set[str] = set()
    singletons: set[str] = set()
    while index < len(parts):
        part = parts[index]
        folded = part.casefold()
        if len(part) == 1 and part.isalnum():
            if folded == "x":
                break
            if folded in singletons:
                return True
            singletons.add(folded)
            index += 1
            while index < len(parts) and len(parts[index]) != 1:
                index += 1
            continue
        is_variant = (5 <= len(part) <= 8 and part.isalnum()) or (len(part) == 4 and part[0].isdigit() and part[1:].isalnum())
        if is_variant:
            if folded in variants:
                return True
            variants.add(folded)
        index += 1
    return False


def _year(value: object) -> int | None:
    if isinstance(value, int) and not isinstance(value, bool):
        return value
    if isinstance(value, float) and math.isfinite(value) and value.is_integer():
        return int(value)
    return None


def validate_temporal(value: object, file: str, pointer: str) -> list[ValidationIssue]:
    """Return temporal-boundary and possible-activity ordering issues."""
    temporal = _mapping(value)
    issues: list[ValidationIssue] = []
    boundaries = {name: _mapping(temporal.get(name)) for name in ("start", "end")}
    for name, boundary in boundaries.items():
        earliest = _year(boundary.get("earliestYear"))
        latest = _year(boundary.get("latestYear"))
        if earliest is not None and latest is not None and earliest > latest:
            issues.append(_issue("temporal.invalid", file, _pointer(*pointer.strip("/").split("/"), name), "earliestYear must not exceed latestYear"))
    start_earliest = _year(boundaries["start"].get("earliestYear"))
    end_latest = _year(boundaries["end"].get("latestYear"))
    if start_earliest is not None and end_latest is not None and start_earliest > end_latest:
        issues.append(_issue("temporal.invalid", file, pointer, "possible activity start must not be after possible activity end"))
    return sorted(issues, key=lambda issue: (issue.file, issue.pointer, issue.code, issue.message))


def _possible_range(value: object) -> tuple[int | float, int | float]:
    temporal = _mapping(value)
    start = _mapping(temporal.get("start"))
    end = _mapping(temporal.get("end"))
    earliest = _year(start.get("earliestYear"))
    latest = _year(end.get("latestYear"))
    return (float("-inf") if earliest is None else earliest, float("inf") if latest is None else latest)


def _hypothesis_issues(features: Sequence[Mapping[str, JsonValue]], profile: ValidationProfile) -> list[ValidationIssue]:
    groups: dict[str, list[tuple[int, Mapping[str, JsonValue]]]] = {}
    for index, feature in enumerate(features):
        properties = _mapping(feature.get("properties"))
        group_id = properties.get("hypothesisGroupId")
        if isinstance(group_id, str):
            groups.setdefault(group_id, []).append((index, properties))
    issues: list[ValidationIssue] = []
    for members in groups.values():
        for index, properties in members:
            if _kind(properties.get("hypothesisGroupId")) != "hypothesis":
                issues.append(_issue("id.invalid_kind", "feature-versions.geojson", _pointer("features", index, "properties", "hypothesisGroupId"), "hypothesisGroupId must have kind 'hypothesis'"))
            if not _mapping(properties.get("hypothesisLabel")):
                issues.append(_issue("hypothesis.invalid", "feature-versions.geojson", _pointer("features", index, "properties", "hypothesisLabel"), "hypothesis members require a label"))
        relevant = [member for member in members if profile != ValidationProfile.PUBLIC or member[1].get("publicationStatus") == "public"]
        if profile == ValidationProfile.PUBLIC and not relevant:
            continue
        if len(relevant) < 2:
            for index, _ in relevant:
                issues.append(_issue("hypothesis.invalid", "feature-versions.geojson", _pointer("features", index, "properties", "hypothesisGroupId"), "a hypothesis group needs at least two alternatives"))
            continue
        entity_ids = {properties.get("entityId") for _, properties in relevant}
        if len(entity_ids) != 1:
            for index, _ in relevant:
                issues.append(_issue("hypothesis.invalid", "feature-versions.geojson", _pointer("features", index, "properties", "hypothesisGroupId"), "hypothesis alternatives must belong to one entity"))
        starts, ends = zip(*(_possible_range(properties.get("temporal")) for _, properties in relevant))
        if max(starts) > min(ends):
            for index, _ in relevant:
                issues.append(_issue("hypothesis.invalid", "feature-versions.geojson", _pointer("features", index, "properties", "hypothesisGroupId"), "hypothesis alternatives must have overlapping possible activity"))
    return issues


def _uncertainty_issues(
    properties: Mapping[str, JsonValue], evidence_by_id: Mapping[object, Mapping[str, JsonValue]], index: int
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    feature_evidence = set(_records(properties.get("evidenceIds")))
    uncertainty = _mapping(properties.get("uncertainty"))
    for dimension in ("temporal", "location", "geometry", "identity"):
        assessment = _mapping(uncertainty.get(dimension))
        base = _pointer("features", index, "properties", "uncertainty", dimension)
        status = assessment.get("assessment")
        evidence_ids = _records(assessment.get("evidenceIds"))
        note = assessment.get("note")
        if status in {"well-supported", "approximate", "disputed"} and not evidence_ids:
            issues.append(_issue("uncertainty.invalid", "feature-versions.geojson", _pointer(*base.strip("/").split("/"), "evidenceIds"), "assessment requires evidence"))
        if status in {"approximate", "disputed", "unknown", "not-applicable"} and not isinstance(note, str | bytes) or status in {"approximate", "disputed", "unknown", "not-applicable"} and not note:
            issues.append(_issue("uncertainty.invalid", "feature-versions.geojson", _pointer(*base.strip("/").split("/"), "note"), "assessment requires an explanatory note"))
        for evidence_index, evidence_id in enumerate(evidence_ids):
            evidence_pointer = _pointer(*base.strip("/").split("/"), "evidenceIds", evidence_index)
            evidence_record = evidence_by_id.get(evidence_id)
            if evidence_record is None:
                issues.append(_issue("ref.missing", "feature-versions.geojson", evidence_pointer, f"evidence {evidence_id!r} does not exist"))
            if evidence_id not in feature_evidence:
                issues.append(_issue("uncertainty.invalid", "feature-versions.geojson", evidence_pointer, "uncertainty evidence must be a feature evidence subset"))
            elif dimension not in _records(_mapping(evidence_record).get("supports")):
                issues.append(_issue("uncertainty.invalid", "feature-versions.geojson", evidence_pointer, "uncertainty evidence must support its dimension"))
    return issues


def _publishable(value: object) -> bool:
    return _mapping(value).get("status") in {"public-domain", "open-license", "permission"}


def _public_issues(
    package: DatasetPackage,
    features: Sequence[Mapping[str, JsonValue]],
    evidence_by_id: Mapping[object, Mapping[str, JsonValue]],
    source_by_id: Mapping[object, Mapping[str, JsonValue]],
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    dataset = _mapping(package.dataset)
    if not _publishable(dataset.get("rights")):
        issues.append(_issue("publication.rights", "dataset.json", "/rights/status", "public datasets require publishable rights"))
    used_evidence: set[object] = set()
    for index, feature in enumerate(features):
        properties = _mapping(feature.get("properties"))
        if properties.get("publicationStatus") != "public":
            continue
        base = _pointer("features", index, "properties")
        if not _publishable(properties.get("rights")):
            issues.append(_issue("publication.rights", "feature-versions.geojson", _pointer(*base.strip("/").split("/"), "rights", "status"), "public feature versions require publishable rights"))
        evidence_ids = _records(properties.get("evidenceIds"))
        supports = {dimension for evidence_id in evidence_ids for dimension in _records(_mapping(evidence_by_id.get(evidence_id)).get("supports"))}
        geometry_evidence = [
            _mapping(evidence_by_id.get(evidence_id))
            for evidence_id in evidence_ids
            if "geometry" in _records(_mapping(evidence_by_id.get(evidence_id)).get("supports"))
        ]
        has_derived_geometry_basis = any(
            evidence.get("usage") == "derived-geometry" and evidence.get("publicationBasis")
            for evidence in geometry_evidence
        )
        if not {"temporal", "geometry"} <= supports or not has_derived_geometry_basis:
            issues.append(_issue("publication.evidence", "feature-versions.geojson", _pointer(*base.strip("/").split("/"), "evidenceIds"), "public feature versions need temporal and geometry evidence"))
        used_evidence.update(evidence_ids)
    source_indexes = {record.get("id"): index for index, record in enumerate(_records(package.sources))}
    for evidence_index, evidence in enumerate(_records(package.evidence)):
        evidence_id = evidence.get("id")
        if evidence_id not in used_evidence:
            continue
        source = source_by_id.get(evidence.get("sourceId"))
        source_rights = _mapping(source.get("rights") if source else None)
        source_status = source_rights.get("status")
        evidence_pointer = _pointer(evidence_index, "sourceId")
        if source_status in {"restricted", "unknown"}:
            if evidence.get("usage") != "citation" or not evidence.get("locator") or not source_rights.get("terms"):
                issues.append(_issue("publication.evidence", "evidence.json", evidence_pointer, "restricted or unknown sources may be cited only with rights metadata and a locator"))
        elif source_status in {"open-license", "permission"} and (not source_rights.get("attribution") or not source_rights.get("terms")):
            issues.append(_issue("publication.rights", "sources.json", _pointer(source_indexes.get(evidence.get("sourceId"), 0), "rights"), "source rights metadata is incomplete"))
        if evidence.get("usage") == "derived-geometry" and (not evidence.get("publicationBasis") or source_status in {"restricted", "unknown"}):
            issues.append(_issue("publication.evidence", "evidence.json", evidence_pointer, "derived geometry needs a publication basis and publishable source rights"))
    return issues


def _text_map_issues(value: JsonValue, file: str, pointer: str) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    text_map = _mapping(value)
    seen: set[str] = set()
    for tag in text_map:
        folded = tag.casefold()
        if folded in seen or _language_duplicate(tag):
            issues.append(_issue("language.invalid", file, _pointer(*pointer.strip("/").split("/"), tag), "language tag repeats a BCP 47 variant or extension singleton"))
        seen.add(folded)
    return issues


def validate_semantics(package: DatasetPackage, profile: ValidationProfile) -> list[ValidationIssue]:
    """Return deterministic semantic diagnostics without mutating *package*."""
    _ = profile
    issues: list[ValidationIssue] = []
    dataset = _mapping(package.dataset)
    entities = _records(package.entities)
    sources = _records(package.sources)
    evidence = _records(package.evidence)
    collection = _mapping(package.feature_versions)
    features = _records(collection.get("features"))
    bbox_issues, bounds = validate_bbox(dataset.get("bbox"))
    issues.extend(bbox_issues)

    resources: dict[str, tuple[str, str]] = {}
    for identifier, expected, file, pointer in [
        (dataset.get("id"), "dataset", "dataset.json", "/id"),
        *[(record.get("id"), "entity", "entities.json", _pointer(index, "id")) for index, record in enumerate(entities)],
        *[(record.get("id"), "source", "sources.json", _pointer(index, "id")) for index, record in enumerate(sources)],
        *[(record.get("id"), "evidence", "evidence.json", _pointer(index, "id")) for index, record in enumerate(evidence)],
        *[(record.get("id"), "version", "feature-versions.geojson", _pointer("features", index, "id")) for index, record in enumerate(features)],
    ]:
        if _kind(identifier) != expected:
            issues.append(_issue("id.invalid_kind", file, pointer, f"identifier must have kind {expected!r}"))
            continue
        assert isinstance(identifier, str)
        if identifier in resources:
            issues.append(_issue("id.duplicate", file, pointer, f"resource identifier {identifier!r} is already used"))
        else:
            resources[identifier] = (file, pointer)

    default_language = dataset.get("defaultLanguage")
    for field in ("title", "description"):
        text_map = _mapping(dataset.get(field))
        issues.extend(_text_map_issues(dataset.get(field), "dataset.json", _pointer(field)))
        if isinstance(default_language, str) and default_language.casefold() not in {tag.casefold() for tag in text_map}:
            issues.append(_issue("ref.missing", "dataset.json", _pointer(field), f"text map must contain default language {default_language!r}"))
    if _language_duplicate(default_language):
        issues.append(
            _issue(
                "language.invalid",
                "dataset.json",
                "/defaultLanguage",
                "language tag repeats a BCP 47 variant or extension singleton",
            )
        )
    issues.extend(validate_temporal(dataset.get("temporalExtent"), "dataset.json", "/temporalExtent"))

    entity_ids = {record.get("id") for record in entities}
    source_ids = {record.get("id") for record in sources}
    evidence_ids = {record.get("id") for record in evidence}
    evidence_by_id = {record.get("id"): record for record in evidence}
    source_by_id = {record.get("id"): record for record in sources}
    for index, record in enumerate(entities):
        labels = _mapping(record.get("labels"))
        issues.extend(_text_map_issues(record.get("labels"), "entities.json", _pointer(index, "labels")))
        issues.extend(_text_map_issues(record.get("description"), "entities.json", _pointer(index, "description")))
        if isinstance(default_language, str) and default_language.casefold() not in {tag.casefold() for tag in labels}:
            issues.append(_issue("ref.missing", "entities.json", _pointer(index, "labels"), f"text map must contain default language {default_language!r}"))
    for index, record in enumerate(sources):
        issues.extend(_text_map_issues(record.get("title"), "sources.json", _pointer(index, "title")))
    for index, record in enumerate(evidence):
        source_id = record.get("sourceId")
        pointer = _pointer(index, "sourceId")
        if _kind(source_id) != "source":
            issues.append(_issue("id.invalid_kind", "evidence.json", pointer, "sourceId must have kind 'source'"))
        elif source_id not in source_ids:
            issues.append(_issue("ref.missing", "evidence.json", pointer, f"source {source_id!r} does not exist"))
    for index, feature in enumerate(features):
        properties = _mapping(feature.get("properties"))
        issues.extend(
            validate_geometry_with_bounds(
                feature.get("geometry"), bounds, "feature-versions.geojson", _pointer("features", index, "geometry")
            )
        )
        labels = _mapping(properties.get("labels"))
        issues.extend(_text_map_issues(properties.get("labels"), "feature-versions.geojson", _pointer("features", index, "properties", "labels")))
        issues.extend(_text_map_issues(properties.get("description"), "feature-versions.geojson", _pointer("features", index, "properties", "description")))
        if "hypothesisLabel" in properties:
            issues.extend(_text_map_issues(properties.get("hypothesisLabel"), "feature-versions.geojson", _pointer("features", index, "properties", "hypothesisLabel")))
        if isinstance(default_language, str) and default_language.casefold() not in {tag.casefold() for tag in labels}:
            issues.append(_issue("ref.missing", "feature-versions.geojson", _pointer("features", index, "properties", "labels"), f"text map must contain default language {default_language!r}"))
        entity_id = properties.get("entityId")
        issues.extend(validate_temporal(properties.get("temporal"), "feature-versions.geojson", _pointer("features", index, "properties", "temporal")))
        pointer = _pointer("features", index, "properties", "entityId")
        if _kind(entity_id) != "entity":
            issues.append(_issue("id.invalid_kind", "feature-versions.geojson", pointer, "entityId must have kind 'entity'"))
        elif entity_id not in entity_ids:
            issues.append(_issue("ref.missing", "feature-versions.geojson", pointer, f"entity {entity_id!r} does not exist"))
        for evidence_index, evidence_id in enumerate(_records(properties.get("evidenceIds"))):
            evidence_pointer = _pointer("features", index, "properties", "evidenceIds", evidence_index)
            if _kind(evidence_id) != "evidence":
                issues.append(_issue("id.invalid_kind", "feature-versions.geojson", evidence_pointer, "evidenceIds values must have kind 'evidence'"))
            elif evidence_id not in evidence_ids:
                issues.append(_issue("ref.missing", "feature-versions.geojson", evidence_pointer, f"evidence {evidence_id!r} does not exist"))
        issues.extend(_uncertainty_issues(properties, evidence_by_id, index))
    issues.extend(_hypothesis_issues(features, profile))
    if profile == ValidationProfile.PUBLIC:
        issues.extend(_public_issues(package, features, evidence_by_id, source_by_id))
    return sorted(issues, key=lambda issue: (issue.file, issue.pointer, issue.code, issue.message))
