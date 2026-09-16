import { initialYear, localizedText, displayYear } from "../domain/labels";
import type { AppEvent, AppState } from "../app/state";
import { reduce } from "../app/state";
import type { PublicBundle } from "../domain/types";
import { renderFeatureList } from "./feature-list";
import { renderMetadataPanel } from "./metadata-panel";

export interface MapAdapterLike { setFeatures(features: AppState["visibleFeatures"]): void; setSelectedFeature(id: string | null): void; destroy?(): void; }
export interface AppController { setMapAdapter(adapter: MapAdapterLike): void; retry(): void; destroy(): void; }

export function mountUiShell(root: HTMLElement, bundle: PublicBundle, dispatch: (event: AppEvent) => void): AppController {
  let state: AppState = { status: "loading", selectedYear: initialYear(bundle.dataset), visibleFeatures: [], selectedFeatureId: null, activeMobileTab: "list", error: null, allFeatures: [] };
  let adapter: MapAdapterLike | null = null;
  let lastTrigger: HTMLElement | null = null;
  const emit = (event: AppEvent) => { state = reduce(state, event); dispatch(event); adapter?.setFeatures(state.visibleFeatures); adapter?.setSelectedFeature(state.selectedFeatureId); render(); };
  const render = () => {
    root.replaceChildren();
    const skip = document.createElement("a"); skip.className = "skip-link"; skip.href = "#chronomap-main"; skip.textContent = "Skip to main content"; root.append(skip);
    const shell = document.createElement("div"); shell.className = "app-shell";
    const header = document.createElement("header");
    const title = document.createElement("h1"); title.textContent = localizedText(bundle.dataset.title, bundle.dataset.defaultLanguage); header.append(title);
    const description = document.createElement("p"); description.textContent = localizedText(bundle.dataset.description, bundle.dataset.defaultLanguage); header.append(description);
    const controls = document.createElement("div"); controls.className = "year-controls";
    const previous = document.createElement("button"); previous.type = "button"; previous.textContent = "Previous year"; previous.disabled = state.status === "loading" || state.status === "retrying"; previous.addEventListener("click", () => emit({ type: "yearChanged", year: state.selectedYear - 1 })); controls.append(previous);
    const label = document.createElement("label"); label.htmlFor = "selected-year"; label.textContent = "Year"; controls.append(label);
    const input = document.createElement("input"); input.id = "selected-year"; input.type = "number"; input.inputMode = "numeric"; input.value = String(state.selectedYear); input.disabled = state.status === "loading" || state.status === "retrying"; input.addEventListener("change", () => { const value = Number(input.value); if (Number.isInteger(value)) emit({ type: "yearChanged", year: value }); }); controls.append(input);
    const next = document.createElement("button"); next.type = "button"; next.textContent = "Next year"; next.disabled = state.status === "loading" || state.status === "retrying"; next.addEventListener("click", () => emit({ type: "yearChanged", year: state.selectedYear + 1 })); controls.append(next);
    const shownYear = document.createElement("p"); shownYear.textContent = `Showing possible activity overlapping ${displayYear(state.selectedYear)}.`; controls.append(shownYear); header.append(controls); shell.append(header);
    const main = document.createElement("main"); main.id = "chronomap-main"; main.tabIndex = -1;
    const live = document.createElement("p"); live.className = "live-status"; live.setAttribute("aria-live", "polite"); live.setAttribute("role", state.status === "failed" ? "alert" : "status"); live.textContent = statusText(state); main.append(live);
    if (state.status === "failed") { const retry = document.createElement("button"); retry.type = "button"; retry.textContent = "Retry loading dataset"; retry.addEventListener("click", () => controller.retry()); main.append(retry); }
    const map = document.createElement("section"); map.className = "map-placeholder"; map.setAttribute("aria-label", "Map area"); map.textContent = "Map will be available here. The feature list provides the same historical information."; main.append(map);
    const sidebar = document.createElement("section"); sidebar.className = "sidebar";
    const tabs = document.createElement("div"); tabs.className = "mobile-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Feature information");
    for (const [tab, text] of [["list", "Feature list"], ["detail", "Details"]] as const) { const button = document.createElement("button"); button.type = "button"; button.id = `tab-${tab}`; button.setAttribute("role", "tab"); button.setAttribute("aria-controls", `panel-${tab}`); button.setAttribute("aria-selected", String(state.activeMobileTab === tab)); button.textContent = text; button.addEventListener("click", () => emit({ type: "mobileTabChanged", tab })); tabs.append(button); }
    sidebar.append(tabs);
    const listPanel = document.createElement("section"); listPanel.id = "panel-list"; listPanel.className = "list-panel"; listPanel.setAttribute("role", "tabpanel"); listPanel.setAttribute("aria-labelledby", "tab-list"); listPanel.hidden = state.activeMobileTab !== "list";
    renderFeatureList(listPanel, state, bundle, (featureId, trigger) => { lastTrigger = trigger; emit({ type: "featureSelected", featureId }); }); sidebar.append(listPanel);
    const detailPanel = document.createElement("section"); detailPanel.id = "panel-detail"; detailPanel.className = "detail-panel"; detailPanel.setAttribute("role", "tabpanel"); detailPanel.setAttribute("aria-labelledby", "tab-detail"); detailPanel.hidden = state.activeMobileTab !== "detail";
    renderMetadataPanel(detailPanel, state.visibleFeatures.find((feature) => feature.id === state.selectedFeatureId) ?? null, bundle, () => { emit({ type: "selectionCleared" }); lastTrigger?.focus(); }); sidebar.append(detailPanel); main.append(sidebar); shell.append(main);
    const footer = document.createElement("footer"); footer.textContent = "Map attribution will be shown here when the map is enabled."; shell.append(footer); root.append(shell);
  };
  const controller: AppController = { setMapAdapter(nextAdapter) { adapter?.destroy?.(); adapter = nextAdapter; adapter.setFeatures(state.visibleFeatures); adapter.setSelectedFeature(state.selectedFeatureId); }, retry() { emit({ type: "retryStarted" }); }, destroy() { adapter?.destroy?.(); adapter = null; root.replaceChildren(); } };
  emit({ type: "bundleReady", features: bundle.features, year: state.selectedYear });
  return controller;
}

function statusText(state: AppState): string {
  switch (state.status) { case "loading": return "Loading dataset…"; case "ready": return "Dataset available."; case "no-match": return "No features match the selected year."; case "selection-cleared": return "The selected feature is not visible for this year; selection cleared."; case "failed": return `Dataset failed to load. ${state.error ?? "Please retry."}`; case "retrying": return "Retrying dataset load…"; }
}
