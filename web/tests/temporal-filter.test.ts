import { describe, expect, it } from "vitest";
import { displayYear, initialYear, localizedText, recordedYears } from "../src/domain/labels";
import { filterFeaturesByYear } from "../src/domain/temporal-filter";
import type { Dataset, FeatureVersion } from "../src/domain/types";

const assessment = { assessment: "well-supported", note: "", evidenceIds: ["synthetic:evidence:one"] } as const;
const rights = { status: "public-domain" } as const;

const feature = (id: string, temporal: FeatureVersion["properties"]["temporal"], publicationStatus: "public" | "private", geometry: FeatureVersion["geometry"] = { type: "Point", coordinates: [0, 0] }): FeatureVersion => ({
  type: "Feature",
  id,
  geometry,
  properties: {
    entityId: "synthetic:entity:one",
    labels: { en: "Feature" },
    description: { en: "Feature description" },
    temporal,
    uncertainty: { temporal: assessment, location: assessment, geometry: assessment, identity: assessment },
    evidenceIds: ["synthetic:evidence:one"],
    publicationStatus,
    rights,
  },
});

const features: readonly FeatureVersion[] = [
  feature("synthetic:version:line-alternative-a", { start: { earliestYear: -4, latestYear: -3, precision: "year", qualifier: "circa" }, end: { earliestYear: 2, latestYear: 3, precision: "year", qualifier: "circa" } }, "public", { type: "LineString", coordinates: [[-2, -2], [2, 2]] }),
  feature("synthetic:version:line-alternative-b", { start: { earliestYear: -3, latestYear: -2, precision: "year", qualifier: "circa" }, end: { earliestYear: 1, latestYear: 2, precision: "year", qualifier: "circa" } }, "public", { type: "LineString", coordinates: [[-2, 2], [2, -2]] }),
  feature("synthetic:version:point-open-boundary", { start: { earliestYear: 0, latestYear: 0, precision: "year", qualifier: "exact" }, end: null }, "public"),
  feature("synthetic:version:private-polygon", { start: null, end: { earliestYear: 999999999999999, latestYear: 999999999999999, precision: "year", qualifier: "exact" } }, "private", { type: "Polygon", coordinates: [] }),
];

const dataset = (temporalExtent: Dataset["temporalExtent"]): Dataset => ({
  id: "synthetic:dataset:sample",
  schemaVersion: "1.0.0",
  title: { en: "Sample" },
  description: { en: "Sample" },
  defaultLanguage: "en",
  bbox: [-1, -1, 1, 1],
  temporalExtent,
  rights,
  files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" },
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

  it("matches a public feature with an open start", () => {
    const openStart = feature("synthetic:version:open-start", { start: null, end: { earliestYear: -10, latestYear: -10, precision: "year", qualifier: "exact" } }, "public");
    expect(filterFeaturesByYear([openStart], -999999999999999).map((feature) => feature.id)).toEqual([
      "synthetic:version:open-start",
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
    expect(initialYear(dataset({ start: { earliestYear: -10, latestYear: 5, precision: "year", qualifier: "exact" }, end: { earliestYear: 6, latestYear: 8, precision: "year", qualifier: "exact" } }))).toBe(5);
    expect(initialYear(dataset({ start: null, end: { earliestYear: -2, latestYear: 7, precision: "year", qualifier: "exact" } }))).toBe(7);
    expect(initialYear(dataset({ start: null, end: { earliestYear: 0, latestYear: null, precision: "year", qualifier: "after" } }))).toBe(0);
    expect(initialYear(dataset({ start: { earliestYear: -5, latestYear: 100, precision: "year", qualifier: "exact" }, end: { earliestYear: 4, latestYear: 4, precision: "year", qualifier: "exact" } }))).toBe(4);
  });

  it("uses the default language then a deterministic available translation", () => {
    expect(localizedText({ ja: "日本語", en: "English" }, "en")).toBe("English");
    expect(localizedText({ ja: "日本語", fr: "Français" }, "en")).toBe("Français");
  });

  it("collects public authored snapshot years without inventing empty years", () => {
    expect(recordedYears(features)).toEqual([-4, -3, -2, 0, 1, 2, 3]);
  });
});
