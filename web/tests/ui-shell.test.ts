// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
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
    expect(dialog.querySelectorAll("[data-dataset-catalog-card]")).toHaveLength(3);
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
});
