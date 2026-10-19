import json
from pathlib import Path

import pytest

from chronomap_data.importers import bakumatsu, world
from chronomap_data.importers.common import RawDataError, fetch, write_package
from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package

shapely_geometry = pytest.importorskip("shapely.geometry")
box = shapely_geometry.box

POINT_CSV = (
    "番号,相給,国ID,国名,郡ID,郡名,国郡,村ID,VID,村名,よみ,領分１,領分２,領分３,領分４,領分５,領分６,Longitude,Latitude\n"
    "1,1,K01,陸奥,K01G01,津軽郡,陸奥津軽郡,S00001,K01G01S00001,青森町,あおもりまち,陸奥弘前藩,,,,,,140.7483,40.82724\n"
    "2,2,K01,陸奥,K01G01,津軽郡,陸奥津軽郡,S00002,K01G01S00002,浦町村,うらまち,陸奥弘前藩,幕領,,,,,140.756812,40.81325\n"
    "3,1,K01,陸奥,K01G01,津軽郡,陸奥津軽郡,S00003,K01G01S00003,座標なし村,,幕領,,,,,,,\n"
    "4,1,K01,陸奥,K01G01,津軽郡,陸奥津軽郡,S00004,K01G01S00004,,,幕領,,,,,,140.7,40.8\n"
    "5,1,K01,陸奥,K01G01,津軽郡,陸奥津軽郡,S00005,K01G01S00005,原点村,,幕領,,,,,,0,0\n"
).encode("cp932")
FIELDS_CSV = (
    "番号,村数,国ID,国名,郡ID,郡名,国郡,村ID,AID,村名,よみ,領分１,領分２,領分３,領分４,領分５,領分６,領分７,領分８\n"
    "1,1,K01,陸奥,K01G01,津軽郡,陸奥津軽郡,S00001,K01G01S00001,青森町,,陸奥弘前藩,,,,,,,\n"
    "2,1,K02,出羽,K02G01,秋田郡,出羽秋田郡,S00009,K02G01S00009,某村,,幕領,,,,,,,\n"
    "3,1,K01,出羽,K01G02,某郡,出羽某郡,S00010,K01G02S00010,食違村,,幕領,,,,,,,\n"
).encode("cp932")
KEY_CSV = b"KEY,AID\n201001001,K01G01S00001\n201001002,K01G01S00001\n501001001,K02G01S00009\n501001002,K01G02S00010\n"


def validate(path: Path) -> list:
    return validate_package(load_package(path), ValidationProfile.PUBLIC)


def test_village_package_is_a_valid_public_package(tmp_path: Path):
    villages = bakumatsu.parse_villages(POINT_CSV)
    assert [village.vid for village in villages] == ["K01G01S00001", "K01G01S00002"]
    assert villages[1].lords == ("陸奥弘前藩", "幕領")

    package = bakumatsu.village_package(villages)
    write_package(tmp_path / "bakumatsu-villages", *package)

    assert validate(tmp_path / "bakumatsu-villages") == []
    features = json.loads((tmp_path / "bakumatsu-villages" / "feature-versions.geojson").read_text(encoding="utf-8"))["features"]
    assert features[1]["geometry"]["coordinates"] == [140.75681, 40.81325]
    assert "相給" in features[1]["properties"]["description"]["ja"]
    assert features[0]["properties"]["temporal"]["start"]["earliestYear"] == 1865
    assert features[0]["properties"]["temporal"]["end"]["latestYear"] == 1868
    dataset = json.loads((tmp_path / "bakumatsu-villages" / "dataset.json").read_text(encoding="utf-8"))
    assert dataset["display"] == {"minZoom": 9}


