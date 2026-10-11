"""Import Bakumatsu-era villages, provinces, and domains into 5-file packages."""

from collections import Counter, defaultdict
from collections.abc import Iterable, Mapping, Sequence
import csv
from dataclasses import dataclass
import io
from pathlib import Path
import tempfile
import zipfile

from .common import FILES, assessment, fetch, round_coordinates, slug_part, temporal, write_package
from .pins import KYUDAKA_BASE_URL, KYUDAKA_COMMIT, KYUDAKA_SHA256, MAFF_BASE_URL, MAFF_SHA256


JAPAN_BBOX = [122.0, 20.0, 154.0, 46.0]
ACCESSED = "2026-10-12"
# 慶応年間（1865〜1868年）。領分は慶応3年（1867年）1月1日時点。
PERIOD = temporal((1865, 1867), (1867, 1868), precision="period", qualifier="circa")
SIMPLIFY_TOLERANCE = 0.0005

KYUDAKA_ATTRIBUTION = "本田謙一・夏目宗幸・根元裕樹「幕末期近世村領域データ」v2.01（CC BY-SA 4.0）"
MAFF_ATTRIBUTION = "農林水産省「農業集落境界データ（2015年農業集落基準）」"
SHARE_ALIKE_TERMS = "CC BY-SA 4.0。Chronomapが形式変換・融合・簡略化した派生データもCC BY-SA 4.0で提供する。"

KYUDAKA_SOURCE = {
    "type": "research-dataset",
    "citation": "本田謙一・夏目宗幸・根元裕樹「幕末期近世村領域データの作成―旧高旧領取調帳および農業集落境界データを活用して―」GIS-理論と応用 34(1); データ v2.01",
    "title": {"ja": "幕末期近世村領域データ v2.01"},
    "creators": ["本田謙一", "夏目宗幸", "根元裕樹"],
    "publishedYear": 2024,
    "url": f"https://github.com/yaoyue00085856/Kyudaka_agrivillage/tree/{KYUDAKA_COMMIT}/02_kyudaka_v2.01",
    "accessedDate": ACCESSED,
    "rights": {"status": "open-license", "attribution": KYUDAKA_ATTRIBUTION, "terms": SHARE_ALIKE_TERMS},
}
MAFF_SOURCE = {
    "type": "government-dataset",
    "citation": "農林水産省「地域の農業を見て・知って・活かすDB」農業集落境界データ（2015年農業集落基準）",
    "title": {"ja": "農業集落境界データ（2015年）"},
    "creators": ["農林水産省"],
    "publishedYear": 2017,
    "url": "https://www.maff.go.jp/j/tokei/census/shuraku_data/2015/ma/index.html",
    "accessedDate": ACCESSED,
    "rights": {
        "status": "open-license",
        "attribution": f"{MAFF_ATTRIBUTION}（Chronomapが融合・簡略化）",
        "terms": "同DBの利用条件により、出典と編集・加工者を明示して自由に利用できる。",
    },
}


@dataclass(frozen=True, slots=True)
class Village:
    vid: str
    province: str
    district: str
    name: str
    reading: str
    lords: tuple[str, ...]
    longitude: float
    latitude: float


def _rows(data: bytes) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(data.decode("cp932"))))


def parse_villages(data: bytes) -> list[Village]:
    villages = []
    for row in _rows(data):
        if not row["村名"].strip():
            continue
        try:
            longitude, latitude = float(row["Longitude"]), float(row["Latitude"])
        except ValueError:
            continue
        lords = tuple(value for key in sorted(k for k in row if k.startswith("領分")) if (value := row[key].strip()))
        villages.append(
            Village(
                vid=row["VID"],
                province=row["国名"],
                district=row["郡名"],
                name=row["村名"],
                reading=row["よみ"],
                lords=lords,
                longitude=longitude,
                latitude=latitude,
            )
        )
    return villages


def parse_polygon_fields(data: bytes) -> dict[str, tuple[str, str, str]]:
    """Return AID -> (province id, province name, primary lord)."""
    return {row["AID"]: (row["国ID"], row["国名"], row["領分１"].strip()) for row in _rows(data)}


