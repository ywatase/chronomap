# Task 1 report — recipient-specific print scopes

## Changes

- Added the strict `LessonPackPrintScope` contract (`student`, `teacher`, `full`) to the lesson-pack render and print flow.
- Split the toolbar into student, teacher/source, and full actions; the teacher action follows `includeTeacher`, while full remains the compatibility path.
- Added JA/EN labels, a student-print warning, and a stable student rights/attribution footer.
- Added print-media selectors that remove non-selected sections with `display: none`, avoiding blank pages and keeping teacher reading examples out of student output.
- Centralized print lifecycle cleanup: both `afterprint` and the 1.5s timeout fallback clear `data-print-document` and `data-lesson-pack-print-scope`.
- Added unit and data-driven Playwright coverage for all three datasets, both viewports, disabled teacher material, privacy/visibility, scope cleanup, toolbar sizing, and mobile overflow.

## TDD evidence

RED:

```text
Focused lesson-pack tests failed before implementation because the new scope selectors/actions were absent.
```

GREEN:

```text
PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm test -- lesson-pack.test.ts ui-shell.test.ts
Test Files  2 passed (2)
Tests  26 passed (26)

PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm run build
✓ built in 1.89s

PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:browser -- tests/browser/lesson-pack-print-scope.spec.ts --trace=off
8 passed (51.6s)  # production preview, mobile + desktop

PATH=/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:browser -- tests/browser/lesson-pack-view.spec.ts tests/browser/lesson-pack-builder.spec.ts tests/browser/lesson-pack-draft.spec.ts --trace=off
18 passed (1.8m)  # dev webServer, mobile + desktop
```

`git diff --check` passed. The production build retains the existing Vite chunk-size warning; there were no type-check or test failures.

## Screenshot inspection

Inspected generated Playwright screenshots for the mobile toolbar and desktop student/teacher print states. The toolbar remained within the mobile viewport with accessible button heights; student print showed the rights footer without teacher/source sections, while teacher print showed sources and reading examples without the student QR/worksheet.