def test_dissolve_groups_settlements_by_province_and_primary_lord(tmp_path: Path):
    fields = bakumatsu.parse_polygon_fields(FIELDS_CSV)
    key_aid = bakumatsu.parse_key_aid(KEY_CSV)
    assert key_aid["0201001001"] == "K01G01S00001"
    shapes = [
        ("0201001001", box(140.0, 40.0, 140.1, 40.1)),
        ("0201001002", box(140.1, 40.0, 140.2, 40.1)),
        ("0501001001", box(140.0, 39.0, 140.1, 39.1)),
        ("0501001002", box(140.1, 39.0, 140.2, 39.1)),
        ("9999999999", box(0, 0, 1, 1)),
    ]

    provinces, domains = bakumatsu.dissolve(shapes, key_aid, fields)

    assert sorted(provinces) == [("K01", "陸奥"), ("K02", "出羽")]
    assert provinces[("K02", "出羽")].bounds == pytest.approx((140.0, 39.0, 140.2, 39.1))
    assert provinces[("K01", "陸奥")].bounds == pytest.approx((140.0, 40.0, 140.2, 40.1))
    assert sorted(domains) == ["幕領", "陸奥弘前藩"]
    for slug, package in (
        ("bakumatsu-provinces", bakumatsu.province_package(provinces)),
        ("bakumatsu-domains", bakumatsu.domain_package(domains)),
    ):
        write_package(tmp_path / slug, *package)
        assert validate(tmp_path / slug) == []


def test_world_snapshot_years_and_held_periods():
    assert world.snapshot_year("world_bc123000.geojson") == -123000
    assert world.snapshot_year("world_1600.geojson") == 1600
    assert world.snapshot_periods([1600, -500, 1650]) == {-500: (-500, 1599), 1600: (1600, 1649), 1650: (1650, 1650)}


def test_world_package_merges_names_per_snapshot_and_skips_unnamed(tmp_path: Path):
    def polygon(x):
        return {"type": "Polygon", "coordinates": [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]]}

    snapshots = {
        1600: {"features": [
            {"properties": {"NAME": "Japan (Warring States)", "BORDERPRECISION": 1}, "geometry": polygon(130)},
            {"properties": {"NAME": "Japan (Warring States)", "BORDERPRECISION": 1}, "geometry": polygon(131)},
            {"properties": {"NAME": None}, "geometry": polygon(0)},
        ]},
        -500: {"features": [{"properties": {"NAME": "Persia", "BORDERPRECISION": 3}, "geometry": {"type": "Polygon", "coordinates": [[[50, 0, 0.0], [51, 0, 0.0], [51, 1, 0.0], [50, 1, 0.0], [50, 0, 0.0]]]}}]},
    }

    package = world.world_package(snapshots)
    write_package(tmp_path / "world", *package)

    assert validate(tmp_path / "world") == []
    _dataset, entities, _sources, _evidence, features = package
    assert len(entities) == 2
    japan = next(feature for feature in features if feature["properties"]["labels"]["en"].startswith("Japan"))
    assert japan["geometry"]["type"] == "MultiPolygon"
    assert len(japan["geometry"]["coordinates"]) == 1
    persia = next(feature for feature in features if feature["properties"]["labels"]["en"] == "Persia")
    assert persia["id"].endswith("-bc500")
    assert all(len(position) == 2 for position in persia["geometry"]["coordinates"][0][0])
    assert persia["properties"]["temporal"]["end"]["latestYear"] == 1599
    assert persia["properties"]["uncertainty"]["location"]["assessment"] == "well-supported"


def test_fetch_rejects_a_cached_file_with_the_wrong_digest(tmp_path: Path):
    (tmp_path / "data.csv").write_bytes(b"tampered")

    with pytest.raises(RawDataError, match="SHA-256 mismatch"):
        fetch("https://example.invalid/data.csv", "0" * 64, tmp_path)


def test_write_package_is_deterministic(tmp_path: Path):
    package = bakumatsu.village_package(bakumatsu.parse_villages(POINT_CSV))
    write_package(tmp_path / "a" / "bakumatsu-villages", *package)
    write_package(tmp_path / "b" / "bakumatsu-villages", *package)

    for name in ("dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"):
        assert (tmp_path / "a" / "bakumatsu-villages" / name).read_bytes() == (tmp_path / "b" / "bakumatsu-villages" / name).read_bytes()


