import { displayYearLocalized, initialYear, localizedText, recordedYears } from "../domain/labels";
import type { AppEvent, AppState } from "../app/state";
import { reduce } from "../app/state";
import type { Dataset, PublicBundle } from "../domain/types";
import { parseSharedState, sharedQuery } from "../domain/share-state";
import type { MapCamera } from "../map/map-adapter";
import { renderFeatureList } from "./feature-list";
import { renderMetadataPanel } from "./metadata-panel";
import { uiCopy, type UiCopy } from "./copy";

export interface MapAdapterLike { mount(container: HTMLElement): void; setFeatures(features: AppState["visibleFeatures"]): void; setSelectedFeature(id: string | null): void; setViewport?(bbox: Dataset["bbox"]): void; setCamera?(camera: MapCamera): void; getCamera?(): MapCamera | null; onSelect?(handler: (ids: readonly string[]) => void): void; onCameraChange?(handler: (camera: MapCamera) => void): void; onBasemapError?(handler: (message: string) => void): void; retry?(): void; destroy?(): void; }
export interface AppController { setMapAdapter(adapter: MapAdapterLike): void; reportBasemapFailure(message: string): void; retry(): void; destroy(): void; }

export function mountUiShell(root: HTMLElement, bundle: PublicBundle, dispatch: (event: AppEvent) => void): AppController {
  const copy = uiCopy(bundle.dataset.defaultLanguage);
  const years = authoredYears(bundle, initialYear(bundle.dataset));
  const shared = typeof window === "undefined" ? {} : parseSharedState(window.location.search);
  const datasetSlug = datasetKey(bundle.dataset.id);
  const sharedMatchesDataset = !shared.dataset || shared.dataset === datasetSlug;
  const sharedYear = sharedMatchesDataset && shared.year !== undefined && yearWithinDataset(shared.year, bundle.dataset) ? shared.year : undefined;
  const requestedCamera = sharedMatchesDataset ? cameraFromSharedState(shared) : null;
  let pendingFeatureId = sharedMatchesDataset ? shared.featureId ?? null : null;
  if (typeof document !== "undefined") document.documentElement.lang = copy.language;
  let state: AppState = { status: "loading", selectedYear: sharedYear ?? initialYear(bundle.dataset), visibleFeatures: [], selectedFeatureId: null, activeMobileTab: "list", error: null, allFeatures: [] };
  let adapter: MapAdapterLike | null = null;
  let lastFeatureId: string | null = null;
  root.replaceChildren();

  const shell = document.createElement("div"); shell.className = "app-shell"; root.append(shell);
  const header = document.createElement("header"); header.className = "app-header";
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = copy.language === "ja" ? "歴史地図パイロット" : "Historical map pilot";
  const title = document.createElement("h1"); title.textContent = localizedText(bundle.dataset.title, bundle.dataset.defaultLanguage);
  const description = document.createElement("p"); description.className = "dataset-description"; description.textContent = localizedText(bundle.dataset.description, bundle.dataset.defaultLanguage); header.append(eyebrow, title, description); shell.append(header);

  const controls = document.createElement("div"); controls.className = "year-controls";
  const previous = button(copy.previousYear); previous.dataset.yearPrevious = "";
  const yearField = document.createElement("div"); yearField.className = "year-field";
  const label = document.createElement("label"); label.htmlFor = "selected-year"; label.textContent = copy.yearLabel;
  const input = document.createElement("input"); input.id = "selected-year"; input.type = "number"; input.inputMode = "numeric"; input.min = String(years[0] ?? initialYear(bundle.dataset)); input.max = String(years.at(-1) ?? initialYear(bundle.dataset)); input.setAttribute("aria-describedby", "recorded-year-hint");
  const directLabel = document.createElement("span"); directLabel.className = "direct-year-label"; directLabel.textContent = copy.directYearLabel;
  yearField.append(label, input, directLabel);
  const recordedField = document.createElement("div"); recordedField.className = "recorded-field";
  const recordedLabel = document.createElement("label"); recordedLabel.htmlFor = "recorded-year"; recordedLabel.textContent = copy.recordedLabel;
  const snapshotSelect = document.createElement("select"); snapshotSelect.id = "recorded-year"; snapshotSelect.setAttribute("aria-describedby", "recorded-year-hint");
  for (const year of years) { const option = document.createElement("option"); option.value = String(year); option.textContent = displayYearLocalized(year, bundle.dataset.defaultLanguage); snapshotSelect.append(option); }
  recordedField.append(recordedLabel, snapshotSelect);
  const next = button(copy.nextYear); next.dataset.yearNext = "";
  const shareButton = button(copy.shareView); shareButton.dataset.shareView = "";
  const hint = document.createElement("p"); hint.id = "recorded-year-hint"; hint.className = "year-hint"; hint.textContent = copy.recordedHint;
  const shownYear = document.createElement("p"); shownYear.className = "shown-year";
  const shareUrl = document.createElement("input"); shareUrl.type = "url"; shareUrl.readOnly = true; shareUrl.hidden = true; shareUrl.className = "share-url"; shareUrl.setAttribute("aria-label", copy.shareUrlLabel); shareUrl.dataset.shareUrl = "";
  const shareNotice = document.createElement("p"); shareNotice.className = "share-notice"; shareNotice.hidden = true; shareNotice.setAttribute("role", "status"); shareNotice.setAttribute("aria-live", "polite"); shareNotice.dataset.shareFeedback = "";
  controls.append(previous, yearField, recordedField, next, shareButton, hint, shownYear, shareUrl, shareNotice); header.append(controls);

  const content = document.createElement("main"); content.id = "chronomap-main"; content.tabIndex = -1; content.className = "shell-content"; shell.append(content);
  const live = document.createElement("p"); live.className = "live-status"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite"); content.append(live);
  const basemapAlert = document.createElement("p"); basemapAlert.className = "basemap-alert"; basemapAlert.setAttribute("role", "alert"); basemapAlert.hidden = true; content.append(basemapAlert);
  const basemapRetry = button(copy.retryBasemap); basemapRetry.dataset.basemapRetry = ""; basemapRetry.hidden = true; content.append(basemapRetry);
  const retry = button(copy.retryDataset); retry.hidden = true; content.append(retry);
  const map = document.createElement("section"); map.className = "map-placeholder"; map.dataset.mapHost = ""; map.setAttribute("aria-label", copy.mapLabel); map.textContent = copy.mapFallback; content.append(map);
  const sidebar = document.createElement("section"); sidebar.className = "sidebar";
  const tabs = document.createElement("div"); tabs.className = "mobile-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", copy.featureInformation);
  const listTab = tab("list", copy.featureList); const detailTab = tab("detail", copy.details); tabs.append(listTab, detailTab); sidebar.append(tabs);
  const candidates = document.createElement("section"); candidates.className = "map-candidates"; candidates.hidden = true; sidebar.append(candidates);
  const listPanel = document.createElement("section"); listPanel.id = "panel-list"; listPanel.className = "list-panel"; listPanel.setAttribute("role", "tabpanel"); listPanel.setAttribute("aria-labelledby", "tab-list");
  const detailPanel = document.createElement("section"); detailPanel.id = "panel-detail"; detailPanel.className = "detail-panel"; detailPanel.setAttribute("role", "tabpanel"); detailPanel.setAttribute("aria-labelledby", "tab-detail"); detailPanel.tabIndex = -1; sidebar.append(listPanel, detailPanel); content.append(sidebar);
  const footer = document.createElement("footer"); footer.innerHTML = `${copy.footerBasemap}: <a href="https://maps.gsi.go.jp/development/ichiran.html">GSI Maps</a>.`; shell.append(footer);

  const focusDetails = () => { if (window.matchMedia?.("(min-width: 48rem)").matches) detailPanel.focus(); else detailTab.focus(); };
  const syncUrl = () => {
    if (typeof window === "undefined" || !window.history?.replaceState) return;
    const camera = adapter?.getCamera?.() ?? requestedCamera;
    const query = sharedQuery({ dataset: datasetSlug, year: state.selectedYear, featureId: state.selectedFeatureId, longitude: camera?.longitude ?? null, latitude: camera?.latitude ?? null, zoom: camera?.zoom ?? null });
    window.history.replaceState(null, "", `${window.location.pathname}${query}${window.location.hash}`);
  };
  const setShareNotice = (message: string) => { shareNotice.hidden = false; shareNotice.textContent = message; };
  const shareCurrentView = async () => {
    syncUrl();
    const url = typeof window === "undefined" ? "" : window.location.href;
    shareUrl.value = url;
    const selected = state.visibleFeatures.find((feature) => feature.id === state.selectedFeatureId);
    const title = `${localizedText(bundle.dataset.title, bundle.dataset.defaultLanguage)} — ${displayYearLocalized(state.selectedYear, bundle.dataset.defaultLanguage)}${selected ? ` — ${localizedText(selected.properties.labels, bundle.dataset.defaultLanguage)}` : ""}`;
    const shareApi = navigator as Navigator & { share?: (data: { title: string; text: string; url: string }) => Promise<void> };
    if (typeof shareApi.share === "function") {
      try { await shareApi.share({ title, text: title, url }); setShareNotice(copy.shareCopied); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") { setShareNotice(copy.shareCancelled); return; } }
    }
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setShareNotice(copy.shareCopied); return; } }
    catch { /* Fall through to a selectable URL for locked-down browsers. */ }
    shareUrl.hidden = false; shareUrl.focus(); shareUrl.select(); setShareNotice(copy.shareUnavailable);
  };
  const update = () => {
    input.value = String(state.selectedYear);
    snapshotSelect.value = years.includes(state.selectedYear) ? String(state.selectedYear) : "";
    const disabled = state.status === "loading" || state.status === "retrying";
    const previousYear = adjacentYear(years, state.selectedYear, -1); const nextYear = adjacentYear(years, state.selectedYear, 1);
    previous.disabled = disabled || previousYear === null; next.disabled = disabled || nextYear === null; input.disabled = disabled; snapshotSelect.disabled = disabled;
    shownYear.textContent = copy.showingYear(state.selectedYear); shownYear.dataset.currentYear = String(state.selectedYear);
    live.textContent = statusText(state, copy);
    basemapAlert.hidden = !state.basemapError; basemapAlert.textContent = state.basemapError ? copy.basemapFailure(state.basemapError) : ""; basemapRetry.hidden = !state.basemapError || !adapter?.retry; retry.hidden = state.status !== "failed";
    listPanel.hidden = state.activeMobileTab !== "list"; detailPanel.hidden = state.activeMobileTab !== "detail"; listPanel.setAttribute("aria-hidden", String(state.activeMobileTab !== "list")); detailPanel.setAttribute("aria-hidden", String(state.activeMobileTab !== "detail")); listTab.setAttribute("aria-selected", String(state.activeMobileTab === "list")); detailTab.setAttribute("aria-selected", String(state.activeMobileTab === "detail"));
    renderMapCandidates(candidates, state, bundle, copy, (featureId) => { lastFeatureId = featureId; emit({ type: "featureSelected", featureId }); focusDetails(); });
    renderFeatureList(listPanel, state, bundle, (featureId) => { lastFeatureId = featureId; emit({ type: "featureSelected", featureId }); focusDetails(); });
    renderMetadataPanel(detailPanel, state.visibleFeatures.find((feature) => feature.id === state.selectedFeatureId) ?? null, bundle, () => { emit({ type: "detailClosed" }); const returnControl = [...candidates.querySelectorAll<HTMLButtonElement>("[data-map-candidate-id]")].find((button) => button.dataset.mapCandidateId === lastFeatureId) ?? [...listPanel.querySelectorAll<HTMLButtonElement>("[data-feature-id]")].find((button) => button.dataset.featureId === lastFeatureId); returnControl?.focus(); });
  };
  const emit = (event: AppEvent) => {
    state = reduce(state, event); dispatch(event);
    if (event.type === "bundleReady" && pendingFeatureId) {
      const feature = state.visibleFeatures.find((candidate) => candidate.id === pendingFeatureId);
      pendingFeatureId = null;
      if (feature) { state = reduce(state, { type: "featureSelected", featureId: feature.id }); dispatch({ type: "featureSelected", featureId: feature.id }); }
    }
    syncUrl(); adapter?.setFeatures(state.visibleFeatures); adapter?.setSelectedFeature(state.selectedFeatureId); update();
  };
  const commitYear = () => { const value = Number(input.value); if (Number.isInteger(value)) emit({ type: "yearChanged", year: value }); };
  previous.addEventListener("click", () => { const year = adjacentYear(years, state.selectedYear, -1); if (year !== null) emit({ type: "yearChanged", year }); });
  next.addEventListener("click", () => { const year = adjacentYear(years, state.selectedYear, 1); if (year !== null) emit({ type: "yearChanged", year }); });
  input.addEventListener("change", commitYear); input.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); commitYear(); } });
  snapshotSelect.addEventListener("change", () => { const value = Number(snapshotSelect.value); if (Number.isInteger(value)) emit({ type: "yearChanged", year: value }); });
  shareButton.addEventListener("click", () => void shareCurrentView());
  listTab.addEventListener("click", () => emit({ type: "mobileTabChanged", tab: "list" })); detailTab.addEventListener("click", () => emit({ type: "mobileTabChanged", tab: "detail" })); tabs.addEventListener("keydown", (event) => { if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return; event.preventDefault(); const nextTab = event.key === "ArrowLeft" ? (state.activeMobileTab === "list" ? detailTab : listTab) : (state.activeMobileTab === "list" ? detailTab : listTab); nextTab.focus(); nextTab.click(); });
  const controller: AppController = { setMapAdapter(nextAdapter) { adapter?.destroy?.(); adapter = nextAdapter; adapter.onSelect?.((featureIds) => { if (featureIds.length === 1) { lastFeatureId = featureIds[0]!; emit({ type: "mapCandidatesReported", featureIds }); focusDetails(); } else emit({ type: "mapCandidatesReported", featureIds }); }); adapter.onCameraChange?.(() => syncUrl()); adapter.onBasemapError?.((error) => emit({ type: "basemapFailed", error })); try { adapter.mount(map); if (requestedCamera) adapter.setCamera?.(requestedCamera); adapter.setViewport?.(bundle.dataset.bbox); adapter.setFeatures(state.visibleFeatures); adapter.setSelectedFeature(state.selectedFeatureId); syncUrl(); } catch { controller.reportBasemapFailure(copy.language === "ja" ? "地図の初期化に失敗しました。" : "Basemap or map rendering could not start."); } }, reportBasemapFailure(message) { emit({ type: "basemapFailed", error: message }); }, retry() { emit({ type: "retryStarted" }); }, destroy() { adapter?.destroy?.(); adapter = null; root.replaceChildren(); } };
  basemapRetry.addEventListener("click", () => { try { adapter?.retry?.(); emit({ type: "basemapRecovered" }); } catch { controller.reportBasemapFailure(copy.language === "ja" ? "背景地図を再起動できませんでした。" : "Basemap or map rendering could not restart."); } });
  retry.addEventListener("click", () => controller.retry()); emit({ type: "bundleReady", features: bundle.features, year: state.selectedYear }); return controller;
}

