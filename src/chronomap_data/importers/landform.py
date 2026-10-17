"""Import modern drained land and coastal reclaimed land from GSI landform tiles.

GSI's "地形分類（人工地形）" is served only as zoom-14 GeoJSON tiles (lower zooms are
coverage masks). Tiles are live, so they are cached with their retrieval date
instead of a pinned hash. The national coastline (国土数値情報 C23, pinned) only
decides which reclaimed polygons touch the sea; its geometry is not published.
"""

from collections.abc import Iterable, Mapping, Sequence
import datetime
import json
import math
from pathlib import Path
import time
import urllib.error
import urllib.request

from .common import FILES, RawDataError, assessment, fetch, round_coordinates, write_package
from .pins import C23_BASE_URL, C23_SHA256

TILE_URL = "https://cyberjapandata.gsi.go.jp/xyz/experimental_landformclassification2/{z}/{x}/{y}.geojson"
USER_AGENT = "chronomap/0.1 (historical map research)"
DATA_ZOOM = 14
MASK_ZOOM = 5
MASK_TILES = [(x, y) for x in range(26, 30) for y in range(10, 15)]
REQUEST_INTERVAL = 0.33
COAST_DISTANCE = 0.001  # about 100 m in degrees
PREFILTER_DISTANCE = 0.01  # about 1 km: drop inland fill while reading tiles, before merging
SIMPLIFY_TOLERANCE = 0.0001  # about 10 m
MIN_AREA = 1e-7  # about 1,000 m2 in square degrees; smaller pieces are tile-edge slivers
SLUG = "gsi-artificial-land"
JAPAN_BBOX = [122.0, 20.0, 154.0, 46.0]
LANDFORM_ATTRIBUTION = "国土地理院 地形分類（人工地形）（Chronomapが融合・簡略化）"
C23_ATTRIBUTION = "国土数値情報（海岸線データ）国土交通省（Chronomapが判定に利用）"

# Codes read from GSI's legend colours and checked against known places (see docs/data/landform.md).
DRAINED_CODES = frozenset({"4010101", "11008"})
FILLED_CODES = frozenset({"4010201", "11004", "11005", "11006", "11007", "11014"})


def tile_bounds(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    n = 2**z

    def latitude(row: int) -> float:
        return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * row / n))))

    return x / n * 360 - 180, latitude(y + 1), (x + 1) / n * 360 - 180, latitude(y)


def _get(url: str) -> dict | None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            if attempt == 3:
                raise RawDataError(f"could not fetch {url}: {error}") from error
        except (OSError, ValueError) as error:
            if attempt == 3:
                raise RawDataError(f"could not fetch {url}: {error}") from error
        time.sleep(2**attempt)
    return None


def coverage_tiles(cache_dir: Path) -> list[tuple[int, int]]:
    """z14 tiles that intersect GSI's coverage masks; cached as a list."""
    listing = cache_dir / "tiles-z14.json"
    if listing.is_file():
        return [tuple(item) for item in json.loads(listing.read_text())]  # type: ignore[misc]
    from shapely import union_all
    from shapely.geometry import box, shape
    from shapely.prepared import prep

    parts = []
    for x, y in MASK_TILES:
        document = _get(TILE_URL.format(z=MASK_ZOOM, x=x, y=y))
        parts += [shape(feature["geometry"]).buffer(0) for feature in (document or {}).get("features", [])]
    cover = prep(union_all(parts))
    n = 2**DATA_ZOOM
    minx, miny, maxx, maxy = union_all(parts).bounds

    def row(lat: float) -> int:
        return int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)

    tiles = [
        (x, y)
        for x in range(int((minx + 180) / 360 * n), int((maxx + 180) / 360 * n) + 1)
        for y in range(row(maxy), row(miny) + 1)
        if cover.intersects(box(*tile_bounds(DATA_ZOOM, x, y)))
    ]
    cache_dir.mkdir(parents=True, exist_ok=True)
    listing.write_text(json.dumps(tiles))
    return tiles


def fetch_tiles(tiles: Sequence[tuple[int, int]], cache_dir: Path) -> Iterable[tuple[tuple[int, int], dict | None]]:
    """Yield each tile's GeoJSON (None for 404), fetching politely and caching for resumption."""
    for x, y in tiles:
        path = cache_dir / str(DATA_ZOOM) / str(x) / f"{y}.geojson"
        if path.is_file():
            text = path.read_text()
            yield (x, y), (json.loads(text) if text else None)
            continue
        document = _get(TILE_URL.format(z=DATA_ZOOM, x=x, y=y))
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(document) if document else "")
        time.sleep(REQUEST_INTERVAL)
        yield (x, y), document


