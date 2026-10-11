import { describe, expect, it } from "vitest";
import { BASE_MAPS, createStyle, HIGHLIGHT_LAYER_IDS, themeLayerIds } from "../src/map/style";
import { yearFilter } from "../src/domain/year-filter";
import type { Manifest } from "../src/domain/manifest";

const manifest: Manifest = {
  tiles: "chronomap.pmtiles",
  sourceLayer: "features",
  yearRange: { min: 710, max: 1942 },
  years: [710, 1942],
  defaultYear: 710,
  themes: [
    { id: "polity", labels: { ja: "国" } },
    { id: "river", labels: { ja: "河川" } },
  ],
  rasters: [
    { id: "swale", dataset: "gsi-history", title: { ja: "明治期の低湿地" }, description: { ja: "" }, date: "1880年代", tileTemplate: "https://example.test/{z}/{x}/{y}.png", attribution: "GSI", bbox: [122, 20, 154, 46], minZoom: 10, maxZoom: 16 },
  ],
  datasets: [
    { slug: "world", id: "world:dataset:x", title: { en: "World" }, defaultLanguage: "en", bbox: [-180, -90, 180, 90], attribution: null, minZoom: 0, detailShards: 1, features: 1 },
    { slug: "ogurike", id: "ogurike:dataset:x", title: { ja: "巨椋池" }, defaultLanguage: "ja", bbox: [135, 34, 136, 35], attribution: null, minZoom: 4, detailShards: 1, features: 1 },
  ],
};

describe("createStyle", () => {
  const style = createStyle(manifest, {
    tilesUrl: "pmtiles://http://localhost/chronomap/chronomap.pmtiles",
    year: 1600,
    hiddenThemes: ["river"],
    rasters: ["swale"],
    base: "pale",
    baseOpacity: 0.8,
    rasterOpacity: 0.6,
  });

  it("puts the year filter on every theme layer", () => {
    const ids = themeLayerIds(manifest);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const layer = style.layers.find((item) => item.id === id);
      expect(JSON.stringify(layer?.filter)).toContain(JSON.stringify(yearFilter(1600)));
    }
  });

  it("hides the layers of hidden themes", () => {
    const river = style.layers.filter((layer) => layer.id.startsWith("theme-river-"));
    expect(river.length).toBeGreaterThan(0);
    expect(river.every((layer) => layer.layout?.visibility === "none")).toBe(true);
    const polity = style.layers.filter((layer) => layer.id.startsWith("theme-polity-"));
    expect(polity.every((layer) => layer.layout?.visibility === "visible")).toBe(true);
  });

  it("adds the selected base map, raster overlays, and the vector source", () => {
    expect(style.sources.base).toMatchObject({ type: "raster", tiles: [BASE_MAPS.pale.tiles] });
    expect(style.sources["raster-swale"]).toMatchObject({ type: "raster", minzoom: 10, maxzoom: 16 });
    expect(style.layers.find((layer) => layer.id === "raster-swale")?.layout?.visibility).toBe("visible");
    expect(style.sources.chronomap).toMatchObject({ type: "vector", url: "pmtiles://http://localhost/chronomap/chronomap.pmtiles" });
  });

  it("draws highlight layers last", () => {
    expect(style.layers.slice(-HIGHLIGHT_LAYER_IDS.length).map((layer) => layer.id)).toEqual([...HIGHLIGHT_LAYER_IDS]);
  });
});

describe("world-scale datasets", () => {
  const style = createStyle(manifest, { tilesUrl: "pmtiles://x", year: 1600, hiddenThemes: [], rasters: [], base: "pale", baseOpacity: 1, rasterOpacity: 0.7 });

  it("fade their polygons out when zooming into a region", () => {
    const fill = style.layers.find((layer) => layer.id === "theme-polity-fill");
    expect(fill?.paint?.["fill-opacity"]).toEqual(["interpolate", ["linear"], ["zoom"], 4, 0.12, 7, ["case", ["in", ["get", "dataset"], ["literal", ["world"]]], 0, 0.12]]);
  });

  it("drop their labels from zoom 7", () => {
    expect(JSON.stringify(style.layers.find((layer) => layer.id === "labels")?.filter)).toContain('["<",["zoom"],7]');
  });
});
