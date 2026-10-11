import gzip
import json
from pathlib import Path
import shutil
from types import SimpleNamespace

import pytest

from chronomap_data.cli import main
from chronomap_data.loader import load_package
from chronomap_data.public_builder import PublicBuildIOError, PublicBuildValidationError, project_public
from chronomap_data import tile_builder
from chronomap_data.tile_builder import (
    THEME_DEFINITIONS,
    TILE_PROPERTIES,
    TileDataset,
    build_tile_documents,
    build_tiles,
    feature_period,
)


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"
ENTITY_THEME = {
    "coastline": "coast",
    "waterbody": "lake",
    "watercourse": "river",
    "polity": "polity",
    "boundary": "polity",
    "sphere-of-influence": "sphere",
    "fortification": "castle",
    "battlefield": "battlefield",
    "settlement": "settlement",
    "port": "settlement",
    "route": "route",
    "archaeological-site": "other",
    "other": "other",
}


def synthetic_dataset(tmp_path: Path, name: str = "synthetic") -> TileDataset:
    package_dir = tmp_path / name
    shutil.copytree(SYNTHETIC_PACKAGE, package_dir)
    dataset_path = package_dir / "dataset.json"
    metadata = json.loads(dataset_path.read_text(encoding="utf-8"))
    metadata["id"] = f"{name}:dataset:synthetic-test"
    dataset_path.write_text(json.dumps(metadata), encoding="utf-8")
    package = load_package(package_dir)
    return TileDataset(name, package, project_public(package))


def copy_synthetic_package(parent: Path, name: str, *, invalid: bool = False) -> Path:
    package_dir = parent / name
    shutil.copytree(SYNTHETIC_PACKAGE, package_dir)
    dataset_path = package_dir / "dataset.json"
    metadata = json.loads(dataset_path.read_text(encoding="utf-8"))
    metadata["id"] = f"{name}:dataset:synthetic-test"
    if invalid:
        metadata["rights"]["status"] = "restricted"
    dataset_path.write_text(json.dumps(metadata), encoding="utf-8")
    return package_dir


def read_tree(path: Path) -> dict[str, bytes]:
    return {
        file.relative_to(path).as_posix(): file.read_bytes()
        for file in sorted(path.rglob("*"))
        if file.is_file()
    }


def decode_pmtiles(path: Path) -> tuple[dict[str, object], dict[int, dict[str, dict[str, object]]]]:
    pmtiles_reader = pytest.importorskip("pmtiles.reader")
    vector_tile = pytest.importorskip("mapbox_vector_tile")
    by_zoom: dict[int, dict[str, dict[str, object]]] = {}
    with path.open("rb") as archive:
        source = pmtiles_reader.MmapSource(archive)
        reader = pmtiles_reader.Reader(source)
        header = reader.header()
        for (zoom, _x, _y), tile_bytes in pmtiles_reader.all_tiles(source):
            payload = gzip.decompress(tile_bytes) if tile_bytes.startswith(b"\x1f\x8b") else tile_bytes
            decoded = vector_tile.decode(payload)
            assert set(decoded) == {"features"}
            for feature in decoded["features"]["features"]:
                properties = feature["properties"]
                by_zoom.setdefault(zoom, {})[properties["feature_version_id"]] = properties
    return header, by_zoom


def expected_data_documents():
    datasets = []
    for package_dir in sorted((ROOT / "data").iterdir(), key=lambda path: path.name):
        if not package_dir.is_dir():
            continue
        package = load_package(package_dir)
        datasets.append(TileDataset(package_dir.name, package, project_public(package)))
    return build_tile_documents(datasets)


@pytest.mark.parametrize(
    ("temporal", "expected"),
    [
        ({"start": None, "end": None}, (-999999, 999999)),
        (
            {
                "start": {"earliestYear": 710, "latestYear": 720},
                "end": {"earliestYear": 2010, "latestYear": 2020},
            },
            (710, 2020),
        ),
        (
            {
                "start": {"earliestYear": None, "latestYear": 720},
                "end": {"earliestYear": 2010, "latestYear": None},
            },
            (-999999, 999999),
        ),
        (
            {
                "start": {"earliestYear": 710, "latestYear": None},
                "end": None,
            },
            (710, 999999),
        ),
    ],
)
def test_feature_period_uses_open_endpoint_sentinels(temporal, expected):
    assert feature_period({"temporal": temporal}) == expected


def test_theme_definitions_cover_every_entity_type():
    mapped = {
        entity_type: theme_id
        for theme_id, _label_ja, _label_en, entity_types in THEME_DEFINITIONS
        for entity_type in entity_types
    }

    assert mapped == ENTITY_THEME


