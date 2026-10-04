import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { Dataset, FeatureVersion, HistoricalMapAsset } from "../domain/types";
import { createGsiStyle, HISTORICAL_LAYER_IDS, HISTORICAL_MAP_ASSET_LAYER_ID, TERRITORY_LAYER_IDS } from "./map-style";

const sourceId = "historical-features";
const interactiveLayerIds = [...HISTORICAL_LAYER_IDS];

maplibregl.setWorkerUrl(workerUrl);

export interface MapCamera {
  readonly longitude: number;
  readonly latitude: number;
  readonly zoom: number;
}

export class MapAdapter {
  private map: maplibregl.Map | null = null;
  private container: HTMLElement | null = null;
  private features: readonly FeatureVersion[] = [];
  private selectedFeatureId: string | null = null;
  private viewport: Dataset["bbox"] | null = null;
  private requestedCamera: MapCamera | null = null;
  private camera: MapCamera | null = null;
  private viewportApplied = false;
  private sourceReady = false;
  private selectHandler: ((ids: readonly string[]) => void) | null = null;
  private cameraChangeHandler: ((camera: MapCamera) => void) | null = null;
  private basemapErrorHandler: ((message: string) => void) | null = null;
  private basemapOpacity = 1;
  private historicalOpacity = 1;
  private historicalVisible = true;
  private territoryVisible = true;
  private historicalMapAsset: HistoricalMapAsset | null = null;
  private historicalMapAssetOpacity = 1;
  private historicalMapAssetVisible = true;

  mount(container: HTMLElement, asset: HistoricalMapAsset | null = null): void {
    this.container = container;
    this.historicalMapAsset = asset;
    this.createMap();
  }

  retry(): void {
    if (!this.container) return;
    const current = this.readCamera();
    if (current) { this.camera = current; this.requestedCamera = current; }
    this.createMap();
  }

  private createMap(): void {
    if (!this.container) return;
    this.map?.remove();
    this.viewportApplied = false;
    this.sourceReady = false;
    this.map = new maplibregl.Map({ container: this.container, style: createGsiStyle(this.historicalMapAsset) as unknown as maplibregl.StyleSpecification, center: [135, 35], zoom: 4 });
    this.map.on("load", () => { this.updateSource(); this.applyRequestedCameraOrViewport(); });
    this.map.on("styledata", () => { this.updateSource(); this.applyDisplaySettings(); });
    this.map.on("moveend", (event: maplibregl.MapMovementEvent) => {
      const camera = this.readCamera();
      if (!camera) return;
      if (this.requestedCamera && !sameCamera(camera, this.requestedCamera) && !event.originalEvent) {
        this.map?.jumpTo({ center: [this.requestedCamera.longitude, this.requestedCamera.latitude], zoom: this.requestedCamera.zoom });
        return;
      }
      if (event.originalEvent) this.requestedCamera = null;
      this.camera = camera; if (this.camera) this.cameraChangeHandler?.(this.camera);
    });
    this.map.on("error", (event: maplibregl.ErrorEvent) => this.basemapErrorHandler?.(event.error?.message ?? "Basemap or map rendering is unavailable."));
    this.map.on("click", (event: maplibregl.MapMouseEvent) => {
      const clicked = this.map?.queryRenderedFeatures(event.point, { layers: interactiveLayerIds }) ?? [];
      const clickedIds = new Set(clicked.map((feature: maplibregl.MapGeoJSONFeature) => String(feature.id)).filter((id: string) => this.features.some((feature) => feature.id === id)));
      const ids = this.features.map((feature) => feature.id).filter((id) => clickedIds.has(id));
      if (ids.length) this.selectHandler?.(ids);
    });
    this.applyRequestedCameraOrViewport();
    this.applyDisplaySettings();
  }

  setFeatures(features: readonly FeatureVersion[]): void { this.features = features; this.updateSource(true); }
  setSelectedFeature(id: string | null): void { this.selectedFeatureId = id; this.updateSource(true); }
  setViewport(bbox: Dataset["bbox"]): void { this.viewport = bbox; if (this.map) this.applyRequestedCameraOrViewport(); }
  setCamera(camera: MapCamera): void { this.requestedCamera = camera; this.camera = camera; this.map?.jumpTo({ center: [camera.longitude, camera.latitude], zoom: camera.zoom }); }
  setBasemapOpacity(value: number): void { this.basemapOpacity = clamp(value); this.applyDisplaySettings(); }
  setHistoricalOpacity(value: number): void { this.historicalOpacity = clamp(value); this.applyDisplaySettings(); }
  setHistoricalVisibility(visible: boolean): void { this.historicalVisible = visible; this.applyDisplaySettings(); }
  setTerritoryVisibility(visible: boolean): void { this.territoryVisible = visible; this.applyDisplaySettings(); }
  setHistoricalMapAsset(asset: HistoricalMapAsset | null): void {
    if (this.historicalMapAsset?.id === asset?.id) return;
    const current = this.readCamera();
    if (current) { this.camera = current; this.requestedCamera = current; }
    this.historicalMapAsset = asset;
    if (this.map && this.container) this.createMap();
  }
  setHistoricalMapAssetOpacity(value: number): void { this.historicalMapAssetOpacity = clamp(value); this.applyDisplaySettings(); }
  setHistoricalMapAssetVisibility(visible: boolean): void { this.historicalMapAssetVisible = visible; this.applyDisplaySettings(); }
  getCamera(): MapCamera | null { return this.map ? this.readCamera() : this.camera; }
  onSelect(handler: (ids: readonly string[]) => void): void { this.selectHandler = handler; }
  onCameraChange(handler: (camera: MapCamera) => void): void { this.cameraChangeHandler = handler; }
  onBasemapError(handler: (message: string) => void): void { this.basemapErrorHandler = handler; }
  destroy(): void { this.map?.remove(); this.map = null; this.container = null; }

