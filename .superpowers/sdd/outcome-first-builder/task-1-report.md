# Task 1 report — outcome-first builder

Base: `0a7990a`

## Delivered

- Added a privacy-safe `deriveLessonPackBuilderSummary` view model with `ready`, `editing`, and `invalid` states.
- Added the above-fold outcome rail: selected/total steps, model duration, student worksheet, optional teacher reference and sources, QR/online links, and A4/PDF + recipient print output.
- Added the Japanese and English primary `この内容で完成見本を見る` / `See the finished example` CTA. It shares the existing form normalization and preview callback path with the end-of-form CTA.
- Added a secondary `内容を調整する` / `Adjust the contents` action that scrolls and focuses the existing form; title/class, prompts, step selection, and teacher inclusion contracts are unchanged.
- Summary facts update from rendered form state on `input`/`change`, including atomic draft apply and reset.
- Zero selected steps keep preview blocked, announce an alert, focus the step fieldset, and recover when a step is selected again.
- Desktop uses a sticky summary rail. Mobile uses a fixed bottom CTA with safe-area padding and reserved sheet padding so the final prompt is not covered.
- Draft controls remain unchanged and now sit after the editing form as a secondary path.
- Existing pack, print scope, QR, feedback, teacher-note privacy, URL/storage, and lesson allow-list paths were not changed.

## TDD evidence

The new summary contract tests were added before production implementation. The initial focused run failed five tests with the expected missing `deriveLessonPackBuilderSummary`/summary DOM errors. After implementation:

```text
tests/lesson-pack-builder.test.ts — 11 passed
```

The tests cover default ready output, editing/invalid states, CTA equivalence, draft synchronization, JA/EN labels, ARIA live status, and no editable-text leakage.

## Verification

- Focused unit: `npm test -- --run tests/lesson-pack-builder.test.ts` — 11 passed.
- Full unit: `npm test` — 147 passed; 4 pre-existing `public-asset-sync` failures because `chronomap-data` is unavailable (`spawn chronomap-data ENOENT`).
- Build: `npm run build` — TypeScript and Vite build passed; existing chunk-size warning only.
- Dev outcome E2E: `outcome-first-builder.spec.ts` desktop + mobile — 6/6 passed.
- Dev full browser run: 103/108 passed. The five failures were load-sensitive print-scope/quick-start races; isolated reruns passed (`lesson-pack-print-scope.spec.ts` 8/8, `quick-start.spec.ts` 2/2). The new outcome tests remained green.
- Production representative E2E after rebuilding preview: outcome-first builder + draft round-trip + quick-start, desktop + mobile — 16/16 passed.
- `git diff --check` — passed.

Outcome screenshots are emitted by the E2E test at `test-results/**/outcome-summary.png` for both configured viewports.
