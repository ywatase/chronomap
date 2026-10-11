import type { Manifest } from "../domain/manifest";
import { yearFilter } from "../domain/year-filter";

export interface LayerSpec {
  readonly id: string;
  readonly type: "background" | "raster" | "fill" | "line" | "circle" | "symbol";
  readonly source?: string;
  readonly "source-layer"?: string;
  readonly filter?: unknown;
  readonly minzoom?: number;
  readonly layout?: Record<string, unknown>;
  readonly paint?: Record<string, unknown>;
}

export interface StyleSpec {
  readonly version: 8;
  readonly glyphs: string;
  readonly sources: Record<string, Record<string, unknown>>;
  readonly layers: LayerSpec[];
}

export interface StyleOptions {
  readonly tilesUrl: string;
  readonly year: number;
  readonly hiddenThemes: readonly string[];
  readonly rasters: readonly string[];
  readonly base: BaseMapId;
  readonly baseOpacity: number;
  readonly rasterOpacity: number;
}

const GSI_ATTRIBUTION = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院</a>';

export const BASE_MAPS = {
  pale: { label: "淡色地図", tiles: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", maxzoom: 18 },
  std: { label: "標準地図", tiles: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", maxzoom: 18 },
  photo: { label: "写真", tiles: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg", maxzoom: 18 },
} as const;
export type BaseMapId = keyof typeof BASE_MAPS;

/** Fixed theme colours; polity and sphere fills use the per-entity `hue` palette instead. */
export const THEME_COLORS: Readonly<Record<string, string>> = {
  coast: "#1d6fa5",
  lake: "#2f8fd8",
  river: "#1f5fbf",
  polity: "#7a5c2e",
  sphere: "#9d3b6b",
  castle: "#b3261e",
  battlefield: "#d9480f",
  settlement: "#6d4c41",
  route: "#8a6d00",
  other: "#6b3fa0",
};

export const HUE_PALETTE = ["#d95f02", "#1b9e77", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#1f78b4", "#b15928", "#e31a1c", "#6a3d9a", "#33a02c"];

/** Painting order from bottom to top. */
const THEME_ORDER = ["polity", "sphere", "coast", "lake", "other", "river", "route", "settlement", "castle", "battlefield"];
export const HIGHLIGHT_LAYER_IDS = ["highlight-fill", "highlight-line", "highlight-point"] as const;
const SOURCE = "chronomap";

const polygons = ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]];
const lines = ["in", ["geometry-type"], ["literal", ["LineString", "MultiLineString"]]];
const points = ["in", ["geometry-type"], ["literal", ["Point", "MultiPoint"]]];
const hueColor = ["match", ["get", "hue"], ...HUE_PALETTE.flatMap((color, index) => [index, color]), "#888888"];

function orderedThemes(manifest: Manifest): string[] {
  const ids = manifest.themes.map((theme) => theme.id);
  return [...THEME_ORDER.filter((id) => ids.includes(id)), ...ids.filter((id) => !THEME_ORDER.includes(id))];
}

/** Datasets drawn for the whole world (minZoom 0) fade out as the map zooms into a region. */
const WORLD_FADE = { from: 4, to: 7 };

function worldScale(manifest: Manifest): unknown {
  return ["in", ["get", "dataset"], ["literal", manifest.datasets.filter((dataset) => dataset.minZoom === 0).map((dataset) => dataset.slug)]];
}

function fading(manifest: Manifest, opacity: number): unknown {
  const world = worldScale(manifest);
  return ["interpolate", ["linear"], ["zoom"], WORLD_FADE.from, opacity, WORLD_FADE.to, ["case", world, 0, opacity]];
}

function themeLayers(theme: string, manifest: Manifest, year: number, visible: boolean): LayerSpec[] {
  const color = THEME_COLORS[theme] ?? "#555555";
  const filled = theme === "polity" || theme === "sphere" ? hueColor : color;
  const base = { source: SOURCE, "source-layer": manifest.sourceLayer, layout: { visibility: visible ? "visible" : "none" } };
  const where = (geometry: unknown) => ["all", ["==", ["get", "theme"], theme], geometry, yearFilter(year)];
  const fillOpacity = theme === "polity" ? 0.12 : theme === "sphere" ? 0.22 : 0.35;
  return [
    { id: `theme-${theme}-fill`, type: "fill", ...base, filter: where(polygons), paint: { "fill-color": filled, "fill-opacity": fading(manifest, fillOpacity) } },
    {
      id: `theme-${theme}-outline`, type: "line", ...base, filter: where(polygons),
      paint: { "line-color": filled, "line-width": theme === "polity" ? 1.2 : 1, "line-opacity": fading(manifest, 0.9), ...(theme === "sphere" ? { "line-dasharray": [2, 1] } : {}) },
    },
    {
      id: `theme-${theme}-line`, type: "line", ...base, filter: where(lines),
      layout: { ...base.layout, "line-cap": "round", "line-join": "round" },
      paint: { "line-color": color, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.5, 12, 4], ...(theme === "route" ? { "line-dasharray": [2, 1.5] } : {}) },
    },
    {
      id: `theme-${theme}-point`, type: "circle", ...base, filter: where(points),
      paint: {
        "circle-color": color,
        "circle-radius": theme === "settlement" ? ["interpolate", ["linear"], ["zoom"], 8, 2, 14, 5] : ["interpolate", ["linear"], ["zoom"], 4, 4, 12, 7],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": theme === "settlement" ? 0.6 : 1.5,
      },
    },
  ];
}

function labelLayer(manifest: Manifest, year: number, hiddenThemes: readonly string[]): LayerSpec {
  const shown = manifest.themes.map((theme) => theme.id).filter((id) => !hiddenThemes.includes(id));
  return {
    id: "labels",
    type: "symbol",
    source: SOURCE,
    "source-layer": manifest.sourceLayer,
    filter: [
      "all",
      ["in", ["get", "theme"], ["literal", shown]],
      yearFilter(year),
      ["any", ["!=", ["get", "theme"], "settlement"], [">=", ["zoom"], 12]],
      ["any", ["!", worldScale(manifest)], ["<", ["zoom"], WORLD_FADE.to]],
    ],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Open Sans Semibold"],
      "text-size": ["match", ["get", "theme"], ["polity", "sphere"], 13, 12],
      "text-max-width": 8,
      "text-optional": true,
      "symbol-sort-key": ["match", ["get", "theme"], "polity", 0, "sphere", 1, 2],
    },
    paint: { "text-color": "#1f2933", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
  };
}

const HIGHLIGHT_GEOMETRY: Readonly<Record<(typeof HIGHLIGHT_LAYER_IDS)[number], unknown>> = {
  "highlight-fill": polygons,
  "highlight-line": ["any", polygons, lines],
  "highlight-point": points,
};

/** Filter for a highlight layer: the selected FeatureVersion, restricted to that layer's geometry. */
export function highlightFilter(layerId: (typeof HIGHLIGHT_LAYER_IDS)[number], featureVersionId: string | null): unknown {
  return ["all", HIGHLIGHT_GEOMETRY[layerId], ["==", ["get", "feature_version_id"], featureVersionId ?? ""]];
}

export function createStyle(manifest: Manifest, options: StyleOptions): StyleSpec {
  const base = BASE_MAPS[options.base];
  const sources: StyleSpec["sources"] = {
    base: { type: "raster", tiles: [base.tiles], tileSize: 256, maxzoom: base.maxzoom, attribution: GSI_ATTRIBUTION },
    [SOURCE]: { type: "vector", url: options.tilesUrl },
  };
  const layers: LayerSpec[] = [
    { id: "background", type: "background", paint: { "background-color": "#f4f1ea" } },
    { id: "base", type: "raster", source: "base", paint: { "raster-opacity": options.baseOpacity } },
  ];
  for (const raster of manifest.rasters) {
    sources[`raster-${raster.id}`] = {
      type: "raster",
      tiles: [raster.tileTemplate],
      tileSize: 256,
      minzoom: raster.minZoom,
      maxzoom: raster.maxZoom,
      bounds: raster.bbox,
      attribution: raster.attribution,
    };
    layers.push({
      id: `raster-${raster.id}`,
      type: "raster",
      source: `raster-${raster.id}`,
      layout: { visibility: options.rasters.includes(raster.id) ? "visible" : "none" },
      paint: { "raster-opacity": options.rasterOpacity },
    });
  }
  for (const theme of orderedThemes(manifest)) {
    layers.push(...themeLayers(theme, manifest, options.year, !options.hiddenThemes.includes(theme)));
  }
  layers.push(labelLayer(manifest, options.year, options.hiddenThemes));
  const highlight = { source: SOURCE, "source-layer": manifest.sourceLayer };
  layers.push(
    { id: "highlight-fill", type: "fill", ...highlight, filter: highlightFilter("highlight-fill", null), paint: { "fill-color": "#fde047", "fill-opacity": 0.25 } },
    { id: "highlight-line", type: "line", ...highlight, filter: highlightFilter("highlight-line", null), paint: { "line-color": "#111827", "line-width": 3 } },
    { id: "highlight-point", type: "circle", ...highlight, filter: highlightFilter("highlight-point", null), paint: { "circle-radius": 10, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#111827", "circle-stroke-width": 3 } },
  );
  return { version: 8, glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf", sources, layers };
}

/** Layer ids that carry the year filter, in painting order. */
export function themeLayerIds(manifest: Manifest): string[] {
  return orderedThemes(manifest).flatMap((theme) => ["fill", "outline", "line", "point"].map((kind) => `theme-${theme}-${kind}`));
}

/** Layer ids whose features can be clicked. */
export function interactiveLayerIds(manifest: Manifest): string[] {
  return themeLayerIds(manifest);
}