function authoredYears(bundle: PublicBundle, fallback: number): readonly number[] { const years = [...recordedYears(bundle.features)]; if (!years.includes(fallback)) years.push(fallback); return years.sort((a, b) => a - b); }
function adjacentYear(years: readonly number[], current: number, direction: -1 | 1): number | null { if (!years.length) return null; const index = years.indexOf(current); if (index >= 0) return years[index + direction] ?? null; if (direction < 0) return [...years].reverse().find((year) => year < current) ?? null; return years.find((year) => year > current) ?? null; }
function datasetKey(id: string): string { return id.split(":", 1)[0] ?? id; }
function yearWithinDataset(year: number, dataset: Dataset): boolean { const minimum = dataset.temporalExtent.start?.earliestYear; const maximum = dataset.temporalExtent.end?.latestYear; return (minimum === null || minimum === undefined || year >= minimum) && (maximum === null || maximum === undefined || year <= maximum); }
function cameraFromSharedState(state: ReturnType<typeof parseSharedState>): MapCamera | null { return state.longitude !== undefined && state.latitude !== undefined && state.zoom !== undefined ? { longitude: state.longitude, latitude: state.latitude, zoom: state.zoom } : null; }
function button(text: string): HTMLButtonElement { const element = document.createElement("button"); element.type = "button"; element.textContent = text; return element; }
function tab(name: "list" | "detail", text: string): HTMLButtonElement { const element = button(text); element.id = `tab-${name}`; element.setAttribute("role", "tab"); element.setAttribute("aria-controls", `panel-${name}`); return element; }
function renderMapCandidates(container: HTMLElement, state: AppState, bundle: PublicBundle, copy: UiCopy, select: (id: string) => void): void { const features = (state.mapCandidateIds ?? []).map((id) => state.visibleFeatures.find((feature) => feature.id === id)).filter((feature): feature is NonNullable<typeof feature> => Boolean(feature)); container.hidden = features.length < 2; container.replaceChildren(); if (!features.length) return; const heading = document.createElement("h2"); heading.textContent = copy.mapCandidates; container.append(heading); for (const feature of features) { const candidate = button(localizedText(feature.properties.labels, bundle.dataset.defaultLanguage)); candidate.dataset.mapCandidateId = feature.id; candidate.addEventListener("click", () => select(feature.id)); container.append(candidate); } }
function statusText(state: AppState, copy: UiCopy): string { switch (state.status) { case "loading": return copy.language === "ja" ? "公開データを読み込んでいます…" : "Loading dataset…"; case "ready": return copy.language === "ja" ? "公開データを利用できます。" : "Dataset available."; case "no-match": return copy.language === "ja" ? "この収録年に一致する公開地物はありません。" : "No features match the selected year."; case "selection-cleared": return copy.language === "ja" ? "選択中の地物はこの年には表示されないため、選択を解除しました。" : "The selected feature is not visible for this year; selection cleared."; case "failed": return copy.language === "ja" ? `公開データを読み込めませんでした。${state.error ?? "再試行してください。"}` : `Dataset failed to load. ${state.error ?? "Please retry."}`; case "retrying": return copy.language === "ja" ? "公開データを再読み込みしています…" : "Retrying dataset load…"; } }