def test_wikidata_castles_and_battles_become_valid_point_packages(tmp_path: Path):
    from chronomap_data.importers import wikidata

    castles = wikidata.castle_records([
        {"item": {"value": "http://www.wikidata.org/entity/Q1"}, "itemLabel": {"value": "安土城"}, "coord": {"value": "Point(136.141 35.155)"}, "inception": {"value": "1576-01-01T00:00:00Z"}, "dissolved": {"value": "1585-01-01T00:00:00Z"}},
        {"item": {"value": "http://www.wikidata.org/entity/Q2"}, "itemLabel": {"value": "Q2"}, "coord": {"value": "Point(136 35)"}, "inception": {"value": "1500-01-01T00:00:00Z"}},
        {"item": {"value": "http://www.wikidata.org/entity/Q3"}, "itemLabel": {"value": "海外城"}, "coord": {"value": "Point(2 48)"}, "inception": {"value": "1500-01-01T00:00:00Z"}},
        {"item": {"value": "http://www.wikidata.org/entity/Q4"}, "itemLabel": {"value": "年不明城"}, "coord": {"value": "Point(136 35)"}, "inception": {"value": "t123"}},
    ])
    battles = wikidata.battle_records([
        {"item": {"value": "http://www.wikidata.org/entity/Q9"}, "itemLabel": {"value": "関ヶ原の戦い"}, "coord": {"value": "Point(136.47 35.37)"}, "time": {"value": "1600-10-21T00:00:00Z"}},
    ])
    assert castles == [("q1", "安土城", [136.141, 35.155], 1576, 1585)]
    assert battles == [("q9", "関ヶ原の戦い", [136.47, 35.37], 1600, 1600)]
    assert wikidata.year_of("-0500-01-01T00:00:00Z") == -500

    for slug, entity_type, records in (("wikidata-castles", "fortification", castles), ("wikidata-battles", "battlefield", battles)):
        write_package(tmp_path / slug, *wikidata.package(slug, entity_type, "t", "d", records, "2026-10-12"))
        assert validate(tmp_path / slug) == []


def test_landform_keeps_drained_land_and_only_coastal_reclaimed_land(tmp_path: Path):
    from shapely.geometry import LineString, mapping

    from chronomap_data.importers import landform

    def tile(*items):
        return {"features": [{"properties": {"code": code}, "geometry": mapping(geometry)} for code, geometry in items]}

    tiles = [
        tile(("4010101", box(135.70, 34.90, 135.75, 34.95)), ("4010201", box(139.77, 35.62, 139.78, 35.63))),
        tile(("4010101", box(135.75, 34.90, 135.80, 34.95)), ("11005", box(139.40, 35.60, 139.41, 35.61)), ("999999", box(0, 0, 1, 1))),
        tile(("4010101", box(140.0, 36.0, 140.0001, 36.0001)), ("4010101", box(140.1, 36.0, 140.1001, 36.0001))),
    ]
    drained, filled = landform.collect(tiles)
    assert len(drained) == 4 and len(filled) == 2

    coast = landform.CoastIndex([LineString([(139.78, 35.60), (139.78, 35.64)])])
    assert len(landform.collect(tiles, coast)[1]) == 1
    drained_parts, coastal_parts = landform.build_parts(drained, filled, coast)

    assert len(drained_parts) == 1
    assert drained_parts[0].bounds == pytest.approx((135.70, 34.90, 135.80, 34.95))
    assert len(coastal_parts) == 1
    assert coastal_parts[0].bounds == pytest.approx((139.77, 35.62, 139.78, 35.63))

    write_package(tmp_path / "gsi-artificial-land", *landform.package(drained_parts, coastal_parts, "2026-10-17"))
    assert validate(tmp_path / "gsi-artificial-land") == []
    features = json.loads((tmp_path / "gsi-artificial-land" / "feature-versions.geojson").read_text(encoding="utf-8"))["features"]
    assert {feature["properties"]["labels"]["ja"] for feature in features} == {"干拓地（現代）", "埋立地（現代・海岸沿い）"}
    assert all(feature["properties"]["temporal"]["end"] is None for feature in features)


