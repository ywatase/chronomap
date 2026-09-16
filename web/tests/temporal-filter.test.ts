import { describe, expect, it } from "vitest";
import { displayYear, initialYear, localizedText } from "../src/domain/labels";
import { filterFeaturesByYear } from "../src/domain/temporal-filter";
import type { Dataset, FeatureVersion } from "../src/domain/types";

const features: readonly FeatureVersion[] = [
  {
    type: "Feature",
    id: "synthetic:version:line-alternative-a",
    geometry: { type: "LineString", coordinates: [[-2, -2], [2, 2]] },
    properties: {
      publicationStatus: "public",
      temporal: {
        start: { earliestYear: -4, latestYear: -3 },
        end: { earliestYear: 2, latestYear: 3 },
      },
    },
  },
  {
    type: "Feature",
    id: "synthetic:version:line-alternative-b",
    geometry: { type: "LineString", coordinates: [[-2, 2], [2, -2]] },
    properties: {
      publicationStatus: "public",
      temporal: {
        start: { earliestYear: -3, latestYear: -2 },
        end: { earliestYear: 1, latestYear: 2 },
      },
    },
  },
  {
    type: "Feature",
    id: "synthetic:version:point-open-boundary",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: {
      publicationStatus: "public",
      temporal: { start: { earliestYear: 0, latestYear: 0 }, end: null },
    },
  },
  {
    type: "Feature",
    id: "synthetic:version:private-polygon",
    geometry: { type: "Polygon", coordinates: [] },
    properties: {
      publicationStatus: "private",
      temporal: { start: null, end: { earliestYear: 999999999999999, latestYear: 999999999999999 } },
    },
  },
];

const dataset = (temporalExtent: Dataset["temporalExtent"]): Dataset => ({
  temporalExtent,
});

describe("filterFeaturesByYear", () => {
  it("matches inclusive possible activity and open ends", () => {
    expect(filterFeaturesByYear(features, -2).map((feature) => feature.id)).toEqual([
      "synthetic:version:line-alternative-a",
      "synthetic:version:line-alternative-b",
    ]);
    expect(filterFeaturesByYear(features, 0).map((feature) => feature.id)).toContain(
      "synthetic:version:point-open-boundary",
    );
  });

  it("excludes private features and non-matching intervals", () => {
    expect(filterFeaturesByYear(features, -5)).toEqual([]);
    expect(filterFeaturesByYear(features, 999999999999999).map((feature) => feature.id)).toEqual([
      "synthetic:version:point-open-boundary",
    ]);
  });
});

describe("temporal labels", () => {
  it("formats astronomical years for people", () => {
    expect(displayYear(-1)).toBe("2 BCE");
    expect(displayYear(0)).toBe("1 BCE");
    expect(displayYear(1)).toBe("1 CE");
  });

  it("chooses the end of a known start before the end boundary and clamps to bounds", () => {
    expect(initialYear(dataset({ start: { earliestYear: -10, latestYear: 5 }, end: { earliestYear: 6, latestYear: 8 } }))).toBe(5);
    expect(initialYear(dataset({ start: null, end: { earliestYear: -2, latestYear: 7 } }))).toBe(7);
    expect(initialYear(dataset({ start: { earliestYear: null, latestYear: null }, end: null }))).toBe(0);
    expect(initialYear(dataset({ start: { earliestYear: -5, latestYear: 100 }, end: { earliestYear: 4, latestYear: 4 } }))).toBe(4);
  });

  it("uses the default language then a deterministic available translation", () => {
    expect(localizedText({ ja: "日本語", en: "English" }, "en")).toBe("English");
    expect(localizedText({ ja: "日本語", fr: "Français" }, "en")).toBe("Français");
  });
});
