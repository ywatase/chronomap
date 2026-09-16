# Chronomap UI MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static responsive Web UI that loads a public Chronomap bundle, filters FeatureVersions by one astronomical year, lets users select features from a map or synchronized text list, and exposes metadata, uncertainty, evidence, rights, and failure states.

**Architecture:** A Vite-built TypeScript SPA owns application state and pure domain functions. Only `PublicBundleLoader` reads the five public files; `TemporalFilter`, `FeatureList`, and `MetadataPanel` consume immutable normalized data; `MapAdapter` is the only module that imports MapLibre GL JS. The same state drives the map, desktop sidebar, and mobile list/detail tabs.

**Tech Stack:** Node.js 22 LTS for the web toolchain, Vite 8.3.0, TypeScript 7.0.2, MapLibre GL JS 6.10.0, Vitest 5.0.1, Playwright 1.63.0, and plain HTML/CSS/TypeScript without a component framework.

**Spec:** `docs/superpowers/specs/2026-09-16-chronomap-ui-mvp-design.md`

## Global Constraints

- The UI is a static SPA and must not add a server API, login, browser editing, or deployment configuration.
- The browser loads only the public five-file bundle: `dataset.json`, `entities.json`, `sources.json`, `evidence.json`, and `feature-versions.geojson`.
- Public data remains fail-closed: private FeatureVersions, unreachable records, and authored source content are never copied into Web assets.
- PC and smartphone layouts have equal acceptance priority; mobile uses a map plus `list/detail` tabs rather than a gesture-only sheet.
- The timeline is a single astronomical year; possible activity is inclusive and possibility-first, with open boundaries treated as infinite.
- Internal year `0` is 1 BCE; visible labels use BCE/CE while all filtering uses astronomical integer years.
- A synchronized text list is mandatory and remains usable when MapLibre or the GSI basemap fails.
- Parallel hypotheses are grouped and shown without a preferred flag; labels and text remain authoritative over color or opacity.
- Entity, FeatureVersion, four uncertainty dimensions, Evidence, Source, rights, and GSI attribution remain distinct in the detail view.
- Loading, available, no-match, selection-cleared, dataset-failure, basemap-failure, and retrying states have explicit text and accessible announcements.
- Production code is introduced through red-green tests; browser acceptance tests use the synthetic fixture and never real historical claims.
- Existing Python data-contract behavior and tests must remain green.

---

### Task 1: Scaffold the static web app and checked-in public demo asset

**Files:**
- Create: `web/package.json`
- Create: `web/package-lock.json`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/src/main.ts`
- Create: `web/src/styles.css`
- Create: `web/tests/public-asset-sync.test.ts`
- Create: `web/public/data/synthetic/dataset.json`
- Create: `web/public/data/synthetic/entities.json`
- Create: `web/public/data/synthetic/sources.json`
- Create: `web/public/data/synthetic/evidence.json`
- Create: `web/public/data/synthetic/feature-versions.geojson`
- Create: `web/README.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces a Vite app at `web/` whose `npm run dev` and `npm run build` commands are defined.
- Serves a public demo bundle from `/data/synthetic/`; the checked-in files must equal `chronomap-data build-public tests/fixtures/valid/synthetic-package` output.
- `web/src/main.ts` initially mounts a labeled shell and must not import MapLibre or implement domain logic in this task.

- [ ] **Step 1: Write the failing scaffold and asset-sync tests**

Create `web/tests/public-asset-sync.test.ts` with a real filesystem check. It must read the five files under `web/public/data/synthetic`, run the Python builder into a temporary directory through the installed `chronomap-data` command, and compare every byte.

