import { describe, expect, it } from "vitest";
import { reduce, type AppState } from "../src/app/state";
import type { FeatureVersion } from "../src/domain/types";

const feature = (id: string, start: number): FeatureVersion => ({
  type: "Feature", id, geometry: { type: "Point", coordinates: [0, 0] },
  properties: {
    entityId: "entity", labels: { en: id }, description: { en: "description" }, publicationStatus: "public",
    temporal: { start: { earliestYear: start, latestYear: start, precision: "year", qualifier: "exact" }, end: null },
    uncertainty: {
      temporal: { assessment: "unknown", note: "", evidenceIds: [] }, location: { assessment: "unknown", note: "", evidenceIds: [] },
      geometry: { assessment: "unknown", note: "", evidenceIds: [] }, identity: { assessment: "unknown", note: "", evidenceIds: [] },
    }, evidenceIds: [], rights: { status: "public-domain" },
  },
});

const readyState = (selectedFeatureId: string | null, selectedYear = 0): AppState => ({
  status: "ready", selectedYear, visibleFeatures: [feature("synthetic:version:point-open-boundary", 0)],
  selectedFeatureId, activeMobileTab: "list", error: null, allFeatures: [feature("synthetic:version:point-open-boundary", 0)],
});

describe("reduce", () => {
  it("moves from loading to ready with visible public features", () => {
    const next = reduce({ ...readyState(null), status: "loading", visibleFeatures: [] }, { type: "bundleReady", features: [feature("one", 0)], year: 0 });
    expect(next.status).toBe("ready");
    expect(next.visibleFeatures.map(({ id }) => id)).toEqual(["one"]);
  });

  it("clears a selected feature when the selected year removes it", () => {
    const next = reduce(readyState("synthetic:version:point-open-boundary", 0), { type: "yearChanged", year: -4 });
    expect(next.selectedFeatureId).toBeNull();
    expect(next.status).toBe("selection-cleared");
  });

  it("selects a visible feature and opens the mobile detail tab", () => {
    const next = reduce(readyState(null), { type: "featureSelected", featureId: "synthetic:version:point-open-boundary" });
    expect(next.selectedFeatureId).toBe("synthetic:version:point-open-boundary");
    expect(next.activeMobileTab).toBe("detail");
  });

  it("records a bundle failure and retry lifecycle without exposing a stack", () => {
    const failed = reduce(readyState(null), { type: "bundleFailed", error: "dataset.json could not be loaded" });
    expect(failed).toMatchObject({ status: "failed", error: "dataset.json could not be loaded" });
    expect(reduce(failed, { type: "retryStarted" }).status).toBe("retrying");
    expect(reduce(failed, { type: "retryFinished" }).status).toBe("loading");
  });

  it("changes the active mobile tab", () => {
    expect(reduce(readyState(null), { type: "mobileTabChanged", tab: "detail" }).activeMobileTab).toBe("detail");
  });

  it("closes a still-visible detail without reporting a temporal selection clear", () => {
    const selected = reduce(readyState(null), { type: "featureSelected", featureId: "synthetic:version:point-open-boundary" });
    expect(reduce(selected, { type: "detailClosed" })).toMatchObject({ status: "ready", selectedFeatureId: null, activeMobileTab: "list" });
  });

  it("retains a basemap error while selection and year state still change normally", () => {
    const unavailable = reduce(readyState("synthetic:version:point-open-boundary", 0), { type: "basemapFailed", error: "Map rendering unavailable" });
    expect(unavailable).toMatchObject({ status: "ready", basemapError: "Map rendering unavailable" });
    expect(reduce(unavailable, { type: "detailClosed" })).toMatchObject({ status: "ready", basemapError: "Map rendering unavailable" });
    expect(reduce(unavailable, { type: "yearChanged", year: -4 })).toMatchObject({ status: "selection-cleared", basemapError: "Map rendering unavailable" });
  });
});
