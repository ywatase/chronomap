# Task 5 report: responsive UI vertical slice

## Changes

- Connected startup loading of `/data/synthetic/`, safe dataset-failure output,
  and a retry that reloads the five-file public bundle before mounting a fresh
  controller and map adapter.
- Added browser acceptance coverage for public features, year zero/open-boundary
  selection, metadata, keyboard close/return, mobile tabs, dataset retry, and
  a deliberately blocked GSI tile host.
- Kept dataset status and the independent basemap alert separate, added an
  accessible bilingual year label, Enter-to-commit year handling, and arrow-key
  mobile tab navigation.
- Added Playwright configuration for 390×844 and 1440×900 Chromium projects,
  documentation, generated-report ignores, and Vite test/dev configuration
  that excludes browser specifications from Vitest and MapLibre from dependency
  prebundling.

## Verification

- `PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:/home/ywatase/git/github.com/ywatase/chronomap/.venv/bin:$PATH npm test` — PASS (32 tests).
- `PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:/home/ywatase/git/github.com/ywatase/chronomap/.venv/bin:$PATH npm run build` — PASS (Vite chunk-size warning only).
- `PYTHONDONTWRITEBYTECODE=1 uv run pytest -q -p no:cacheprovider` — PASS.
- `npm run test:browser` — PASS for both configured Chromium projects (eight
  acceptance tests). Chromium was installed locally for this verification.

## Findings

- GSI raster tile requests use `cyberjapandata.gsi.go.jp`, not the attribution
  host `maps.gsi.go.jp`; the acceptance route blocks both hosts.
- The year field's native `change` event must be committed before selecting a
  newly visible feature. The acceptance test commits it by moving focus, then
  asserts the specific public FeatureVersion button is selected.
- The public synthetic asset scan found no private polygon ID/text or requested
  raw authored citation content.