def test_tile_documents_exclude_private_features_from_tiles_and_details(tmp_path: Path):
    dataset = synthetic_dataset(tmp_path)

    documents = build_tile_documents([dataset])

    assert [feature["properties"]["feature_version_id"] for feature in documents.features] == [
        "synthetic:version:line-alternative-a",
        "synthetic:version:line-alternative-b",
        "synthetic:version:point-open-boundary",
    ]
    assert all(
        set(feature["properties"])
        == {"feature_version_id", "entity_id", "dataset", "theme", "name", "from_year", "to_year"}
        for feature in documents.features
    )
    details = documents.details["synthetic"]
    assert "synthetic:version:polygon-private" not in details["features"]
    assert "synthetic:entity:polygon-subject" not in details["entities"]
    assert all("publicationStatus" not in feature for feature in details["features"].values())
    assert all("geometry" not in feature for feature in details["features"].values())


def test_details_keep_the_safe_citation_only_evidence_projection(tmp_path: Path):
    documents = build_tile_documents([synthetic_dataset(tmp_path)])
    details = documents.details["synthetic"]
    evidence = details["evidence"]["synthetic:evidence:citation-identity"]

    assert evidence["usage"] == "citation"
    assert evidence["note"] == "Citation-only metadata; no authored source content is reproduced."
    assert "Non-historical private feature." not in json.dumps(details, ensure_ascii=False)


def test_tile_documents_reject_slug_mismatch_and_duplicates(tmp_path: Path):
    dataset = synthetic_dataset(tmp_path)

    with pytest.raises(PublicBuildValidationError) as mismatch:
        build_tile_documents([TileDataset("wrong", dataset.package, dataset.projection)])
    assert mismatch.value.issues[0].code == "tiles.slug_mismatch"

    with pytest.raises(PublicBuildValidationError) as duplicate:
        build_tile_documents([dataset, dataset])
    assert duplicate.value.issues[0].code == "tiles.slug_duplicate"


def test_manifest_uses_sorted_unique_years_and_datasets(tmp_path: Path):
    late = synthetic_dataset(tmp_path, "zeta")
    early = synthetic_dataset(tmp_path, "alpha")

    documents = build_tile_documents([late, early])

    assert [item["slug"] for item in documents.manifest["datasets"]] == ["alpha", "zeta"]
    assert documents.manifest["years"] == [-4, -3, 0, 2, 3]
    assert documents.manifest["yearRange"] == {"min": -4, "max": 3}
    assert [theme["id"] for theme in documents.manifest["themes"]] == [row[0] for row in THEME_DEFINITIONS]


def test_manifest_handles_datasets_without_finite_year_endpoints(tmp_path: Path):
    dataset = synthetic_dataset(tmp_path)
    feature_collection = json.loads(json.dumps(dataset.projection.feature_collection))
    for feature in feature_collection["features"]:
        feature["properties"]["temporal"] = {
            "start": {"earliestYear": None, "latestYear": 10},
            "end": {"earliestYear": 10, "latestYear": None},
        }
    projection = dataset.projection.__class__(
        dataset.projection.dataset,
        dataset.projection.entities,
        dataset.projection.sources,
        dataset.projection.evidence,
        feature_collection,
    )

    documents = build_tile_documents([TileDataset(dataset.slug, dataset.package, projection)])

    assert documents.manifest["years"] == []
    assert documents.manifest["yearRange"] == {"min": None, "max": None}


@pytest.mark.skipif(shutil.which("tippecanoe") is None, reason="Tippecanoe is required for PMTiles integration")
def test_build_tiles_cli_writes_all_seven_public_datasets_and_all_z4_z12_features(tmp_path: Path, capsys):
    output = tmp_path / "chronomap"
    expected = expected_data_documents()

    exit_code = main(["build-tiles", str(ROOT / "data"), "--output", str(output)])

    assert exit_code == 0
    captured = capsys.readouterr()
    assert captured.err == ""
    assert "7 datasets" in captured.out
    assert "-> " + str(output.resolve()) in captured.out
    assert (output / "chronomap.pmtiles").is_file()
    assert (output / "manifest.json").is_file()
    assert len(list((output / "details").glob("*.json"))) == 7
    manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
    assert manifest == expected.manifest
    details = {
        path.stem: json.loads(path.read_text(encoding="utf-8"))
        for path in (output / "details").glob("*.json")
    }
    assert details == expected.details

    header, by_zoom = decode_pmtiles(output / "chronomap.pmtiles")
    expected_features = {
        feature["properties"]["feature_version_id"]: feature["properties"]
        for feature in expected.features
    }
    assert (header["min_zoom"], header["max_zoom"]) == (4, 12)
    for zoom in (4, 12):
        assert by_zoom[zoom] == expected_features
        assert all(set(properties) == set(TILE_PROPERTIES) for properties in by_zoom[zoom].values())


