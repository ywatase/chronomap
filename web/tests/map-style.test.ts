// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

  const mocked = vi.hoisted(() => {
  const maps: any[] = [];
  class FakeMap {
    readonly handlers = new Map<string, Array<(event: any) => void>>();
    readonly source = { setData: vi.fn() };
    sourceAvailable = true;
    queryRenderedFeatures = vi.fn(() => []);
    getLayer = vi.fn((id: string) => ({ id }));
    setPaintProperty = vi.fn();
    setLayoutProperty = vi.fn();
    fitBounds = vi.fn();
    jumpTo = vi.fn((options: { center?: readonly [number, number]; zoom?: number }) => {
      if (options.center) this.center = { lng: options.center[0], lat: options.center[1] };
      if (options.zoom !== undefined) this.zoom = options.zoom;
    });
    easeTo = vi.fn((options: { center?: readonly [number, number]; zoom?: number }) => {
      if (options.center) this.center = { lng: options.center[0], lat: options.center[1] };
      if (options.zoom !== undefined) this.zoom = options.zoom;
    });
    center = { lng: 135.75, lat: 34.89 };
    zoom = 11;
    remove = vi.fn();
    constructor(_options: unknown) { maps.push(this); }
    on(event: string, handler: (event: any) => void): this { this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]); return this; }
    getSource(): typeof this.source | undefined { return this.sourceAvailable ? this.source : undefined; }
    getCenter(): typeof this.center { return this.center; }
    getZoom(): number { return this.zoom; }
    fire(event: string, payload: unknown = {}): void { for (const handler of this.handlers.get(event) ?? []) handler(payload); }
  }
  return { maps, FakeMap };
});

vi.mock("maplibre-gl", () => ({ Map: mocked.FakeMap, setWorkerUrl: vi.fn() }));

import { MapAdapter } from "../src/map/map-adapter";
import { createGsiStyle, geometryLayerDefinitions, HISTORICAL_MAP_ASSET_LAYER_ID, HISTORICAL_MAP_ASSET_SOURCE_ID, TERRITORY_LAYER_IDS } from "../src/map/map-style";
import type { FeatureVersion } from "../src/domain/types";

const point = (id: string, coordinates: readonly unknown[]): FeatureVersion => ({
  type: "Feature", id, geometry: { type: "Point", coordinates },
  properties: { entityId: "entity", labels: { en: id }, description: { en: id }, temporal: { start: null, end: null }, uncertainty: { temporal: { assessment: "unknown", note: "", evidenceIds: [] }, location: { assessment: "unknown", note: "", evidenceIds: [] }, geometry: { assessment: "unknown", note: "", evidenceIds: [] }, identity: { assessment: "unknown", note: "", evidenceIds: [] } }, evidenceIds: [], rights: { status: "public-domain" } },
});