class CoastIndex:
    """Distance test against coastline segments via an STRtree (buffering the national coastline exhausts memory)."""

    def __init__(self, lines: Sequence[object]):
        from shapely import STRtree

        self.tree = STRtree(list(lines))

    def within(self, geometry: object, distance: float) -> bool:
        return len(self.tree.query(geometry, predicate="dwithin", distance=distance)) > 0


def collect(tiles: Iterable[Mapping[str, object] | None], coast: "CoastIndex | None" = None) -> tuple[list[object], list[object]]:
    """Split tile polygons into drained land and filled/reclaimed land.

    With ``coast``, filled pieces farther than PREFILTER_DISTANCE from the coastline are dropped while
    reading, so inland fill never reaches memory-heavy merging.
    """
    from shapely.geometry import shape

    drained, filled = [], []
    for document in tiles:
        for feature in (document or {}).get("features", []):  # type: ignore[union-attr]
            code = str(feature.get("properties", {}).get("code"))
            target = drained if code in DRAINED_CODES else filled if code in FILLED_CODES else None
            if target is None:
                continue
            geometry = shape(feature["geometry"])
            geometry = geometry if geometry.is_valid else geometry.buffer(0)
            if target is filled and coast is not None and not coast.within(geometry, PREFILTER_DISTANCE):
                continue
            target.append(geometry)
    return drained, filled


def _explode(geometries: Sequence[object]) -> list[object]:
    from shapely import union_all

    if not geometries:
        return []
    merged = union_all(geometries).simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)
    parts = list(getattr(merged, "geoms", [merged]))
    return sorted((part for part in parts if part.geom_type == "Polygon" and part.area >= MIN_AREA), key=lambda part: part.bounds)


def build_parts(drained: Sequence[object], filled: Sequence[object], coast: CoastIndex) -> tuple[list[object], list[object]]:
    """Merge tile pieces; keep every drained area and only filled areas within ~100 m of the coast."""
    coastal = [part for part in _explode(filled) if coast.within(part, COAST_DISTANCE)]
    return _explode(drained), coastal


