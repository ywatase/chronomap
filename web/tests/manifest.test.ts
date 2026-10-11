import { describe, expect, it } from "vitest";
import { parseManifest } from "../src/domain/manifest";

const valid = {
  schemaVersion: 2,
  tiles: "chronomap.pmtiles",
  sourceLayer: "features",
  openYear: { min: -999999, max: 999999 },
  yearRange: { min: 710, max: 1942 },
  years: [710, 1590, 1942],
  defaultYear: 1590,
  themes: [{ id: "lake", labels: { ja: "湖沼", en: "Lakes" } }],
  rasters: [],
  datasets: [{ slug: "ogurike", id: "ogurike:dataset:pilot-2026", title: { ja: "巨椋池" }, defaultLanguage: "ja", bbox: [135, 34, 136, 35], attribution: "MLIT", minZoom: 4, detailShards: 1, features: 8 }],
};

describe("parseManifest", () => {
  it("accepts a schema version 2 manifest", () => {
    expect(parseManifest(valid).defaultYear).toBe(1590);
  });

  it("rejects other schema versions and malformed fields", () => {
    expect(() => parseManifest({ ...valid, schemaVersion: 1 })).toThrow(/schemaVersion/);
    expect(() => parseManifest({ ...valid, years: "x" })).toThrow(/years/);
    expect(() => parseManifest(null)).toThrow();
  });

  it("falls back to the first recorded year when there is no default", () => {
    expect(parseManifest({ ...valid, defaultYear: null }).defaultYear).toBe(710);
    expect(parseManifest({ ...valid, defaultYear: null, years: [], yearRange: { min: null, max: null } }).defaultYear).toBe(0);
  });
});
