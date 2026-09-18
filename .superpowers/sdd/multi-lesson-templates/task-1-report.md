# Task 1 report — multi-lesson templates

## Changes

- Replaced the catalog's single lesson authority with an explicit `lessons[]` allow-list (`id`, `path`, `featured`) while retaining the old `lessonPath` field only as a compatibility alias; no runtime fetch path is generated from URL input.
- Added parallel allow-listed manifest loading with per-lesson `null` failure isolation, strict lesson selection, and safe removal of invalid `lesson`/`view=builder|pack` URL state.
- Loaded all lessons once per dataset snapshot, kept bundle availability independent from lesson-row availability, and updated catalog snapshots/view models for multiple purpose-specific rows.
- Added featured-aware catalog links, one map route per card, localized unavailable-row copy, and responsive lesson row actions.
- Added Ogurike's `ogurike-river-compare` manifest (two steps, eight minutes) reusing the existing 1590/1596 Ujigawa features and bounded JA/EN non-assertive teacher notes.
- Kept exact dataset+lesson draft resume routing and existing lesson-pack print scopes, QR access, feedback, and teacher-note privacy behavior intact.
- Added unit, browser regression, and data-driven coverage for allow-list selection, parallel loading/partial failure, catalog rows, invalid URLs, the new lesson, draft round-trips, and teacher-note visibility.

## TDD evidence

RED:

```text
Focused catalog/data-loader/view-model tests failed before implementation:
- catalog lessons were undefined
- loadLessonManifests was not a function
- multi-lesson rows were undefined

The strict lesson-selection contract test initially failed because
src/domain/lesson-selection.ts did not exist.
```

GREEN:

```text
PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm test -- --run tests/dataset-catalog.test.ts tests/data-loader.test.ts tests/dataset-catalog-view-model.test.ts tests/dataset-catalog-dialog.test.ts tests/lesson-selection.test.ts tests/lesson.test.ts tests/lesson-pack-model.test.ts tests/lesson-pack-draft.test.ts tests/ui-shell.test.ts
Test Files  9 passed (9)
Tests  58 passed (58)

PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm test
Test Files  28 passed, 1 failed (29)
Tests  142 passed, 4 failed (146)
```

The four full-unit failures are the existing `public-asset-sync.test.ts` checks, which cannot spawn `chronomap-data` in this environment (`ENOENT`); all web unit tests passed.

```text
PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm run build
✓ built successfully (existing Vite chunk-size warning only)

PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:browser -- --trace=off
102 passed (5.7m)  # dev webServer, mobile + desktop

CHRONOMAP_PREVIEW=1 PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:browser -- tests/browser/multi-lesson-templates.spec.ts tests/browser/lesson-pack-draft.spec.ts tests/browser/lesson-pack-reading-example.spec.ts --trace=off
24 passed (1.1m)  # production preview, mobile + desktop
```

`git diff --check` passed.

## Screenshot inspection

Inspected the generated mobile catalog and desktop `ogurike-river-compare` pack screenshots. The catalog shows two distinct Ogurike lesson rows and one map action; the pack shows the two-step worksheet, QR/start link, and scoped layout without horizontal overflow. Japanese glyphs render as fallback boxes in the test browser image, but structure and controls remain visible.

## Unresolved / notes

- No new geometry, source, or historical claims were added; the new lesson reuses the existing public bundle features.
- The public-asset sync failures require the repository's `chronomap-data` executable and are environmental, not caused by this task.