describe("map style", () => {
  it("defines the attributed GSI raster and a separate source for comparison snapshots", () => {
    const style = createGsiStyle();
    expect(Object.keys(style.sources)).toEqual(["gsi", "historical-features", "historical-comparison"]);
    expect(style.sources.gsi).toMatchObject({ type: "raster", attribution: expect.stringContaining("https://maps.gsi.go.jp/development/ichiran.html") });
    expect(style.sources["historical-features"]).toMatchObject({ type: "geojson", data: { type: "FeatureCollection", features: [] } });
    expect(style.sources["historical-comparison"]).toMatchObject({ type: "geojson", data: { type: "FeatureCollection", features: [] } });
  });

  it("uses distinct point, line, and polygon layers with selected and hypothesis patterns", () => {
    const layers = geometryLayerDefinitions();
    expect(layers.map((layer) => layer.id)).toEqual(expect.arrayContaining(["historical-points", "historical-lines", "historical-polygons", "comparison-polygons", "comparison-lines", "comparison-points", "selected-point-halo", "selected-line-halo", "selected-polygon-outline"]));
    expect(layers.some((layer) => "line-dasharray" in (layer.layout ?? {}))).toBe(false);
    expect(layers.some((layer) => "line-dasharray" in (layer.paint ?? {}))).toBe(true);
    expect(layers.some((layer) => "line-width" in (layer.paint ?? {}) && layer.id.startsWith("selected-"))).toBe(true);
  });

  it("renders political territory separately from ordinary polygons", () => {
    const layers = geometryLayerDefinitions();
    const territory = layers.find((layer) => layer.id === "historical-territories");
    const polygons = layers.find((layer) => layer.id === "historical-polygons");

    expect(TERRITORY_LAYER_IDS).toEqual(["historical-territories", "selected-territory-outline"]);
    expect(territory?.filter).toEqual(expect.arrayContaining([["in", ["get", "entityType"], ["literal", ["boundary", "polity", "sphere-of-influence"]]]]));
    expect(polygons?.filter).toEqual(expect.arrayContaining([["!", ["in", ["get", "entityType"], ["literal", ["boundary", "polity", "sphere-of-influence"]]]]]));
  });

  it("loads MapLibre's stylesheet at the MapLibre boundary", () => {
    expect(readFileSync("src/map/map-adapter.ts", "utf8")).toContain('import "maplibre-gl/dist/maplibre-gl.css"');
  });

  it("adds an attributed, bounded XYZ raster layer only for a validated tile asset", () => {
    const style = createGsiStyle({
      id: "synthetic:historical-map:sample",
      title: { en: "Sample" },
      description: { en: "Sample" },
      tileTemplate: "https://tiles.example.invalid/ort/{z}/{x}/{y}.png",
      bbox: [135, 34, 136, 35],
      date: "1936–1942",
      accessedDate: "2026-10-04",
      georeference: { method: "provider XYZ tile georeference", error: "not evaluated" },
      sourceUrl: "https://example.invalid/source",
      attribution: "Example archive",
      rights: { status: "open-license" },
      minZoom: 13,
      maxZoom: 18,
    });

    expect(style.sources[HISTORICAL_MAP_ASSET_SOURCE_ID]).toMatchObject({ type: "raster", tiles: ["https://tiles.example.invalid/ort/{z}/{x}/{y}.png"], bounds: [135, 34, 136, 35], minzoom: 13, maxzoom: 18 });
    expect(style.layers.find((layer) => layer.id === HISTORICAL_MAP_ASSET_LAYER_ID)).toMatchObject({ type: "raster", source: HISTORICAL_MAP_ASSET_SOURCE_ID });
  });
});

