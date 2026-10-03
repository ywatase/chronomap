// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderFeatureList } from "../src/ui/feature-list";
import { renderMetadataPanel } from "../src/ui/metadata-panel";
import type { AppState } from "../src/app/state";
import type { PublicBundle } from "../src/domain/types";
import { entityTypeLabel } from "../src/ui/copy";

const feature = {
  type: "Feature", id: "version:b", geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
  properties: {
    entityId: "entity:one", labels: { en: "Version label" }, description: { en: "Version description" }, publicationStatus: "public",
    hypothesisGroupId: "hypothesis:one", hypothesisLabel: { en: "Alternative B" },
    temporal: { start: { earliestYear: -1, latestYear: -1, precision: "year", qualifier: "circa" }, end: { earliestYear: 4, latestYear: 5, precision: "decade", qualifier: "after" } },
    uncertainty: Object.fromEntries(["temporal", "location", "geometry", "identity"].map((key) => [key, { assessment: "approximate", note: `${key} note`, evidenceIds: ["evidence:one"] }])),
    evidenceIds: ["evidence:one"], rights: { status: "permission", terms: "Version terms" },
  },
} as unknown as PublicBundle["features"][number];

const bundle: PublicBundle = {
  dataset: { id: "dataset:one", schemaVersion: "1.0.0", title: { en: "Dataset" }, description: { en: "Dataset description" }, defaultLanguage: "en", bbox: [0, 0, 1, 1], temporalExtent: { start: null, end: null }, rights: { status: "public-domain", terms: "Dataset terms" }, files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" } },
  entitiesById: { "entity:one": { id: "entity:one", type: "route", labels: { en: "Entity label" }, description: { en: "Entity description" } } },
  evidenceById: { "evidence:one": { id: "evidence:one", sourceId: "source:one", locator: "folio 12", usage: "citation", supports: ["temporal", "location"], note: "Citation-only metadata; no authored source content is reproduced." } },
  sourcesById: { "source:one": { id: "source:one", type: "reference", citation: "Restricted citation", title: { en: "Restricted source" }, creators: ["Author"], publishedYear: 1900, url: "https://example.invalid/source", accessedDate: "2026-09-16", rights: { status: "restricted", terms: "Citation only" } } },
  features: [feature],
};
const state: AppState = { status: "ready", selectedYear: -1, visibleFeatures: [feature], selectedFeatureId: null, activeMobileTab: "list", error: null, allFeatures: [feature] };

describe("metadata and list rendering", () => {
  it("labels political entity types in Japanese and English without implying certainty", () => {
    expect(entityTypeLabel("boundary", "ja")).toBe("境界");
    expect(entityTypeLabel("polity", "en")).toBe("Polity");
    expect(entityTypeLabel("sphere-of-influence", "ja")).toBe("勢力圏");

    const territoryBundle = {
      ...bundle,
      dataset: { ...bundle.dataset, defaultLanguage: "ja" },
      entitiesById: { "entity:one": { ...bundle.entitiesById["entity:one"]!, type: "sphere-of-influence", labels: { ja: "勢力範囲A" }, description: { ja: "史料に基づく概略範囲です。" } } },
    } as PublicBundle;
    const container = document.createElement("div");
    renderMetadataPanel(container, feature, territoryBundle, () => undefined);

    expect(container.textContent).toContain("勢力範囲A（勢力圏）");
    expect(container.textContent).toContain("形状: 概略・近似");
  });

  it("separates entity/version metadata and renders uncertainty, evidence, source rights, and citation-only notice", () => {
    const container = document.createElement("div");
    renderMetadataPanel(container, feature, bundle, () => undefined);
    expect(container.textContent).toContain("Entity label");
    expect(container.textContent).toContain("Version label");
    for (const dimension of ["temporal", "location", "geometry", "identity"]) expect(container.textContent).toContain(dimension);
    expect(container.textContent).toContain("folio 12");
    expect(container.textContent).toContain("Restricted citation");
    expect(container.textContent).toContain("Citation-only metadata; no authored source content is reproduced.");
    expect(container.textContent).toContain("Version terms");
    expect(container.textContent).toContain("Dataset terms");
    expect(container.textContent).toContain("circa");
    expect(container.textContent).toContain("5 CE");
    expect(container.querySelector('a[href="#source-source:one"]')?.textContent).toContain("Restricted citation");
    expect(container.querySelector<HTMLElement>("#source-source\\:one")).not.toBeNull();
    expect(container.querySelector('a[href="https://example.invalid/source"]')?.getAttribute("target")).toBe("_blank");
  });

  it("renders a semantic selectable list with shape, year, uncertainty, and unranked hypothesis labels", () => {
    const container = document.createElement("div");
    renderFeatureList(container, state, bundle, () => undefined);
    expect(container.querySelector("[data-feature-list-search]")).not.toBeNull();
    expect(container.querySelector("ul button")?.textContent).toContain("LineString");
    expect(container.querySelector("ul button")?.textContent).toContain("Entity label");
    expect(container.querySelector("ul button")?.textContent).toContain("2 BCE");
    expect(container.textContent).toContain("Alternative B");
    expect(container.textContent).toContain("No preferred hypothesis");
  });

  it("renders an unsafe source URL as text instead of a navigable link", () => {
    const unsafeBundle: PublicBundle = {
      ...bundle,
      sourcesById: {
        ...bundle.sourcesById,
        "source:one": { ...bundle.sourcesById["source:one"]!, url: "javascript:alert(document.domain)" },
      },
    };
    const container = document.createElement("div");

    renderMetadataPanel(container, feature, unsafeBundle, () => undefined);

    expect(container.textContent).toContain("javascript:alert(document.domain)");
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it("filters the visible list by localized feature metadata without changing the bundle", () => {
    const second = {
      ...feature,
      id: "version:a",
      properties: { ...feature.properties, labels: { en: "Other river" }, description: { en: "Another description" } },
    } as typeof feature;
    const searchableBundle = { ...bundle, features: [feature, second] } as PublicBundle;
    const searchableState = { ...state, visibleFeatures: [feature, second], allFeatures: [feature, second] };
    const container = document.createElement("div");

    renderFeatureList(container, searchableState, searchableBundle, () => undefined, { query: "other" });

    expect(container.querySelectorAll("[data-feature-id]")).toHaveLength(1);
    expect(container.querySelector("[data-feature-id]")?.getAttribute("data-feature-id")).toBe("version:a");
    expect(container.textContent).toContain("1 of 2 features");
    renderFeatureList(container, searchableState, searchableBundle, () => undefined, { query: "missing" });
    expect(container.querySelector("[role=status]")?.textContent).toContain("No visible features match");
    expect(searchableBundle.features).toHaveLength(2);
  });
});
