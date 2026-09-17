// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { ComparisonCandidate } from "../src/domain/comparison-candidates";
import type { FeatureVersion, PublicBundle } from "../src/domain/types";
import { renderComparisonCard } from "../src/ui/comparison-card";

const first: FeatureVersion = {
  type: "Feature", id: "version:first", geometry: { type: "Point", coordinates: [0, 0] },
  properties: {
    entityId: "entity", labels: { en: "River 1590" }, description: { en: "First description" }, publicationStatus: "public",
    temporal: { start: { earliestYear: 1590, latestYear: 1590, precision: "year", qualifier: "exact" }, end: { earliestYear: 1590, latestYear: 1590, precision: "year", qualifier: "exact" } },
    uncertainty: { temporal: { assessment: "approximate", note: "", evidenceIds: [] }, location: { assessment: "unknown", note: "", evidenceIds: [] }, geometry: { assessment: "unknown", note: "", evidenceIds: [] }, identity: { assessment: "unknown", note: "", evidenceIds: [] } }, evidenceIds: [], rights: { status: "public-domain" },
  },
};
const second = { ...first, id: "version:second", properties: { ...first.properties, labels: { en: "River 1596" }, description: { en: "Second description" }, temporal: { start: { earliestYear: 1596, latestYear: 1596, precision: "year" as const, qualifier: "exact" as const }, end: { earliestYear: 1596, latestYear: 1596, precision: "year" as const, qualifier: "exact" as const } } } };
const candidate: ComparisonCandidate = { entityId: "entity", versions: [{ feature: first, year: 1590 }, { feature: second, year: 1596 }] };
const bundle = { dataset: { defaultLanguage: "en" }, entitiesById: { entity: { labels: { en: "River" } } } } as unknown as PublicBundle;

describe("comparison card", () => {
  it("uses the dataset language and exposes an accessible comparison panel", () => {
    const root = document.createElement("div");
    renderComparisonCard(root, candidate, bundle, true, first.id, () => undefined, () => undefined);
    expect(root.querySelector("[data-comparison-cta]")?.textContent).toBe("Compare River snapshots");
    expect(root.querySelector("[data-comparison-cta]")?.getAttribute("aria-controls")).toBe("comparison-panel");
    expect(root.querySelector("[data-comparison-feature-id=\"version:first\"]")?.getAttribute("aria-pressed")).toBe("true");
    expect(root.textContent).toContain("Uncertainty: approximate, unknown, unknown, unknown");
    expect(root.textContent).not.toContain("不確実性");
  });
});
