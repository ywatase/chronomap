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

export function geometryLayerDefinitions(): readonly LayerSpecification[] {
  const source = historicalSource;
  const pointFilter = ["in", "$type", "Point"] as const;
  const lineFilter = ["in", "$type", "LineString"] as const;
  const polygonFilter = ["in", "$type", "Polygon"] as const;
  const selected = ["==", ["get", "selected"], true] as const;
  const unselected = ["!=", ["get", "selected"], true] as const;

  return [
    { id: "historical-polygons", type: "fill", source, filter: ["all", polygonFilter, unselected], paint: { "fill-color": "#406a90", "fill-opacity": 0.32, "fill-outline-color": "#193a56" } },
    { id: "historical-points", type: "circle", source, filter: ["all", pointFilter, unselected], paint: { "circle-radius": 7, "circle-color": "#9c4e1c", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
    { id: "historical-lines", type: "line", source, filter: ["all", lineFilter, unselected], layout: { "line-cap": "round", "line-join": "round", "line-dasharray": ["case", ["has", "hypothesisGroupId"], [3, 2], [1, 0]] }, paint: { "line-color": "#693d86", "line-width": 4 } },
    { id: "selected-polygon-outline", type: "line", source, filter: ["all", polygonFilter, selected], layout: { "line-dasharray": [2, 1] }, paint: { "line-color": "#111827", "line-width": 5 } },
    { id: "selected-point-halo", type: "circle", source, filter: ["all", pointFilter, selected], paint: { "circle-radius": 12, "circle-color": "#ffffff", "circle-stroke-width": 4, "circle-stroke-color": "#111827" } },
    { id: "selected-line-halo", type: "line", source, filter: ["all", lineFilter, selected], layout: { "line-dasharray": [1, 0] }, paint: { "line-color": "#ffffff", "line-width": 9 } },
    { id: "selected-lines", type: "line", source, filter: ["all", lineFilter, selected], layout: { "line-dasharray": [2, 1] }, paint: { "line-color": "#111827", "line-width": 5 } },
  ];
}

export function createGsiStyle(): GsiStyleSpecification {
  return {
    version: 8,
    sources: {
      gsi: { type: "raster", tiles: ["https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"], tileSize: 256, attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI Maps</a>' },
      [historicalSource]: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
    },
    layers: [
      { id: "gsi-base", type: "raster", source: "gsi" },
      ...geometryLayerDefinitions(),
    ],
  };
}
