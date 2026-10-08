import { localizedText } from "../domain/labels";
import type { HistoricalMapAsset } from "../domain/types";
import type { UiCopy } from "./copy";

export interface MapDisplaySettings {
  readonly basemapOpacity: number;
  readonly historicalOpacity: number;
  readonly historicalVisible: boolean;
  readonly territoryVisible: boolean;
  readonly historicalMapAssetOpacity?: number;
  readonly historicalMapAssetVisible?: boolean;
}

export interface MapSettingsController {
  readonly element: HTMLDetailsElement;
  getSettings(): MapDisplaySettings;
  setHistoricalMapAsset(asset: HistoricalMapAsset | null): void;
}

export function createMapSettings(
  copy: UiCopy,
  onChange: (settings: MapDisplaySettings) => void,
  assetInput: HistoricalMapAsset | readonly HistoricalMapAsset[] | null = null,
  onAssetChange: (asset: HistoricalMapAsset) => void = () => undefined,
): MapSettingsController {
  const assets: readonly HistoricalMapAsset[] = Array.isArray(assetInput) ? [...assetInput] : assetInput ? [assetInput] : [];
  let selectedAsset = assets[0] ?? null;
  let settings: MapDisplaySettings = { basemapOpacity: 1, historicalOpacity: 1, historicalVisible: true, territoryVisible: true };
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
  const territoryVisibilityLabel = document.createElement("label");
  territoryVisibilityLabel.className = "map-visibility-control";
  const territoryVisibility = document.createElement("input");
  territoryVisibility.type = "checkbox";
  territoryVisibility.checked = settings.territoryVisible;
  territoryVisibility.id = "territory-visibility";
  territoryVisibility.addEventListener("change", () => {
    settings = { ...settings, territoryVisible: territoryVisibility.checked };
    onChange(settings);
  });
  territoryVisibilityLabel.append(territoryVisibility, document.createTextNode(copy.territoryVisibilityLabel));
  body.append(territoryVisibilityLabel);

  let assetSelect: HTMLSelectElement | null = null;
  let assetTitle: HTMLElement | null = null;
  let assetDescription: HTMLElement | null = null;
  let assetProvenance: HTMLElement | null = null;
  let assetSource: HTMLAnchorElement | null = null;
  if (assets.length) {
    settings = { ...settings, historicalMapAssetOpacity: 1, historicalMapAssetVisible: true };
    const assetSection = document.createElement("section");
    assetSection.className = "historical-map-asset-control";
    if (assets.length > 1) {
      const assetSelectLabel = document.createElement("label");
      assetSelectLabel.className = "historical-map-asset-select";
      assetSelectLabel.textContent = copy.historicalMapAssetSelectLabel;
      assetSelect = document.createElement("select");
      assetSelect.id = "historical-map-asset-select";
      assetSelect.setAttribute("aria-label", copy.historicalMapAssetSelectLabel);
      for (const candidate of assets) {
        const option = document.createElement("option");
        option.value = candidate.id;
        option.textContent = `${localizedText(candidate.title, copy.language)} · ${candidate.date}`;
        assetSelect.append(option);
      }
      assetSelectLabel.append(assetSelect);
      assetSection.append(assetSelectLabel);
      assetSelect.addEventListener("change", () => {
        const next = assets.find((candidate) => candidate.id === assetSelect?.value);
        if (!next) return;
        selectedAsset = next;
        renderAssetMetadata();
        onAssetChange(next);
      });
    }
    assetTitle = document.createElement("h4");
    assetTitle.textContent = selectedAsset ? localizedText(selectedAsset.title, copy.language) : copy.historicalMapAssetUnavailable;
    assetSection.append(assetTitle);
    assetDescription = document.createElement("p");
    assetSection.append(assetDescription);
    assetProvenance = document.createElement("p");
    assetProvenance.className = "historical-map-asset-provenance";
    assetSection.append(assetProvenance);
    assetSource = document.createElement("a");
    assetSource.target = "_blank";
    assetSource.rel = "noreferrer";
    assetSource.textContent = copy.sourceLink;
    assetSource.dataset.historicalMapAssetSource = "";
    assetSection.append(assetSource);
    assetSection.append(rangeControl(copy.historicalMapAssetOpacityLabel, copy.mapOpacityValue, 1, "historical-map-asset-opacity", (value) => {
      settings = { ...settings, historicalMapAssetOpacity: value };
      onChange(settings);
    }));
    const assetVisibilityLabel = document.createElement("label");
    assetVisibilityLabel.className = "map-visibility-control";
    const assetVisibility = document.createElement("input");
    assetVisibility.type = "checkbox";
    assetVisibility.checked = true;
    assetVisibility.id = "historical-map-asset-visibility";
    assetVisibility.addEventListener("change", () => {
      settings = { ...settings, historicalMapAssetVisible: assetVisibility.checked };
      onChange(settings);
    });
    assetVisibilityLabel.append(assetVisibility, document.createTextNode(copy.historicalMapAssetVisibilityLabel));
    assetSection.append(assetVisibilityLabel);
    body.append(assetSection);
    renderAssetMetadata();
  }

  const legend = document.createElement("section");
  legend.className = "map-legend";
  const heading = document.createElement("h4");
  heading.textContent = copy.mapLegend;
  legend.append(heading);
  legend.append(legendItem("point", copy.legendPoint), legendItem("line", copy.legendLine), legendItem("polygon", copy.legendPolygon), legendItem("territory", copy.legendTerritory), legendItem("selected", copy.legendSelected));
  body.append(legend);
  details.append(body);

  return {
    element: details,
    getSettings: () => settings,
    setHistoricalMapAsset(asset) {
      const next = assets.find((candidate) => candidate.id === asset?.id) ?? assets[0] ?? null;
      selectedAsset = next;
      if (assetSelect && next) assetSelect.value = next.id;
      renderAssetMetadata();
    },
  };

  function renderAssetMetadata(): void {
    if (!selectedAsset || !assetTitle || !assetDescription || !assetProvenance || !assetSource) return;
    assetTitle.textContent = localizedText(selectedAsset.title, copy.language);
    assetDescription.textContent = selectedAsset.description[copy.language] ?? selectedAsset.description["en"] ?? Object.values(selectedAsset.description)[0] ?? "";
    assetProvenance.textContent = `${selectedAsset.date} · ${selectedAsset.georeference.method} (${selectedAsset.georeference.error}) · ${selectedAsset.attribution} · ${selectedAsset.rights.status}`;
    assetSource.href = selectedAsset.sourceUrl;
  }
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

function legendItem(kind: "point" | "line" | "polygon" | "territory" | "selected", label: string): HTMLElement {
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