```ts
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const files = ["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"];

it("checked-in demo assets equal the public builder output", async () => {
  const directory = await mkdtemp(join(tmpdir(), "chronomap-ui-"));
  try {
    await execFileAsync("chronomap-data", ["build-public", "../tests/fixtures/valid/synthetic-package", "--output", directory], { cwd: ".." });
    for (const name of files) {
      await expect(readFile(join("web/public/data/synthetic", name))).resolves.toEqual(await readFile(join(directory, name)));
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from the repository root: `cd web && npm test -- public-asset-sync.test.ts`. Expected: FAIL because the web package and demo assets do not exist.

- [ ] **Step 3: Add the minimal web project and generate the demo asset**

Use exact package versions from the plan. Define these scripts in `web/package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:browser": "playwright test"
  },
  "dependencies": { "maplibre-gl": "6.10.0" },
  "devDependencies": {
    "@playwright/test": "1.63.0",
    "@types/node": "22.20.3",
    "jsdom": "26.1.0",
    "typescript": "7.0.2",
    "vite": "8.3.0",
    "vitest": "5.0.1"
  }
}
```

`web/index.html` must contain a skip link, `<main id="app">`, and a no-JavaScript message. `web/src/main.ts` must render a heading, a loading status, and a `data-testid="app-shell"` root. `web/src/styles.css` must define a mobile-first layout, visible `:focus-visible`, and a reduced-motion media query. Generate the five public files with `chronomap-data build-public` and copy the resulting bytes into `web/public/data/synthetic/`; do not copy authoring files directly.

- [ ] **Step 4: Run the scaffold and asset tests to verify they pass**

Run: `cd web && npm test -- public-asset-sync.test.ts` and `npm run build`. Expected: PASS and a `web/dist/` directory.

- [ ] **Step 5: Commit**

```bash
git add .gitignore web
git commit -m "feat: scaffold responsive chronomap web app"
```

### Task 2: Implement public bundle loading and single-year filtering

**Files:**
- Create: `web/src/domain/types.ts`
- Create: `web/src/domain/data-loader.ts`
- Create: `web/src/domain/temporal-filter.ts`
- Create: `web/src/domain/labels.ts`
- Create: `web/tests/temporal-filter.test.ts`
- Create: `web/tests/data-loader.test.ts`

**Interfaces:**
- `loadPublicBundle(baseUrl: string): Promise<PublicBundle>`
- `PublicBundle` contains immutable `dataset`, `entitiesById`, `sourcesById`, `evidenceById`, and `features`.
- `filterFeaturesByYear(features: readonly FeatureVersion[], year: number): readonly FeatureVersion[]`
- `initialYear(dataset: Dataset): number`
- `displayYear(year: number): string`
- `localizedText(values: Readonly<Record<string, string>>, defaultLanguage: string): string`
- `BundleLoadError` exposes `resource` and a user-safe `message` without raw stack text.

- [ ] **Step 1: Write failing pure-domain tests**

Cover inclusive boundary matches, open start/end, no match, astronomical year `0`, initial-year fallback order, default-language fallback, and a malformed HTTP response. The expected filter behavior must include both synthetic line hypotheses at year `-2` and exclude the private polygon.

```ts
it("matches inclusive possible activity and open ends", () => {
  expect(filterFeaturesByYear(features, -2).map((feature) => feature.id)).toEqual([
    "synthetic:version:line-alternative-a",
    "synthetic:version:line-alternative-b"
  ]);
  expect(filterFeaturesByYear(features, 0).map((feature) => feature.id)).toContain("synthetic:version:point-open-boundary");
});

