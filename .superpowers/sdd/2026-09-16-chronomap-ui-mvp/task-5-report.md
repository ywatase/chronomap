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
- Separated bundle-load failures from synchronous MapLibre startup failures so a
  map/WebGL/style error becomes a basemap alert while the text list and detail
  path remain mounted. Added a regression test for that boundary.
- Replaced deprecated geometry filters with `geometry-type` expressions and
  preserved the skip-link main target while loading or failing. The visible UI
  status is the sole polite live notifier for normal, no-match,
  selection-cleared, and retry states; dataset failure remains an alert.
- Added responsive focus handling (desktop detail panel, mobile detail tab) and
  verified mobile arrow-key tab selection, `aria-selected`, and tabpanel state.
- Added an explicit bilingual basemap retry action. Retrying rebuilds only the
  MapLibre map, restores the current feature collection and selection, and
  leaves the authoritative list and open detail panel in place.
- Documented that the web unit suite requires the repository `.venv/bin` on
  `PATH` because its public-asset regression invokes `chronomap-data`.

## Verification

- `PATH=/tmp/chronomap-node22.bQpa1j/bin:/home/ywatase/git/github.com/ywatase/chronomap/.venv/bin:$PATH npm test` — PASS (37 tests).
- `PATH=/tmp/chronomap-node22.bQpa1j/bin:/home/ywatase/git/github.com/ywatase/chronomap/.venv/bin:$PATH npm run build` — PASS (Vite chunk-size warning only).
- `PYTHONDONTWRITEBYTECODE=1 uv run pytest -q -p no:cacheprovider` — PASS (209 tests).
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