def test_edo_coast_band_is_sea_around_land_and_lakes_are_waterbodies(tmp_path: Path):
    from shapely.geometry import shape

    from chronomap_data.importers import edo

    land = [box(139.0, 35.0, 140.0, 36.0), box(139.9, 35.9, 140.2, 36.2)]
    band = edo.sea_band(land, width=0.1)
    assert band.contains(shape({"type": "Point", "coordinates": [139.0 - 0.05, 35.5]}))
    assert not band.contains(shape({"type": "Point", "coordinates": [139.5, 35.5]}))
    assert not band.contains(shape({"type": "Point", "coordinates": [138.5, 35.5]}))

    lakes = [
        {"properties": {"id": "26007", "name": "巨椋池", "yomi": "おぐらいけ", "pref": "京都府", "remarks": "仮製2万参照"}, "geometry": {"type": "MultiPolygon", "coordinates": [[[[135.7, 34.9], [135.8, 34.9], [135.8, 34.95], [135.7, 34.9]]]]}},
        {"properties": {"id": "26008", "name": "琵琶湖", "yomi": "びわこ", "pref": "滋賀県"}, "geometry": {"type": "MultiPolygon", "coordinates": [[[[136.0, 35.0], [136.1, 35.0], [136.1, 35.1], [136.0, 35.0]]]]}},
        {"properties": {"id": "99999", "name": "", "pref": "x"}, "geometry": None},
    ]
    for slug, package in (("edo-coast", edo.coast_package(band)), ("edo-lakes", edo.lake_package(lakes))):
        write_package(tmp_path / slug, *package)
        assert validate(tmp_path / slug) == []
    dataset = json.loads((tmp_path / "edo-coast" / "dataset.json").read_text(encoding="utf-8"))
    assert dataset["display"]["seaMask"] is True
    lake_features = json.loads((tmp_path / "edo-lakes" / "feature-versions.geojson").read_text(encoding="utf-8"))["features"]
    assert [feature["properties"]["labels"]["ja"] for feature in lake_features] == ["琵琶湖"]
    assert all(not feature["id"].endswith("lake-26007") for feature in lake_features)
    assert lake_features[0]["properties"]["temporal"]["end"]["latestYear"] == 1894


