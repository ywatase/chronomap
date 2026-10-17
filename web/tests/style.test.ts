import { describe, expect, it } from "vitest";
import { BASE_MAPS, coastFillColor, createStyle, HIGHLIGHT_LAYER_IDS, layersOfTheme, seaColor, THEME_COLORS, themeLayerIds, yearDependentFilters } from "../src/map/style";
import { referenceFilter, yearFilter } from "../src/domain/year-filter";
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
    { id: "lake", labels: { ja: "湖沼" } },
    { id: "coast", labels: { ja: "海岸線・海域" } },
  ],
  rasters: [
    { id: "swale", dataset: "gsi-history", title: { ja: "明治期の低湿地" }, description: { ja: "" }, date: "1880年代", tileTemplate: "https://example.test/{z}/{x}/{y}.png", attribution: "GSI", bbox: [122, 20, 154, 46], minZoom: 10, maxZoom: 16 },
  ],
  datasets: [
    { slug: "world", id: "world:dataset:x", title: { en: "World" }, defaultLanguage: "en", bbox: [-180, -90, 180, 90], attribution: null, minZoom: 0, maxZoom: 6, detailShards: 1, features: 1 },
    { slug: "ogurike", id: "ogurike:dataset:x", title: { ja: "巨椋池" }, defaultLanguage: "ja", bbox: [135, 34, 136, 35], attribution: null, minZoom: 4, maxZoom: 12, detailShards: 1, features: 1 },
    { slug: "edo-coast", id: "edo-coast:dataset:x", title: { ja: "江戸末期の海岸線" }, defaultLanguage: "ja", bbox: [122, 20, 154, 46], attribution: null, minZoom: 4, maxZoom: 12, seaMask: true, detailShards: 1, features: 1 },
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
    const sea = ["in", ["get", "dataset"], ["literal", ["edo-coast"]]];
    expect(fill?.paint?.["fill-opacity"]).toEqual(["interpolate", ["linear"], ["zoom"], 4, ["case", sea, 1, 0.12], 7, ["case", ["in", ["get", "dataset"], ["literal", ["world"]]], 0, sea, 1, 0.12]]);
  });

  it("drop their labels from zoom 7", () => {
    expect(JSON.stringify(style.layers.find((layer) => layer.id === "labels")?.filter)).toContain('["<",["zoom"],7]');
  });
});

describe("labels", () => {
  it("show dense themes only within their zoom windows", () => {
    const style = createStyle(manifest, { tilesUrl: "pmtiles://x", year: 1600, hiddenThemes: [], rasters: [], base: "pale", baseOpacity: 1, rasterOpacity: 0.7 });
    const filter = JSON.stringify(style.layers.find((layer) => layer.id === "labels")?.filter);
    expect(filter).toContain('["all",["==",["get","theme"],"settlement"],[">=",["zoom"],12],["<",["zoom"],24]]');
    expect(filter).toContain('["all",["==",["get","theme"],"sphere"],[">=",["zoom"],0],["<",["zoom"],10]]');
    expect(filter).toContain('["all",["==",["get","theme"],"artificial"],[">=",["zoom"],24],["<",["zoom"],24]]');
  });
});

describe("reference layers", () => {
  const style = createStyle(manifest, { tilesUrl: "pmtiles://x", year: 1200, hiddenThemes: ["river"], rasters: [], base: "pale", baseOpacity: 1, rasterOpacity: 0.7 });

  it("draw natural themes before their first record, below the normal layers", () => {
    const ids = style.layers.map((layer) => layer.id);
    expect(ids).toContain("ref-lake-fill");
    expect(ids.indexOf("ref-lake-line")).toBeLessThan(ids.indexOf("theme-polity-fill"));
    expect(JSON.stringify(style.layers.find((layer) => layer.id === "ref-lake-fill")?.filter)).toContain(JSON.stringify(referenceFilter(1200)));
    expect(ids).not.toContain("ref-polity-fill");
  });

  it("follow the theme visibility", () => {
    expect(style.layers.find((layer) => layer.id === "ref-river-line")?.layout?.visibility).toBe("none");
    expect(layersOfTheme("river")).toContain("ref-river-line");
  });

  it("are part of the year-dependent filters", () => {
    const filters = yearDependentFilters(manifest, 900, []);
    expect(JSON.stringify(filters["ref-lake-line"])).toContain(JSON.stringify(referenceFilter(900)));
    expect(JSON.stringify(filters["theme-polity-fill"])).toContain(JSON.stringify(yearFilter(900)));
    expect(filters.labels).toBeDefined();
  });
});

describe("sea mask", () => {
  it("paints sea-mask datasets in the base map's sea colour, blended by the base opacity", () => {
    expect(seaColor("pale", 1)).toBe("#bed2ff");
    expect(seaColor("pale", 0)).toBe("#f4f1ea");
    expect(seaColor("photo", 1)).toBe("#10142f");
    const style = createStyle(manifest, { tilesUrl: "pmtiles://x", year: 1850, hiddenThemes: [], rasters: [], base: "std", baseOpacity: 1, rasterOpacity: 0.7 });
    const fill = style.layers.find((layer) => layer.id === "theme-coast-fill");
    expect(fill?.paint?.["fill-color"]).toEqual(["case", ["in", ["get", "dataset"], ["literal", ["edo-coast"]]], "#bed2ff", THEME_COLORS.coast]);
    expect(coastFillColor(manifest, "photo", 1)).toEqual(["case", ["in", ["get", "dataset"], ["literal", ["edo-coast"]]], "#10142f", THEME_COLORS.coast]);
  });

  it("does not label the period's sea", () => {
    const style = createStyle(manifest, { tilesUrl: "pmtiles://x", year: 1850, hiddenThemes: [], rasters: [], base: "pale", baseOpacity: 1, rasterOpacity: 0.7 });
    expect(JSON.stringify(style.layers.find((layer) => layer.id === "labels")?.filter)).toContain('["!",["in",["get","dataset"],["literal",["edo-coast"]]]]');
  });

  it("keeps the sea opaque in the reference display too", () => {
    const style = createStyle(manifest, { tilesUrl: "pmtiles://x", year: 1500, hiddenThemes: [], rasters: [], base: "pale", baseOpacity: 1, rasterOpacity: 0.7 });
    expect(style.layers.find((layer) => layer.id === "ref-coast-fill")?.paint?.["fill-opacity"]).toEqual(["case", ["in", ["get", "dataset"], ["literal", ["edo-coast"]]], 1, 0.12]);
  });
});
