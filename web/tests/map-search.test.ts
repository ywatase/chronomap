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
  it("filters visible features and selects a result from the map toolbar", () => {
    const selected: string[] = [];
    const search = createMapSearch(uiCopy("en"), bundle, (featureId) => selected.push(featureId));
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
});
