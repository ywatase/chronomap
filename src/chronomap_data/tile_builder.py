"""Build the deterministic national vector-tile documents from public projections."""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
import math
from pathlib import Path
import shutil
import subprocess
import tempfile

from .loader import PackageLoadError, load_package
from .models import DatasetPackage, ValidationIssue, ValidationProfile
from .public_builder import (
    PublicBuildIOError,
    PublicBuildValidationError,
    PublicProjection,
    _canonical_json,
    _serialized,
    _swap_output,
    _verify_package_source,
    project_public,
)
from .schema_validation import validate_package


DEFAULT_MIN_ZOOM = 4
MAX_ZOOM = 12
DETAIL_SHARD_SIZE = 200
HUE_COUNT = 12
OPEN_YEAR_MIN = -999999
OPEN_YEAR_MAX = 999999
TIPPECANOE_VERSION = "2.79.0"
TIPPECANOE_INSTALL_GUIDANCE = (
    "install Tippecanoe 2.79.0 from https://github.com/felt/tippecanoe/releases/tag/2.79.0 "
    "using the instructions in README.md"
)
TILE_PROPERTIES = (
    "feature_version_id",
    "entity_id",
    "dataset",
    "theme",
    "name",
    "from_year",
    "to_year",
    "hue",
    "ref_from_year",
)
NATURAL_ENTITY_TYPES = frozenset({"waterbody", "watercourse", "coastline"})

THEME_DEFINITIONS = (
    ("coast", "海岸線・海域", "Coastline and sea", ("coastline",)),
    ("lake", "湖沼", "Lakes and wetlands", ("waterbody",)),
    ("river", "河川・水路", "Rivers and waterways", ("watercourse",)),
    ("polity", "国・郡・境界", "Polities and boundaries", ("polity", "boundary")),
    ("sphere", "勢力圏", "Spheres of influence", ("sphere-of-influence",)),
    ("castle", "城郭", "Fortifications", ("fortification",)),
    ("battlefield", "古戦場", "Battlefields", ("battlefield",)),
    ("settlement", "集落・街・港", "Settlements, towns, and ports", ("settlement", "port")),
    ("route", "街道", "Routes", ("route",)),
    ("artificial", "干拓地・埋立地（現代）", "Modern drained and reclaimed land", ("artificial-land",)),
    ("other", "その他", "Other", ("archaeological-site", "other")),
)
THEME_BY_ENTITY_TYPE = {
    entity_type: theme_id
    for theme_id, _label_ja, _label_en, entity_types in THEME_DEFINITIONS
    for entity_type in entity_types
}


@dataclass(frozen=True, slots=True)
class TileDataset:
    """A validated package and its shared public projection."""

    slug: str
    package: DatasetPackage
    projection: PublicProjection


@dataclass(frozen=True, slots=True)
class TileDocuments:
    """Pure JSON and GeoJSON content staged by a tile build."""

    manifest: dict[str, object]
    details: dict[str, dict[str, object]]
    features: tuple[dict[str, object], ...]


@dataclass(frozen=True, slots=True)
class TileBuildSummary:
    """Counts and destination of a completed national tile build."""

    datasets: int
    features: int
    output: Path


def fnv1a32(text: str) -> int:
    """Return the 32-bit FNV-1a hash of *text* encoded as UTF-8."""
    value = 0x811C9DC5
    for byte in text.encode("utf-8"):
        value = ((value ^ byte) * 0x01000193) & 0xFFFFFFFF
    return value


def detail_shard(feature_version_id: str, shards: int) -> int:
    """Return the detail-index shard that holds *feature_version_id*."""
    return fnv1a32(feature_version_id) % shards


def _zoom_range(dataset: Mapping[str, object]) -> tuple[int, int]:
    display = _mapping(dataset.get("display"))
    low, high = display.get("minZoom"), display.get("maxZoom")
    low = low if isinstance(low, int) and not isinstance(low, bool) else DEFAULT_MIN_ZOOM
    high = high if isinstance(high, int) and not isinstance(high, bool) else MAX_ZOOM
    return low, max(low, high)


def _mapping(value: object) -> Mapping[str, object]:
    return value if isinstance(value, Mapping) else {}


def _records(value: object) -> Sequence[Mapping[str, object]]:
    if isinstance(value, list | tuple):
        return tuple(item for item in value if isinstance(item, Mapping))
    return ()


