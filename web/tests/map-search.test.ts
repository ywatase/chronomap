// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { FeatureVersion, PublicBundle } from "../src/domain/types";
import { uiCopy } from "../src/ui/copy";
import { createMapSearch } from "../src/ui/map-search";

const feature = (id: string, label: string, coordinates: readonly [number, number]): FeatureVersion => ({
  type: "Feature",
  id,
  geometry: { type: "Point", coordinates },
  properties: {
    entityId: id,
    labels: { en: label },
    description: { en: `${label} description` },
    publicationStatus: "public",
    temporal: { start: null, end: null },
    uncertainty: {
      temporal: { assessment: "unknown", note: "", evidenceIds: [] },
      location: { assessment: "unknown", note: "", evidenceIds: [] },
      geometry: { assessment: "unknown", note: "", evidenceIds: [] },
      identity: { assessment: "unknown", note: "", evidenceIds: [] },
    },
    evidenceIds: [],
    rights: { status: "public-domain" },
  },
});

const river = feature("river", "Uji River", [135.8, 34.9]);
const pond = feature("pond", "Ogurike", [135.75, 34.9]);
const bundle = {
  dataset: { defaultLanguage: "en" },
  entitiesById: {},
  features: [river, pond],
} as unknown as PublicBundle;

describe("map search", () => {
  it("does not place every feature in the hidden result tree before a query", () => {
    const search = createMapSearch(uiCopy("en"), bundle, () => undefined);

    expect(search.element.querySelectorAll("[data-map-feature-result]")).toHaveLength(0);
    expect(search.element.querySelector("#map-feature-search-results")?.hasAttribute("hidden")).toBe(true);
  });

  it("filters visible features and selects a result from the map toolbar", () => {
    const selected: string[] = [];
    const search = createMapSearch(uiCopy("en"), bundle, (entry) => selected.push(entry.feature.id));
    document.body.append(search.element);
    search.setFeatures([river]);

    const input = search.element.querySelector<HTMLInputElement>("[data-map-feature-search]")!;
    input.value = "oguri";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(search.element.querySelectorAll("[data-map-feature-result]")).toHaveLength(1);
    expect(search.element.querySelector("[data-map-feature-result]")?.textContent).toContain("Ogurike");
    (search.element.querySelector("[data-map-feature-result]") as HTMLButtonElement).click();
    expect(selected).toEqual(["pond"]);
  });

  it("adds delayed cross-region candidates with an explicit region label", () => {
    const foreign = feature("foreign", "Watanabe port", [135.5, 34.7]);
    const foreignBundle = { ...bundle, dataset: { defaultLanguage: "en", id: "osaka:dataset:pilot" }, features: [foreign] } as unknown as PublicBundle;
    const selected: string[] = [];
    const search = createMapSearch(uiCopy("en"), bundle, (entry) => selected.push(`${entry.datasetSlug}:${entry.feature.id}`));
    search.setExternalEntries([{ datasetSlug: "osaka", region: "Osaka City", bundle: foreignBundle, feature: foreign }]);
    document.body.append(search.element);

    const input = search.element.querySelector<HTMLInputElement>("[data-map-feature-search]")!;
    input.value = "watanabe";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    const result = search.element.querySelector<HTMLButtonElement>("[data-map-feature-result]")!;
    expect(result.textContent).toContain("Osaka City");
    expect(result.dataset.mapDataset).toBe("osaka");
    result.click();
    expect(selected).toEqual(["osaka:foreign"]);
  });

  it("announces a delayed regional index without hiding the local map", () => {
    const search = createMapSearch(uiCopy("en"), bundle, () => undefined);
    search.setSearchLoading(true);
    expect(search.element.querySelector(".map-search-count")?.textContent).toContain("Loading recorded regions");
    search.setSearchLoading(false);
    expect(search.element.querySelector(".map-search-count")?.textContent).toBe("");
  });
});