it("formats astronomical years for people", () => {
  expect(displayYear(0)).toBe("1 BCE");
  expect(displayYear(1)).toBe("1 CE");
});
```

- [ ] **Step 2: Run the focused tests to verify RED**

Run: `cd web && npm test -- temporal-filter.test.ts data-loader.test.ts`. Expected: FAIL because the domain modules and exported functions do not exist.

- [ ] **Step 3: Implement immutable types, loader, labels, and filter**

Fetch all five files relative to `baseUrl` with `Promise.all`, require `response.ok`, check the GeoJSON `FeatureCollection` marker, index records by ID, and freeze the returned containers. Filter only public FeatureVersions; the public bundle must already be pruned, but the loader must defensively ignore a feature with `publicationStatus !== "public"`. Implement interval overlap without converting years to floating point: `start.earliestYear ?? -Infinity <= year` and `end.latestYear ?? Infinity >= year`. Treat `null` as an open end. `initialYear` uses `start.latestYear`, then `end.latestYear`, then `0`, and clamps to finite Dataset bounds. Reject malformed payloads with `BundleLoadError`.

- [ ] **Step 4: Run focused tests and the TypeScript checker**

Run: `cd web && npm test -- temporal-filter.test.ts data-loader.test.ts && npx tsc --noEmit`. Expected: PASS with no diagnostics.

- [ ] **Step 5: Commit**

```bash
git add web/src/domain web/tests/temporal-filter.test.ts web/tests/data-loader.test.ts
git commit -m "feat: load public bundles and filter historical years"
```

### Task 3: Build the synchronized list, detail panel, and responsive shell

**Files:**
- Create: `web/src/app/state.ts`
- Create: `web/src/ui/feature-list.ts`
- Create: `web/src/ui/metadata-panel.ts`
- Create: `web/src/ui/ui-shell.ts`
- Modify: `web/src/main.ts`
- Modify: `web/src/styles.css`
- Create: `web/tests/state.test.ts`
- Create: `web/tests/metadata.test.ts`

**Interfaces:**
- `AppState`: `{ status, selectedYear, visibleFeatures, selectedFeatureId, activeMobileTab, error }`
- `reduce(state: AppState, event: AppEvent): AppState`
- `renderFeatureList(container, state, bundle, onSelect): void`
- `renderMetadataPanel(container, selectedFeature, bundle, onClose): void`
- `mountUiShell(root, bundle, dispatch): AppController`
- `AppController` exposes `setMapAdapter(adapter)`, `retry()`, and `destroy()`.

- [ ] **Step 1: Write failing state and metadata tests**

Test initial loading, ready, year changes, selection clearing when a feature leaves the visible set, mobile tab changes, entity/version separation, four uncertainty dimensions, Evidence locator/supports, Source rights, and fixed citation-only notice.

```ts
it("clears a selected feature when the selected year removes it", () => {
  const state = readyState("synthetic:version:point-open-boundary", 0);
  const next = reduce(state, { type: "yearChanged", year: -4 });
  expect(next.selectedFeatureId).toBeNull();
  expect(next.status).toBe("selection-cleared");
});
```

- [ ] **Step 2: Run focused tests to verify RED**

Run: `cd web && npm test -- state.test.ts metadata.test.ts`. Expected: FAIL because state and UI modules do not exist.

- [ ] **Step 3: Implement reducer and UI rendering**

Use events `bundleLoading`, `bundleReady`, `bundleFailed`, `yearChanged`, `featureSelected`, `selectionCleared`, `mobileTabChanged`, `retryStarted`, and `retryFinished`. Sort visible features by Feature ID, group matching `hypothesisGroupId` without ranking, and use `localizedText` for all labels. The list must be a real `<ul>` of buttons with shape, year, and uncertainty text. The detail panel must use headings and sections for Entity, Version, time, uncertainty, Evidence, Source, and rights. Render `role="status"` for loading/no-match and `role="alert"` for failures. Desktop keeps list/detail in a sidebar; mobile exposes `role="tablist"` with `list` and `detail` tabs and a back button.

- [ ] **Step 4: Run focused tests and inspect the static DOM**

Run: `cd web && npm test -- state.test.ts metadata.test.ts && npm run build`. Expected: PASS; built HTML includes the skip link, main landmark, list controls, tabs, and live-region status.

- [ ] **Step 5: Commit**

```bash
git add web/src/app web/src/ui web/src/main.ts web/src/styles.css web/tests/state.test.ts web/tests/metadata.test.ts
git commit -m "feat: add responsive feature list and metadata panel"
```

### Task 4: Add MapLibre and GSI basemap integration

**Files:**
- Create: `web/src/map/map-adapter.ts`
- Create: `web/src/map/map-style.ts`
- Create: `web/tests/map-style.test.ts`
- Modify: `web/src/app/state.ts`
- Modify: `web/src/ui/ui-shell.ts`
- Modify: `web/src/main.ts`
- Modify: `web/src/styles.css`

**Interfaces:**
- `MapAdapter` with `mount(container)`, `setFeatures(features)`, `setSelectedFeature(id)`, `onSelect(handler)`, `onBasemapError(handler)`, and `destroy()`.
- `createGsiStyle(): maplibregl.StyleSpecification`
- `geometryLayerDefinitions(): readonly LayerSpecification[]`

- [ ] **Step 1: Write failing map-boundary tests**

Assert the style contains a GSI raster source with visible attribution, one GeoJSON source, layers for point/line/polygon geometries, and a selected-state visual that does not rely on color alone. Test that `setFeatures` preserves authored coordinate order and that feature click events expose the Feature ID to the controller.

- [ ] **Step 2: Run map tests to verify RED**

Run: `cd web && npm test -- map-style.test.ts`. Expected: FAIL because MapAdapter and style definitions do not exist.

- [ ] **Step 3: Implement the MapLibre boundary**

Import MapLibre only in `map-adapter.ts`. Use a GSI raster source and link the attribution to `https://maps.gsi.go.jp/development/ichiran.html`. Add one GeoJSON source fed by the current visible Feature collection, geometry-specific layers, a selected outline/halo, and non-color differences for hypothesis members (line dash or outline pattern). Wire map clicks through `queryRenderedFeatures` to the controller; when multiple Features overlap, emit all candidate IDs in authored order. Convert map load/error events into the basemap-failure state while leaving the list and metadata controller active.

- [ ] **Step 4: Run focused tests and the production build**