def parse_key_aid(data: bytes) -> dict[str, str]:
    return {row["KEY"].zfill(10): row["AID"] for row in csv.DictReader(io.StringIO(data.decode("ascii")))}


def _feature(version_id: str, entity_id: str, geometry: Mapping[str, object], label: str, description: str,
             uncertainty: Mapping[str, object], evidence_ids: Sequence[str], attribution: str) -> dict[str, object]:
    return {
        "type": "Feature",
        "id": version_id,
        "geometry": geometry,
        "properties": {
            "entityId": entity_id,
            "labels": {"ja": label},
            "description": {"ja": description},
            "temporal": PERIOD,
            "uncertainty": uncertainty,
            "evidenceIds": list(evidence_ids),
            "publicationStatus": "public",
            "rights": {"status": "open-license", "attribution": attribution, "terms": SHARE_ALIKE_TERMS},
        },
    }


def _dataset(slug: str, title: str, description: str, min_zoom: int, attribution: str) -> dict[str, object]:
    return {
        "schemaVersion": "1.0.0",
        "id": f"{slug}:dataset:keio",
        "title": {"ja": title},
        "description": {"ja": description},
        "defaultLanguage": "ja",
        "bbox": JAPAN_BBOX,
        "temporalExtent": PERIOD,
        "rights": {"status": "open-license", "attribution": attribution, "terms": SHARE_ALIKE_TERMS},
        "display": {"minZoom": min_zoom},
        "files": FILES,
    }


def village_package(villages: Iterable[Village]) -> tuple[dict, list, list, list, list]:
    slug = "bakumatsu-villages"
    source_id = f"{slug}:source:kyudaka"
    evidence_id = f"{slug}:evidence:village-points"
    evidence = [
        {
            "id": evidence_id,
            "sourceId": source_id,
            "locator": "02_kyudaka_v2.01/01_Data/01_Village_point_data_v2.csv の各行（VID・国名・郡名・村名・よみ・領分・経緯度）",
            "usage": "derived-geometry",
            "supports": ["temporal", "location", "geometry", "identity"],
            "note": "旧高旧領取調帳をもとにした近世村リストの代表点と、慶応3年1月1日時点の領分。Chronomapは座標を小数第5位に丸めた。",
            "publicationBasis": "open-license",
        }
    ]
    uncertainty = {
        "temporal": assessment("approximate", "慶応年間（1865〜1868年頃）の状態です。領分は慶応3年1月1日時点で、それ以前・以後の存否や領主は示しません。", [evidence_id]),
        "location": assessment("approximate", "村の領域（2015年の農業集落境界から推定）に置いた代表点で、村の中心や集落の位置そのものではありません。", [evidence_id]),
        "geometry": assessment("approximate", "村を1点で代表させた表示です。", [evidence_id]),
        "identity": assessment("well-supported", "", [evidence_id]),
    }
    entities, features = [], []
    for village in villages:
        key = village.vid.lower()
        entity_id = f"{slug}:entity:{key}"
        lords = "・".join(village.lords) if village.lords else "不明"
        shared = "（相給）" if len(village.lords) > 1 else ""
        reading = f"（{village.reading}）" if village.reading else ""
        entities.append({
            "id": entity_id,
            "type": "settlement",
            "labels": {"ja": village.name},
            "description": {"ja": f"{village.province}国{village.district}の近世村{reading}。"},
        })
        features.append(_feature(
            f"{slug}:version:{key}",
            entity_id,
            {"type": "Point", "coordinates": round_coordinates([village.longitude, village.latitude])},
            village.name,
            f"{village.province}国{village.district}の近世村{reading}。慶応3年1月1日時点の領分{shared}: {lords}。",
            uncertainty,
            [evidence_id],
            KYUDAKA_ATTRIBUTION,
        ))
    dataset = _dataset(
        slug,
        "幕末期の近世村（慶応年間）",
        "旧高旧領取調帳をもとにした全国の近世村の代表点と、慶応3年1月1日時点の領分です。",
        9,
        KYUDAKA_ATTRIBUTION,
    )
    return dataset, entities, [{"id": source_id, **KYUDAKA_SOURCE}], evidence, features


