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
    fitBounds = vi.fn();
    jumpTo = vi.fn((options: { center?: readonly [number, number]; zoom?: number }) => {
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
import { createGsiStyle, geometryLayerDefinitions } from "../src/map/map-style";
import type { FeatureVersion } from "../src/domain/types";

const point = (id: string, coordinates: readonly unknown[]): FeatureVersion => ({
  type: "Feature", id, geometry: { type: "Point", coordinates },
  properties: { entityId: "entity", labels: { en: id }, description: { en: id }, temporal: { start: null, end: null }, uncertainty: { temporal: { assessment: "unknown", note: "", evidenceIds: [] }, location: { assessment: "unknown", note: "", evidenceIds: [] }, geometry: { assessment: "unknown", note: "", evidenceIds: [] }, identity: { assessment: "unknown", note: "", evidenceIds: [] } }, evidenceIds: [], rights: { status: "public-domain" } },
});

describe("map style", () => {
  it("defines the attributed GSI raster and exactly one historical GeoJSON source", () => {
    const style = createGsiStyle();
    expect(Object.keys(style.sources)).toEqual(["gsi", "historical-features"]);
    expect(style.sources.gsi).toMatchObject({ type: "raster", attribution: expect.stringContaining("https://maps.gsi.go.jp/development/ichiran.html") });
    expect(style.sources["historical-features"]).toMatchObject({ type: "geojson", data: { type: "FeatureCollection", features: [] } });
  });

  it("uses distinct point, line, and polygon layers with selected and hypothesis patterns", () => {
    const layers = geometryLayerDefinitions();
    expect(layers.map((layer) => layer.id)).toEqual(expect.arrayContaining(["historical-points", "historical-lines", "historical-polygons", "selected-point-halo", "selected-line-halo", "selected-polygon-outline"]));
    expect(layers.some((layer) => "line-dasharray" in (layer.layout ?? {}))).toBe(false);
    expect(layers.some((layer) => "line-dasharray" in (layer.paint ?? {}))).toBe(true);
    expect(layers.some((layer) => "line-width" in (layer.paint ?? {}) && layer.id.startsWith("selected-"))).toBe(true);
  });

  it("loads MapLibre's stylesheet at the MapLibre boundary", () => {
    expect(readFileSync("src/map/map-adapter.ts", "utf8")).toContain('import "maplibre-gl/dist/maplibre-gl.css"');
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
