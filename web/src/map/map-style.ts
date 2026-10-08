import type { HistoricalMapAsset } from "../domain/types";
import { isTileHistoricalMapAsset } from "../domain/historical-map-assets";

/** A structural subset of the MapLibre style schema, kept runtime-independent. */
export interface LayerSpecification {
  readonly id: string;
  readonly type: "raster" | "circle" | "fill" | "line";
  readonly source?: string;
  readonly filter?: readonly unknown[];
  readonly layout?: Readonly<Record<string, unknown>>;
  readonly paint?: Readonly<Record<string, unknown>>;
}

export interface GsiStyleSpecification {
  readonly version: 8;
  readonly sources: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly layers: readonly LayerSpecification[];
}

const historicalSource = "historical-features";
export const HISTORICAL_COMPARISON_SOURCE_ID = "historical-comparison";
export const HISTORICAL_MAP_ASSET_SOURCE_ID = "historical-map-asset";
export const HISTORICAL_MAP_ASSET_LAYER_ID = "historical-map-asset";

export const HISTORICAL_LAYER_IDS = [
  "historical-polygons",
  "historical-territories",
  "historical-points",
  "historical-lines",
  "selected-polygon-outline",
  "selected-territory-outline",
  "selected-point-halo",
  "selected-line-halo",
  "selected-lines",
] as const;

export const TERRITORY_LAYER_IDS = ["historical-territories", "selected-territory-outline"] as const;

export function geometryLayerDefinitions(): readonly LayerSpecification[] {
  const source = historicalSource;
  const comparisonSource = HISTORICAL_COMPARISON_SOURCE_ID;
  const pointFilter = ["==", ["geometry-type"], "Point"] as const;
  const lineFilter = ["==", ["geometry-type"], "LineString"] as const;
  const polygonFilter = ["==", ["geometry-type"], "Polygon"] as const;
  const selected = ["==", ["get", "selected"], true] as const;
  const unselected = ["!=", ["get", "selected"], true] as const;
  const territory = ["in", ["get", "entityType"], ["literal", ["boundary", "polity", "sphere-of-influence"]]] as const;
  const notTerritory = ["!", territory] as const;

  return [
    // Comparison is deliberately drawn first: the selected/current snapshot
    // remains the visual foreground and the prior snapshot reads as a quiet
    // dashed reference rather than a second dominant map.
    { id: "comparison-polygons", type: "fill", source: comparisonSource, filter: polygonFilter, paint: { "fill-color": "#52758f", "fill-opacity": 0.08, "fill-outline-color": "#52758f" } },
    { id: "comparison-lines", type: "line", source: comparisonSource, filter: lineFilter, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#52758f", "line-width": 2, "line-dasharray": [2, 2] } },
    { id: "comparison-points", type: "circle", source: comparisonSource, filter: pointFilter, paint: { "circle-radius": 5, "circle-color": "#52758f", "circle-opacity": 0.35, "circle-stroke-width": 1, "circle-stroke-color": "#ffffff", "circle-stroke-opacity": 0.7 } },
    { id: "historical-polygons", type: "fill", source, filter: ["all", polygonFilter, notTerritory], paint: { "fill-color": "#406a90", "fill-opacity": 0.32, "fill-outline-color": "#193a56" } },
    { id: "historical-territories", type: "fill", source, filter: ["all", polygonFilter, territory, unselected], paint: { "fill-color": "#b7791f", "fill-opacity": 0.22, "fill-outline-color": "#7c4a03" } },
    { id: "historical-points", type: "circle", source, filter: ["all", pointFilter, unselected], paint: { "circle-radius": 7, "circle-color": "#9c4e1c", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
    { id: "historical-lines", type: "line", source, filter: ["all", lineFilter, unselected], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#693d86", "line-width": 4, "line-dasharray": ["case", ["has", "hypothesisGroupId"], ["literal", [3, 2]], ["literal", [1, 0]]] } },
    { id: "selected-polygon-outline", type: "line", source, filter: ["all", polygonFilter, notTerritory, selected], paint: { "line-color": "#111827", "line-width": 5, "line-dasharray": [2, 1] } },
    { id: "selected-territory-outline", type: "line", source, filter: ["all", polygonFilter, territory, selected], paint: { "line-color": "#7c4a03", "line-width": 5, "line-dasharray": [2, 1] } },
    { id: "selected-point-halo", type: "circle", source, filter: ["all", pointFilter, selected], paint: { "circle-radius": 12, "circle-color": "#ffffff", "circle-stroke-width": 4, "circle-stroke-color": "#111827" } },
    { id: "selected-line-halo", type: "line", source, filter: ["all", lineFilter, selected], paint: { "line-color": "#ffffff", "line-width": 9, "line-dasharray": [1, 0] } },
    { id: "selected-lines", type: "line", source, filter: ["all", lineFilter, selected], paint: { "line-color": "#111827", "line-width": 5, "line-dasharray": [2, 1] } },
  ];
}

export function createGsiStyle(asset: HistoricalMapAsset | null = null): GsiStyleSpecification {
  const sources: Record<string, Readonly<Record<string, unknown>>> = {
    gsi: { type: "raster", tiles: ["https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"], tileSize: 256, attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI Maps</a>' },
    [historicalSource]: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
    [HISTORICAL_COMPARISON_SOURCE_ID]: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
  };
  const assetLayer: LayerSpecification[] = [];
  if (asset && isTileHistoricalMapAsset(asset)) {
    sources[HISTORICAL_MAP_ASSET_SOURCE_ID] = {
      type: "raster",
      tiles: [asset.tileTemplate],
      tileSize: 256,
      minzoom: asset.minZoom,
      maxzoom: asset.maxZoom,
      bounds: asset.bbox,
      attribution: asset.attribution,
    };
    assetLayer.push({ id: HISTORICAL_MAP_ASSET_LAYER_ID, type: "raster", source: HISTORICAL_MAP_ASSET_SOURCE_ID, paint: { "raster-opacity": 0.72 } });
  }
  return {
    version: 8,
    sources,
    layers: [
      { id: "gsi-base", type: "raster", source: "gsi" },
      ...assetLayer,
      ...geometryLayerDefinitions(),
    ],
  };
}
