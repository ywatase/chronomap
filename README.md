# Chronomap data contract tooling

Chronomap packages are normalized, versioned historical-data records.  This
repository contains their JSON Schemas, validator, and fail-closed public
bundle builder. Installed wheels include the versioned schemas as internal
package resources, so validation does not depend on a checkout. The included
fixture is synthetic test data, not history.

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

Build a deterministic public projection.  The target is replaced only after
public-profile validation and staging both succeed:

```sh
uv run chronomap-data build-public tests/fixtures/valid/synthetic-package --output public-bundles/synthetic
```

See [the normative data model](docs/data/model.md) for the complete package
contract.
