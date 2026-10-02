# Chronomap data contract tooling and a static historical-map pilot

Chronomap packages are normalized, versioned historical-data records.  This
repository contains their JSON Schemas, validator, and fail-closed public
bundle builder. Installed wheels include the versioned schemas as internal
package resources, so validation does not depend on a checkout. The checked-in
`data/ogurike/`, `data/tonegawa/`, `data/heijokyo/`, and `data/azuchijo/` are
small, citation-linked pilots for the Ogurike, Tone River, Heijokyo, and Azuchi
Castle/Lake Biwa areas; the test fixture remains synthetic and is not history.

## Setup

Install Python 3.12 or later and [uv](https://docs.astral.sh/uv/), then run:

```sh
uv sync --dev
```

## Commands

Validate authoring data (the default profile):

```sh
uv run chronomap-data validate tests/fixtures/valid/synthetic-package
```

Validate it as data eligible for publication:

```sh
uv run chronomap-data validate tests/fixtures/valid/synthetic-package --profile public
```

Validate the Ogurike pilot and build the browser-facing projection:

```sh
uv run chronomap-data validate data/ogurike --profile public
uv run chronomap-data build-public data/ogurike --output web/public/data/ogurike
```

The second public pilot uses the same contract:

```sh
uv run chronomap-data validate data/tonegawa --profile public
uv run chronomap-data build-public data/tonegawa --output web/public/data/tonegawa
```

The third public pilot uses the same contract:

```sh
uv run chronomap-data validate data/heijokyo --profile public
uv run chronomap-data build-public data/heijokyo --output web/public/data/heijokyo
```

The fourth public pilot uses the same contract:

```sh
uv run chronomap-data validate data/azuchijo --profile public
uv run chronomap-data build-public data/azuchijo --output web/public/data/azuchijo
```

Build a deterministic public projection.  The target is replaced only after
public-profile validation and staging both succeed:

```sh
uv run chronomap-data build-public tests/fixtures/valid/synthetic-package --output public-bundles/synthetic
```

See [the normative data model](docs/data/model.md) for the complete package
contract.

## Web demo

The static responsive UI, setup instructions, and browser acceptance tests are
documented in [web/README.md](web/README.md). The default `/data/ogurike/`
bundle is generated from the pilot package; the header's region/lesson catalog
or `/?dataset=tonegawa`, `/?dataset=heijokyo`, or `/?dataset=azuchijo` selects
another pilot. All
bundles keep restricted source material as citation-only metadata.

GitHub Actions runs the Python contract/public-data checks and the Web
unit/build/Chromium acceptance suite on pushes and pull requests.