def feature_period(properties: Mapping[str, object]) -> tuple[int, int]:
    """Return the possible activity interval with finite open-end sentinels."""
    temporal = _mapping(properties.get("temporal"))
    start = _mapping(temporal.get("start"))
    end = _mapping(temporal.get("end"))
    start_year = start.get("earliestYear")
    end_year = end.get("latestYear")
    from_year = start_year if isinstance(start_year, int) and not isinstance(start_year, bool) else OPEN_YEAR_MIN
    to_year = end_year if isinstance(end_year, int) and not isinstance(end_year, bool) else OPEN_YEAR_MAX
    return from_year, to_year


def display_periods(features: Sequence[Mapping[str, object]]) -> dict[str, tuple[int, int]]:
    """Return ``{version id: (held to_year, next version's from_year)}`` for snapshots held until the next version.

    Versions of one entity without a hypothesis group are ordered by ``from_year``; a version with a finite
    end stays visible until the year before the next version starts (never shortened, last one untouched).
    """
    series: dict[str, list[tuple[int, int, str]]] = {}
    for feature in features:
        properties = _mapping(feature.get("properties"))
        feature_id, entity_id = feature.get("id"), properties.get("entityId")
        if not isinstance(feature_id, str) or not isinstance(entity_id, str) or properties.get("hypothesisGroupId"):
            continue
        from_year, to_year = feature_period(properties)
        series.setdefault(entity_id, []).append((from_year, to_year, feature_id))
    held: dict[str, tuple[int, int]] = {}
    for versions in series.values():
        versions.sort()
        for (from_year, to_year, feature_id), (next_from, _next_to, _next_id) in zip(versions, versions[1:]):
            if to_year != OPEN_YEAR_MAX and next_from - 1 > to_year:
                held[feature_id] = (next_from - 1, next_from)
    return held


def reference_versions(features: Sequence[Mapping[str, object]], entity_type_by_id: Mapping[str, str]) -> set[str]:
    """Return the earliest non-hypothesis version of each natural entity, shown as a reference before its start."""
    earliest: dict[str, tuple[int, str]] = {}
    for feature in features:
        properties = _mapping(feature.get("properties"))
        feature_id, entity_id = feature.get("id"), properties.get("entityId")
        if not isinstance(feature_id, str) or not isinstance(entity_id, str) or properties.get("hypothesisGroupId"):
            continue
        if entity_type_by_id.get(entity_id) not in NATURAL_ENTITY_TYPES:
            continue
        candidate = (feature_period(properties)[0], feature_id)
        if entity_id not in earliest or candidate < earliest[entity_id]:
            earliest[entity_id] = candidate
    return {feature_id for _from_year, feature_id in earliest.values()}


def _tile_feature(
    feature: Mapping[str, object],
    dataset: TileDataset,
    entity_type_by_id: Mapping[str, str],
    zooms: tuple[int, int],
    held: Mapping[str, tuple[int, int]],
    references: set[str],
) -> dict[str, object]:
    feature_id = feature["id"]
    properties = _mapping(feature.get("properties"))
    entity_id = str(properties["entityId"])
    entity_type = entity_type_by_id[entity_id]
    name = _mapping(properties.get("labels"))[str(dataset.projection.dataset["defaultLanguage"])]
    from_year, to_year = feature_period(properties)
    to_year = held.get(str(feature_id), (to_year, 0))[0]
    return {
        "type": "Feature",
        "tippecanoe": {"minzoom": zooms[0], "maxzoom": zooms[1]},
        "geometry": feature["geometry"],
        "properties": {
            "feature_version_id": feature_id,
            "entity_id": entity_id,
            "dataset": dataset.slug,
            "theme": THEME_BY_ENTITY_TYPE[entity_type],
            "name": name,
            "from_year": from_year,
            "to_year": to_year,
            "hue": fnv1a32(entity_id) % HUE_COUNT,
            "ref_from_year": OPEN_YEAR_MIN if feature_id in references else from_year,
        },
    }


def _by_id(records: Sequence[object]) -> dict[str, Mapping[str, object]]:
    return {
        str(record["id"]): record
        for record in records
        if isinstance(record, Mapping) and isinstance(record.get("id"), str)
    }


def _sorted_dict(records: Mapping[str, object]) -> dict[str, object]:
    return {key: records[key] for key in sorted(records)}