  private applyViewport(): void {
    if (!this.map || !this.viewport || this.viewportApplied) return;
    const [west, south, east, north] = this.viewport;
    this.map.fitBounds([[west, south], [east, north]], { padding: 48, maxZoom: 13, duration: 0 });
    this.viewportApplied = true;
  }

  private applyRequestedCameraOrViewport(): void {
    if (this.requestedCamera && this.map) {
      this.map.jumpTo({ center: [this.requestedCamera.longitude, this.requestedCamera.latitude], zoom: this.requestedCamera.zoom });
      this.camera = this.requestedCamera;
      this.viewportApplied = true;
      return;
    }
    this.applyViewport();
  }

  private readCamera(): MapCamera | null {
    if (!this.map) return this.camera;
    const center = this.map.getCenter();
    return { longitude: center.lng, latitude: center.lat, zoom: this.map.getZoom() };
  }

  private updateSource(force = false): void {
    const source = this.map?.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (!source || (this.sourceReady && !force)) return;
    source.setData({ type: "FeatureCollection", features: this.features.map((feature) => ({ ...feature, properties: { ...feature.properties, id: feature.id, selected: feature.id === this.selectedFeatureId } })) } as Parameters<maplibregl.GeoJSONSource["setData"]>[0]);
    this.sourceReady = true;
  }

  private applyDisplaySettings(): void {
    if (!this.map) return;
    try {
      if (this.map.getLayer("gsi-base")) this.map.setPaintProperty("gsi-base", "raster-opacity", this.basemapOpacity);
      if (this.map.getLayer(HISTORICAL_MAP_ASSET_LAYER_ID)) {
        this.map.setPaintProperty(HISTORICAL_MAP_ASSET_LAYER_ID, "raster-opacity", 0.72 * this.historicalMapAssetOpacity);
        this.map.setLayoutProperty(HISTORICAL_MAP_ASSET_LAYER_ID, "visibility", this.historicalMapAssetVisible ? "visible" : "none");
      }
      const polygonOpacity = 0.32 * this.historicalOpacity;
      if (this.map.getLayer("historical-polygons")) this.map.setPaintProperty("historical-polygons", "fill-opacity", polygonOpacity);
      if (this.map.getLayer("historical-territories")) this.map.setPaintProperty("historical-territories", "fill-opacity", 0.22 * this.historicalOpacity);
      for (const layerId of ["historical-points", "selected-point-halo"]) {
        if (this.map.getLayer(layerId)) {
          this.map.setPaintProperty(layerId, "circle-opacity", this.historicalOpacity);
          this.map.setPaintProperty(layerId, "circle-stroke-opacity", this.historicalOpacity);
        }
      }
      for (const layerId of ["historical-lines", "selected-polygon-outline", "selected-territory-outline", "selected-line-halo", "selected-lines"]) {
        if (this.map.getLayer(layerId)) this.map.setPaintProperty(layerId, "line-opacity", this.historicalOpacity);
      }
      for (const layerId of HISTORICAL_LAYER_IDS) if (this.map.getLayer(layerId)) this.map.setLayoutProperty(layerId, "visibility", this.historicalVisible ? "visible" : "none");
      if (this.historicalVisible) for (const layerId of TERRITORY_LAYER_IDS) if (this.map.getLayer(layerId)) this.map.setLayoutProperty(layerId, "visibility", this.territoryVisible ? "visible" : "none");
    } catch {
      // MapLibre can emit styledata before all layers exist; the next styledata retries.
    }
  }
}

function sameCamera(first: MapCamera, second: MapCamera): boolean {
  const longitudeDifference = Math.abs(first.longitude - second.longitude) % 360;
  return Math.min(longitudeDifference, 360 - longitudeDifference) < 1e-6
    && Math.abs(first.latitude - second.latitude) < 1e-6
    && Math.abs(first.zoom - second.zoom) < 1e-6;
}

function clamp(value: number): number { return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0; }
