// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { mountUiShell, type MapAdapterLike } from "../src/ui/ui-shell";
import type { PublicBundle } from "../src/domain/types";
import type { Lesson } from "../src/domain/lesson";

const bundle = { dataset: { id: "dataset", schemaVersion: "1.0.0", title: { en: "Dataset" }, description: { en: "Description" }, defaultLanguage: "en", bbox: [0, 0, 1, 1], temporalExtent: { start: { earliestYear: 0, latestYear: 0, precision: "year", qualifier: "exact" }, end: null }, rights: { status: "public-domain" }, files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" } }, entitiesById: { entity: { id: "entity", type: "place", labels: { en: "Entity" }, description: { en: "Entity description" } } }, sourcesById: {}, evidenceById: {}, features: [{ type: "Feature", id: "feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: { entityId: "entity", labels: { en: "Feature" }, description: { en: "Feature description" }, publicationStatus: "public", temporal: { start: { earliestYear: 0, latestYear: 0, precision: "year", qualifier: "exact" }, end: null }, uncertainty: { temporal: { assessment: "unknown", note: "", evidenceIds: [] }, location: { assessment: "unknown", note: "", evidenceIds: [] }, geometry: { assessment: "unknown", note: "", evidenceIds: [] }, identity: { assessment: "unknown", note: "", evidenceIds: [] } }, evidenceIds: [], rights: { status: "public-domain" } } }] } as unknown as PublicBundle;

