"""Import CODH's Edo-period coastline (as a near-shore sea band) and lakes into 5-file packages."""

from collections.abc import Iterable, Mapping, Sequence
import json
from pathlib import Path
import tempfile
import zipfile

from .common import FILES, assessment, fetch, round_coordinates, write_package
from .pins import EDO_COAST_SHA256, EDO_COAST_URL, EDO_LAKE_SHA256, EDO_LAKE_URL

ACCESSED = "2026-10-17"
JAPAN_BBOX = [122.0, 20.0, 154.0, 46.0]
BAND_WIDTH = 0.08  # about 8 km
SIMPLIFY_TOLERANCE = 0.0005
EXCLUDED_LAKE_IDS = frozenset({"26007"})  # Maintained as the Ogurike historical time series in data/ogurike.
# 江戸末期〜明治初期: Ino maps (to 1821) corrected over the 1884-1894 Shūsei 1:200,000 maps.
PERIOD = {
    "start": {"earliestYear": 1800, "latestYear": 1868, "precision": "period", "qualifier": "circa"},
    "end": {"earliestYear": 1868, "latestYear": 1894, "precision": "period", "qualifier": "circa"},
}
TERMS = "CC BY 4.0。Chronomapが形式変換・融合・簡略化した。"
COAST_CITATION = "『江戸末期海岸線／水域データセット』（ROIS-DS人文学オープンデータ共同利用センター作成）doi:10.20676/00000453"
LAKE_CITATION = "『江戸末期湖沼データセット』（ROIS-DS人文学オープンデータ共同利用センター作成）doi:10.20676/00000467"


def sea_band(land: Iterable[object], width: float = BAND_WIDTH) -> object:
    """Sea within ``width`` degrees of the Edo-period land, as one geometry."""
    from shapely import union_all

    merged = union_all([part if part.is_valid else part.buffer(0) for part in land])
    return merged.buffer(width).difference(merged).simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)


def _multipolygon(geometry: object) -> dict[str, object]:
    from shapely import force_2d
    from shapely.geometry import MultiPolygon, Polygon, mapping

    geometry = force_2d(geometry)
    if isinstance(geometry, Polygon):
        geometry = MultiPolygon([geometry])
    elif not isinstance(geometry, MultiPolygon):
        geometry = MultiPolygon([part for part in getattr(geometry, "geoms", []) if isinstance(part, Polygon)])
    return round_coordinates(mapping(geometry), 5)  # type: ignore[return-value]


def _dataset(slug: str, title: str, description: str, citation: str, display: Mapping[str, object]) -> dict[str, object]:
    return {
        "schemaVersion": "1.0.0",
        "id": f"{slug}:dataset:codh",
        "title": {"ja": title},
        "description": {"ja": description},
        "defaultLanguage": "ja",
        "bbox": JAPAN_BBOX,
        "temporalExtent": PERIOD,
        "rights": {"status": "open-license", "attribution": citation, "terms": TERMS},
        "display": dict(display),
        "files": FILES,
    }


def _source(slug: str, citation: str, title: str, url: str) -> dict[str, object]:
    return {
        "id": f"{slug}:source:codh",
        "type": "research-dataset",
        "citation": citation,
        "title": {"ja": title},
        "creators": ["ROIS-DS人文学オープンデータ共同利用センター", "株式会社平凡社地図出版"],
        "publishedYear": 2026,
        "url": url,
        "accessedDate": ACCESSED,
        "rights": {"status": "open-license", "attribution": citation, "terms": TERMS},
    }


def _feature(slug: str, key: str, entity_id: str, geometry: dict[str, object], label: str, description: str,
             uncertainty: Mapping[str, object], evidence_ids: Sequence[str], citation: str) -> dict[str, object]:
    return {
        "type": "Feature",
        "id": f"{slug}:version:{key}",
        "geometry": geometry,
        "properties": {
            "entityId": entity_id,
            "labels": {"ja": label},
            "description": {"ja": description},
            "temporal": PERIOD,
            "uncertainty": uncertainty,
            "evidenceIds": list(evidence_ids),
            "publicationStatus": "public",
            "rights": {"status": "open-license", "attribution": citation, "terms": TERMS},
        },
    }


