import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { Dataset, FeatureVersion } from "../domain/types";
import { createGsiStyle } from "./map-style";

const sourceId = "historical-features";
const interactiveLayerIds = ["historical-points", "historical-lines", "historical-polygons", "selected-point-halo", "selected-line-halo", "selected-lines", "selected-polygon-outline"];

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

  mount(container: HTMLElement): void {
    this.container = container;
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
    this.map = new maplibregl.Map({ container: this.container, style: createGsiStyle() as unknown as maplibregl.StyleSpecification, center: [135, 35], zoom: 4 });
    this.map.on("load", () => { this.updateSource(); this.applyRequestedCameraOrViewport(); });
    this.map.on("styledata", () => this.updateSource());
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
  }

  setFeatures(features: readonly FeatureVersion[]): void { this.features = features; this.updateSource(true); }
  setSelectedFeature(id: string | null): void { this.selectedFeatureId = id; this.updateSource(true); }
  setViewport(bbox: Dataset["bbox"]): void { this.viewport = bbox; if (this.map) this.applyRequestedCameraOrViewport(); }
  setCamera(camera: MapCamera): void { this.requestedCamera = camera; this.camera = camera; this.map?.jumpTo({ center: [camera.longitude, camera.latitude], zoom: camera.zoom }); }
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
}

function sameCamera(first: MapCamera, second: MapCamera): boolean {
  const longitudeDifference = Math.abs(first.longitude - second.longitude) % 360;
  return Math.min(longitudeDifference, 360 - longitudeDifference) < 1e-6
    && Math.abs(first.latitude - second.latitude) < 1e-6
    && Math.abs(first.zoom - second.zoom) < 1e-6;
}
