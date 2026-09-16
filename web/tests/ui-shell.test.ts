// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountUiShell, type MapAdapterLike } from "../src/ui/ui-shell";
import type { PublicBundle } from "../src/domain/types";

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
    const feature = root.querySelector<HTMLButtonElement>(".feature-choice")!;
    feature.click();
    expect(root.querySelector("h3")?.textContent).toBe("Entity");
    root.remove();
  });
});
