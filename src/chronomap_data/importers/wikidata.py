"""Import castles and battles in Japan from Wikidata (CC0) into 5-file packages.

Wikidata changes continuously, so results are not hash-pinned; the retrieval
date is recorded on the Source instead.
"""

from collections.abc import Mapping, Sequence
import datetime
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request

from .common import FILES, RawDataError, assessment, round_coordinates, write_package


ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "chronomap/0.1 (historical map research)"
JAPAN_BBOX = [122.0, 20.0, 154.0, 46.0]
CASTLE_QUERY = """SELECT ?item ?itemLabel ?coord ?inception ?dissolved WHERE {
  ?item wdt:P31/wdt:P279* wd:Q23413; wdt:P17 wd:Q17; wdt:P625 ?coord; wdt:P571 ?inception.
  OPTIONAL { ?item wdt:P576 ?dissolved. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ja,en". }
}"""
BATTLE_QUERY = """SELECT ?item ?itemLabel ?coord ?time ?start WHERE {
  ?item wdt:P31/wdt:P279* wd:Q178561; wdt:P17 wd:Q17; wdt:P625 ?coord.
  OPTIONAL { ?item wdt:P585 ?time. }
  OPTIONAL { ?item wdt:P580 ?start. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ja,en". }
}"""


def query(sparql: str) -> list[dict[str, dict[str, str]]]:
    url = f"{ENDPOINT}?{urllib.parse.urlencode({'query': sparql})}"
    request = urllib.request.Request(url, headers={"Accept": "application/sparql-results+json", "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.load(response)["results"]["bindings"]
    except (OSError, ValueError, KeyError) as error:
        raise RawDataError(f"Wikidata query failed: {error}") from error


def year_of(value: str | None) -> int | None:
    """Year of a Wikidata xsd:dateTime such as ``1562-04-18T00:00:00Z`` or ``-0500-01-01T00:00:00Z``."""
    if not value:
        return None
    match = re.match(r"^(-?)(\d{1,6})-", value)
    if not match:
        return None
    year = int(match.group(2))
    return -year if match.group(1) else year


def point_of(value: str) -> list[float] | None:
    match = re.match(r"^Point\(([-\d.]+) ([-\d.]+)\)$", value)
    if not match:
        return None
    longitude, latitude = float(match.group(1)), float(match.group(2))
    west, south, east, north = JAPAN_BBOX
    if not (west <= longitude <= east and south <= latitude <= north):
        return None
    return round_coordinates([longitude, latitude])  # type: ignore[return-value]


def _qid(binding: Mapping[str, Mapping[str, str]]) -> str:
    return binding["item"]["value"].rsplit("/", 1)[-1].lower()


def _boundary(year: int) -> dict[str, object]:
    return {"earliestYear": year, "latestYear": year, "precision": "year", "qualifier": "exact"}


def package(slug: str, entity_type: str, title: str, description: str, records: Sequence[tuple[str, str, list[float], int, int | None]], accessed: str):
    """``records``: (qid, label, point, start year, end year or None)."""
    source_id = f"{slug}:source:wikidata"
    evidence_id = f"{slug}:evidence:wikidata-statements"
    uncertainty = {
        "temporal": assessment("approximate", "Wikidataの年（築城・廃城・合戦の日付）をそのまま使っています。諸説ある場合も1つの値だけです。", [evidence_id]),
        "location": assessment("approximate", "Wikidataの座標（P625）の代表点です。", [evidence_id]),
        "geometry": assessment("approximate", "範囲ではなく1点で表しています。", [evidence_id]),
        "identity": assessment("well-supported", "", [evidence_id]),
    }
    entities, features = [], []
    seen: set[str] = set()
    for qid, label, point, start, end in sorted(records):
        if qid in seen:
            continue
        seen.add(qid)
        entity_id = f"{slug}:entity:{qid}"
        entities.append({"id": entity_id, "type": entity_type, "labels": {"ja": label}, "description": {"ja": f"Wikidata {qid.upper()}。"}})
        period = f"{start}年" + (f"〜{end}年" if end is not None and end != start else "" if end == start else "〜")
        features.append({
            "type": "Feature",
            "id": f"{slug}:version:{qid}",
            "geometry": {"type": "Point", "coordinates": point},
            "properties": {
                "entityId": entity_id,
                "labels": {"ja": label},
                "description": {"ja": f"{label}（{period}）。出典はWikidata {qid.upper()}。"},
                "temporal": {"start": _boundary(start), "end": _boundary(end) if end is not None else None},
                "uncertainty": uncertainty,
                "evidenceIds": [evidence_id],
                "publicationStatus": "public",
                "rights": {"status": "public-domain", "attribution": "Wikidata (CC0)"},
            },
        })
    dataset = {
        "schemaVersion": "1.0.0",
        "id": f"{slug}:dataset:wikidata",
        "title": {"ja": title},
        "description": {"ja": description},
        "defaultLanguage": "ja",
        "bbox": JAPAN_BBOX,
        "temporalExtent": {"start": _boundary(min(record[3] for record in records)), "end": None},
        "rights": {"status": "public-domain", "attribution": "Wikidata (CC0)"},
        "display": {"minZoom": 5},
        "files": FILES,
    }
    source = {
        "id": source_id,
        "type": "knowledge-base",
        "citation": f"Wikidata SPARQL query ({accessed})",
        "title": {"ja": "Wikidata"},
        "creators": ["Wikidata contributors"],
        "publishedYear": int(accessed[:4]),
        "url": "https://query.wikidata.org/",
        "accessedDate": accessed,
        "rights": {"status": "public-domain", "attribution": "Wikidata (CC0)", "terms": "CC0 1.0"},
    }
    evidence = [{
        "id": evidence_id,
        "sourceId": source_id,
        "locator": "各項目のP625（座標）とP571・P576（築城・廃城）またはP585・P580（日付）",
        "usage": "derived-geometry",
        "supports": ["temporal", "location", "geometry", "identity"],
        "note": "Wikidataの文を取得日時点のまま変換した。座標は小数第5位に丸めた。",
        "publicationBasis": "public-domain",
    }]
    return dataset, entities, [source], evidence, features


def castle_records(bindings: Sequence[Mapping[str, Mapping[str, str]]]) -> list[tuple[str, str, list[float], int, int | None]]:
    records = []
    for binding in bindings:
        point = point_of(binding["coord"]["value"])
        start = year_of(binding.get("inception", {}).get("value"))
        end = year_of(binding.get("dissolved", {}).get("value"))
        label = binding.get("itemLabel", {}).get("value", "")
        if point is None or start is None or not label or re.fullmatch(r"Q\d+", label):
            continue
        records.append((_qid(binding), label, point, start, end if end is not None and end >= start else None))
    return records


def battle_records(bindings: Sequence[Mapping[str, Mapping[str, str]]]) -> list[tuple[str, str, list[float], int, int | None]]:
    records = []
    for binding in bindings:
        point = point_of(binding["coord"]["value"])
        year = year_of(binding.get("start", {}).get("value")) or year_of(binding.get("time", {}).get("value"))
        label = binding.get("itemLabel", {}).get("value", "")
        if point is None or year is None or not label or re.fullmatch(r"Q\d+", label):
            continue
        records.append((_qid(binding), label, point, year, year))
    return records


def import_wikidata(output_root: Path, _cache_dir: Path, today: str | None = None) -> list[Path]:
    accessed = today or datetime.date.today().isoformat()
    outputs = []
    for slug, entity_type, title, description, records in (
        ("wikidata-castles", "fortification", "日本の城（Wikidata）", "築城年が登録されている日本の城の代表点です。廃城年がなければ現在まで続く可能性として表示します。", castle_records(query(CASTLE_QUERY))),
        ("wikidata-battles", "battlefield", "日本の合戦（Wikidata）", "日付と座標が登録されている日本の合戦です。合戦の年だけ表示します。", battle_records(query(BATTLE_QUERY))),
    ):
        write_package(output_root / slug, *package(slug, entity_type, title, description, records, accessed))
        outputs.append(output_root / slug)
    return outputs
