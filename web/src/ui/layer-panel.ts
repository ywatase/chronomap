import type { Manifest } from "../domain/manifest";
import { BASE_MAPS, type BaseMapId, HUE_PALETTE, THEME_COLORS } from "../map/style";
import { h, text } from "./dom";

export interface LayerPanelHandlers {
  readonly onTheme: (theme: string, visible: boolean) => void;
  readonly onRaster: (raster: string, visible: boolean) => void;
  readonly onRasterOpacity: (opacity: number) => void;
  readonly onBase: (base: BaseMapId) => void;
  readonly onBaseOpacity: (opacity: number) => void;
  readonly onPlace: (lng: number, lat: number) => void;
}

const SYMBOLS: Record<string, string> = { polity: "面", sphere: "面", coast: "面", lake: "面", river: "線", route: "線", settlement: "点", castle: "点", battlefield: "点", other: "点・線・面" };

function swatch(theme: string) {
  const element = h("span", { class: `swatch swatch-${SYMBOLS[theme] === "線" ? "line" : SYMBOLS[theme] === "点" ? "point" : "area"}`, "aria-hidden": "true" });
  element.style.setProperty("--swatch", theme === "polity" || theme === "sphere" ? `linear-gradient(90deg, ${HUE_PALETTE.slice(0, 4).join(",")})` : THEME_COLORS[theme] ?? "#555");
  return element;
}

async function searchPlace(query: string): Promise<{ title: string; lng: number; lat: number }[]> {
  const response = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`search failed: ${response.status}`);
  const results = (await response.json()) as { geometry: { coordinates: [number, number] }; properties: { title: string } }[];
  return results.slice(0, 8).map((item) => ({ title: item.properties.title, lng: item.geometry.coordinates[0], lat: item.geometry.coordinates[1] }));
}

/** Collapsible left panel: place search, theme layers with legend, historical rasters, base map. */
export function mountLayerPanel(root: HTMLElement, manifest: Manifest, initial: { hiddenThemes: readonly string[]; rasters: readonly string[] }, handlers: LayerPanelHandlers) {
  const toggle = h("button", { type: "button", class: "panel-toggle", "aria-expanded": "true", "aria-controls": "panel-content" }, "レイヤー");
  const content = h("div", { class: "panel-content", id: "panel-content" });
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    content.hidden = expanded;
  });

  const query = h("input", { type: "search", id: "place-search", placeholder: "地名・住所で移動", "aria-label": "地名・住所を検索" });
  const results = h("ul", { class: "search-results", "aria-live": "polite" });
  const form = h("form", { class: "search", role: "search" }, query, h("button", { type: "submit" }, "検索"), results);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = query.value.trim();
    if (!value) return;
    results.replaceChildren(h("li", {}, "検索しています…"));
    try {
      const places = await searchPlace(value);
      results.replaceChildren(...(places.length ? places.map((place) => {
        const button = h("button", { type: "button" }, place.title);
        button.addEventListener("click", () => {
          handlers.onPlace(place.lng, place.lat);
          results.replaceChildren();
        });
        return h("li", {}, button);
      }) : [h("li", {}, "見つかりませんでした")]));
    } catch {
      results.replaceChildren(h("li", { role: "alert" }, "検索できませんでした"));
    }
  });

  const themes = h("fieldset", { class: "layer-group" }, h("legend", {}, "歴史地物"));
  for (const theme of manifest.themes) {
    const checkbox = h("input", { type: "checkbox", name: "theme", value: theme.id, checked: !initial.hiddenThemes.includes(theme.id) });
    checkbox.addEventListener("change", () => handlers.onTheme(theme.id, checkbox.checked));
    themes.append(h("label", { class: "layer-option" }, checkbox, swatch(theme.id), h("span", {}, text(theme.labels)), h("small", {}, SYMBOLS[theme.id] ?? "")));
  }

  const rasters = h("fieldset", { class: "layer-group" }, h("legend", {}, "歴史地図・空中写真"));
  for (const raster of manifest.rasters) {
    const checkbox = h("input", { type: "checkbox", name: "raster", value: raster.id, checked: initial.rasters.includes(raster.id) });
    checkbox.addEventListener("change", () => handlers.onRaster(raster.id, checkbox.checked));
    rasters.append(h("label", { class: "layer-option", title: text(raster.description) }, checkbox, h("span", {}, text(raster.title)), h("small", {}, raster.date)));
  }
  const rasterOpacity = h("input", { type: "range", min: 0, max: 1, step: 0.05, value: 0.7, "aria-label": "歴史地図の不透明度" });
  rasterOpacity.addEventListener("input", () => handlers.onRasterOpacity(Number(rasterOpacity.value)));
  if (manifest.rasters.length) rasters.append(h("label", { class: "slider-option" }, h("span", {}, "不透明度"), rasterOpacity));

  const base = h("select", { "aria-label": "背景地図" }, ...(Object.keys(BASE_MAPS) as BaseMapId[]).map((id) => h("option", { value: id }, BASE_MAPS[id].label)));
  base.addEventListener("change", () => handlers.onBase(base.value as BaseMapId));
  const baseOpacity = h("input", { type: "range", min: 0, max: 1, step: 0.05, value: 1, "aria-label": "背景地図の濃さ" });
  baseOpacity.addEventListener("input", () => handlers.onBaseOpacity(Number(baseOpacity.value)));
  const background = h("fieldset", { class: "layer-group" }, h("legend", {}, "背景地図（現在）"), base, h("label", { class: "slider-option" }, h("span", {}, "濃さ"), baseOpacity));

  const sources = h(
    "details",
    { class: "layer-group sources" },
    h("summary", {}, `収録データ（${manifest.datasets.length}件）`),
    h("ul", {}, ...manifest.datasets.map((dataset) => h("li", {}, h("strong", {}, text(dataset.title, dataset.defaultLanguage)), dataset.attribution ? h("small", {}, dataset.attribution) : null))),
  );

  content.append(form, themes, ...(manifest.rasters.length ? [rasters] : []), background, sources);
  root.append(h("div", { class: "panel-head" }, h("h1", { class: "brand" }, "Chronomap"), toggle), content);
  return {
    collapse() {
      toggle.setAttribute("aria-expanded", "false");
      content.hidden = true;
    },
  };
}