def _detail_shards(
    dataset: TileDataset, features: Sequence[Mapping[str, object]], held: Mapping[str, tuple[int, int]]
) -> dict[str, dict[str, object]]:
    """Split geometry-free details into hash shards with only reachable records."""
    projection = dataset.projection
    entities = _by_id(projection.entities)
    evidence = _by_id(projection.evidence)
    sources = _by_id(projection.sources)
    shard_count = max(1, math.ceil(len(features) / DETAIL_SHARD_SIZE))
    shards: list[dict[str, dict[str, object]]] = [
        {"features": {}, "entities": {}, "evidence": {}, "sources": {}} for _ in range(shard_count)
    ]
    for feature in features:
        feature_id = feature.get("id")
        if not isinstance(feature_id, str):
            continue
        properties = _mapping(feature.get("properties"))
        shard = shards[detail_shard(feature_id, shard_count)]
        shard["features"][feature_id] = {key: value for key, value in properties.items() if key != "publicationStatus"}
        if feature_id in held:
            shard["features"][feature_id]["display"] = {"toYear": held[feature_id][0], "nextVersionYear": held[feature_id][1]}
        entity_id = properties.get("entityId")
        if isinstance(entity_id, str) and entity_id in entities:
            shard["entities"][entity_id] = dict(entities[entity_id])
        evidence_ids = set(_records_of_strings(properties.get("evidenceIds")))
        for assessment in _mapping(properties.get("uncertainty")).values():
            evidence_ids.update(_records_of_strings(_mapping(assessment).get("evidenceIds")))
        for evidence_id in evidence_ids:
            record = evidence.get(evidence_id)
            if record is None:
                continue
            shard["evidence"][evidence_id] = dict(record)
            source_id = record.get("sourceId")
            if isinstance(source_id, str) and source_id in sources:
                shard["sources"][source_id] = dict(sources[source_id])
    return {
        f"details/{dataset.slug}/{index}.json": {
            "dataset": dataset.slug,
            **{key: _sorted_dict(records) for key, records in shard.items()},
        }
        for index, shard in enumerate(shards)
    }


def _records_of_strings(value: object) -> tuple[str, ...]:
    if isinstance(value, list | tuple):
        return tuple(item for item in value if isinstance(item, str))
    return ()


def _default_year(years: Sequence[int], features: Sequence[Mapping[str, object]]) -> int | None:
    periods = [
        (int(properties["from_year"]), int(properties["to_year"]))
        for properties in (_mapping(feature.get("properties")) for feature in features)
    ]
    best: tuple[int, int] | None = None
    for year in years:
        visible = sum(1 for start, end in periods if start <= year <= end)
        if best is None or visible > best[1]:
            best = (year, visible)
    return best[0] if best else None


def _rasters(dataset: TileDataset) -> list[dict[str, object]]:
    rasters: list[dict[str, object]] = []
    for asset in _records(dataset.projection.dataset.get("historicalMapAssets")):
        if not isinstance(asset.get("tileTemplate"), str):
            continue
        rasters.append(
            {
                "id": asset["id"],
                "dataset": dataset.slug,
                "title": asset["title"],
                "description": asset["description"],
                "date": asset["date"],
                "tileTemplate": asset["tileTemplate"],
                "attribution": asset["attribution"],
                "bbox": asset["bbox"],
                "minZoom": asset["minZoom"],
                "maxZoom": asset["maxZoom"],
            }
        )
    return rasters


