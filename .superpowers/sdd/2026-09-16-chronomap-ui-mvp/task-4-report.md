# Task 4 report: MapLibre and GSI integration

## Changes

- Added the MapLibre-only `MapAdapter` boundary and runtime-independent GSI style definitions.
- Added a visible GSI attribution link, one live GeoJSON source, geometry-specific rendering, selected halos/outlines, and dashed hypothesis line rendering.
- Wired the stable UI map host to the adapter. Map clicks report authored-order candidate IDs; overlapping candidates are rendered as text buttons.
- Added an explicit basemap-failure state that preserves list and detail interactions.

## Tests and verification

- `PATH=/tmp/chronomap-node22.bQpa1j/bin:$PATH npm test -- map-style.test.ts`
- `PATH=/tmp/chronomap-node22.bQpa1j/bin:$PATH uv run --project .. -- npm test`
- `PATH=/tmp/chronomap-node22.bQpa1j/bin:$PATH npm run build`
- `git diff --check`

## Findings

- The direct web test command needs the project Python environment for `chronomap-data`; `uv run --project .. -- npm test` supplies it.
- The Vite production build succeeds but reports its standard MapLibre-related chunk-size warning (1.03 MB JavaScript); no generated assets or lockfiles were changed.

## Review follow-up

- Moved all `line-dasharray` styling to valid paint properties and used literal array branches for the data-driven hypothesis dash expression.
- Imported MapLibre's distributed CSS solely at the adapter boundary.
- Separated persistent `basemapError` from UI status, so temporal selection-cleared announcements and normal detail/list transitions remain accurate while the map notice persists.
- Added map-rendering error, style-placement, and candidate/detail focus regression coverage. Candidate controls carry stable `data-map-candidate-id` values and regain focus after details close.
