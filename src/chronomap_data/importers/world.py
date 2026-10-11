"""Import historical-basemaps world snapshots into a 5-file package."""

from collections import defaultdict
from collections.abc import Mapping, Sequence
import json
from pathlib import Path

from .common import FILES, assessment, fetch, round_coordinates, slug_part
from .common import write_package
from .pins import WORLD_BASE_URL, WORLD_COMMIT, WORLD_SHA256


SLUG = "world"
ACCESSED = "2026-10-12"
SIMPLIFY_TOLERANCE = 0.02
ATTRIBUTION = "A. Ourednik, historical-basemaps (GPL-3.0)"
TERMS = "GPL-3.0。Chronomapが形式変換・融合・簡略化した派生データもGPL-3.0で提供する。"
SOURCE_ID = f"{SLUG}:source:historical-basemaps"
SHAPE_EVIDENCE = f"{SLUG}:evidence:snapshot-shapes"
TIME_EVIDENCE = f"{SLUG}:evidence:snapshot-years"


def snapshot_year(filename: str) -> int:
    """Return the snapshot year encoded in ``world_<year>.geojson`` (``bcN`` is ``-N``)."""
    token = filename.removeprefix("world_").removesuffix(".geojson")
    return -int(token[2:]) if token.startswith("bc") else int(token)


def snapshot_periods(years: Sequence[int]) -> dict[int, tuple[int, int]]:
    """Hold each snapshot until the year before the next one; the last closes on itself."""
    ordered = sorted(years)
    return {
        year: (year, ordered[index + 1] - 1 if index + 1 < len(ordered) else year)
        for index, year in enumerate(ordered)
    }


def _merge(geometries: Sequence[Mapping[str, object]]) -> dict[str, object] | None:
    from shapely import force_2d, union_all
    from shapely.geometry import MultiPolygon, Polygon, mapping, shape

    parts = []
    for geometry in geometries:
        candidate = force_2d(shape(geometry))
        parts.append(candidate if candidate.is_valid else candidate.buffer(0))
    merged = union_all(parts).simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)
    if isinstance(merged, Polygon):
        merged = MultiPolygon([merged])
    if not isinstance(merged, MultiPolygon):
        merged = MultiPolygon([part for part in getattr(merged, "geoms", []) if isinstance(part, Polygon)])
    if merged.is_empty:
        return None
    return round_coordinates(mapping(merged), 4)  # type: ignore[return-value]


