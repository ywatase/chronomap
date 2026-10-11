"""Shared helpers for importers that turn pinned raw data into 5-file packages."""

from collections.abc import Mapping, Sequence
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile
import urllib.request

from ..public_builder import _swap_output


class RawDataError(Exception):
    """Raw data could not be fetched, verified, or converted."""


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fetch(url: str, expected_sha256: str, cache_dir: Path) -> Path:
    """Return a cached copy of *url* whose SHA-256 equals *expected_sha256*."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    target = cache_dir / url.rsplit("/", 1)[-1]
    if not target.is_file():
        partial = target.with_suffix(target.suffix + ".part")
        try:
            with urllib.request.urlopen(url, timeout=120) as response, partial.open("wb") as output:
                shutil.copyfileobj(response, output)
        except OSError as error:
            partial.unlink(missing_ok=True)
            raise RawDataError(f"could not download {url}: {error}") from error
        partial.replace(target)
    actual = sha256_file(target)
    if actual != expected_sha256:
        raise RawDataError(f"SHA-256 mismatch for {target.name}: expected {expected_sha256}, found {actual}")
    return target


def slug_part(text: str) -> str:
    """Return an ID segment: ASCII words joined by hyphens, plus a short stable hash."""
    words = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:8]
    return f"{words}-{digest}" if words else digest


def temporal(start: tuple[int, int], end: tuple[int, int], precision: str = "year", qualifier: str = "exact") -> dict[str, object]:
    return {
        "start": {"earliestYear": start[0], "latestYear": start[1], "precision": precision, "qualifier": qualifier},
        "end": {"earliestYear": end[0], "latestYear": end[1], "precision": precision, "qualifier": qualifier},
    }


def assessment(level: str, note: str, evidence_ids: Sequence[str]) -> dict[str, object]:
    return {"assessment": level, "note": note, "evidenceIds": list(evidence_ids)}


def round_coordinates(value: object, digits: int = 5) -> object:
    if isinstance(value, float):
        return round(value, digits)
    if isinstance(value, list | tuple):
        return [round_coordinates(item, digits) for item in value]
    return value


def _dump(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def write_package(
    output: Path,
    dataset: Mapping[str, object],
    entities: Sequence[Mapping[str, object]],
    sources: Sequence[Mapping[str, object]],
    evidence: Sequence[Mapping[str, object]],
    features: Sequence[Mapping[str, object]],
) -> None:
    """Atomically replace *output* with a deterministic 5-file package."""
    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=f".{output.name}.tmp-", dir=output.parent))
    try:
        for filename, value in (
            ("dataset.json", dataset),
            ("entities.json", sorted(entities, key=lambda record: str(record["id"]))),
            ("sources.json", sorted(sources, key=lambda record: str(record["id"]))),
            ("evidence.json", sorted(evidence, key=lambda record: str(record["id"]))),
            (
                "feature-versions.geojson",
                {"type": "FeatureCollection", "features": sorted(features, key=lambda record: str(record["id"]))},
            ),
        ):
            (stage / filename).write_bytes(_dump(value))
        _swap_output(stage, output)
    finally:
        shutil.rmtree(stage, ignore_errors=True)


FILES = {
    "entities": "entities.json",
    "sources": "sources.json",
    "evidence": "evidence.json",
    "featureVersions": "feature-versions.geojson",
}
