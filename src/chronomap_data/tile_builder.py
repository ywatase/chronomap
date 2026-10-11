"""Build the deterministic national vector-tile documents from public projections."""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
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
)

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


def _tile_feature(feature: Mapping[str, object], dataset: TileDataset, entity_type_by_id: Mapping[str, str]) -> dict[str, object]:
    feature_id = feature["id"]
    properties = _mapping(feature.get("properties"))
    entity_id = str(properties["entityId"])
    entity_type = entity_type_by_id[entity_id]
    name = _mapping(properties.get("labels"))[str(dataset.projection.dataset["defaultLanguage"])]
    from_year, to_year = feature_period(properties)
    return {
        "type": "Feature",
        "geometry": feature["geometry"],
        "properties": {
            "feature_version_id": feature_id,
            "entity_id": entity_id,
            "dataset": dataset.slug,
            "theme": THEME_BY_ENTITY_TYPE[entity_type],
            "name": name,
            "from_year": from_year,
            "to_year": to_year,
        },
    }


def _detail_records(records: Sequence[object]) -> dict[str, object]:
    result: dict[str, object] = {}
    for record in records:
        if not isinstance(record, Mapping):
            continue
        record_id = record.get("id")
        if not isinstance(record_id, str):
            continue
        result[record_id] = dict(record)
    return {record_id: result[record_id] for record_id in sorted(result)}


def _detail_features(features: Sequence[Mapping[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for feature in features:
        feature_id = feature.get("id")
        properties = _mapping(feature.get("properties"))
        if isinstance(feature_id, str):
            result[feature_id] = {key: value for key, value in properties.items() if key != "publicationStatus"}
    return {feature_id: result[feature_id] for feature_id in sorted(result)}


def build_tile_documents(datasets: Sequence[TileDataset]) -> TileDocuments:
    """Build the manifest, geometry-free details, and ordered tile features."""
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
    all_features: list[dict[str, object]] = []
    years: set[int] = set()

    for dataset in ordered_datasets:
        projection = dataset.projection
        raw_features = _records(_mapping(projection.feature_collection).get("features"))
        entities = _records(projection.entities)
        entity_type_by_id = {
            str(entity["id"]): str(entity["type"])
            for entity in entities
            if isinstance(entity.get("id"), str) and isinstance(entity.get("type"), str)
        }
        tile_features = [_tile_feature(feature, dataset, entity_type_by_id) for feature in raw_features]
        all_features.extend(tile_features)
        for feature in tile_features:
            properties = _mapping(feature["properties"])
            years.update(year for year in (properties["from_year"], properties["to_year"]) if year not in {OPEN_YEAR_MIN, OPEN_YEAR_MAX})

        details[dataset.slug] = {
            "dataset": dataset.slug,
            "features": _detail_features(raw_features),
            "entities": _detail_records(projection.entities),
            "evidence": _detail_records(projection.evidence),
            "sources": _detail_records(projection.sources),
        }
        source_dataset = projection.dataset
        rights = _mapping(source_dataset.get("rights"))
        manifest_datasets.append(
            {
                "slug": dataset.slug,
                "id": source_dataset["id"],
                "title": source_dataset["title"],
                "defaultLanguage": source_dataset["defaultLanguage"],
                "bbox": source_dataset["bbox"],
                "attribution": rights.get("attribution"),
                "details": f"details/{dataset.slug}.json",
                "features": len(raw_features),
            }
        )

    sorted_years = sorted(years)
    themes = [
        {"id": theme_id, "labels": {"ja": label_ja, "en": label_en}}
        for theme_id, label_ja, label_en, _entity_types in THEME_DEFINITIONS
    ]
    manifest = {
        "schemaVersion": 1,
        "tiles": "chronomap.pmtiles",
        "sourceLayer": "features",
        "openYear": {"min": OPEN_YEAR_MIN, "max": OPEN_YEAR_MAX},
        "yearRange": {
            "min": sorted_years[0] if sorted_years else None,
            "max": sorted_years[-1] if sorted_years else None,
        },
        "years": sorted_years,
        "themes": themes,
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


def _validate_packages(package_root: Path, output: Path) -> list[TileDataset]:
    try:
        package_paths = sorted(
            (path for path in package_root.iterdir() if path.is_dir()),
            key=lambda path: path.name,
        )
    except OSError as error:
        raise PublicBuildIOError(f"could not enumerate package root {package_root}: {error}") from error

    if not package_paths:
        raise PublicBuildValidationError(
            [ValidationIssue("tiles.no_packages", str(package_root), "", "package root contains no package directories")]
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


def build_tiles(package_root: Path, output: Path) -> TileBuildSummary:
    """Build the national PMTiles archive and public detail indexes atomically."""
    try:
        package_root = Path(package_root).resolve()
        output = Path(output).resolve()
    except (OSError, RuntimeError) as error:
        raise PublicBuildIOError(f"could not resolve input or output path: {error}") from error
    if not package_root.is_dir():
        raise PublicBuildIOError(f"package root is not a directory: {package_root}")
    if not output.parent.is_dir():
        raise PublicBuildIOError(f"output parent directory does not exist: {output.parent}")
    if output.exists() and not output.is_dir():
        raise PublicBuildIOError(f"output path is not a directory: {output}")

    datasets = _validate_packages(package_root, output)
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
        details_dir = stage / "details"
        details_dir.mkdir()
        (stage / "manifest.json").write_bytes(_serialized(documents.manifest))
        for slug, detail in documents.details.items():
            (details_dir / f"{slug}.json").write_bytes(_serialized(detail))
        _write_geojson_sequence(work / "features.geojsonl", documents.features)

        command = [
            "tippecanoe",
            "--quiet",
            "--output=chronomap.pmtiles",
            "--layer=features",
            "--minimum-zoom=4",
            "--maximum-zoom=12",
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