def package(drained: Sequence[object], coastal: Sequence[object], accessed: str):
    from shapely.geometry import MultiPolygon, mapping

    landform_source, coast_source = f"{SLUG}:source:gsi-landform", f"{SLUG}:source:c23"
    shape_evidence, coast_evidence = f"{SLUG}:evidence:landform-shapes", f"{SLUG}:evidence:coastline-test"
    period = {
        "start": {"earliestYear": None, "latestYear": 2022, "precision": "period", "qualifier": "before"},
        "end": None,
    }
    entities, features = [], []
    for kind, label, note, parts, evidence_ids in (
        ("drained", "干拓地（現代）", "湖沼や浅い海を干拓して造られた土地です。", drained, [shape_evidence]),
        ("reclaimed", "埋立地（現代・海岸沿い）", "海岸沿いの盛土地・埋立地です。", coastal, [shape_evidence, coast_evidence]),
    ):
        for index, part in enumerate(parts, 1):
            key = f"{kind}-{index:05d}"
            entity_id = f"{SLUG}:entity:{key}"
            entities.append({"id": entity_id, "type": "artificial-land", "labels": {"ja": label}, "description": {"ja": note}})
            features.append({
                "type": "Feature",
                "id": f"{SLUG}:version:{key}",
                "geometry": round_coordinates(mapping(MultiPolygon([part])), 5),
                "properties": {
                    "entityId": entity_id,
                    "labels": {"ja": label},
                    "description": {"ja": f"{note}現代の地図では陸地ですが、造成された年はデータにありません。その年に海・湖だったとは限りません。"},
                    "temporal": period,
                    "uncertainty": {
                        "temporal": assessment("unknown", "造成年はデータにありません。2022年の更新時点で存在した範囲です。", []),
                        "location": assessment("well-supported", "", [shape_evidence]),
                        "geometry": assessment("approximate", "ズーム14のタイルを融合し、約10mの許容差で簡略化しました。", [shape_evidence]),
                        "identity": assessment("approximate", "連続した範囲を1つの地物としました。", [shape_evidence]),
                    },
                    "evidenceIds": evidence_ids + [f"{SLUG}:evidence:landform-period"],
                    "publicationStatus": "public",
                    "rights": {"status": "open-license", "attribution": LANDFORM_ATTRIBUTION, "terms": "国土地理院コンテンツ利用規約"},
                },
            })
    dataset = {
        "schemaVersion": "1.0.0",
        "id": f"{SLUG}:dataset:landform",
        "title": {"ja": "現代の干拓地・埋立地（地理院 人工地形）"},
        "description": {"ja": "現代の地図で陸地になっている干拓地と、海岸沿いの埋立地です。過去の年に、当時は海や湖だった可能性がある範囲の目安として表示します。"},
        "defaultLanguage": "ja",
        "bbox": JAPAN_BBOX,
        "temporalExtent": period,
        "rights": {"status": "open-license", "attribution": LANDFORM_ATTRIBUTION, "terms": "国土地理院コンテンツ利用規約"},
        "display": {"minZoom": 6},
        "files": FILES,
    }
    sources = [
        {
            "id": landform_source, "type": "government-dataset",
            "citation": "国土地理院 ベクトルタイル提供実験「地形分類（人工地形）」experimental_landformclassification2",
            "title": {"ja": "地形分類（人工地形）"}, "creators": ["国土地理院"], "publishedYear": 2022,
            "url": "https://github.com/gsi-cyberjapan/experimental_landformclassification", "accessedDate": accessed,
            "rights": {"status": "open-license", "attribution": "国土地理院", "terms": "国土地理院コンテンツ利用規約"},
        },
        {
            "id": coast_source, "type": "government-dataset",
            "citation": "国土交通省 国土数値情報「海岸線データ（C23）」平成18年度",
            "title": {"ja": "国土数値情報 海岸線データ"}, "creators": ["国土交通省"], "publishedYear": 2006,
            "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C23.html", "accessedDate": accessed,
            "rights": {"status": "open-license", "attribution": C23_ATTRIBUTION, "terms": "非商用。出典・加工者を表示し、複製物を再配布しない（形は公開しない）。"},
        },
    ]
    evidence = [
        {
            "id": shape_evidence, "sourceId": landform_source,
            "locator": "ズーム14のタイルのcode 4010101・11008（干拓地）、4010201・11004〜11007・11014（盛土地・埋立地）",
            "usage": "derived-geometry", "supports": ["geometry", "location", "identity"],
            "note": "タイルごとのポリゴンを区分ごとに融合し、連続した範囲に分けて簡略化した。", "publicationBasis": "open-license",
        },
        {
            "id": f"{SLUG}:evidence:landform-period", "sourceId": landform_source,
            "locator": "2022-03-28 のデータ更新", "usage": "citation", "supports": ["temporal"],
            "note": "調査時点で造成済みであることだけを示す。造成年は含まれない。",
        },
        {
            "id": coast_evidence, "sourceId": coast_source,
            "locator": "C23-06_XX_GML.zip の海岸線（2006年度）", "usage": "citation", "supports": ["location"],
            "note": "海岸線から約100m以内に接する盛土地・埋立地だけを残す判定に使った。海岸線の形は公開しない。",
        },
    ]
    return dataset, entities, sources, evidence, features


def read_coastline(archive: Path) -> list[object]:
    import shapefile
    import tempfile
    import zipfile
    from shapely.geometry import shape

    with zipfile.ZipFile(archive) as bundle, tempfile.TemporaryDirectory() as directory:
        bundle.extractall(directory)
        lines = []
        for shp in Path(directory).rglob("*.shp"):
            lines += [shape(record.__geo_interface__) for record in shapefile.Reader(str(shp)).shapes()]
        return lines


def import_landform(output_root: Path, cache_dir: Path, today: str | None = None) -> list[Path]:
    accessed = today or datetime.date.today().isoformat()
    landform_cache = cache_dir / "landform"
    tiles = coverage_tiles(landform_cache)
    coast = CoastIndex([line for name, digest in sorted(C23_SHA256.items()) for line in read_coastline(fetch(C23_BASE_URL + name, digest, cache_dir / "c23"))])
    drained, filled = collect((document for _tile, document in fetch_tiles(tiles, landform_cache)), coast)
    drained_parts, coastal_parts = build_parts(drained, filled, coast)
    write_package(output_root / SLUG, *package(drained_parts, coastal_parts, accessed))
    return [output_root / SLUG]


if __name__ == "__main__":  # python -m chronomap_data.importers.landform <cache_dir>: prefetch only
    import sys

    cache = Path(sys.argv[1])
    listed = coverage_tiles(cache)
    for index, _ in enumerate(fetch_tiles(listed, cache), 1):
        if index % 1000 == 0:
            print(f"{index}/{len(listed)}", flush=True)
    print("done", len(listed), flush=True)
