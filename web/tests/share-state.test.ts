import { describe, expect, it } from "vitest";
import { parseSharedState, sharedQuery } from "../src/domain/share-state";

describe("shareable map state", () => {
  it("parses a year and feature id from a shared query", () => {
    expect(parseSharedState("?dataset=ogurike&year=1910&feature=ogurike%3Aversion%3Awaterbody-1910&lng=135.75&lat=34.89&z=11.5")).toEqual({
      dataset: "ogurike",
      year: 1910,
      featureId: "ogurike:version:waterbody-1910",
      longitude: 135.75,
      latitude: 34.89,
      zoom: 11.5,
    });
  });

  it("restores a guided lesson step alongside the map state", () => {
    expect(parseSharedState("?dataset=ogurike&lesson=ogurike-intro&step=uji-1596&year=1596")).toEqual({
      dataset: "ogurike",
      lessonId: "ogurike-intro",
      lessonStepId: "uji-1596",
      year: 1596,
    });
  });

  it("ignores malformed years and empty feature ids", () => {
    expect(parseSharedState("?year=not-a-year&feature=")).toEqual({});
    expect(parseSharedState("?year=1910.5&feature=feature")).toEqual({ featureId: "feature" });
  });

  it("rejects unsafe dataset slugs and out-of-range camera values", () => {
    expect(parseSharedState("?dataset=../private&lng=181&lat=-91&z=25")).toEqual({});
    expect(parseSharedState("?lat=90&z=24")).toEqual({});
  });

  it("parses and serializes allow-listed catalog, pack, and builder views without accepting arbitrary view names", () => {
    expect(parseSharedState("?dataset=tonegawa&view=catalog")).toEqual({ dataset: "tonegawa", view: "catalog" });
    expect(parseSharedState("?dataset=ogurike&lesson=ogurike-intro&view=pack")).toEqual({ dataset: "ogurike", lessonId: "ogurike-intro", view: "pack" });
    expect(parseSharedState("?dataset=tonegawa&lesson=tonegawa-eastward&view=builder")).toEqual({ dataset: "tonegawa", lessonId: "tonegawa-eastward", view: "builder" });
    expect(parseSharedState("?view=admin")).toEqual({});
    expect(sharedQuery({ dataset: "tonegawa", view: "catalog", year: 1654, featureId: null })).toBe("?dataset=tonegawa&view=catalog&year=1654");
    expect(sharedQuery({ dataset: "ogurike", view: "pack", lessonId: "ogurike-intro", year: 1590, featureId: null })).toBe("?dataset=ogurike&view=pack&lesson=ogurike-intro&year=1590");
    expect(sharedQuery({ dataset: "tonegawa", view: "builder", lessonId: "tonegawa-eastward", year: 1654, featureId: null })).toBe("?dataset=tonegawa&view=builder&lesson=tonegawa-eastward&year=1654");
    expect(sharedQuery({ dataset: "tonegawa", view: null, year: 1654, featureId: null })).toBe("?dataset=tonegawa&year=1654");
  });

  it("serializes only the stable share parameters", () => {
    expect(sharedQuery({ dataset: "ogurike", year: 1596, featureId: "ogurike:version:ujigawa-1596", longitude: 135.750004, latitude: 34.890006, zoom: 11.504 })).toBe("?dataset=ogurike&year=1596&feature=ogurike%3Aversion%3Aujigawa-1596&lng=135.75&lat=34.89001&z=11.5");
    expect(sharedQuery({ year: null, featureId: null })).toBe("");
    expect(sharedQuery({ dataset: "ogurike", lessonId: "ogurike-intro", lessonStepId: "uji-1596", year: 1596, featureId: "ogurike:version:ujigawa-1596" })).toBe("?dataset=ogurike&lesson=ogurike-intro&step=uji-1596&year=1596&feature=ogurike%3Aversion%3Aujigawa-1596");
  });
});
