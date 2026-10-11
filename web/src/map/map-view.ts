import * as maplibregl from "maplibre-gl";
import type { MapGeoJSONFeature, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Protocol } from "pmtiles";
import type { Manifest } from "../domain/manifest";
import type { ViewState } from "../domain/view-state";
import { yearFilter } from "../domain/year-filter";
import { BASE_MAPS, type BaseMapId, createStyle, HIGHLIGHT_LAYER_IDS, highlightFilter, interactiveLayerIds, themeLayerIds } from "./style";

export interface PickedFeature {
  readonly featureVersionId: string;
  readonly dataset: string;
  readonly theme: string;
  readonly name: string;
}

export interface MapViewOptions {
  readonly container: HTMLElement;
  readonly manifest: Manifest;
  readonly tilesUrl: string;
  readonly initial: ViewState;
  readonly onMove: (camera: { zoom: number; lat: number; lng: number }) => void;
  readonly onPick: (features: PickedFeature[]) => void;
}

maplibregl.setWorkerUrl(workerUrl);
let protocolAdded = false;

/** The only module that talks to MapLibre and the PMTiles protocol. */
export function createMapView(options: MapViewOptions) {
  if (!protocolAdded) {
    maplibregl.addProtocol("pmtiles", new Protocol().tile);
    protocolAdded = true;
  }
  const { manifest } = options;
  const state = { year: options.initial.year, hiddenThemes: [...options.initial.hiddenThemes], rasters: [...options.initial.rasters], base: "pale" as BaseMapId };
  const map = new maplibregl.Map({
    container: options.container,
    style: createStyle(manifest, {
      tilesUrl: options.tilesUrl,
      year: state.year,
      hiddenThemes: state.hiddenThemes,
      rasters: state.rasters,
      base: state.base,
      baseOpacity: 1,
      rasterOpacity: 0.7,
    }) as maplibregl.StyleSpecification,
    center: [options.initial.lng, options.initial.lat],
    zoom: options.initial.zoom,
    maxZoom: 18,
    attributionControl: { compact: true },
    localIdeographFontFamily: "'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif",
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

  map.on("moveend", () => {
    const center = map.getCenter();
    options.onMove({ zoom: map.getZoom(), lat: center.lat, lng: center.lng });
  });

  const interactive = interactiveLayerIds(manifest);
  map.on("click", (event: MapMouseEvent) => {
    const box: [maplibregl.PointLike, maplibregl.PointLike] = [
      [event.point.x - 4, event.point.y - 4],
      [event.point.x + 4, event.point.y + 4],
    ];
    const seen = new Set<string>();
    const picked: PickedFeature[] = [];
    for (const feature of map.queryRenderedFeatures(box, { layers: interactive.filter((id) => map.getLayer(id)) }) as MapGeoJSONFeature[]) {
      const id = String(feature.properties.feature_version_id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      picked.push({ featureVersionId: id, dataset: String(feature.properties.dataset), theme: String(feature.properties.theme), name: String(feature.properties.name) });
    }
    options.onPick(picked);
  });
  for (const id of interactive) {
    map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
  }

  return {
    map,
    setYear(year: number) {
      state.year = year;
      const filter = yearFilter(year);
      for (const id of themeLayerIds(manifest)) {
        const current = map.getFilter(id) as unknown[] | undefined;
        if (current) map.setFilter(id, [...current.slice(0, -1), filter] as maplibregl.FilterSpecification);
      }
      const label = map.getFilter("labels") as unknown[] | undefined;
      if (label) map.setFilter("labels", [label[0], label[1], filter, ...label.slice(3)] as maplibregl.FilterSpecification);
    },
    setThemeVisible(theme: string, visible: boolean) {
      state.hiddenThemes = visible ? state.hiddenThemes.filter((id) => id !== theme) : [...new Set([...state.hiddenThemes, theme])];
      for (const kind of ["fill", "outline", "line", "point"]) {
        const id = `theme-${theme}-${kind}`;
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
      const shown = manifest.themes.map((item) => item.id).filter((id) => !state.hiddenThemes.includes(id));
      const label = map.getFilter("labels") as unknown[] | undefined;
      if (label) map.setFilter("labels", [label[0], ["in", ["get", "theme"], ["literal", shown]], ...label.slice(2)] as maplibregl.FilterSpecification);
    },
    setRasterVisible(id: string, visible: boolean) {
      state.rasters = visible ? [...new Set([...state.rasters, id])] : state.rasters.filter((item) => item !== id);
      if (map.getLayer(`raster-${id}`)) map.setLayoutProperty(`raster-${id}`, "visibility", visible ? "visible" : "none");
    },
    setRasterOpacity(opacity: number) {
      for (const raster of manifest.rasters) map.setPaintProperty(`raster-${raster.id}`, "raster-opacity", opacity);
    },
    setBase(base: BaseMapId) {
      state.base = base;
      const source = map.getSource("base") as maplibregl.RasterTileSource | undefined;
      source?.setTiles([BASE_MAPS[base].tiles]);
    },
    setBaseOpacity(opacity: number) {
      map.setPaintProperty("base", "raster-opacity", opacity);
    },
    highlight(featureVersionId: string | null) {
      for (const id of HIGHLIGHT_LAYER_IDS) map.setFilter(id, highlightFilter(id, featureVersionId) as maplibregl.FilterSpecification);
    },
    flyTo(lng: number, lat: number, zoom: number) {
      map.flyTo({ center: [lng, lat], zoom });
    },
  };
}

export type MapView = ReturnType<typeof createMapView>;