describe("MapAdapter", () => {
  it("restores a shared camera and reports later map movement", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    const map = mocked.maps.at(-1);
    const cameras: unknown[] = []; adapter.onCameraChange((camera) => cameras.push(camera));
    adapter.setCamera({ longitude: 135.75, latitude: 34.89, zoom: 11.5 });
    map.center = { lng: 135, lat: 35 }; map.zoom = 4;
    map.fire("moveend");
    expect(cameras).toEqual([]);
    map.fire("load");
    expect(map.jumpTo).toHaveBeenCalledWith({ center: [135.75, 34.89], zoom: 11.5 });
    adapter.setViewport([135.73, 34.87, 135.82, 34.94]);
    expect(map.fitBounds).not.toHaveBeenCalled();
    map.center = { lng: 135.76, lat: 34.9 }; map.zoom = 12; map.fire("moveend", { originalEvent: {} });
    expect(cameras).toEqual([{ longitude: 135.76, latitude: 34.9, zoom: 12 }]);
  });

  it("fits the map to the requested dataset bbox after the map loads", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    const map = mocked.maps.at(-1);
    adapter.setViewport([135.73, 34.87, 135.82, 34.94]);
    expect(map.fitBounds).toHaveBeenCalledWith([[135.73, 34.87], [135.82, 34.94]], { padding: 48, maxZoom: 13, duration: 0 });
    map.fire("load");
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
  });

  it("fits the map to a selected historical feature geometry", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    const map = mocked.maps.at(-1);
    adapter.focusFeature({
      type: "Feature",
      id: "waterbody",
      geometry: { type: "Polygon", coordinates: [[[135.72, 34.86], [135.78, 34.86], [135.8, 34.91], [135.72, 34.86]]] },
      properties: {} as any,
    });
    expect(map.fitBounds).toHaveBeenCalledWith([[135.72, 34.86], [135.8, 34.91]], { padding: 64, maxZoom: 15, duration: 450 });
  });

  it("centers point features and safely bounds multi geometries", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    const map = mocked.maps.at(-1);
    adapter.focusFeature({ type: "Feature", id: "point", geometry: { type: "Point", coordinates: [135.75, 34.9] }, properties: {} as any });
    expect(map.easeTo).toHaveBeenCalledWith({ center: [135.75, 34.9], zoom: 15, duration: 450 });
    adapter.focusFeature({ type: "Feature", id: "multi", geometry: { type: "MultiLineString", coordinates: [[[135.7, 34.8], [135.8, 34.95]], [[135.72, 34.85], [135.82, 34.92]]] }, properties: {} as any });
    expect(map.fitBounds).toHaveBeenCalledWith([[135.7, 34.8], [135.82, 34.95]], { padding: 64, maxZoom: 15, duration: 450 });
  });

  it("preserves authored coordinate order in its one GeoJSON source", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    const coordinates = [139.7, 35.6] as const; adapter.setFeatures([point("first", coordinates)]);
    expect(mocked.maps.at(-1).source.setData).toHaveBeenLastCalledWith(expect.objectContaining({ features: [expect.objectContaining({ id: "first", geometry: { type: "Point", coordinates } })] }));
  });

  it("updates the source once when the style first exposes it", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    const map = mocked.maps.at(-1);
    map.sourceAvailable = false;
    adapter.setFeatures([point("first", [139.7, 35.6])]);
    expect(map.source.setData).not.toHaveBeenCalled();
    map.sourceAvailable = true;
    map.fire("styledata");
    expect(map.source.setData).toHaveBeenCalledTimes(1);
    map.fire("styledata");
    expect(map.source.setData).toHaveBeenCalledTimes(1);
  });

  it("reports overlapping clicked IDs in authored feature order", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    adapter.setFeatures([point("first", [1, 2]), point("second", [3, 4])]);
    const received: string[][] = []; adapter.onSelect((ids) => received.push([...ids]));
    const map = mocked.maps.at(-1); map.queryRenderedFeatures.mockReturnValue([{ id: "second" }, { id: "first" }, { id: "second" }]);
    map.fire("click", { point: {} });
    expect(received).toEqual([["first", "second"]]);
  });

  it("reports map rendering errors without assuming a GSI tile error", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    const errors: string[] = []; adapter.onBasemapError((message) => errors.push(message));
    mocked.maps.at(-1).fire("error", { error: new Error("WebGL context lost") });
    expect(errors).toEqual(["WebGL context lost"]);
  });

  it("updates only display paint/layout properties and preserves them across retry", () => {
    const adapter = new MapAdapter();
    adapter.mount(document.createElement("div"));
    const firstMap = mocked.maps.at(-1);
    adapter.setBasemapOpacity(0.4);
    adapter.setHistoricalOpacity(0.5);
    adapter.setHistoricalVisibility(false);
    adapter.setTerritoryVisibility(false);
    expect(firstMap.setPaintProperty).toHaveBeenCalledWith("gsi-base", "raster-opacity", 0.4);
    expect(firstMap.setPaintProperty).toHaveBeenCalledWith("historical-polygons", "fill-opacity", 0.16);
    expect(firstMap.setPaintProperty).toHaveBeenCalledWith("historical-lines", "line-opacity", 0.5);
    expect(firstMap.setLayoutProperty).toHaveBeenCalledWith("historical-points", "visibility", "none");
    expect(firstMap.setLayoutProperty).toHaveBeenCalledWith("historical-territories", "visibility", "none");

    adapter.retry();
    const retriedMap = mocked.maps.at(-1);
    expect(retriedMap.setPaintProperty).toHaveBeenCalledWith("gsi-base", "raster-opacity", 0.4);
    expect(retriedMap.setPaintProperty).toHaveBeenCalledWith("historical-polygons", "fill-opacity", 0.16);
    expect(retriedMap.setLayoutProperty).toHaveBeenCalledWith("selected-lines", "visibility", "none");
    expect(retriedMap.setLayoutProperty).toHaveBeenCalledWith("selected-territory-outline", "visibility", "none");
  });

  it("keeps the historical raster overlay independent from feature opacity", () => {
    const adapter = new MapAdapter();
    adapter.mount(document.createElement("div"), {
      id: "synthetic:historical-map:sample",
      title: { en: "Sample" },
      description: { en: "Sample" },
      tileTemplate: "https://tiles.example.invalid/ort/{z}/{x}/{y}.png",
      bbox: [135, 34, 136, 35],
      date: "1936–1942",
      accessedDate: "2026-10-04",
      georeference: { method: "provider XYZ tile georeference", error: "not evaluated" },
      sourceUrl: "https://example.invalid/source",
      attribution: "Example archive",
      rights: { status: "open-license" },
      minZoom: 13,
      maxZoom: 18,
    });
    const map = mocked.maps.at(-1);

    adapter.setHistoricalMapAssetOpacity(0.5);
    adapter.setHistoricalOpacity(0.25);
    adapter.setHistoricalMapAssetVisibility(false);

    expect(map.setPaintProperty).toHaveBeenCalledWith("historical-map-asset", "raster-opacity", 0.36);
    expect(map.setPaintProperty).toHaveBeenCalledWith("historical-polygons", "fill-opacity", 0.08);
    expect(map.setLayoutProperty).toHaveBeenCalledWith("historical-map-asset", "visibility", "none");
  });

  it("hides only territory layers while ordinary point and line layers stay visible", () => {
    const adapter = new MapAdapter(); adapter.mount(document.createElement("div"));
    const map = mocked.maps.at(-1);

    adapter.setTerritoryVisibility(false);

    expect(map.setLayoutProperty).toHaveBeenCalledWith("historical-territories", "visibility", "none");
    expect(map.setLayoutProperty).toHaveBeenCalledWith("selected-territory-outline", "visibility", "none");
    expect(map.setLayoutProperty).not.toHaveBeenCalledWith("historical-points", "visibility", "none");
    expect(map.setLayoutProperty).not.toHaveBeenCalledWith("historical-lines", "visibility", "none");
  });

  it("recreates the map on retry and restores visible and selected features", () => {
    const adapter = new MapAdapter();
    adapter.mount(document.createElement("div"));
    adapter.setFeatures([point("first", [139.7, 35.6])]);
    adapter.setSelectedFeature("first");
    adapter.setCamera({ longitude: 135.75, latitude: 34.89, zoom: 11.5 });
    const firstMap = mocked.maps.at(-1);

    adapter.retry();

    const retriedMap = mocked.maps.at(-1);
    expect(retriedMap).not.toBe(firstMap);
    expect(firstMap.remove).toHaveBeenCalledOnce();
    expect(retriedMap.jumpTo).toHaveBeenCalledWith({ center: [135.75, 34.89], zoom: 11.5 });
    retriedMap.fire("load");
    expect(retriedMap.source.setData).toHaveBeenLastCalledWith(expect.objectContaining({
      features: [expect.objectContaining({ id: "first", properties: expect.objectContaining({ selected: true }) })],
    }));
  });
});