Run: `cd web && npm test -- map-style.test.ts && npm run build`. Expected: PASS and a production bundle with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/map web/src/app/state.ts web/src/ui/ui-shell.ts web/src/main.ts web/src/styles.css web/tests/map-style.test.ts
git commit -m "feat: render historical features with maplibre"
```

### Task 5: Integrate loading/retry, keyboard behavior, browser acceptance tests, and docs

**Files:**
- Modify: `web/src/main.ts`
- Modify: `web/src/app/state.ts`
- Modify: `web/src/ui/ui-shell.ts`
- Modify: `web/src/styles.css`
- Create: `web/playwright.config.ts`
- Create: `web/tests/browser/ui-mvp.spec.ts`
- Modify: `web/README.md`
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- `main.ts` loads `/data/synthetic/`, dispatches loader/map/UI events, and mounts one `AppController`.
- Browser test server command: `cd web && npm run dev -- --host 127.0.0.1`.
- Playwright projects cover Chromium at 390×844 and 1440×900.

- [ ] **Step 1: Write failing browser acceptance tests**

Create tests that open the app, wait for `利用可能`, assert three public synthetic features or hypothesis entries are listed, change the year to `0`, select the open-boundary point from the list, verify Entity/Version/Evidence/Source text, switch mobile tabs, use keyboard-only navigation, and assert private polygon text is absent. Add a route-level test that blocks the GSI tile request and verifies the list remains usable with a basemap-failure alert.

```ts
test("mobile list and detail flow works without private data", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("利用可能");
  await expect(page.getByText("Synthetic Private Polygon")).toHaveCount(0);
  await page.getByLabel("年").fill("0");
  await page.getByRole("button", { name: /Synthetic Open Boundary Point/ }).click();
  await page.getByRole("tab", { name: "詳細" }).click();
  await expect(page.getByRole("heading", { name: /Entity/ })).toBeVisible();
  await expect(page.getByText("Citation-only metadata; no authored source content is reproduced.")).toBeVisible();
});
```

- [ ] **Step 2: Run the browser tests to verify RED**

Run: `cd web && npm run test:browser -- ui-mvp.spec.ts`. Expected: FAIL because main does not yet connect the loader, reducer, UI shell, and MapAdapter.

- [ ] **Step 3: Wire the vertical slice and accessibility behavior**

On startup, dispatch loading, call `loadPublicBundle("/data/synthetic")`, calculate `initialYear`, and pass the bundle to `mountUiShell`. On a load error, render the dataset-failure state and a retry button without a stack trace. Keep the list available when `MapAdapter` reports basemap failure. Make the year field a labeled numeric input with previous/next buttons; add `aria-live` status regions, visible focus, logical tab order, focus return after closing details, and a skip link. Preserve the map viewport on year changes and clear selection with a status announcement when the selected version becomes invisible.

- [ ] **Step 4: Run all web and Python verification**

Run from the repository root:

```bash
cd web && npm test && npm run build && npm run test:browser
cd .. && PYTHONDONTWRITEBYTECODE=1 uv run pytest -q -p no:cacheprovider
```

Expected: all web unit/browser tests pass, the Vite build succeeds, and the existing Python suite remains green.

- [ ] **Step 5: Update docs and verify links/output boundaries**

Add setup, `npm run dev`, `npm run build`, and browser-test instructions to `web/README.md` and link it from the root `README.md`. Document that `/data/synthetic` is a non-historical public demo generated by the Python builder. Ensure generated `web/dist/`, `web/node_modules/`, and browser reports are ignored while demo assets remain tracked. Run relative-link checks across Markdown, `git diff --check`, and a recursive scan proving `synthetic:version:polygon-private`, `Non-historical private feature`, and raw authored citation notes are absent from `web/public/data/synthetic`.

- [ ] **Step 6: Commit**

```bash
git add README.md web .gitignore
git commit -m "feat: connect responsive chronomap UI vertical slice"
```

## Final Acceptance

- `cd web && npm run dev` opens a usable Chronomap UI at desktop and mobile widths.
- The UI reads only the public demo bundle and never exposes the private synthetic polygon.
- A single year change updates the map and text list using inclusive possibility-first semantics.
- A feature can be selected from the list without a map and its Entity, Version, uncertainty, Evidence, Source, and rights are visible.
- Parallel hypotheses remain co-equal and distinguishable without a preferred flag.
- GSI attribution is visible; a basemap failure does not remove list/detail access.
- Loading, no-match, selection-cleared, dataset-failure, and retrying states are announced without stack traces.
- Keyboard operation and mobile list/detail tabs work in browser acceptance tests.
- The web build and the existing Python suite pass from a clean checkout.