@pytest.mark.skipif(shutil.which("tippecanoe") is None, reason="Tippecanoe is required for PMTiles integration")
def test_build_tiles_is_byte_identical_across_two_builds(tmp_path: Path):
    first = tmp_path / "first"
    second = tmp_path / "second"

    build_tiles(ROOT / "data", first)
    first_build = read_tree(first)
    build_tiles(ROOT / "data", second)

    assert read_tree(second) == first_build


def test_build_tiles_validation_failure_preserves_existing_output(tmp_path: Path, capsys):
    package_root = tmp_path / "data"
    package_root.mkdir()
    copy_synthetic_package(package_root, "synthetic", invalid=True)
    output = tmp_path / "chronomap"
    output.mkdir()
    (output / "previous.txt").write_bytes(b"previous output\n")
    before = read_tree(output)

    exit_code = main(["build-tiles", str(package_root), "--output", str(output)])

    assert exit_code == 1
    assert capsys.readouterr().out == ""
    assert read_tree(output) == before


def test_build_tiles_reports_missing_tippecanoe_with_install_guidance(tmp_path: Path, monkeypatch, capsys):
    package_root = tmp_path / "data"
    package_root.mkdir()
    copy_synthetic_package(package_root, "synthetic")
    output = tmp_path / "chronomap"
    monkeypatch.setattr(tile_builder.shutil, "which", lambda _command: None)

    exit_code = main(["build-tiles", str(package_root), "--output", str(output)])

    assert exit_code == 2
    assert "Tippecanoe 2.79.0" in capsys.readouterr().err
    assert not output.exists()


def test_build_tiles_rejects_an_unpinned_tippecanoe_version(tmp_path: Path, monkeypatch):
    package_root = tmp_path / "data"
    package_root.mkdir()
    copy_synthetic_package(package_root, "synthetic")
    output = tmp_path / "chronomap"
    monkeypatch.setattr(tile_builder.shutil, "which", lambda _command: "/usr/bin/tippecanoe")
    monkeypatch.setattr(
        tile_builder.subprocess,
        "run",
        lambda *_args, **_kwargs: SimpleNamespace(returncode=0, stdout="Tippecanoe v2.80.0", stderr=""),
    )

    with pytest.raises(PublicBuildIOError, match="found 2.80.0"):
        build_tiles(package_root, output)

    assert not output.exists()


def test_build_tiles_rejects_output_overlapping_input_packages(tmp_path: Path, capsys):
    package_root = tmp_path / "data"
    package_root.mkdir()
    copy_synthetic_package(package_root, "synthetic")
    before = read_tree(package_root)

    exit_code = main(["build-tiles", str(package_root), "--output", str(package_root)])

    assert exit_code == 2
    assert "overlap" in capsys.readouterr().err
    assert read_tree(package_root) == before


def test_build_tiles_preserves_output_and_cleans_staging_when_tippecanoe_fails(tmp_path: Path, monkeypatch):
    package_root = tmp_path / "data"
    package_root.mkdir()
    copy_synthetic_package(package_root, "synthetic")
    output = tmp_path / "chronomap"
    output.mkdir()
    (output / "previous.txt").write_bytes(b"previous output\n")
    before = read_tree(output)
    monkeypatch.setattr(tile_builder.shutil, "which", lambda _command: "/usr/bin/tippecanoe")

    def fail_tool(command, **kwargs):
        assert command[0] == "tippecanoe"
        if command[-1] == "--version":
            return SimpleNamespace(returncode=0, stdout="Tippecanoe v2.79.0", stderr="")
        assert all(not str(argument).startswith("/") for argument in command[1:])
        assert Path(kwargs["cwd"]).name == ".work"
        return SimpleNamespace(returncode=1, stderr="synthetic tool failure")

    monkeypatch.setattr(tile_builder.subprocess, "run", fail_tool)

    with pytest.raises(PublicBuildIOError, match="synthetic tool failure"):
        build_tiles(package_root, output)

    assert read_tree(output) == before
    assert not list(tmp_path.glob(".chronomap.tmp-*"))


def test_build_tiles_rejects_empty_and_missing_package_roots(tmp_path: Path, capsys):
    empty = tmp_path / "empty"
    empty.mkdir()

    empty_exit_code = main(["build-tiles", str(empty), "--output", str(tmp_path / "empty-output")])
    missing_exit_code = main(["build-tiles", str(tmp_path / "missing"), "--output", str(tmp_path / "missing-output")])

    captured = capsys.readouterr()
    assert empty_exit_code == 1
    assert missing_exit_code == 2
    assert "no package" in captured.err.lower()