def coast_package(band: object):
    slug = "edo-coast"
    evidence_id = f"{slug}:evidence:coast-polygon"
    entity_id = f"{slug}:entity:near-shore-sea"
    uncertainty = {
        "temporal": assessment("approximate", "伊能大図（〜1821年）と輯製二十万分一図（1884〜1894年）に基づく江戸末期〜明治初期の状態です。", [evidence_id]),
        "location": assessment("approximate", "基本は20万分の1の縮尺で使うことを想定したデータです。", [evidence_id]),
        "geometry": assessment("approximate", "陸地の外側約8kmまでの帯だけを海として表し、細かな入江・干潟は表しません。", [evidence_id]),
        "identity": assessment("well-supported", "", [evidence_id]),
    }
    feature = _feature(
        slug, "near-shore-sea", entity_id, _multipolygon(band), "江戸末期の海（海岸付近）",
        "江戸末期〜明治初期の海岸線から沖合約8kmまでの海です。現代の埋立地・干拓地のうち、当時は海だった範囲が分かります。",
        uncertainty, [evidence_id], COAST_CITATION,
    )
    dataset = _dataset(slug, "江戸末期の海岸線（CODH）", "江戸末期〜明治初期の海岸線の内側を陸、外側を海として、現代の埋立地を当時の海として示します。", COAST_CITATION, {"minZoom": 4, "seaMask": True})
    evidence = [{
        "id": evidence_id,
        "sourceId": f"{slug}:source:codh",
        "locator": "coast-polygon.zip（陸地ポリゴン、2026-05-14更新）",
        "usage": "derived-geometry",
        "supports": ["temporal", "location", "geometry", "identity"],
        "note": "陸地ポリゴンを融合し、外側約8kmまでの帯から陸地を除いて簡略化した。",
        "publicationBasis": "open-license",
    }]
    entities = [{"id": entity_id, "type": "coastline", "labels": {"ja": "江戸末期の海（海岸付近）"}, "description": {"ja": "江戸末期〜明治初期の海岸線の外側の海。"}}]
    return dataset, entities, [_source(slug, COAST_CITATION, "江戸末期海岸線／水域データセット", "https://codh.rois.ac.jp/historical-gis/edo-coast/")], evidence, [feature]


def lake_package(lakes: Iterable[Mapping[str, object]]):
    from shapely.geometry import shape

    slug = "edo-lakes"
    evidence_id = f"{slug}:evidence:lake-polygon"
    entities, features = [], []
    for lake in lakes:
        properties = lake.get("properties") or {}
        if str(properties.get("id")).strip().lower() in EXCLUDED_LAKE_IDS:
            continue
        name = str(properties.get("name") or "").strip()
        if not name or not lake.get("geometry"):
            continue
        geometry = shape(lake["geometry"])
        geometry = geometry if geometry.is_valid else geometry.buffer(0)
        if geometry.is_empty:
            continue
        key = f"lake-{str(properties.get('id')).strip().lower()}"
        entity_id = f"{slug}:entity:{key}"
        reading = f"（{properties['yomi']}）" if properties.get("yomi") else ""
        remarks = str(properties.get("remarks") or "").strip()
        entities.append({"id": entity_id, "type": "waterbody", "labels": {"ja": name}, "description": {"ja": f"{properties.get('pref', '')}の湖沼{reading}。"}})
        features.append(_feature(
            slug, key, entity_id, _multipolygon(geometry), name,
            f"江戸末期〜明治初期の{name}{reading}の推定湖面です（{properties.get('pref', '')}）。" + (f"作図の備考: {remarks}" if remarks else ""),
            {
                "temporal": assessment("approximate", "江戸時代末期の存在を資料で確認した湖沼の、江戸末期〜明治初期の湖面です。", [evidence_id]),
                "location": assessment("approximate", "旧版地形図・天保国絵図・DEMなどから推定した湖面です。", [evidence_id]),
                "geometry": assessment("approximate", "推定湖面であり、正確な湖岸線ではありません。", [evidence_id]),
                "identity": assessment("well-supported", "", [evidence_id]),
            },
            [evidence_id], LAKE_CITATION,
        ))
    dataset = _dataset(slug, "江戸末期の湖沼（CODH）", "1800年頃以降に消滅・干拓・拡張した湖沼の、江戸末期〜明治初期の推定湖面です。", LAKE_CITATION, {"minZoom": 6})
    evidence = [{
        "id": evidence_id,
        "sourceId": f"{slug}:source:codh",
        "locator": "lake_polygon.geojson（各湖沼のid・name・remarks、2026-05-18公開）",
        "usage": "derived-geometry",
        "supports": ["temporal", "location", "geometry", "identity"],
        "note": "推定湖面のポリゴンを形式変換し、座標を小数第5位に丸めた。",
        "publicationBasis": "open-license",
    }]
    return dataset, entities, [_source(slug, LAKE_CITATION, "江戸末期湖沼データセット", "https://codh.rois.ac.jp/historical-gis/edo-lake/")], evidence, features


def read_land(archive: Path) -> list[object]:
    import shapefile
    from shapely.geometry import shape

    with zipfile.ZipFile(archive) as bundle, tempfile.TemporaryDirectory() as directory:
        bundle.extractall(directory)
        shp = next(Path(directory).rglob("*.shp"))
        return [shape(item.__geo_interface__) for item in shapefile.Reader(str(shp)).shapes() if item.shapeType != shapefile.NULL]


def import_edo(output_root: Path, cache_dir: Path) -> list[Path]:
    land = read_land(fetch(EDO_COAST_URL, EDO_COAST_SHA256, cache_dir / "edo"))
    lakes = json.loads(fetch(EDO_LAKE_URL, EDO_LAKE_SHA256, cache_dir / "edo").read_bytes())["features"]
    write_package(output_root / "edo-coast", *coast_package(sea_band(land)))
    write_package(output_root / "edo-lakes", *lake_package(lakes))
    return [output_root / "edo-coast", output_root / "edo-lakes"]