def world_package(snapshots: Mapping[int, Mapping[str, object]]) -> tuple[dict, list, list, list, list]:
    periods = snapshot_periods(list(snapshots))
    entities: dict[str, dict[str, object]] = {}
    features = []
    for year in sorted(snapshots):
        by_name: dict[str, list[Mapping[str, object]]] = defaultdict(list)
        precision: dict[str, int] = {}
        for feature in snapshots[year].get("features", []):
            properties = feature.get("properties") or {}
            name = properties.get("NAME")
            if not name or not feature.get("geometry"):
                continue
            by_name[name].append(feature["geometry"])
            precision[name] = min(precision.get(name, 3), int(properties.get("BORDERPRECISION") or 1))
        start, end = periods[year]
        for name in sorted(by_name):
            geometry = _merge(by_name[name])
            if geometry is None:
                continue
            key = slug_part(name)
            entity_id = f"{SLUG}:entity:{key}"
            entities.setdefault(entity_id, {
                "id": entity_id,
                "type": "polity",
                "labels": {"en": name},
                "description": {"en": f"{name} as drawn in historical-basemaps world snapshots."},
            })
            held = f" and held until {end}" if end != start else ""
            level = "well-supported" if precision[name] >= 3 else "approximate"
            features.append({
                "type": "Feature",
                "id": f"{SLUG}:version:{key}-{'bc' + str(-year) if year < 0 else year}",
                "geometry": geometry,
                "properties": {
                    "entityId": entity_id,
                    "labels": {"en": name},
                    "description": {"en": f"Extent of {name} in the {year if year > 0 else str(-year) + ' BC'} snapshot{held}. World-scale generalisation; not suitable for local boundaries."},
                    "temporal": {
                        "start": {"earliestYear": start, "latestYear": start, "precision": "year", "qualifier": "circa"},
                        "end": {"earliestYear": start, "latestYear": end, "precision": "year", "qualifier": "circa"},
                    },
                    "uncertainty": {
                        "temporal": assessment("approximate", "The snapshot shows one year; Chronomap keeps it visible until the next snapshot without claiming the border was unchanged.", [TIME_EVIDENCE]),
                        "location": assessment(level, "Border precision as recorded by historical-basemaps (BORDERPRECISION).", [SHAPE_EVIDENCE]),
                        "geometry": assessment("approximate", "Merged and simplified for world-scale display.", [SHAPE_EVIDENCE]),
                        "identity": assessment("approximate", "Polities are matched across snapshots by their NAME only.", [TIME_EVIDENCE]),
                    },
                    "evidenceIds": [SHAPE_EVIDENCE, TIME_EVIDENCE],
                    "publicationStatus": "public",
                    "rights": {"status": "open-license", "attribution": ATTRIBUTION, "terms": TERMS},
                },
            })
    years = sorted(snapshots)
    dataset = {
        "schemaVersion": "1.0.0",
        "id": f"{SLUG}:dataset:historical-basemaps",
        "title": {"en": "World polities (historical-basemaps)", "ja": "世界の国・勢力（historical-basemaps）"},
        "description": {"en": "World-scale extents of countries and cultural regions from 123000 BC to 2010.", "ja": "紀元前123000年から2010年までの世界の国・勢力の範囲（世界規模の概略）。"},
        "defaultLanguage": "en",
        "bbox": [-180, -90, 180, 90],
        "temporalExtent": {
            "start": {"earliestYear": years[0], "latestYear": years[0], "precision": "year", "qualifier": "circa"},
            "end": {"earliestYear": years[-1], "latestYear": years[-1], "precision": "year", "qualifier": "circa"},
        },
        "rights": {"status": "open-license", "attribution": ATTRIBUTION, "terms": TERMS},
        "display": {"minZoom": 0, "maxZoom": 6},
        "files": FILES,
    }
    source = {
        "id": SOURCE_ID,
        "type": "research-dataset",
        "citation": "Ourednik, A. historical-basemaps: Historical boundaries of world countries and cultural regions.",
        "title": {"en": "historical-basemaps"},
        "creators": ["André Ourednik"],
        "publishedYear": 2026,
        "url": f"https://github.com/aourednik/historical-basemaps/tree/{WORLD_COMMIT}/geojson",
        "accessedDate": ACCESSED,
        "rights": {"status": "open-license", "attribution": ATTRIBUTION, "terms": TERMS},
    }
    evidence = [
        {
            "id": SHAPE_EVIDENCE,
            "sourceId": SOURCE_ID,
            "locator": "geojson/world_<year>.geojson（NAME・BORDERPRECISION・geometry）",
            "usage": "derived-geometry",
            "supports": ["geometry", "location"],
            "note": "Polygons with the same NAME in one snapshot are merged and simplified (about 2 km).",
            "publicationBasis": "open-license",
        },
        {
            "id": TIME_EVIDENCE,
            "sourceId": SOURCE_ID,
            "locator": "geojson/world_<year>.geojson のファイル名の年",
            "usage": "citation",
            "supports": ["temporal", "identity"],
            "note": "Each file is one snapshot year; bcN files are year -N.",
        },
    ]
    return dataset, list(entities.values()), [source], evidence, features


def import_world(output_root: Path, cache_dir: Path) -> list[Path]:
    snapshots = {
        snapshot_year(name): json.loads(fetch(WORLD_BASE_URL + name, digest, cache_dir / "world").read_bytes())
        for name, digest in WORLD_SHA256.items()
    }
    write_package(output_root / SLUG, *world_package(snapshots))
    return [output_root / SLUG]
