import { describe, expect, it } from "vitest";
import { comparisonCandidates } from "../src/domain/comparison-candidates";
import type { FeatureVersion } from "../src/domain/types";

function feature(id: string, entityId: string, year: number, publicationStatus: "public" | "private" = "public"): FeatureVersion { return { type: "Feature", id, geometry: { type: "Point", coordinates: [0, 0] }, properties: { entityId, labels: { ja: id }, description: { ja: id }, publicationStatus, temporal: { start: { earliestYear: year, latestYear: year, precision: "year", qualifier: "exact" }, end: { earliestYear: year, latestYear: year, precision: "year", qualifier: "exact" } }, uncertainty: { temporal: { assessment: "unknown", note: "", evidenceIds: [] }, location: { assessment: "unknown", note: "", evidenceIds: [] }, geometry: { assessment: "unknown", note: "", evidenceIds: [] }, identity: { assessment: "unknown", note: "", evidenceIds: [] } }, evidenceIds: [], rights: { status: "public-domain" } } }; }

function openVersion(id: string, entityId: string, year: number): FeatureVersion {
  const value = feature(id, entityId, year);
  return { ...value, properties: { ...value.properties, temporal: { start: value.properties.temporal.start, end: null } } };
}

describe("comparison candidates", () => {
  it("groups public single-year snapshots by entity and sorts them chronologically", () => {
    const candidates = comparisonCandidates([feature("late", "uji", 1596), feature("early", "uji", 1590), feature("private", "uji", 1592, "private"), openVersion("open", "uji", 1600), feature("single", "lake", 1910), feature("other", "other", 1590)]);
    expect(candidates).toHaveLength(1); expect(candidates[0]!.entityId).toBe("uji"); expect(candidates[0]!.versions.map((version) => version.year)).toEqual([1590, 1596]);
  });
});
