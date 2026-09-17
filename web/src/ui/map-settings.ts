import type { UiCopy } from "./copy";

export interface MapDisplaySettings {
  readonly basemapOpacity: number;
  readonly historicalOpacity: number;
  readonly historicalVisible: boolean;
}

export interface MapSettingsController {
  readonly element: HTMLDetailsElement;
  getSettings(): MapDisplaySettings;
}

export function createMapSettings(copy: UiCopy, onChange: (settings: MapDisplaySettings) => void): MapSettingsController {
  let settings: MapDisplaySettings = { basemapOpacity: 1, historicalOpacity: 1, historicalVisible: true };
  const details = document.createElement("details");
  details.className = "map-tools";
  details.dataset.mapSettings = "";
  const summary = document.createElement("summary");
  summary.textContent = copy.mapSettings;
  details.append(summary);

  const body = document.createElement("div");
  body.className = "map-tools-body";
  body.append(rangeControl(copy.basemapOpacityLabel, copy.mapOpacityValue, settings.basemapOpacity, "basemap-opacity", (value) => {
    settings = { ...settings, basemapOpacity: value };
    onChange(settings);
  }));
  body.append(rangeControl(copy.historicalOpacityLabel, copy.mapOpacityValue, settings.historicalOpacity, "historical-opacity", (value) => {
    settings = { ...settings, historicalOpacity: value };
    onChange(settings);
  }));
  const visibilityLabel = document.createElement("label");
  visibilityLabel.className = "map-visibility-control";
  const visibility = document.createElement("input");
  visibility.type = "checkbox";
  visibility.checked = settings.historicalVisible;
  visibility.id = "historical-visibility";
  visibility.addEventListener("change", () => {
    settings = { ...settings, historicalVisible: visibility.checked };
    onChange(settings);
  });
  visibilityLabel.append(visibility, document.createTextNode(copy.historicalVisibilityLabel));
  body.append(visibilityLabel);

  const legend = document.createElement("section");
  legend.className = "map-legend";
  const heading = document.createElement("h4");
  heading.textContent = copy.mapLegend;
  legend.append(heading);
  legend.append(legendItem("point", copy.legendPoint), legendItem("line", copy.legendLine), legendItem("polygon", copy.legendPolygon), legendItem("selected", copy.legendSelected));
  body.append(legend);
  details.append(body);

  return { element: details, getSettings: () => settings };
}

function rangeControl(labelText: string, formatValue: (value: number) => string, initial: number, id: string, onChange: (value: number) => void): HTMLElement {
  const wrapper = document.createElement("label");
  wrapper.className = "map-range-control";
  const text = document.createElement("span");
  text.textContent = labelText;
  const output = document.createElement("output");
  output.htmlFor = id;
  output.textContent = formatValue(initial);
  const input = document.createElement("input");
  input.id = id;
  input.type = "range";
  input.min = "0";
  input.max = "1";
  input.step = "0.05";
  input.value = String(initial);
  input.setAttribute("aria-label", labelText);
  input.addEventListener("input", () => {
    const value = clamp(Number(input.value));
    output.textContent = formatValue(value);
    onChange(value);
  });
  wrapper.append(text, output, input);
  return wrapper;
}

function legendItem(kind: "point" | "line" | "polygon" | "selected", label: string): HTMLElement {
  const item = document.createElement("div");
  item.className = "legend-item";
  const swatch = document.createElement("span");
  swatch.className = `legend-swatch legend-${kind}`;
  swatch.setAttribute("aria-hidden", "true");
  item.append(swatch, document.createTextNode(label));
  return item;
}

function clamp(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