def build_tile_documents(datasets: Sequence[TileDataset]) -> TileDocuments:
    """Build the manifest, geometry-free detail shards, and ordered tile features."""
    issues: list[ValidationIssue] = []
    seen_slugs: set[str] = set()
    for dataset in datasets:
        dataset_id = dataset.projection.dataset.get("id")
        id_slug = dataset_id.partition(":")[0] if isinstance(dataset_id, str) else ""
        if dataset.slug in seen_slugs:
            issues.append(ValidationIssue("tiles.slug_duplicate", "dataset.json", "/id", f"duplicate dataset slug {dataset.slug!r}"))
        seen_slugs.add(dataset.slug)
        if dataset.slug != dataset.package.path.name or dataset.slug != id_slug:
            issues.append(
                ValidationIssue(
                    "tiles.slug_mismatch",
                    "dataset.json",
                    "/id",
                    f"dataset id slug {id_slug!r} and package directory {dataset.package.path.name!r} must match",
                )
            )
    if issues:
        raise PublicBuildValidationError(issues)

    ordered_datasets = sorted(datasets, key=lambda dataset: dataset.slug)
    details: dict[str, dict[str, object]] = {}
    manifest_datasets: list[dict[str, object]] = []
    rasters: list[dict[str, object]] = []
    all_features: list[dict[str, object]] = []
    years: set[int] = set()

    for dataset in ordered_datasets:
        projection = dataset.projection
        source_dataset = projection.dataset
        zooms = _zoom_range(source_dataset)
        raw_features = _records(_mapping(projection.feature_collection).get("features"))
        entity_type_by_id = {
            str(entity["id"]): str(entity["type"])
            for entity in _records(projection.entities)
            if isinstance(entity.get("id"), str) and isinstance(entity.get("type"), str)
        }
        held = display_periods(raw_features)
        references = reference_versions(raw_features, entity_type_by_id)
        tile_features = [_tile_feature(feature, dataset, entity_type_by_id, zooms, held, references) for feature in raw_features]
        all_features.extend(tile_features)
        for feature in raw_features:
            years.update(year for year in feature_period(_mapping(feature.get("properties"))) if year not in {OPEN_YEAR_MIN, OPEN_YEAR_MAX})

        shards = _detail_shards(dataset, raw_features, held)
        details.update(shards)
        rasters.extend(_rasters(dataset))
        rights = _mapping(source_dataset.get("rights"))
        manifest_datasets.append(
            {
                "slug": dataset.slug,
                "id": source_dataset["id"],
                "title": source_dataset["title"],
                "defaultLanguage": source_dataset["defaultLanguage"],
                "bbox": source_dataset["bbox"],
                "attribution": rights.get("attribution"),
                "minZoom": zooms[0],
                "maxZoom": zooms[1],
                "seaMask": _mapping(source_dataset.get("display")).get("seaMask") is True,
                "detailShards": len(shards),
                "features": len(raw_features),
            }
        )

    sorted_years = sorted(years)
    themes = [
        {"id": theme_id, "labels": {"ja": label_ja, "en": label_en}}
        for theme_id, label_ja, label_en, _entity_types in THEME_DEFINITIONS
    ]
    manifest = {
        "schemaVersion": 2,
        "tiles": "chronomap.pmtiles",
        "sourceLayer": "features",
        "openYear": {"min": OPEN_YEAR_MIN, "max": OPEN_YEAR_MAX},
        "yearRange": {
            "min": sorted_years[0] if sorted_years else None,
            "max": sorted_years[-1] if sorted_years else None,
        },
        "years": sorted_years,
        "defaultYear": _default_year(sorted_years, all_features),
        "themes": themes,
        "rasters": rasters,
        "datasets": manifest_datasets,
    }
    return TileDocuments(manifest=manifest, details=details, features=tuple(all_features))


def _overlaps(source: Path, output: Path) -> bool:
    return source == output or source in output.parents or output in source.parents