describe("ui shell", () => {
  it("mounts an adapter into a stable map host and retains its live status element", () => {
    const root = document.createElement("main"); const controller = mountUiShell(root, bundle, () => undefined);
    const host = root.querySelector<HTMLElement>("[data-map-host]")!; const live = root.querySelector("[role=status]")!;
    const adapter: MapAdapterLike = { mount: (element) => element.append("map canvas"), setFeatures: () => undefined, setSelectedFeature: () => undefined };
    controller.setMapAdapter(adapter);
    root.querySelector<HTMLButtonElement>(".feature-choice")!.click();
    expect(root.querySelector("[data-map-host]")).toBe(host);
    expect(root.querySelector("[role=status]")).toBe(live);
    expect(host.textContent).toContain("map canvas");
  });

  it("passes the dataset bbox to an adapter for the initial viewport", () => {
    const root = document.createElement("div");
    const controller = mountUiShell(root, bundle, () => undefined);
    let viewport: readonly number[] | undefined;
    controller.setMapAdapter({
      mount: () => undefined,
      setFeatures: () => undefined,
      setSelectedFeature: () => undefined,
      setViewport: (bbox) => { viewport = bbox; },
    });
    expect(viewport).toEqual([0, 0, 1, 1]);
  });

  it("restores and switches a validated historical map asset through the shared view", () => {
    const first = {
      id: "dataset:historical-map:first",
      title: { en: "First context" },
      description: { en: "First context" },
      tileTemplate: "https://tiles.example.invalid/first/{z}/{x}/{y}.png",
      bbox: [0, 0, 1, 1] as const,
      date: "1928",
      accessedDate: "2026-10-04",
      georeference: { method: "provider", error: "not evaluated" },
      sourceUrl: "https://example.invalid/first",
      attribution: "Example",
      rights: { status: "open-license" as const },
      minZoom: 13,
      maxZoom: 18,
    };
    const second = { ...first, id: "dataset:historical-map:second", title: { en: "Second context" }, tileTemplate: "https://tiles.example.invalid/second/{z}/{x}/{y}.png" };
    const assetBundle = { ...bundle, dataset: { ...bundle.dataset, historicalMapAssets: [first, second] } } as PublicBundle;
    window.history.replaceState(null, "", "/?dataset=dataset&mapAsset=dataset%3Ahistorical-map%3Asecond");
    const root = document.createElement("div"); document.body.append(root);
    const controller = mountUiShell(root, assetBundle, () => undefined);
    let mounted: string | undefined;
    let switched: string | undefined;
    controller.setMapAdapter({
      mount: (_container, asset) => { mounted = asset?.id; },
      setFeatures: () => undefined,
      setSelectedFeature: () => undefined,
      setHistoricalMapAsset: (asset) => { switched = asset?.id; },
    });
    expect(mounted).toBe(second.id);
    const select = root.querySelector<HTMLSelectElement>("#historical-map-asset-select")!;
    select.value = first.id;
    select.dispatchEvent(new Event("change"));
    expect(switched).toBe(first.id);
    expect(new URLSearchParams(window.location.search).get("mapAsset")).toBe(first.id);
    controller.destroy(); root.remove(); window.history.replaceState(null, "", "/");
  });

  it("searches a later public snapshot, changes the year, and focuses its geometry", () => {
    const later = {
      ...bundle.features[0]!,
      id: "later",
      geometry: { type: "Polygon", coordinates: [[[0.2, 0.2], [0.4, 0.2], [0.4, 0.4], [0.2, 0.2]]] },
      properties: {
        ...bundle.features[0]!.properties,
        labels: { en: "Later place" },
        temporal: { start: { earliestYear: 10, latestYear: 10, precision: "year", qualifier: "exact" }, end: { earliestYear: 10, latestYear: 10, precision: "year", qualifier: "exact" } },
      },
    };
    const snapshotBundle = { ...bundle, features: [...bundle.features, later] } as PublicBundle;
    const root = document.createElement("div"); document.body.append(root);
    const controller = mountUiShell(root, snapshotBundle, () => undefined);
    let focused: string | undefined;
    controller.setMapAdapter({ mount: () => undefined, setFeatures: () => undefined, setSelectedFeature: () => undefined, focusFeature: (feature) => { focused = feature.id; } });
    const search = root.querySelector<HTMLInputElement>("[data-map-feature-search]")!;
    search.value = "later place";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-map-feature-result][data-map-feature-id="later"]')!.click();
    expect(root.querySelector<HTMLInputElement>("#selected-year")?.value).toBe("10");
    expect(root.querySelector("h3")?.textContent).toBe("Entity");
    expect(focused).toBe("later");
    controller.destroy(); root.remove();
    window.history.replaceState(null, "", "/");
  });

  it("lets the viewer overlay the previous authored snapshot without replacing the current features", () => {
    const snapshotBase = structuredClone(bundle) as PublicBundle;
    const snapshotBundle = {
      ...snapshotBase,
      dataset: { ...snapshotBase.dataset, defaultLanguage: "ja" },
      features: [
        { ...snapshotBase.features[0]!, id: "current", properties: { ...snapshotBase.features[0]!.properties, labels: { ja: "現在" }, temporal: { start: { earliestYear: 0, latestYear: 0, precision: "year", qualifier: "exact" }, end: null } } },
        { ...snapshotBase.features[0]!, id: "previous", properties: { ...snapshotBase.features[0]!.properties, labels: { ja: "前の時点" }, temporal: { start: { earliestYear: -1, latestYear: -1, precision: "year", qualifier: "exact" }, end: null } } },
      ],
    } as PublicBundle;
    const root = document.createElement("div");
    const controller = mountUiShell(root, snapshotBundle, () => undefined);
    let comparison: readonly unknown[] = [];
    const adapter = {
      mount: () => undefined,
      setFeatures: () => undefined,
      setSelectedFeature: () => undefined,
      setComparisonFeatures: (features) => { comparison = features; },
    } as MapAdapterLike & { setComparisonFeatures: (features: readonly unknown[]) => void };
    controller.setMapAdapter(adapter);

    const toggle = root.querySelector<HTMLButtonElement>("[data-temporal-compare]")!;
    expect(toggle.disabled).toBe(false);
    toggle.click();

    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(comparison.map((feature: any) => feature.id)).toEqual(["previous"]);
    controller.destroy();
  });

  it("uses the provided neutral root for one header, main, and footer landmark", () => {
    const root = document.createElement("div"); mountUiShell(root, bundle, () => undefined);
    expect(root.querySelectorAll("header")).toHaveLength(1);
    expect(root.querySelectorAll("main#chronomap-main")).toHaveLength(1);
    expect(root.querySelectorAll("footer")).toHaveLength(1);
    expect(root.querySelectorAll("main main")).toHaveLength(0);
  });

  it("moves a map-candidate selection to details and restores focus to that candidate", () => {
    const second = structuredClone(bundle) as PublicBundle; (second.features as any).push({ ...second.features[0], id: "second", properties: { ...second.features[0]!.properties, labels: { en: "Second" } } });
    const root = document.createElement("div"); document.body.append(root); const controller = mountUiShell(root, second, () => undefined);
    let select: ((ids: readonly string[]) => void) | undefined;
    controller.setMapAdapter({ mount: () => undefined, setFeatures: () => undefined, setSelectedFeature: () => undefined, onSelect: (handler) => { select = handler; } });
    select?.(["feature", "second"]);
    const candidate = root.querySelector<HTMLButtonElement>('[data-map-candidate-id="second"]')!; candidate.click();
    expect(document.activeElement).toBe(root.querySelector("#tab-detail"));
    root.querySelector<HTMLButtonElement>(".detail-panel button")!.click();
    expect(document.activeElement).toBe(root.querySelector('[data-map-candidate-id="second"]'));
    root.remove();
  });

  it("keeps the text list and detail path available when map startup throws", () => {
    const root = document.createElement("div"); document.body.append(root);
    const controller = mountUiShell(root, bundle, () => undefined);
    controller.setMapAdapter({ mount: () => { throw new Error("WebGL unavailable"); }, setFeatures: () => undefined, setSelectedFeature: () => undefined });
    expect(root.querySelector('[role="alert"]')?.textContent).toMatch(/Basemap or map rendering could not start/);
    expect(root.querySelector<HTMLButtonElement>("[data-basemap-retry]")?.hidden).toBe(true);
    const feature = root.querySelector<HTMLButtonElement>(".feature-choice")!;
    feature.click();
    expect(root.querySelector("h3")?.textContent).toBe("Entity");
    root.remove();
  });

  it("retries only the failed basemap while preserving the selected detail", () => {
    const root = document.createElement("div"); document.body.append(root);
    const controller = mountUiShell(root, bundle, () => undefined);
    let reportError: ((message: string) => void) | undefined;
    let retries = 0;
    controller.setMapAdapter({
      mount: () => undefined,
      setFeatures: () => undefined,
      setSelectedFeature: () => undefined,
      onBasemapError: (handler) => { reportError = handler; },
      retry: () => { retries += 1; },
    });
    root.querySelector<HTMLButtonElement>(".feature-choice")!.click();
    reportError?.("GSI tiles unavailable");

    const retry = root.querySelector<HTMLButtonElement>("[data-basemap-retry]")!;
    expect(retry.hidden).toBe(false);
    retry.click();

    expect(retries).toBe(1);
    expect(root.querySelector("[role=alert]")?.hasAttribute("hidden")).toBe(true);
    expect(root.querySelector("h3")?.textContent).toBe("Entity");
    root.remove();
  });

  it("keeps the basemap error visible when its retry throws", () => {
    const root = document.createElement("div");
    const controller = mountUiShell(root, bundle, () => undefined);
    let reportError: ((message: string) => void) | undefined;
    controller.setMapAdapter({
      mount: () => undefined,
      setFeatures: () => undefined,
      setSelectedFeature: () => undefined,
      onBasemapError: (handler) => { reportError = handler; },
      retry: () => { throw new Error("WebGL still unavailable"); },
    });
    reportError?.("GSI tiles unavailable");

    root.querySelector<HTMLButtonElement>("[data-basemap-retry]")!.click();

    const alert = root.querySelector<HTMLElement>("[role=alert]")!;
    expect(alert.hidden).toBe(false);
    expect(alert.textContent).toContain("could not restart");
  });

  it("keeps a historical-map asset failure non-blocking", () => {
    const root = document.createElement("div");
    const controller = mountUiShell(root, bundle, () => undefined);
    let reportAssetError: ((message: string) => void) | undefined;
    controller.setMapAdapter({
      mount: () => undefined,
      setFeatures: () => undefined,
      setSelectedFeature: () => undefined,
      onHistoricalMapAssetError: (handler) => { reportAssetError = handler; },
    });
    reportAssetError?.("historical tile unavailable");

    expect(root.querySelector<HTMLElement>(".historical-map-asset-alert")?.textContent).toContain("historical tile unavailable");
    expect(root.querySelector<HTMLButtonElement>("[data-basemap-retry]")?.hidden).toBe(true);
    expect(root.querySelector(".feature-choice")).toBeTruthy();
  });

  it("opens the catalog, syncs view=catalog, and restores focus on close", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    window.history.replaceState(null, "", "/?dataset=ogurike");
    const controller = mountUiShell(root, bundle, () => undefined, null, async () => ({
      ogurike: { bundle, lesson: null },
      tonegawa: { bundle: null, lesson: null },
      heijokyo: { bundle: null, lesson: null },
    }));
    const trigger = root.querySelector<HTMLButtonElement>("[data-dataset-catalog-open]")!;
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const dialog = root.querySelector<HTMLElement>("[data-dataset-catalog-dialog]")!;
    expect(dialog.hidden).toBe(false);
    expect(dialog.querySelectorAll("[data-dataset-catalog-card]")).toHaveLength(7);
    expect(new URLSearchParams(window.location.search).get("view")).toBe("catalog");
    dialog.querySelector<HTMLButtonElement>("[data-dataset-catalog-close]")!.click();
    expect(dialog.hidden).toBe(true);
    expect(new URLSearchParams(window.location.search).get("view")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    controller.destroy();
    window.history.replaceState(null, "", "/");
    root.remove();
  });

  it("opens the classroom builder from an allow-listed direct URL and previews edited values", async () => {
    const lesson: Lesson = {
      id: "intro",
      dataset: "dataset",
      title: { en: "Demo lesson" },
      description: { en: "A lesson" },
      durationMinutes: 10,
      steps: [{ id: "first", year: 0, featureId: "feature", prompt: { en: "Observe this" } }],
    };
    const root = document.createElement("div");
    document.body.append(root);
    window.history.replaceState(null, "", "/?dataset=dataset&lesson=intro&view=builder");
    const controller = mountUiShell(root, bundle, () => undefined, lesson);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const builder = root.querySelector<HTMLElement>("[data-lesson-pack-builder]")!;
    expect(builder.hidden).toBe(false);
    root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")!.value = "Edited lesson";
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-builder-preview]")!.click();
    const pack = root.querySelector<HTMLElement>("[data-lesson-pack-dialog]")!;
    expect(pack.hidden).toBe(false);
    expect(pack.textContent).toContain("Edited lesson");
    expect(pack.textContent).toContain("Observe this");
    expect(new URLSearchParams(window.location.search).get("view")).toBe("builder");
    pack.querySelector<HTMLButtonElement>("[data-lesson-pack-back]")!.click();
    expect(builder.hidden).toBe(false);
    controller.destroy();
    window.history.replaceState(null, "", "/");
    root.remove();
  });

  it("opens a matching lesson pack from an allow-listed view=pack URL and clears it on close", async () => {
    const lesson: Lesson = {
      id: "intro",
      dataset: "dataset",
      title: { en: "Demo lesson" },
      description: { en: "A lesson" },
      durationMinutes: 10,
      steps: [{ id: "first", year: 0, featureId: "feature", prompt: { en: "Observe this" } }],
    };
    const root = document.createElement("div");
    document.body.append(root);
    window.history.replaceState(null, "", "/?dataset=dataset&lesson=intro&view=pack");
    const controller = mountUiShell(root, bundle, () => undefined, lesson);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const pack = root.querySelector<HTMLElement>("[data-lesson-pack-dialog]")!;
    expect(pack.hidden).toBe(false);
    expect(pack.querySelector("[data-lesson-pack-qr]")).toBeTruthy();
    expect(new URLSearchParams(window.location.search).get("view")).toBe("pack");
    expect(new URLSearchParams(window.location.search).get("lesson")).toBe("intro");
    pack.querySelector<HTMLButtonElement>("[data-lesson-pack-close]")!.click();
    expect(pack.hidden).toBe(true);
    expect(new URLSearchParams(window.location.search).get("view")).toBeNull();
    controller.destroy();
    window.history.replaceState(null, "", "/");
    root.remove();
  });

  it("renders the root welcome as a flow region rather than a modal dialog", async () => {
    const lesson: Lesson = {
      id: "intro",
      dataset: "dataset",
      title: { en: "Demo lesson" },
      description: { en: "A lesson" },
      durationMinutes: 10,
      steps: [{ id: "first", year: 0, featureId: "feature", prompt: { en: "Observe this" } }],
    };
    const root = document.createElement("div");
    document.body.append(root);
    window.history.replaceState(null, "", "/");
    const controller = mountUiShell(root, bundle, () => undefined, lesson, async () => ({
      ogurike: { bundle, lesson },
      tonegawa: { bundle: null, lesson: null },
      heijokyo: { bundle: null, lesson: null },
    }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.querySelector<HTMLButtonElement>("aside[data-root-quickstart] [data-root-quickstart-secondary]")!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const catalog = root.querySelector<HTMLElement>("[data-dataset-catalog-dialog]")!;
    expect(catalog.getAttribute("role")).toBe("region");
    expect(catalog.hasAttribute("aria-modal")).toBe(false);
    expect(catalog.querySelector("[data-dataset-catalog-welcome] h3")?.getAttribute("aria-hidden")).toBe("true");
    expect(catalog.querySelector("[data-dataset-catalog-card] h3")?.getAttribute("aria-hidden")).toBe("true");
    controller.destroy();
    window.history.replaceState(null, "", "/");
    root.remove();
  });

  it("keeps the root hub visible and reports an invalid local draft without URL state", async () => {
    const lesson: Lesson = {
      id: "intro",
      dataset: "dataset",
      title: { en: "Demo lesson" },
      description: { en: "A lesson" },
      durationMinutes: 10,
      steps: [{ id: "first", year: 0, featureId: "feature", prompt: { en: "Observe this" } }],
    };
    const root = document.createElement("div");
    document.body.append(root);
    window.history.replaceState(null, "", "/");
    const onResumeDraft = vi.fn(async () => false);
    const controller = mountUiShell(root, bundle, () => undefined, lesson, async () => ({
      ogurike: { bundle, lesson: null },
      tonegawa: { bundle: null, lesson: null },
      heijokyo: { bundle: null, lesson: null },
    }), { onResumeDraft });
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.querySelector<HTMLButtonElement>("aside[data-root-quickstart] [data-root-quickstart-secondary]")!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const catalog = root.querySelector<HTMLElement>("[data-dataset-catalog-dialog]")!;
    const input = catalog.querySelector<HTMLInputElement>("[data-dataset-catalog-purpose-draft-file]")!;
    const file = new File(["invalid"], "invalid.json", { type: "application/json" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onResumeDraft).toHaveBeenCalledWith(file);
    expect(catalog.hidden).toBe(false);
    expect(catalog.querySelector("[data-dataset-catalog-purpose-status]")?.textContent).toContain("Could not load this draft");
    expect(window.location.search).not.toContain("invalid");
    controller.destroy();
    window.history.replaceState(null, "", "/");
    root.remove();
  });

  it("opens the builder from an in-memory resume input without rendering the root hub", async () => {
    const lesson: Lesson = {
      id: "intro",
      dataset: "dataset",
      title: { en: "Demo lesson" },
      description: { en: "A lesson" },
      durationMinutes: 10,
      steps: [{ id: "first", year: 0, featureId: "feature", prompt: { en: "Observe this" } }],
    };
    const root = document.createElement("div");
    document.body.append(root);
    window.history.replaceState(null, "", "/");
    const controller = mountUiShell(root, bundle, () => undefined, lesson, null, {
      initialBuilderOpen: true,
      initialBuilderInput: { title: "Resumed lesson", selectedStepIds: ["first"], promptsByStepId: { first: "Resumed prompt" }, includeTeacher: false },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root.querySelector<HTMLElement>("[data-dataset-catalog-dialog]")).toBeNull();
    expect(root.querySelector<HTMLElement>("[data-lesson-pack-builder]")?.hidden).toBe(false);
    expect(root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")?.value).toBe("Resumed lesson");
    expect(root.querySelector<HTMLTextAreaElement>("[data-lesson-pack-prompt]")?.value).toBe("Resumed prompt");
    expect(root.querySelector<HTMLInputElement>("[data-lesson-pack-include-teacher]")?.checked).toBe(false);
    expect(window.location.search).not.toContain("Resumed");
    controller.destroy();
    window.history.replaceState(null, "", "/");
    root.remove();
  });

  it("keeps feedback hidden until print is invoked, then returns focus to the callout", async () => {
    const lesson: Lesson = {
      id: "intro",
      dataset: "dataset",
      title: { en: "Demo lesson" },
      description: { en: "A lesson" },
      durationMinutes: 10,
      steps: [{ id: "first", year: 0, featureId: "feature", prompt: { en: "Observe this" } }],
    };
    const root = document.createElement("div");
    document.body.append(root);
    window.history.replaceState(null, "", "/?dataset=dataset&lesson=intro&view=builder");
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const controller = mountUiShell(root, bundle, () => undefined, lesson);
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-builder-preview]")!.click();
    const pack = root.querySelector<HTMLElement>("[data-lesson-pack-dialog]")!;
    const host = pack.querySelector<HTMLElement>("[data-lesson-pack-feedback-host]")!;
    expect(host.hidden).toBe(true);
    pack.querySelector<HTMLButtonElement>("[data-lesson-pack-print]")!.click();
    expect(print).toHaveBeenCalledOnce();
    expect(host.hidden).toBe(false);
    expect(document.activeElement).toBe(host.querySelector("[data-lesson-pack-completion]"));
    print.mockRestore();
    controller.destroy();
    window.history.replaceState(null, "", "/");
    root.remove();
  });

  it("sets and clears the strict print scope for each lesson-pack print action", async () => {
    const lesson: Lesson = {
      id: "intro",
      dataset: "dataset",
      title: { en: "Demo lesson" },
      description: { en: "A lesson" },
      durationMinutes: 10,
      steps: [{ id: "first", year: 0, featureId: "feature", prompt: { en: "Observe this" } }],
    };
    const root = document.createElement("div");
    document.body.append(root);
    window.history.replaceState(null, "", "/?dataset=dataset&lesson=intro&view=builder");
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const controller = mountUiShell(root, bundle, () => undefined, lesson);
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-builder-preview]")!.click();
    const pack = root.querySelector<HTMLElement>("[data-lesson-pack-dialog]")!;
    for (const scope of ["student", "teacher", "full"] as const) {
      pack.querySelector<HTMLButtonElement>(`[data-lesson-pack-print-${scope}]`)!.click();
      expect(document.body.dataset.printDocument).toBe("lesson-pack");
      expect(document.body.dataset.lessonPackPrintScope).toBe(scope);
      window.dispatchEvent(new Event("afterprint"));
      expect(document.body.dataset.printDocument).toBeUndefined();
      expect(document.body.dataset.lessonPackPrintScope).toBeUndefined();
    }
    expect(print).toHaveBeenCalledTimes(3);
    print.mockRestore();
    controller.destroy();
    window.history.replaceState(null, "", "/");
    root.remove();
  });

  it("clears print scope on the timeout fallback when afterprint is unavailable", async () => {
    vi.useFakeTimers();
    try {
      const lesson: Lesson = {
        id: "intro",
        dataset: "dataset",
        title: { en: "Demo lesson" },
        description: { en: "A lesson" },
        durationMinutes: 10,
        steps: [{ id: "first", year: 0, featureId: "feature", prompt: { en: "Observe this" } }],
      };
      const root = document.createElement("div");
      document.body.append(root);
      window.history.replaceState(null, "", "/?dataset=dataset&lesson=intro&view=builder");
      const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
      const controller = mountUiShell(root, bundle, () => undefined, lesson);
      await Promise.resolve();
      root.querySelector<HTMLButtonElement>("[data-lesson-pack-builder-preview]")!.click();
      root.querySelector<HTMLButtonElement>("[data-lesson-pack-print-student]")!.click();
      expect(document.body.dataset.lessonPackPrintScope).toBe("student");
      vi.advanceTimersByTime(1500);
      expect(document.body.dataset.printDocument).toBeUndefined();
      expect(document.body.dataset.lessonPackPrintScope).toBeUndefined();
      print.mockRestore();
      controller.destroy();
      window.history.replaceState(null, "", "/");
      root.remove();
    } finally {
      vi.useRealTimers();
    }
  });
});
