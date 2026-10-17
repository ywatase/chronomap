import type { Manifest } from "../domain/manifest";
import { referenceFilter, yearFilter } from "../domain/year-filter";

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

/** `sea` is the base map's own sea colour, sampled from GSI tiles, so the period's sea blends in. */
export const BASE_MAPS = {
  pale: { label: "淡色地図", tiles: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", maxzoom: 18, sea: "#bed2ff" },
  std: { label: "標準地図", tiles: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", maxzoom: 18, sea: "#bed2ff" },
  photo: { label: "写真", tiles: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg", maxzoom: 18, sea: "#10142f" },
} as const;
const BACKGROUND = "#f4f1ea";

/** The base map's sea as it appears over the background at the given base opacity. */
export function seaColor(base: BaseMapId, baseOpacity: number): string {
  const channel = (hex: string, index: number) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
  const mixed = [0, 1, 2].map((index) => Math.round(channel(BASE_MAPS[base].sea, index) * baseOpacity + channel(BACKGROUND, index) * (1 - baseOpacity)));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function seaMasked(manifest: Manifest): unknown {
  return ["in", ["get", "dataset"], ["literal", manifest.datasets.filter((dataset) => dataset.seaMask).map((dataset) => dataset.slug)]];
}

/** Fill colour of the coast theme: sea-mask datasets take the base map's sea colour. */
export function coastFillColor(manifest: Manifest, base: BaseMapId, baseOpacity: number): unknown {
  return ["case", seaMasked(manifest), seaColor(base, baseOpacity), THEME_COLORS.coast];
}
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
  artificial: "#e07b39",
  other: "#6b3fa0",
};

export const HUE_PALETTE = ["#d95f02", "#1b9e77", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#1f78b4", "#b15928", "#e31a1c", "#6a3d9a", "#33a02c"];

/** Painting order from bottom to top. */
const THEME_ORDER = ["polity", "sphere", "artificial", "coast", "lake", "other", "river", "route", "settlement", "castle", "battlefield"];
/** Natural themes whose earliest version is drawn as a dashed reference before its first record. */
export const REFERENCE_THEMES = ["coast", "lake", "river"] as const;
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

/** Opacity that fades world-scale datasets out with zoom; sea-mask datasets are always opaque (or hidden). */
function fading(manifest: Manifest, opacity: number, seaMaskOpacity = 1): unknown {
  const world = worldScale(manifest);
  const sea = seaMasked(manifest);
  return [
    "interpolate", ["linear"], ["zoom"],
    WORLD_FADE.from, ["case", sea, seaMaskOpacity, opacity],
    WORLD_FADE.to, ["case", world, 0, sea, seaMaskOpacity, opacity],
  ];
}

const GEOMETRY_BY_KIND: Readonly<Record<string, unknown>> = { fill: polygons, outline: polygons, line: lines, point: points };

function themeFilter(theme: string, kind: string, year: number): unknown {
  return ["all", ["==", ["get", "theme"], theme], GEOMETRY_BY_KIND[kind], yearFilter(year)];
}

function referenceLayerFilter(theme: string, kind: "fill" | "line", year: number): unknown {
  return ["all", ["==", ["get", "theme"], theme], kind === "fill" ? polygons : ["any", polygons, lines], referenceFilter(year)];
}

function referenceLayers(theme: string, manifest: Manifest, year: number, visible: boolean, options: StyleOptions): LayerSpec[] {
  const color = THEME_COLORS[theme] ?? "#555555";
  const fill = theme === "coast" ? coastFillColor(manifest, options.base, options.baseOpacity) : color;
  const sea = seaMasked(manifest);
  const base = { source: SOURCE, "source-layer": manifest.sourceLayer, layout: { visibility: visible ? "visible" : "none" } };
  return [
    { id: `ref-${theme}-fill`, type: "fill", ...base, filter: referenceLayerFilter(theme, "fill", year), paint: { "fill-color": fill, "fill-opacity": ["case", sea, 1, 0.12] } },
    {
      id: `ref-${theme}-line`, type: "line", ...base, filter: referenceLayerFilter(theme, "line", year),
      paint: { "line-color": color, "line-width": 2, "line-opacity": ["case", sea, 0, 0.7], "line-dasharray": [2, 2] },
    },
  ];
}

function themeLayers(theme: string, manifest: Manifest, year: number, visible: boolean, options: StyleOptions): LayerSpec[] {
  const color = THEME_COLORS[theme] ?? "#555555";
  const filled = theme === "polity" || theme === "sphere" ? hueColor : theme === "coast" ? coastFillColor(manifest, options.base, options.baseOpacity) : color;
  const base = { source: SOURCE, "source-layer": manifest.sourceLayer, layout: { visibility: visible ? "visible" : "none" } };
  const where = (kind: string) => themeFilter(theme, kind, year);
  const fillOpacity = theme === "polity" ? 0.12 : theme === "sphere" || theme === "artificial" ? 0.22 : 0.35;
  return [
    { id: `theme-${theme}-fill`, type: "fill", ...base, filter: where("fill"), paint: { "fill-color": filled, "fill-opacity": fading(manifest, fillOpacity) } },
    {
      id: `theme-${theme}-outline`, type: "line", ...base, filter: where("outline"),
      paint: { "line-color": filled, "line-width": theme === "polity" ? 1.2 : 1, "line-opacity": fading(manifest, 0.9, 0), ...(theme === "sphere" || theme === "artificial" ? { "line-dasharray": [2, 1] } : {}) },
    },
    {
      id: `theme-${theme}-line`, type: "line", ...base, filter: where("line"),
      layout: { ...base.layout, "line-cap": "round", "line-join": "round" },
      paint: { "line-color": color, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.5, 12, 4], ...(theme === "route" ? { "line-dasharray": [2, 1.5] } : {}) },
    },
    {
      id: `theme-${theme}-point`, type: "circle", ...base, filter: where("point"),
      paint: {
        "circle-color": color,
        "circle-radius": theme === "settlement" ? ["interpolate", ["linear"], ["zoom"], 8, 2, 14, 5] : ["interpolate", ["linear"], ["zoom"], 4, 4, 12, 7],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": theme === "settlement" ? 0.6 : 1.5,
      },
    },
  ];
}

/** Label zoom windows per theme, so dense themes do not bury the map: [theme, min zoom, max zoom]. */
export const LABEL_ZOOMS: readonly (readonly [string, number, number])[] = [
  ["settlement", 12, 24],
  ["castle", 7, 24],
  ["battlefield", 7, 24],
  ["sphere", 0, 10],
];

function labelZooms(): unknown {
  const listed = LABEL_ZOOMS.map(([theme]) => theme);
  return [
    "any",
    ["!", ["in", ["get", "theme"], ["literal", listed]]],
    ...LABEL_ZOOMS.map(([theme, low, high]) => ["all", ["==", ["get", "theme"], theme], [">=", ["zoom"], low], ["<", ["zoom"], high]]),
  ];
}

function labelFilter(manifest: Manifest, year: number, hiddenThemes: readonly string[]): unknown {
  const shown = manifest.themes.map((theme) => theme.id).filter((id) => !hiddenThemes.includes(id));
  return [
    "all",
    ["in", ["get", "theme"], ["literal", shown]],
    yearFilter(year),
    labelZooms(),
    ["any", ["!", worldScale(manifest)], ["<", ["zoom"], WORLD_FADE.to]],
    ["!", seaMasked(manifest)],
  ];
}

/** Every filter that depends on the year or on hidden themes, keyed by layer id. */
export function yearDependentFilters(manifest: Manifest, year: number, hiddenThemes: readonly string[]): Record<string, unknown> {
  const filters: Record<string, unknown> = { labels: labelFilter(manifest, year, hiddenThemes) };
  for (const theme of orderedThemes(manifest)) {
    for (const kind of Object.keys(GEOMETRY_BY_KIND)) filters[`theme-${theme}-${kind}`] = themeFilter(theme, kind, year);
  }
  for (const theme of referenceThemes(manifest)) {
    filters[`ref-${theme}-fill`] = referenceLayerFilter(theme, "fill", year);
    filters[`ref-${theme}-line`] = referenceLayerFilter(theme, "line", year);
  }
  return filters;
}

function referenceThemes(manifest: Manifest): string[] {
  return REFERENCE_THEMES.filter((theme) => manifest.themes.some((item) => item.id === theme));
}

/** Layer ids drawn for a theme (normal and reference), for visibility toggles. */
export function layersOfTheme(theme: string): string[] {
  const ids = Object.keys(GEOMETRY_BY_KIND).map((kind) => `theme-${theme}-${kind}`);
  return (REFERENCE_THEMES as readonly string[]).includes(theme) ? [`ref-${theme}-fill`, `ref-${theme}-line`, ...ids] : ids;
}

function labelLayer(manifest: Manifest, year: number, hiddenThemes: readonly string[]): LayerSpec {
  return {
    id: "labels",
    type: "symbol",
    source: SOURCE,
    "source-layer": manifest.sourceLayer,
    filter: labelFilter(manifest, year, hiddenThemes),
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
    { id: "background", type: "background", paint: { "background-color": BACKGROUND } },
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
  for (const theme of referenceThemes(manifest)) {
    layers.push(...referenceLayers(theme, manifest, options.year, !options.hiddenThemes.includes(theme), options));
  }
  for (const theme of orderedThemes(manifest)) {
    layers.push(...themeLayers(theme, manifest, options.year, !options.hiddenThemes.includes(theme), options));
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
  return [...themeLayerIds(manifest), ...referenceThemes(manifest).flatMap((theme) => [`ref-${theme}-fill`, `ref-${theme}-line`])];
}
