# Task 3 report — synchronized list, metadata panel, and responsive shell

## Changes

- Added the pure application reducer with bundle, year, selection, mobile-tab, failure, and retry transitions. It delegates single-year visibility to the existing temporal filter.
- Added a semantic, keyboard-operable feature list that sorts by Feature ID, groups parallel hypotheses without ranking them, and uses the existing localization and BCE/CE helpers.
- Added a text-authoritative metadata panel for Entity, Version, possible time, all four uncertainty dimensions, Evidence, Source, and distinct FeatureVersion/Dataset/Source rights. Restricted and unknown sources show the fixed citation-only notice.
- Added a responsive UI shell with skip link, landmarks, live status/alert regions, desktop sidebar, mobile list/detail tabs, close/back behavior, visible focus styling, and reduced-motion rules.
- Updated the bootstrap to load the existing five-file synthetic public bundle and mount the shell.

## Verification

- `PATH=/tmp/chronomap-node22.bQpa1j/bin:$PATH npm test -- state.test.ts metadata.test.ts` — 7 tests passed.
- `PATH=/tmp/chronomap-node22.bQpa1j/bin:$PATH npm run build` — TypeScript check and Vite production build passed.
- `uv run bash -c 'cd web && PATH=/tmp/chronomap-node22.bQpa1j/bin:$PATH npm test'` — all 21 web tests passed.
- `uv run pytest -q` — existing Python suite passed.

## Findings

- The map is intentionally represented by an accessible placeholder in this task; Task 4 owns the MapLibre adapter and GSI attribution integration.

## Review follow-up

- Kept the shell DOM, map host, and live region stable across state changes; the Task 4 adapter boundary now requires `mount(container)`.
- Added semantic close behavior and focus return to the newly-rendered selected list button.
- Added entity labels to list choices, temporal precision/qualifier text, source anchors from evidence, safe source links, and BCE/CE source-year formatting.
- Follow-up verification: focused UI tests (9), complete web suite (23), and production build all passed.

## Final review follow-up

- Time metadata now expresses the possibility-first endpoints independently (`start.earliestYear` and `end.latestYear`), retaining each boundary's precision and qualifier and naming null endpoints as open.
- Evidence links and Source targets use matching literal fragment IDs, including colon-containing resource IDs.
- The document root is neutral; the shell supplies the one `chronomap-main` landmark between sibling header and footer elements.
- Final verification: focused UI tests (10), complete web suite (24), and production build all passed.