def dissolve(
    shapes: Iterable[tuple[str, object]],
    key_aid: Mapping[str, str],
    fields: Mapping[str, tuple[str, str, str]],
) -> tuple[dict[tuple[str, str], object], dict[str, object]]:
    """Group settlement polygons by province name and by primary lord, then dissolve each group.

    A few source rows pair a province ID with another province's name; the name wins and
    each province takes the ID most often used with its name.
    """
    from shapely import union_all

    provinces_by_name: dict[str, list[object]] = defaultdict(list)
    ids_by_name: dict[str, Counter[str]] = defaultdict(Counter)
    domains: dict[str, list[object]] = defaultdict(list)
    for province_id, province, _lord in fields.values():
        ids_by_name[province][province_id] += 1
    for key, geometry in shapes:
        aid = key_aid.get(key)
        field = fields.get(aid) if aid else None
        if field is None:
            continue
        _province_id, province, lord = field
        provinces_by_name[province].append(geometry)
        if lord:
            domains[lord].append(geometry)
    provinces = {
        (ids_by_name[name].most_common(1)[0][0], name): parts for name, parts in provinces_by_name.items()
    }

    def merge(parts: list[object]) -> object:
        return union_all(parts).simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)

    return (
        {key: merge(parts) for key, parts in sorted(provinces.items())},
        {key: merge(parts) for key, parts in sorted(domains.items())},
    )


def _geojson(geometry: object) -> dict[str, object] | None:
    from shapely import force_2d
    from shapely.geometry import MultiPolygon, Polygon, mapping

    geometry = force_2d(geometry)
    if isinstance(geometry, Polygon):
        geometry = MultiPolygon([geometry])
    if not isinstance(geometry, MultiPolygon):
        polygons = [part for part in getattr(geometry, "geoms", []) if isinstance(part, Polygon)]
        geometry = MultiPolygon(polygons)
    if geometry.is_empty:
        return None
    return round_coordinates(mapping(geometry))  # type: ignore[return-value]


def _polygon_evidence(slug: str, subject: str) -> tuple[list[dict[str, object]], list[dict[str, object]], dict[str, object], list[str]]:
    kyudaka_id, maff_id = f"{slug}:source:kyudaka", f"{slug}:source:maff"
    attributes_id, shape_id = f"{slug}:evidence:attributes", f"{slug}:evidence:shape"
    sources = [{"id": kyudaka_id, **KYUDAKA_SOURCE}, {"id": maff_id, **MAFF_SOURCE}]
    evidence = [
        {
            "id": attributes_id,
            "sourceId": kyudaka_id,
            "locator": "02_kyudaka_v2.01/01_Data/02_Village_polygon_field_v2.csv（国ID・国名・領分１）と 03_KEY_AID.csv",
            "usage": "citation",
            "supports": ["temporal", "identity"],
            "note": f"近世村ごとの{subject}と、農業集落（KEY）から近世村（AID）への対応。",
        },
        {
            "id": shape_id,
            "sourceId": maff_id,
            "locator": "都道府県別 MA0001_2015_2015_XX.zip の rcom.shp（KEY）",
            "usage": "derived-geometry",
            "supports": ["geometry", "location"],
            "note": f"2015年の農業集落境界を近世村の対応表で{subject}ごとに融合し、約50mの許容差で簡略化した。",
            "publicationBasis": "open-license",
        },
    ]
    uncertainty = {
        "temporal": assessment("approximate", "慶応年間（1865〜1868年頃）の状態です。それ以前・以後の範囲は示しません。", [attributes_id]),
        "location": assessment("approximate", "2015年の農業集落境界から推定した近世村の領域を融合したもので、幕末の境界線そのものではありません。", [shape_id]),
        "geometry": assessment("approximate", "対応する農業集落がない地域（主に山林・水面・蝦夷地など）は空白になります。", [shape_id]),
        "identity": assessment("well-supported", "", [attributes_id]),
    }
    return sources, evidence, uncertainty, [attributes_id, shape_id]