def _tippecanoe_version() -> str:
    try:
        result = subprocess.run(
            ["tippecanoe", "--version"],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as error:
        raise PublicBuildIOError(f"could not run Tippecanoe version check: {error}") from error
    if result.returncode != 0:
        raise PublicBuildIOError(f"Tippecanoe version check failed: {result.stderr.strip()}")
    version_output = (result.stdout or result.stderr).strip()
    version = version_output.rsplit(maxsplit=1)[-1].lstrip("v") if version_output else ""
    return version


def _write_geojson_sequence(path: Path, features: Sequence[dict[str, object]]) -> None:
    with path.open("wb") as output:
        for feature in features:
            output.write((_canonical_json(feature) + "\n").encode("utf-8"))


def _validate_packages(package_roots: Sequence[Path], output: Path) -> list[TileDataset]:
    package_paths: list[Path] = []
    for package_root in package_roots:
        try:
            package_paths.extend(path for path in package_root.iterdir() if path.is_dir())
        except OSError as error:
            raise PublicBuildIOError(f"could not enumerate package root {package_root}: {error}") from error
    package_paths.sort(key=lambda path: (path.name, str(path)))

    if not package_paths:
        raise PublicBuildValidationError(
            [ValidationIssue("tiles.no_packages", ", ".join(map(str, package_roots)), "", "package roots contain no package directories")]
        )

    packages: list[tuple[Path, DatasetPackage]] = []
    issues: list[ValidationIssue] = []
    for package_path in package_paths:
        if _overlaps(package_path.resolve(), output):
            raise PublicBuildIOError(f"input and output paths overlap: package {package_path} and output {output}")
        try:
            package = load_package(package_path)
            _verify_package_source(package)
        except PackageLoadError as error:
            raise PublicBuildIOError(f"could not load package {package_path.name}: {error}") from error
        except PublicBuildIOError:
            raise
        except OSError as error:
            raise PublicBuildIOError(f"could not inspect package {package_path.name}: {error}") from error
        packages.append((package_path, package))
        issues.extend(
            ValidationIssue(issue.code, f"{package_path.name}/{issue.file}", issue.pointer, issue.message)
            for issue in validate_package(package, ValidationProfile.PUBLIC)
        )

    if issues:
        raise PublicBuildValidationError(issues)
    return [
        TileDataset(package_path.name, package, project_public(package))
        for package_path, package in packages
    ]


def build_tiles(package_roots: Sequence[Path], output: Path) -> TileBuildSummary:
    """Build the national PMTiles archive and public detail indexes atomically."""
    try:
        package_roots = [Path(root).resolve() for root in package_roots]
        output = Path(output).resolve()
    except (OSError, RuntimeError) as error:
        raise PublicBuildIOError(f"could not resolve input or output path: {error}") from error
    for package_root in package_roots:
        if not package_root.is_dir():
            raise PublicBuildIOError(f"package root is not a directory: {package_root}")
    if not output.parent.is_dir():
        raise PublicBuildIOError(f"output parent directory does not exist: {output.parent}")
    if output.exists() and not output.is_dir():
        raise PublicBuildIOError(f"output path is not a directory: {output}")

    datasets = _validate_packages(package_roots, output)
    documents = build_tile_documents(datasets)
    if shutil.which("tippecanoe") is None:
        raise PublicBuildIOError(f"Tippecanoe {TIPPECANOE_VERSION} is required; {TIPPECANOE_INSTALL_GUIDANCE}")
    try:
        version = _tippecanoe_version()
    except PublicBuildIOError as error:
        raise PublicBuildIOError(f"{error}; {TIPPECANOE_INSTALL_GUIDANCE}") from error
    if version != TIPPECANOE_VERSION:
        raise PublicBuildIOError(
            f"Tippecanoe {TIPPECANOE_VERSION} is required, found {version or 'unknown'}; {TIPPECANOE_INSTALL_GUIDANCE}"
        )

    stage: Path | None = None
    primary_error: PublicBuildIOError | None = None
    try:
        stage = Path(tempfile.mkdtemp(prefix=f".{output.name}.tmp-", dir=output.parent))
        work = stage / ".work"
        work.mkdir()
        (stage / "manifest.json").write_bytes(_serialized(documents.manifest))
        for relative_path, detail in documents.details.items():
            path = stage / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(_serialized(detail))
        _write_geojson_sequence(work / "features.geojsonl", documents.features)

        command = [
            "tippecanoe",
            "--quiet",
            "--output=chronomap.pmtiles",
            "--layer=features",
            "--minimum-zoom=0",
            f"--maximum-zoom={MAX_ZOOM}",
            "--no-feature-limit",
            "--no-tile-size-limit",
            "-r1",
            "features.geojsonl",
        ]
        try:
            result = subprocess.run(command, cwd=work, capture_output=True, text=True, check=False)
        except OSError as error:
            raise PublicBuildIOError(f"could not run Tippecanoe: {error}") from error
        if result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip() or "no diagnostic output"
            raise PublicBuildIOError(f"Tippecanoe failed with exit code {result.returncode}: {detail}")
        archive = work / "chronomap.pmtiles"
        if not archive.is_file():
            raise PublicBuildIOError("Tippecanoe completed without creating chronomap.pmtiles")
        archive.replace(stage / "chronomap.pmtiles")
        shutil.rmtree(work)
        _swap_output(stage, output)
    except PublicBuildIOError as error:
        primary_error = error
        raise
    except (OSError, UnicodeError, ValueError) as error:
        primary_error = PublicBuildIOError(f"could not write tile output: {error}")
        raise primary_error from error
    finally:
        if stage is not None:
            try:
                shutil.rmtree(stage)
            except FileNotFoundError:
                pass
            except OSError as cleanup_error:
                if primary_error is None:
                    raise PublicBuildIOError(f"could not clean tile staging: {cleanup_error}") from cleanup_error

    return TileBuildSummary(len(datasets), len(documents.features), output)
