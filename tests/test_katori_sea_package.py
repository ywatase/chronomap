from pathlib import Path

import pytest

from chronomap_data import cli
from chronomap_data.importers import katori
from chronomap_data.importers.common import write_package
from chronomap_data.loader import load_package
from chronomap_data.models import ValidationProfile
from chronomap_data.schema_validation import validate_package
from chronomap_data.semantic_validation import validate_semantics

shapely_geometry = pytest.importorskip("shapely.geometry")
box = shapely_geometry.box


def test_katori_package_has_one_coastline_and_three_supported_versions(tmp_path: Path):
    geometries = {
        700: box(140.0, 35.8, 140.1, 35.9),
        1200: box(140.0, 35.8, 140.09, 35.89),
        1600: box(140.0, 35.8, 140.08, 35.88),
    }

    write_package(tmp_path / "katori-sea", *katori.package(geometries, accessed="2026-10-19"))
    package = load_package(tmp_path / "katori-sea")

    assert validate_package(package, ValidationProfile.PUBLIC) == []
    assert validate_semantics(package, ValidationProfile.PUBLIC) == []
    assert len(package.entities) == 1
    assert package.entities[0]["type"] == "coastline"
    assert package.entities[0]["labels"]["ja"] == "香取海"
    assert len(package.feature_versions["features"]) == 3
    assert package.dataset["display"] == {"minZoom": 6, "seaMask": True}

    features = package.feature_versions["features"]
    by_year = {feature["properties"]["temporal"]["start"]["earliestYear"]: feature for feature in features}
    assert set(by_year) == {700, 1200, 1600}
    assert by_year[1600]["properties"]["temporal"]["end"]["latestYear"] == 1654
    assert all("閾値" in feature["properties"]["description"]["ja"] for feature in features)
    assert all(feature["properties"]["rights"]["status"] == "open-license" for feature in features)

    sources = {source["id"]: source for source in package.sources}
    evidence = {record["id"]: record for record in package.evidence}
    restricted_ids = {source_id for source_id, source in sources.items() if source["rights"]["status"] == "restricted"}
    assert restricted_ids
    for record in evidence.values():
        if record["sourceId"] in restricted_ids:
            assert record["usage"] == "citation"
    assert any(record.get("publicationBasis") == "open-license" for record in evidence.values())
    assert any(record.get("publicationBasis") == "original-reconstruction" for record in evidence.values())


def test_katori_cli_defaults_to_data_and_respects_an_explicit_output(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    calls = []

    def fake_import(output_root: Path, cache_dir: Path):
        calls.append((output_root, cache_dir))
        return []

    monkeypatch.setattr(katori, "import_katori", fake_import)

    assert cli.main(["import", "katori"]) == 0
    assert calls[-1] == (Path("data"), Path(".cache/raw"))

    explicit_output = tmp_path / "custom-output"
    explicit_cache = tmp_path / "raw"
    assert cli.main(["import", "katori", "--output", str(explicit_output), "--cache", str(explicit_cache)]) == 0
    assert calls[-1] == (explicit_output, explicit_cache)


def test_imported_katori_periods_cover_the_two_inlets_and_join_sawara_to_choshi():
    from shapely.geometry import Point, shape

    package = load_package(Path(__file__).parents[1] / "data" / "katori-sea")
    features = package.feature_versions["features"]
    points = {
        "Inbanuma": Point(140.20, 35.77),
        "Teganuma": Point(140.06, 35.86),
        "Sawara Tone": Point(140.50, 35.90),
        "Choshi": Point(*katori.CHOSHI_SEED_COORDINATE),
        "Kasumigaura": Point(140.396591780667, 36.0298025049868),
        "Kitaura": Point(140.561652034978, 36.0457649168077),
    }
    highlands = {
        "Narita": Point(140.317245, 35.776741),
        "Sakura": Point(140.224197, 35.723396),
        "Hokota plateau (Otake)": Point(140.574371, 36.159828),
        "Tsukuba": Point(140.077118, 36.083504),
    }

    assert {feature["properties"]["temporal"]["start"]["earliestYear"] for feature in features} == {700, 1200, 1600}
    for feature in features:
        year = feature["properties"]["temporal"]["start"]["earliestYear"]
        geometry = shape(feature["geometry"])
        assert all(geometry.covers(point) for point in points.values()), year
        assert all(not geometry.covers(point) for point in highlands.values()), year
        parts = list(geometry.geoms)
        choshi_part = next(part for part in parts if part.covers(points["Choshi"]))
        assert all(choshi_part.covers(point) for point in points.values()), year
        sawara_part = next(part for part in parts if part.covers(points["Sawara Tone"]))
        assert sawara_part.equals(choshi_part), year


def test_katori_package_cites_named_inlet_and_sawara_corrections():
    geometries = {
        700: box(140.0, 35.8, 140.1, 35.9),
        1200: box(140.0, 35.8, 140.09, 35.89),
        1600: box(140.0, 35.8, 140.08, 35.88),
    }
    dataset, entities, sources, evidence, features = katori.package(geometries, accessed="2026-10-19")
    evidence_by_id = {record["id"]: record for record in evidence}
    required_ids = {
        "katori-sea:evidence:inbanuma-inlet",
        "katori-sea:evidence:teganuma-inlet",
        "katori-sea:evidence:sawara-tone-channel",
    }

    assert required_ids <= evidence_by_id.keys()
    assert all(record["publicationBasis"] == "original-reconstruction" for record in evidence if record["id"] in required_ids)
    assert all(required_ids <= set(feature["properties"]["evidenceIds"]) for feature in features)