def province_package(provinces: Mapping[tuple[str, str], object]) -> tuple[dict, list, list, list, list]:
    slug = "bakumatsu-provinces"
    sources, evidence, uncertainty, evidence_ids = _polygon_evidence(slug, "国")
    entities, features = [], []
    for (province_id, province), geometry in provinces.items():
        geojson = _geojson(geometry)
        if geojson is None:
            continue
        key = province_id.lower()
        entity_id = f"{slug}:entity:{key}"
        entities.append({"id": entity_id, "type": "polity", "labels": {"ja": f"{province}国"}, "description": {"ja": f"令制国の{province}国。"}})
        features.append(_feature(
            f"{slug}:version:{key}-keio", entity_id, geojson, f"{province}国",
            f"幕末（慶応年間）の{province}国の範囲。所属する近世村の推定領域を融合した概略です。",
            uncertainty, evidence_ids, f"{KYUDAKA_ATTRIBUTION}、{MAFF_ATTRIBUTION}（Chronomapが融合・簡略化）",
        ))
    dataset = _dataset(slug, "幕末期の国（慶応年間）", "近世村の推定領域を国ごとに融合した、幕末の令制国の概略範囲です。", 4,
                       f"{KYUDAKA_ATTRIBUTION}、{MAFF_ATTRIBUTION}")
    return dataset, entities, sources, evidence, features


def domain_package(domains: Mapping[str, object]) -> tuple[dict, list, list, list, list]:
    slug = "bakumatsu-domains"
    sources, evidence, uncertainty, evidence_ids = _polygon_evidence(slug, "主たる領分（領分１）")
    entities, features = [], []
    for lord, geometry in domains.items():
        geojson = _geojson(geometry)
        if geojson is None:
            continue
        key = slug_part(lord)
        entity_id = f"{slug}:entity:{key}"
        entities.append({"id": entity_id, "type": "sphere-of-influence", "labels": {"ja": lord}, "description": {"ja": f"{lord}の領分。"}})
        features.append(_feature(
            f"{slug}:version:{key}-1867", entity_id, geojson, lord,
            f"慶応3年1月1日時点で{lord}を主たる領分（領分１）とする近世村の推定領域を融合した範囲です。相給の村は主たる領分だけで数え、飛び地を含みます。",
            uncertainty, evidence_ids, f"{KYUDAKA_ATTRIBUTION}、{MAFF_ATTRIBUTION}（Chronomapが融合・簡略化）",
        ))
    dataset = _dataset(slug, "幕末期の藩領・幕領（慶応3年）", "慶応3年1月1日時点の主たる領分ごとに近世村の推定領域を融合した、勢力範囲の概略です。", 4,
                       f"{KYUDAKA_ATTRIBUTION}、{MAFF_ATTRIBUTION}")
    return dataset, entities, sources, evidence, features


def read_maff_shapes(archive: Path) -> Iterable[tuple[str, object]]:
    import shapefile
    from shapely.geometry import shape

    with zipfile.ZipFile(archive) as bundle, tempfile.TemporaryDirectory() as directory:
        bundle.extractall(directory)
        shp = next(Path(directory).rglob("*.shp"))
        reader = shapefile.Reader(str(shp), encoding="cp932")
        for record in reader.iterShapeRecords():
            geometry = shape(record.shape.__geo_interface__)
            if not geometry.is_valid:
                geometry = geometry.buffer(0)
            yield str(record.record["KEY"]).zfill(10), geometry


def import_bakumatsu(output_root: Path, cache_dir: Path) -> list[Path]:
    raw = {name: fetch(KYUDAKA_BASE_URL + name, digest, cache_dir / "kyudaka").read_bytes() for name, digest in KYUDAKA_SHA256.items()}
    villages = parse_villages(raw["01_Village_point_data_v2.csv"])
    fields = parse_polygon_fields(raw["02_Village_polygon_field_v2.csv"])
    key_aid = parse_key_aid(raw["03_KEY_AID.csv"])
    archives = [fetch(MAFF_BASE_URL + name, digest, cache_dir / "maff") for name, digest in sorted(MAFF_SHA256.items())]
    provinces, domains = dissolve((item for archive in archives for item in read_maff_shapes(archive)), key_aid, fields)

    outputs = []
    for slug, package in (
        ("bakumatsu-villages", village_package(villages)),
        ("bakumatsu-provinces", province_package(provinces)),
        ("bakumatsu-domains", domain_package(domains)),
    ):
        write_package(output_root / slug, *package)
        outputs.append(output_root / slug)
    return outputs
