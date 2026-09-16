import * as maplibregl from "maplibre-gl";
import type { FeatureVersion } from "../domain/types";
import { createGsiStyle } from "./map-style";

const sourceId = "historical-features";
const interactiveLayerIds = ["historical-points", "historical-lines", "historical-polygons", "selected-point-halo", "selected-line-halo", "selected-lines", "selected-polygon-outline"];

export class MapAdapter {
  private map: maplibregl.Map | null = null;
  private features: readonly FeatureVersion[] = [];
  private selectedFeatureId: string | null = null;
  private selectHandler: ((ids: readonly string[]) => void) | null = null;
  private basemapErrorHandler: ((message: string) => void) | null = null;

  mount(container: HTMLElement): void {
    this.destroy();
    this.map = new maplibregl.Map({ container, style: createGsiStyle() as unknown as maplibregl.StyleSpecification, center: [135, 35], zoom: 4 });
    this.map.on("load", () => this.updateSource());
    this.map.on("error", (event: maplibregl.ErrorEvent) => this.basemapErrorHandler?.(event.error?.message ?? "The GSI basemap could not be loaded."));
    this.map.on("click", (event: maplibregl.MapMouseEvent) => {
      const clicked = this.map?.queryRenderedFeatures(event.point, { layers: interactiveLayerIds }) ?? [];
      const clickedIds = new Set(clicked.map((feature: maplibregl.MapGeoJSONFeature) => String(feature.id)).filter((id: string) => this.features.some((feature) => feature.id === id)));
      const ids = this.features.map((feature) => feature.id).filter((id) => clickedIds.has(id));
      if (ids.length) this.selectHandler?.(ids);
    });
  }

  setFeatures(features: readonly FeatureVersion[]): void { this.features = features; this.updateSource(); }
  setSelectedFeature(id: string | null): void { this.selectedFeatureId = id; this.updateSource(); }
  onSelect(handler: (ids: readonly string[]) => void): void { this.selectHandler = handler; }
  onBasemapError(handler: (message: string) => void): void { this.basemapErrorHandler = handler; }
  destroy(): void { this.map?.remove(); this.map = null; }

  private updateSource(): void {
    const source = this.map?.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData({ type: "FeatureCollection", features: this.features.map((feature) => ({ ...feature, properties: { ...feature.properties, id: feature.id, selected: feature.id === this.selectedFeatureId } })) } as Parameters<maplibregl.GeoJSONSource["setData"]>[0]);
  }
}
