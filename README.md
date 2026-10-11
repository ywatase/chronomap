# Chronomap

Chronomap is a nationwide historical map: one seamless map of Japan (and the
world) whose coastlines, lakes, rivers, castles, battlefields, villages,
provinces, domains, and polities change with a year slider. Every feature
carries its possible period, uncertainty, evidence, and source rights.
The architecture is recorded in
[ADR 0008](docs/adr/0008-seamless-national-map-with-temporal-vector-tiles.md).

```text
data/<slug>/      hand-authored 5-file packages (in Git)
imports/<slug>/   packages generated from pinned external data (not in Git)
      │  chronomap-data build-tiles data imports
      ▼
web/public/chronomap/   chronomap.pmtiles + manifest.json + details/ (not in Git)
      │
      ▼
web/                    static MapLibre viewer
```

## Setup

Install Python 3.12+, [uv](https://docs.astral.sh/uv/), Node.js 22, and
Tippecanoe 2.79.0, then:

```sh
uv sync --dev
(cd web && npm ci)
```

On Ubuntu, build the pinned Tippecanoe release:

```sh
sudo apt-get install build-essential libsqlite3-dev zlib1g-dev
git clone --depth 1 --branch 2.79.0 https://github.com/felt/tippecanoe.git tippecanoe
make -C tippecanoe -j
sudo make -C tippecanoe install
tippecanoe --version
```

## Build the map data

Import the external datasets. Raw files are downloaded once into `.cache/raw/`
and rejected unless their SHA-256 matches the pinned value; packages are
written to `imports/`.

```sh
uv run chronomap-data import world       # historical-basemaps, GPL-3.0 (about 1 minute)
uv run chronomap-data import bakumatsu   # Bakumatsu villages, provinces, domains, CC BY-SA 4.0 (about 16 minutes, ~300 MB download)
uv run chronomap-data import wikidata    # castles and battles in Japan, CC0 (live query; retrieval date is recorded)
```

Build the national tiles and detail indexes from every package (about 10
minutes with all imports; the 66,000-village package dominates validation):

```sh
uv run chronomap-data build-tiles data imports --output web/public/chronomap
```

`build-tiles data --output web/public/chronomap` alone (without `imports`)
builds the small hand-authored set used by CI and the browser tests.

The output contract is [全国統合タイルの公開契約](docs/data/tiles.md); the
package contract is [the normative data model](docs/data/model.md).

## Run the viewer

```sh
cd web
npm run dev        # http://localhost:5173/
```

See [web/README.md](web/README.md) for the viewer, URL format, and tests.

## Validate a package

```sh
uv run chronomap-data validate data/ogurike --profile public
uv run chronomap-data audit data/ogurike
```

`build-public <package> --output <dir>` writes the fail-closed public
projection of one package; `build-tiles` uses the same projection internally.

## Tests

```sh
uv run pytest -q
(cd web && npm test && npm run build && npm run test:browser)
```

GitHub Actions validates every package under `data/`, checks that
`build-tiles` is byte-for-byte deterministic, and runs the web unit, build,
and Chromium browser suites against tiles built from `data/`.
