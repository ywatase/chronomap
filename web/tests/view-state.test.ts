import { describe, expect, it } from "vitest";
import { formatHash, parseHash, type ViewState } from "../src/domain/view-state";

const defaults: ViewState = { zoom: 5, lat: 36.5, lng: 137.5, year: 1867, hiddenThemes: [], rasters: [] };
const limits = { yearRange: { min: -1000, max: 2020 }, themes: ["polity", "river", "route"], rasters: ["swale", "ort_USA10"] };

describe("view state hash", () => {
  it("round-trips a full state", () => {
    const state: ViewState = { zoom: 11.25, lat: 34.9, lng: 135.77, year: -500, hiddenThemes: ["route"], rasters: ["swale"] };
    const hash = formatHash(state);
    expect(hash).toBe("#11.25/34.9/135.77/-500?off=route&raster=swale");
    expect(parseHash(hash, defaults, limits)).toEqual(state);
  });

  it("omits empty options", () => {
    expect(formatHash(defaults)).toBe("#5/36.5/137.5/1867");
  });

  it("falls back to defaults for missing or invalid parts", () => {
    expect(parseHash("", defaults, limits)).toEqual(defaults);
    expect(parseHash("#abc/1/2/3", defaults, limits)).toEqual(defaults);
    expect(parseHash("#30/100/500/99999", defaults, limits)).toEqual(defaults);
    expect(parseHash("#6/35/135", defaults, limits)).toEqual({ ...defaults, zoom: 6, lat: 35, lng: 135 });
  });

  it("drops unknown themes and rasters", () => {
    expect(parseHash("#5/36.5/137.5/1867?off=route,nope&raster=x,ort_USA10", defaults, limits)).toEqual({
      ...defaults,
      hiddenThemes: ["route"],
      rasters: ["ort_USA10"],
    });
  });

  it("rounds coordinates to keep URLs short", () => {
    expect(formatHash({ ...defaults, zoom: 5.123456, lat: 36.1234567, lng: 137.9876543 })).toBe("#5.12/36.12346/137.98765/1867");
  });
});