def _synthetic_rgb_png(rows: list[list[tuple[int, int, int]]], filter_type: int) -> bytes:
    import struct
    import zlib

    def paeth(left: int, above: int, upper_left: int) -> int:
        estimate = left + above - upper_left
        distances = (abs(estimate - left), abs(estimate - above), abs(estimate - upper_left))
        return (left, above, upper_left)[distances.index(min(distances))]

    width = len(rows[0])
    previous = bytes(width * 3)
    scanlines = bytearray()
    for row in rows:
        raw = bytes(channel for pixel in row for channel in pixel)
        filtered = bytearray(len(raw))
        for index, value in enumerate(raw):
            left = raw[index - 3] if index >= 3 else 0
            above = previous[index]
            upper_left = previous[index - 3] if index >= 3 else 0
            predictor = (0, left, above, (left + above) // 2, paeth(left, above, upper_left))[filter_type]
            filtered[index] = (value - predictor) & 255
        scanlines.append(filter_type)
        scanlines.extend(filtered)
        previous = raw

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", width, len(rows), 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(scanlines)) + chunk(b"IEND", b"")


@pytest.mark.parametrize("filter_type", range(5))
def test_katori_dem_png_decodes_signed_values_and_nodata(filter_type: int):
    from chronomap_data.importers import katori

    pixels = [
        [(0, 0, 123), (255, 255, 22), (128, 0, 0)],
        [(0, 3, 232), (0, 0, 0), (128, 0, 0)],
    ]

    elevations = katori.decode_dem_png(_synthetic_rgb_png(pixels, filter_type))

    assert [list(row) for row in elevations] == [[123, -234, katori.NO_DATA], [1000, 0, katori.NO_DATA]]


def test_katori_dem_flood_fill_uses_threshold_and_ocean_connectivity_only():
    from array import array

    from chronomap_data.importers import katori

    elevations = [
        array("h", [katori.NO_DATA, 350, 500, 100]),
        array("h", [300, 500, 100, katori.MISSING]),
        array("h", [500, 100, 500, 200]),
    ]

    mask = katori.flood_fill(elevations, threshold_m=4, seeds=[(0, 0)])

    assert [list(row) for row in mask] == [[1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]]


def test_katori_offshore_seed_uses_geocoded_choshi_row_and_eastern_nodata():
    from chronomap_data.importers import katori

    rows = [[katori.MISSING] * 256 for _ in range(256)]
    rows[127][240] = katori.NO_DATA
    rows[128][100] = katori.NO_DATA
    rows[128][240] = katori.NO_DATA
    rows[128][245] = 500

    seeds = katori.choshi_offshore_seeds(rows, origin_x=0, origin_y=0, coordinate=(0, 0), zoom=0)

    assert seeds == [(128, 240)]


def test_katori_corrections_add_and_remove_geometry():
    from shapely.geometry import Point

    from chronomap_data.importers import katori

    base = katori.polygonize_mask(
        [bytearray([1, 1]), bytearray([1, 1])],
        grid_transform=(100.0, 0, 0.0, 0, -100.0, 200.0),
        bbox=(-0.01, -0.01, 0.01, 0.01),
        simplify_m=0,
        min_component_area_m2=0,
        min_hole_area_m2=0,
    )
    west, south, east, north = base.bounds
    middle = (west + east) / 2
    addition = box(east, south, east + 0.001, north)
    exclusion = box(west, south, middle, north)

    corrected = katori.apply_corrections(base, additions=[addition], exclusions=[exclusion])

    assert corrected.covers(Point(east + 0.0005, (south + north) / 2))
    assert not corrected.covers(Point((west + middle) / 2, (south + north) / 2))


def test_katori_period_corrections_cut_ocean_and_restore_choshi_outlet():
    from shapely.geometry import Point, box

    from chronomap_data.importers import katori

    base = box(140.7, 35.736, 140.8, 35.738)
    choshi = Point(*katori.CHOSHI_SEED_COORDINATE)

    medieval_outlet = katori.choshi_outlet_correction(base)
    ancient = katori.correct_katori_geometry(base, year=700)
    outside_ocean = katori.outer_ocean_exclusion()

    assert medieval_outlet.covers(choshi)
    assert 1200 in katori.CHOSHI_OUTLET_YEARS
    assert 700 not in katori.CHOSHI_OUTLET_YEARS
    assert ancient.is_empty
    assert outside_ocean.covers(Point(140.9, 36.1))
    assert outside_ocean.covers(Point(140.7, 35.66))
    assert not outside_ocean.covers(Point(140.5, 35.9))


def test_katori_correction_discards_unconnected_nodata_components():
    from shapely.geometry import MultiPolygon, Point, box

    from chronomap_data.importers import katori

    main = box(140.38, 36.02, 140.41, 36.04)
    outer_ocean = box(140.61, 36.18, 140.80, 36.22)

    corrected = katori.correct_katori_geometry(MultiPolygon([main, outer_ocean]), 700)

    assert corrected.covers(Point(*katori.KASUMIGAURA_CONTROL_COORDINATE))
    assert not corrected.covers(Point(140.62, 36.20))
    parts = list(corrected.geoms) if hasattr(corrected, "geoms") else [corrected]
    assert len(parts) == 1


def test_katori_corrections_clip_to_study_bbox():
    from shapely.geometry import box

    from chronomap_data.importers import katori

    min_lon, min_lat, max_lon, max_lat = katori.STUDY_BBOX
    base = box(min_lon, min_lat, max_lon, max_lat + 0.001)

    corrected = katori.correct_katori_geometry(base, 700)

    assert corrected.bounds[0] >= min_lon
    assert corrected.bounds[1] >= min_lat
    assert corrected.bounds[2] <= max_lon
    assert corrected.bounds[3] <= max_lat


def test_katori_corrections_remove_sub_hectare_components_and_holes():
    from shapely.geometry import MultiPolygon, Point, Polygon, box

    from chronomap_data.importers import katori

    basin = Polygon(
        [(140.45, 35.85), (140.55, 35.85), (140.55, 35.95), (140.45, 35.95)],
        holes=[[(140.5000, 35.9000), (140.5001, 35.9000), (140.5001, 35.9001), (140.5000, 35.9001)]],
    )
    fragment = box(140.57, 35.86, 140.5701, 35.8601)

    corrected = katori.correct_katori_geometry(MultiPolygon([basin, fragment]), 700)
    polygons = list(corrected.geoms) if corrected.geom_type == "MultiPolygon" else [corrected]

    assert len(polygons) == 1
    assert len(polygons[0].interiors) == 0
    assert polygons[0].covers(Point(140.50005, 35.90005))


def test_katori_local_lowland_component_keeps_only_seed_connected_cells():
    from chronomap_data.importers import katori

    rows = [
        [500, 500, 500, 500, 500, 500, 500],
        [500, 100, 100, 300, 100, 100, 500],
        [500, 100, 200, 300, 100, 500, 500],
        [500, 100, 100, 300, 100, 100, 500],
        [500, 500, 500, 500, 500, 500, 500],
    ]

    mask, row_offset, column_offset = katori.lowland_component_mask(rows, 1.0, (1, 1))

    assert (row_offset, column_offset) == (1, 1)
    assert len(mask) == 3
    assert [list(row) for row in mask] == [[1, 1], [1, 0], [1, 1]]


def test_katori_inlet_connector_joins_dem_component_to_main_sea():
    from shapely import union_all
    from shapely.geometry import Point, box

    from chronomap_data.importers import katori

    main_sea = box(140.3, 35.8, 140.4, 35.9)
    inlet = box(140.1, 35.8, 140.2, 35.9)

    correction = katori.connect_geometry_to_main(main_sea, inlet, width_m=300)
    connected = union_all([main_sea, inlet, correction])

    assert connected.geom_type == "Polygon"
    assert connected.covers(Point(140.15, 35.85))


def test_katori_dem_grid_loads_and_assembles_tiles(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    from array import array

    from chronomap_data.importers import katori

    def fake_fetch(_zoom: int, _x: int, _y: int, _cache_dir: Path):
        return [array("h", [123]) * 256 for _ in range(256)], "dem5a_png/z13"

    monkeypatch.setattr(katori, "fetch_dem_tile", fake_fetch)

    rows, _origin_x, _origin_y, layers = katori.load_dem_grid(
        bbox=(140.0, 35.0, 140.001, 35.001), cache_dir=tmp_path, padding=0
    )

    assert len(rows) == 256
    assert len(rows[0]) == 256
    assert rows[0][0] == 123
    assert layers == {"dem5a_png/z13"}


def test_katori_dem_parent_tile_is_upsampled_into_its_z13_child():
    from array import array

    from chronomap_data.importers import katori

    parent = [array("h", range(256)) for _ in range(256)]

    child = katori._upsample_parent(parent, child_x=1, child_y=0)

    assert len(child) == 256
    assert list(child[0][:6]) == [128, 128, 129, 129, 130, 130]
    assert child[1][0] == 128
    assert child[255][0] == 128


def test_katori_polygonize_traces_holes_drops_small_fragments_and_clips_bbox():
    from chronomap_data.importers import katori

    mask = [
        bytearray([1, 1, 1, 0, 0, 0]),
        bytearray([1, 0, 1, 0, 0, 0]),
        bytearray([1, 1, 1, 0, 0, 0]),
        bytearray([0, 0, 0, 0, 0, 1]),
    ]
    grid_transform = (100.0, 0, 0.0, 0, -100.0, 400.0)

    geometry = katori.polygonize_mask(
        mask,
        grid_transform,
        bbox=(0.0004, 0.0013, 0.0022, 0.0032),
        simplify_m=0,
        min_component_area_m2=10_001,
        min_hole_area_m2=0,
    )

    assert geometry.geom_type == "Polygon"
    assert len(geometry.interiors) == 1
    min_lon, min_lat, max_lon, max_lat = 0.0004, 0.0013, 0.0022, 0.0032
    west, south, east, north = geometry.bounds
    assert west == pytest.approx(min_lon, abs=1e-8)
    assert south == pytest.approx(min_lat, abs=1e-8)
    assert east == pytest.approx(max_lon, abs=1e-8)
    assert north == pytest.approx(max_lat, abs=1e-8)


def test_katori_multipolygon_rounds_geojson_coordinates_to_five_places():
    from shapely.geometry import Polygon

    from chronomap_data.importers import katori

    geometry = Polygon(
        [
            (140.123456789, 36.24999999999999),
            (140.223456789, 36.24999999999999),
            (140.223456789, 36.25000000000001),
            (140.123456789, 36.25000000000001),
            (140.123456789, 36.24999999999999),
        ]
    )

    geojson = katori._multipolygon(geometry)

    ring = geojson["coordinates"][0][0]
    assert all(len(position) == 2 for position in ring)
    assert all(round(value, 5) == value for position in ring for value in position)
    assert max(position[1] for position in ring) == 36.25
