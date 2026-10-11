import "./styles.css";
import { createDetailStore } from "./domain/details";
import { type Manifest, parseManifest } from "./domain/manifest";
import { formatHash, parseHash, type ViewState } from "./domain/view-state";
import { createMapView, type PickedFeature } from "./map/map-view";
import { mountDetailPanel } from "./ui/detail-panel";
import { h } from "./ui/dom";
import { mountLayerPanel } from "./ui/layer-panel";
import { mountTimeline } from "./ui/timeline-bar";

const DATA_URL = `${import.meta.env.BASE_URL}chronomap/`;
const JAPAN = { zoom: 5, lat: 36.5, lng: 137.5 };

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

function start(app: HTMLElement, manifest: Manifest) {
  const defaults: ViewState = { ...JAPAN, year: manifest.defaultYear, hiddenThemes: [], rasters: [] };
  const limits = { yearRange: manifest.yearRange, themes: manifest.themes.map((theme) => theme.id), rasters: manifest.rasters.map((raster) => raster.id) };
  let state = parseHash(window.location.hash, defaults, limits);
  const save = (next: Partial<ViewState>) => {
    state = { ...state, ...next };
    window.history.replaceState(null, "", formatHash(state));
  };

  const mapElement = h("div", { id: "map", class: "map", role: "region", "aria-label": "歴史地図" });
  const panelElement = h("aside", { class: "panel", "aria-label": "レイヤーと検索" });
  const detailElement = h("section", { class: "detail", id: "detail", "aria-label": "地物の詳細" });
  const timelineElement = h("footer", { class: "timeline", "aria-label": "年の選択" });
  app.replaceChildren(mapElement, panelElement, detailElement, timelineElement);

  const details = createDetailStore(DATA_URL, Object.fromEntries(manifest.datasets.map((dataset) => [dataset.slug, dataset.detailShards])), fetchJson);
  const view = createMapView({
    container: mapElement,
    manifest,
    tilesUrl: `pmtiles://${new URL(DATA_URL + manifest.tiles, window.location.href).href}`,
    initial: state,
    onMove: (camera) => save(camera),
    onPick: (features) => pick(features),
  });

  const detail = mountDetailPanel(detailElement, manifest.datasets, {
    onClose: () => {
      detail.hide();
      view.highlight(null);
    },
    onChoose: (feature) => void open(feature),
  });

  async function open(feature: PickedFeature) {
    view.highlight(feature.featureVersionId);
    detail.loading(feature.name);
    try {
      const resolved = await details.load(feature.dataset, feature.featureVersionId);
      if (resolved) detail.detail(resolved);
      else detail.failed(feature.name);
    } catch {
      detail.failed(feature.name);
    }
  }

  function pick(features: PickedFeature[]) {
    if (features.length === 0) {
      detail.hide();
      view.highlight(null);
    } else if (features.length === 1) {
      void open(features[0]);
    } else {
      view.highlight(null);
      detail.choices(features);
    }
  }

  const timeline = mountTimeline(timelineElement, manifest, state.year, (year) => {
    view.setYear(year);
    save({ year });
  });

  const panel = mountLayerPanel(panelElement, manifest, state, {
    onTheme: (theme, visible) => {
      view.setThemeVisible(theme, visible);
      save({ hiddenThemes: visible ? state.hiddenThemes.filter((id) => id !== theme) : [...state.hiddenThemes, theme] });
    },
    onRaster: (raster, visible) => {
      view.setRasterVisible(raster, visible);
      save({ rasters: visible ? [...state.rasters, raster] : state.rasters.filter((id) => id !== raster) });
    },
    onRasterOpacity: (opacity) => view.setRasterOpacity(opacity),
    onBase: (base) => view.setBase(base),
    onBaseOpacity: (opacity) => view.setBaseOpacity(opacity),
    onPlace: (lng, lat) => view.flyTo(lng, lat, 13),
  });
  if (window.matchMedia("(max-width: 700px)").matches) panel.collapse();

  window.addEventListener("hashchange", () => {
    const next = parseHash(window.location.hash, state, limits);
    if (next.year !== state.year) {
      timeline.setYear(next.year);
      view.setYear(next.year);
    }
    if (next.zoom !== state.zoom || next.lat !== state.lat || next.lng !== state.lng) view.map.jumpTo({ center: [next.lng, next.lat], zoom: next.zoom });
    state = { ...next, hiddenThemes: state.hiddenThemes, rasters: state.rasters };
  });
  save({});
}

async function boot(app: HTMLElement) {
  app.replaceChildren(h("p", { class: "boot-status", role: "status" }, "地図データを読み込んでいます…"));
  try {
    start(app, parseManifest(await fetchJson(`${DATA_URL}manifest.json`)));
  } catch (error) {
    const retry = h("button", { type: "button" }, "再読み込み");
    retry.addEventListener("click", () => void boot(app));
    app.replaceChildren(
      h("div", { class: "boot-status", role: "alert" }, h("p", {}, "地図データを読み込めませんでした。"), h("p", {}, h("small", {}, String(error))), retry),
    );
  }
}

const app = document.querySelector<HTMLElement>("#app");
if (app) void boot(app);
