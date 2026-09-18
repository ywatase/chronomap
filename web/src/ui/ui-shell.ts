import { displayYearLocalized, initialYear, localizedText, recordedYears } from "../domain/labels";
import type { AppEvent, AppState } from "../app/state";
import { reduce } from "../app/state";
import type { Dataset, PublicBundle } from "../domain/types";
import { parseSharedState, sharedQuery } from "../domain/share-state";
import type { MapCamera } from "../map/map-adapter";
import { renderFeatureList } from "./feature-list";
import { comparisonCandidates } from "../domain/comparison-candidates";
import { renderComparisonCards } from "./comparison-card";
import { renderMetadataPanel } from "./metadata-panel";
import { uiCopy, type UiCopy } from "./copy";
import { buildReportModel } from "../domain/report-model";
import { renderPrintReport } from "./print-report";
import { createMapSettings } from "./map-settings";
import type { Lesson } from "../domain/lesson";
import { lessonStepIndex } from "../domain/lesson";
import { renderLessonPanel } from "./lesson-panel";
import { buildLessonPackModel } from "../domain/lesson-pack-model";
import { customizeLessonPackModel, type LessonPackCustomizationInput } from "../domain/lesson-pack-customization";
import { renderLessonPack } from "./lesson-pack";
import { showLessonPackFeedback, type LessonPackFeedbackState } from "./lesson-pack-feedback";
import { applyLessonPackBuilderInput, renderLessonPackBuilder } from "./lesson-pack-builder";
import type { LessonPackModel } from "../domain/lesson-pack-model";
import { draftFilename, LESSON_PACK_DRAFT_MAX_BYTES, parseLessonPackDraft, serializeLessonPackDraft } from "../domain/lesson-pack-draft";
import { DATASET_CATALOG } from "../domain/dataset-catalog";
import { buildDatasetCatalogViewModel, type DatasetCatalogSnapshots } from "../domain/dataset-catalog-view-model";
import { renderDatasetCatalog } from "./dataset-catalog-dialog";

export interface MapAdapterLike { mount(container: HTMLElement): void; setFeatures(features: AppState["visibleFeatures"]): void; setSelectedFeature(id: string | null): void; setBasemapOpacity?(value: number): void; setHistoricalOpacity?(value: number): void; setHistoricalVisibility?(visible: boolean): void; setViewport?(bbox: Dataset["bbox"]): void; setCamera?(camera: MapCamera): void; getCamera?(): MapCamera | null; onSelect?(handler: (ids: readonly string[]) => void): void; onCameraChange?(handler: (camera: MapCamera) => void): void; onBasemapError?(handler: (message: string) => void): void; retry?(): void; destroy?(): void; }
export interface AppController { setMapAdapter(adapter: MapAdapterLike): void; reportBasemapFailure(message: string): void; retry(): void; destroy(): void; }
export type DatasetCatalogLoader = () => Promise<DatasetCatalogSnapshots>;
export interface UiShellOptions {
  readonly initialBuilderOpen?: boolean;
  readonly initialBuilderInput?: LessonPackCustomizationInput | null;
  readonly onResumeDraft?: (file: File) => Promise<boolean> | boolean;
}

export function mountUiShell(root: HTMLElement, bundle: PublicBundle, dispatch: (event: AppEvent) => void, lesson: Lesson | null = null, catalogLoader: DatasetCatalogLoader | null = null, options: UiShellOptions = {}): AppController {
  const copy = uiCopy(bundle.dataset.defaultLanguage);
  const years = authoredYears(bundle, initialYear(bundle.dataset));
  const shared = typeof window === "undefined" ? {} : parseSharedState(window.location.search);
  const datasetSlug = datasetKey(bundle.dataset.id);
  const sharedMatchesDataset = !shared.dataset || shared.dataset === datasetSlug;
  let rootWelcomeOpen = typeof window !== "undefined" && window.location.pathname === "/" && window.location.search === "" && options.initialBuilderOpen !== true;
  const requestedLessonIndex = lesson && shared.view !== "builder" && sharedMatchesDataset && shared.lessonId === lesson.id ? lessonStepIndex(lesson, shared.lessonStepId) : null;
  const requestedLessonStep = requestedLessonIndex !== null && lesson ? lesson.steps[requestedLessonIndex] : null;
  const sharedYear = sharedMatchesDataset && shared.year !== undefined && yearWithinDataset(shared.year, bundle.dataset) ? shared.year : undefined;
  const requestedCamera = sharedMatchesDataset ? cameraFromSharedState(shared) : null;
  let lessonIndex: number | null = requestedLessonIndex;
  let catalogOpen = shared.view === "catalog" || rootWelcomeOpen;
  let lessonPackOpen = shared.view === "pack" && sharedMatchesDataset && Boolean(lesson && shared.lessonId === lesson.id);
  let builderOpen = (shared.view === "builder" && sharedMatchesDataset && Boolean(lesson && shared.lessonId === lesson.id)) || (options.initialBuilderOpen === true && Boolean(lesson));
  let catalogSnapshots: DatasetCatalogSnapshots | null = null;
  let catalogPromise: Promise<DatasetCatalogSnapshots> | null = null;
  let workshopBaseModel: LessonPackModel | null = null;
  let workshopInput: LessonPackCustomizationInput | null = null;
  let workshopFeedbackState: LessonPackFeedbackState | null = null;
  let workshopPreviewOpen = false;
  let pendingFeatureId = requestedLessonStep?.featureId ?? (sharedMatchesDataset ? shared.featureId ?? null : null);
  if (typeof document !== "undefined") document.documentElement.lang = copy.language;
  let state: AppState = { status: "loading", selectedYear: requestedLessonStep?.year ?? sharedYear ?? initialYear(bundle.dataset), visibleFeatures: [], selectedFeatureId: null, activeMobileTab: "list", error: null, allFeatures: [] };
  let adapter: MapAdapterLike | null = null;
  let lastFeatureId: string | null = null;
  const comparisons = comparisonCandidates(bundle.features);
  let comparisonEntityId: string | null = requestedLessonStep?.comparisonEntityId ?? null;
  root.replaceChildren();

  const shell = document.createElement("div"); shell.className = "app-shell"; root.append(shell);
  if (rootWelcomeOpen) shell.dataset.rootWelcome = "";
  const header = document.createElement("header"); header.className = "app-header";
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = copy.language === "ja" ? "歴史地図パイロット" : "Historical map pilot";
  const title = document.createElement("h1"); title.textContent = localizedText(bundle.dataset.title, bundle.dataset.defaultLanguage);
  const description = document.createElement("p"); description.className = "dataset-description"; description.textContent = localizedText(bundle.dataset.description, bundle.dataset.defaultLanguage); header.append(eyebrow, title, description); shell.append(header);
  const datasetNav = document.createElement("nav");
  datasetNav.className = "dataset-switcher";
  datasetNav.setAttribute("aria-label", copy.datasetCatalogDialogLabel);
  const catalogButton = button(copy.datasetCatalogOpen);
  catalogButton.dataset.datasetCatalogOpen = "";
  catalogButton.setAttribute("aria-haspopup", "dialog");
  catalogButton.setAttribute("aria-expanded", "false");
  datasetNav.append(catalogButton);
  header.append(datasetNav);

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
  const reportButton = button(copy.reportView); reportButton.dataset.reportView = ""; reportButton.hidden = true; reportButton.setAttribute("aria-expanded", "false");
  const hint = document.createElement("p"); hint.id = "recorded-year-hint"; hint.className = "year-hint"; hint.textContent = copy.recordedHint;
  const shownYear = document.createElement("p"); shownYear.className = "shown-year";
  const shareUrl = document.createElement("input"); shareUrl.type = "url"; shareUrl.readOnly = true; shareUrl.hidden = true; shareUrl.className = "share-url"; shareUrl.setAttribute("aria-label", copy.shareUrlLabel); shareUrl.dataset.shareUrl = "";
  const shareNotice = document.createElement("p"); shareNotice.className = "share-notice"; shareNotice.hidden = true; shareNotice.setAttribute("role", "status"); shareNotice.setAttribute("aria-live", "polite"); shareNotice.dataset.shareFeedback = "";
  controls.append(previous, yearField, recordedField, next, shareButton, reportButton, hint, shownYear, shareUrl, shareNotice); header.append(controls);
  const lessonHost = document.createElement("section"); lessonHost.className = "lesson-host"; lessonHost.hidden = !lesson; lessonHost.setAttribute("aria-label", copy.language === "ja" ? "ガイド教材" : "Guided lesson"); header.append(lessonHost);

  const reportDialog = document.createElement("section");
  reportDialog.hidden = true;
  reportDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeReport(); }
  });
  reportDialog.addEventListener("click", (event) => {
    if (event.target === reportDialog) closeReport();
  });
  shell.append(reportDialog);
  const lessonPackDialog = document.createElement("section");
  lessonPackDialog.hidden = true;
  lessonPackDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeLessonPack(); }
    if (event.key === "Tab") cycleDialogFocus(lessonPackDialog, event);
  });
  lessonPackDialog.addEventListener("click", (event) => {
    if (event.target === lessonPackDialog) closeLessonPack();
  });
  shell.append(lessonPackDialog);
  const lessonPackBuilderDialog = document.createElement("section");
  lessonPackBuilderDialog.hidden = true;
  lessonPackBuilderDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeLessonWorkshop(); }
    if (event.key === "Tab") cycleDialogFocus(lessonPackBuilderDialog, event);
  });
  lessonPackBuilderDialog.addEventListener("click", (event) => {
    if (event.target === lessonPackBuilderDialog) closeLessonWorkshop();
  });
  shell.append(lessonPackBuilderDialog);
  const datasetCatalogDialog = document.createElement("section");
  datasetCatalogDialog.hidden = true;
  datasetCatalogDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeDatasetCatalog(); }
    if (event.key === "Tab" && !rootWelcomeOpen) cycleDialogFocus(datasetCatalogDialog, event);
  });
  datasetCatalogDialog.addEventListener("click", (event) => {
    if (event.target === datasetCatalogDialog) closeDatasetCatalog();
  });
  shell.append(datasetCatalogDialog);

  const content = document.createElement("main"); content.id = "chronomap-main"; content.tabIndex = -1; content.className = "shell-content"; shell.append(content);
  const live = document.createElement("p"); live.className = "live-status"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite"); content.append(live);
  const basemapAlert = document.createElement("p"); basemapAlert.className = "basemap-alert"; basemapAlert.setAttribute("role", "alert"); basemapAlert.hidden = true; content.append(basemapAlert);
  const basemapRetry = button(copy.retryBasemap); basemapRetry.dataset.basemapRetry = ""; basemapRetry.hidden = true; content.append(basemapRetry);
  const retry = button(copy.retryDataset); retry.hidden = true; content.append(retry);
  const mapFrame = document.createElement("section"); mapFrame.className = "map-frame";
  const map = document.createElement("section"); map.className = "map-placeholder"; map.dataset.mapHost = ""; map.setAttribute("aria-label", copy.mapLabel); map.textContent = copy.mapFallback;
  const mapSettings = createMapSettings(copy, (settings) => { adapter?.setBasemapOpacity?.(settings.basemapOpacity); adapter?.setHistoricalOpacity?.(settings.historicalOpacity); adapter?.setHistoricalVisibility?.(settings.historicalVisible); });
  mapFrame.append(map, mapSettings.element); content.append(mapFrame);
  const sidebar = document.createElement("section"); sidebar.className = "sidebar";
  const comparison = document.createElement("section"); comparison.className = "comparison"; sidebar.append(comparison);
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
    const activeLesson = lesson && (lessonIndex !== null || builderOpen || lessonPackOpen) ? lesson : null;
    const activeStep = activeLesson && lessonIndex !== null ? activeLesson.steps[lessonIndex] ?? null : null;
    const view = builderOpen ? "builder" : lessonPackOpen ? "pack" : catalogOpen ? "catalog" : null;
    const query = sharedQuery({ dataset: datasetSlug, view, lessonId: activeLesson?.id ?? null, lessonStepId: activeStep?.id ?? null, year: state.selectedYear, featureId: state.selectedFeatureId, longitude: camera?.longitude ?? null, latitude: camera?.latitude ?? null, zoom: camera?.zoom ?? null });
    window.history.replaceState(null, "", `${window.location.pathname}${query}${window.location.hash}`);
  };
  const setShareNotice = (message: string) => { shareNotice.hidden = false; shareNotice.textContent = message; };
  const closeReport = () => { reportDialog.hidden = true; reportButton.setAttribute("aria-expanded", "false"); reportButton.focus(); };
  const openReport = () => {
    syncUrl();
    const selected = state.visibleFeatures.find((feature) => feature.id === state.selectedFeatureId);
    const candidate = comparisons.find((item) => item.entityId === selected?.properties.entityId) ?? null;
    const model = buildReportModel(bundle, state, typeof window === "undefined" ? "" : window.location.href, candidate);
    if (!model) return;
    renderPrintReport(reportDialog, model, {
      onClose: closeReport,
      onPrint: () => { if (typeof window !== "undefined" && typeof window.print === "function") window.print(); },
    });
    reportDialog.hidden = false;
    reportButton.setAttribute("aria-expanded", "true");
    reportDialog.querySelector<HTMLButtonElement>("[data-report-close]")?.focus();
  };
  const focusWorkshopTrigger = () => {
    const trigger = lessonHost.querySelector<HTMLButtonElement>("[data-lesson-workshop-open]");
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus();
  };
  const closeLessonWorkshop = () => {
    lessonPackBuilderDialog.hidden = true;
    lessonPackDialog.hidden = true;
    workshopPreviewOpen = false;
    builderOpen = false;
    lessonPackOpen = false;
    workshopBaseModel = null;
    workshopInput = null;
    workshopFeedbackState = null;
    syncUrl();
    focusWorkshopTrigger();
  };
  const closeLessonPack = () => {
    if (workshopPreviewOpen) { closeLessonWorkshop(); return; }
    lessonPackDialog.hidden = true;
    lessonPackOpen = false;
    syncUrl();
    const trigger = lessonHost.querySelector<HTMLButtonElement>("[data-lesson-pack-open]");
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus();
  };
  const printLessonPack = () => {
    const feedbackHost = lessonPackDialog.querySelector<HTMLElement>("[data-lesson-pack-feedback-host]");
    if (feedbackHost) showLessonPackFeedback(feedbackHost);
    if (typeof window === "undefined" || typeof window.print !== "function") return;
    document.body.dataset.printDocument = "lesson-pack";
    const clearPrintMode = () => {
      delete document.body.dataset.printDocument;
      window.removeEventListener("afterprint", clearPrintMode);
    };
    window.addEventListener("afterprint", clearPrintMode, { once: true });
    window.print();
    window.setTimeout(clearPrintMode, 1500);
  };
  const setDraftStatus = (message: string, valid: boolean | null = null) => {
    const status = lessonPackBuilderDialog.querySelector<HTMLElement>("[data-lesson-pack-draft-status]");
    if (!status) return;
    status.textContent = message;
    status.dataset.valid = valid === null ? "" : String(valid);
    status.setAttribute("role", valid === false ? "alert" : "status");
  };
  const saveLessonPackDraft = (input: LessonPackCustomizationInput) => {
    if (!workshopBaseModel || typeof Blob === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return;
    const serialized = serializeLessonPackDraft(workshopBaseModel, input);
    if (!serialized) {
      setDraftStatus(copy.lessonPackDraftInvalid, false);
      return;
    }
    const url = URL.createObjectURL(new Blob([serialized], { type: "application/json;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = draftFilename(workshopBaseModel);
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setDraftStatus(copy.lessonPackDraftSaved, true);
  };
  const loadLessonPackDraft = async (file: File) => {
    const baseModel = workshopBaseModel;
    if (!baseModel) return;
    try {
      if (file.size > LESSON_PACK_DRAFT_MAX_BYTES) {
        setDraftStatus(copy.lessonPackDraftInvalid, false);
        return;
      }
      const serialized = await file.text();
      const input = parseLessonPackDraft(baseModel, serialized);
      if (!input || !applyLessonPackBuilderInput(lessonPackBuilderDialog, baseModel, input)) {
        setDraftStatus(copy.lessonPackDraftInvalid, false);
        return;
      }
      setDraftStatus(copy.lessonPackDraftLoaded, true);
    } catch {
      setDraftStatus(copy.lessonPackDraftInvalid, false);
    }
  };
  const openLessonPack = () => {
    if (!lesson) return;
    const model = buildLessonPackModel(lesson, bundle, typeof window === "undefined" ? "" : window.location.href);
    if (!model) return;
    builderOpen = false;
    lessonPackOpen = true;
    workshopPreviewOpen = false;
    workshopFeedbackState = null;
    renderLessonPack(lessonPackDialog, model, copy, {
      onClose: closeLessonPack,
      onBack: () => {
        lessonPackDialog.hidden = true;
        lessonPackOpen = false;
        openLessonWorkshop();
      },
      onPrint: printLessonPack,
    });
    lessonPackDialog.hidden = false;
    syncUrl();
    lessonHost.querySelector<HTMLButtonElement>("[data-lesson-pack-open]")?.setAttribute("aria-expanded", "true");
    lessonPackDialog.querySelector<HTMLButtonElement>("[data-lesson-pack-close]")?.focus();
  };
  const openLessonWorkshop = (initialInput: LessonPackCustomizationInput | null = null) => {
    if (!lesson) return;
    const model = buildLessonPackModel(lesson, bundle, typeof window === "undefined" ? "" : window.location.href);
    if (!model) return;
    workshopBaseModel = model;
    workshopInput = initialInput;
    builderOpen = true;
    lessonPackOpen = false;
    workshopPreviewOpen = false;
    renderLessonPackBuilder(lessonPackBuilderDialog, model, copy, {
      onClose: closeLessonWorkshop,
      onReset: () => { workshopInput = null; workshopFeedbackState = null; },
      onSaveDraft: saveLessonPackDraft,
      onDraftFile: (file) => { void loadLessonPackDraft(file); },
      onPreview: (input) => {
        const customized = workshopBaseModel ? customizeLessonPackModel(workshopBaseModel, input) : null;
        if (!customized) return;
        workshopInput = input;
        workshopPreviewOpen = true;
        lessonPackBuilderDialog.hidden = true;
        renderLessonPack(lessonPackDialog, customized, copy, {
          onClose: closeLessonWorkshop,
          onBack: () => {
            workshopPreviewOpen = false;
            lessonPackDialog.hidden = true;
            openLessonWorkshop(workshopInput);
          },
          onPrint: printLessonPack,
          initialFeedbackState: workshopFeedbackState,
          onFeedbackChange: (state) => { workshopFeedbackState = state; },
        });
        lessonPackDialog.hidden = false;
        lessonPackDialog.querySelector<HTMLButtonElement>("[data-lesson-pack-back]")?.focus();
      },
    }, initialInput);
    lessonPackBuilderDialog.hidden = false;
    lessonPackDialog.hidden = true;
    syncUrl();
    lessonHost.querySelector<HTMLButtonElement>("[data-lesson-workshop-open]")?.setAttribute("aria-expanded", "true");
    lessonPackBuilderDialog.querySelector<HTMLInputElement>("[data-lesson-pack-title]")?.focus();
  };
  const renderCatalogLoading = () => {
    datasetCatalogDialog.replaceChildren();
    datasetCatalogDialog.className = "dataset-catalog-dialog";
    datasetCatalogDialog.dataset.datasetCatalogDialog = "";
    if (rootWelcomeOpen) datasetCatalogDialog.dataset.datasetCatalogRoot = "";
    else delete datasetCatalogDialog.dataset.datasetCatalogRoot;
    datasetCatalogDialog.setAttribute("role", rootWelcomeOpen ? "region" : "dialog");
    if (rootWelcomeOpen) datasetCatalogDialog.removeAttribute("aria-modal");
    else datasetCatalogDialog.setAttribute("aria-modal", "true");
    datasetCatalogDialog.setAttribute("aria-label", copy.datasetCatalogDialogLabel);
    const loading = document.createElement("p");
    loading.className = "dataset-catalog-loading";
    loading.setAttribute("role", "status");
    loading.textContent = copy.datasetCatalogLoading;
    datasetCatalogDialog.append(loading);
  };
  const fallbackCatalogSnapshots = (): DatasetCatalogSnapshots => Object.freeze(Object.fromEntries(DATASET_CATALOG.map((entry) => [entry.slug, entry.slug === datasetSlug ? { bundle, lesson } : { bundle: null, lesson: null }]))) as DatasetCatalogSnapshots;
  const openDatasetCatalog = async () => {
    catalogOpen = true;
    lessonPackOpen = false;
    catalogButton.setAttribute("aria-expanded", "true");
    datasetCatalogDialog.hidden = false;
    syncUrl();
    if (!catalogSnapshots) {
      renderCatalogLoading();
      if (!catalogPromise) catalogPromise = catalogLoader ? catalogLoader() : Promise.resolve(fallbackCatalogSnapshots());
      try { catalogSnapshots = await catalogPromise; }
      catch { catalogSnapshots = fallbackCatalogSnapshots(); }
    }
    if (!catalogOpen || !catalogSnapshots) return;
    const model = buildDatasetCatalogViewModel(DATASET_CATALOG, catalogSnapshots, copy.language, typeof window === "undefined" ? "/" : window.location.href);
    renderDatasetCatalog(datasetCatalogDialog, model, copy, { onClose: closeDatasetCatalog, isRoot: rootWelcomeOpen, onResumeDraft: rootWelcomeOpen ? options.onResumeDraft : undefined });
    if (rootWelcomeOpen) datasetCatalogDialog.dataset.datasetCatalogRoot = "";
    else delete datasetCatalogDialog.dataset.datasetCatalogRoot;
    datasetCatalogDialog.hidden = false;
    datasetCatalogDialog.querySelector<HTMLButtonElement>("[data-dataset-catalog-close]")?.focus();
  };
  const closeDatasetCatalog = () => {
    catalogOpen = false;
    rootWelcomeOpen = false;
    delete shell.dataset.rootWelcome;
    datasetCatalogDialog.hidden = true;
    catalogButton.setAttribute("aria-expanded", "false");
    syncUrl();
    catalogButton.focus();
  };
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
  const leaveLesson = () => { lessonIndex = null; };
  const goToLessonStep = (index: number) => {
    if (!lesson || index < 0 || index >= lesson.steps.length) return;
    if (rootWelcomeOpen) {
      rootWelcomeOpen = false;
      delete shell.dataset.rootWelcome;
      catalogOpen = false;
      datasetCatalogDialog.hidden = true;
      catalogButton.setAttribute("aria-expanded", "false");
    }
    const step = lesson.steps[index];
    lessonIndex = index;
    comparisonEntityId = step.comparisonEntityId ?? null;
    emit({ type: "yearChanged", year: step.year });
    const feature = state.visibleFeatures.find((candidate) => candidate.id === step.featureId);
    if (feature) {
      lastFeatureId = feature.id;
      emit({ type: "featureSelected", featureId: feature.id });
    }
    update();
  };
  const lessonActions = {
    onStart: () => goToLessonStep(0),
    onPrevious: () => { if (lessonIndex !== null) goToLessonStep(lessonIndex - 1); },
    onNext: () => { if (lessonIndex !== null) goToLessonStep(lessonIndex + 1); },
    onClose: () => { leaveLesson(); comparisonEntityId = null; syncUrl(); update(); },
    onDetails: focusDetails,
    onShare: () => { void shareCurrentView(); },
    onReport: openReport,
    onPack: openLessonPack,
    onWorkshop: () => openLessonWorkshop(),
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
    reportButton.hidden = state.status === "loading" || state.status === "retrying" || state.status === "failed" || state.selectedFeatureId === null;
    renderLessonPanel(lessonHost, lesson, lessonIndex, copy, lessonActions);
    listPanel.hidden = state.activeMobileTab !== "list"; detailPanel.hidden = state.activeMobileTab !== "detail"; listPanel.setAttribute("aria-hidden", String(state.activeMobileTab !== "list")); detailPanel.setAttribute("aria-hidden", String(state.activeMobileTab !== "detail")); listTab.setAttribute("aria-selected", String(state.activeMobileTab === "list")); detailTab.setAttribute("aria-selected", String(state.activeMobileTab === "detail"));
    renderMapCandidates(candidates, state, bundle, copy, (featureId) => { leaveLesson(); lastFeatureId = featureId; emit({ type: "featureSelected", featureId }); focusDetails(); });
    renderComparisonCards(comparison, comparisons, bundle, comparisonEntityId, state.selectedFeatureId, (entityId) => { comparisonEntityId = comparisonEntityId === entityId ? null : entityId; update(); }, (featureId) => selectComparisonVersion(featureId));
    renderFeatureList(listPanel, state, bundle, (featureId) => { leaveLesson(); lastFeatureId = featureId; emit({ type: "featureSelected", featureId }); focusDetails(); });
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
  const selectComparisonVersion = (featureId: string) => {
    const feature = state.allFeatures.find((candidate) => candidate.id === featureId);
    if (!feature) return;
    const year = feature.properties.temporal.start?.earliestYear;
    if (year === null || year === undefined) return;
    leaveLesson();
    state = reduce(state, { type: "yearChanged", year }); dispatch({ type: "yearChanged", year });
    state = reduce(state, { type: "featureSelected", featureId }); dispatch({ type: "featureSelected", featureId });
    lastFeatureId = featureId; syncUrl(); adapter?.setFeatures(state.visibleFeatures); adapter?.setSelectedFeature(state.selectedFeatureId); update();
    focusDetails();
  };
  const commitYear = () => { const value = Number(input.value); if (Number.isInteger(value)) { leaveLesson(); emit({ type: "yearChanged", year: value }); } };
  previous.addEventListener("click", () => { const year = adjacentYear(years, state.selectedYear, -1); if (year !== null) { leaveLesson(); emit({ type: "yearChanged", year }); } });
  next.addEventListener("click", () => { const year = adjacentYear(years, state.selectedYear, 1); if (year !== null) { leaveLesson(); emit({ type: "yearChanged", year }); } });
  input.addEventListener("change", commitYear); input.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); commitYear(); } });
  snapshotSelect.addEventListener("change", () => { const value = Number(snapshotSelect.value); if (Number.isInteger(value)) { leaveLesson(); emit({ type: "yearChanged", year: value }); } });
  shareButton.addEventListener("click", () => void shareCurrentView());
  reportButton.addEventListener("click", openReport);
  catalogButton.addEventListener("click", () => { void openDatasetCatalog(); });
  listTab.addEventListener("click", () => emit({ type: "mobileTabChanged", tab: "list" })); detailTab.addEventListener("click", () => emit({ type: "mobileTabChanged", tab: "detail" })); tabs.addEventListener("keydown", (event) => { if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return; event.preventDefault(); const nextTab = event.key === "ArrowLeft" ? (state.activeMobileTab === "list" ? detailTab : listTab) : (state.activeMobileTab === "list" ? detailTab : listTab); nextTab.focus(); nextTab.click(); });
  const controller: AppController = { setMapAdapter(nextAdapter) { adapter?.destroy?.(); adapter = nextAdapter; adapter.onSelect?.((featureIds) => { leaveLesson(); if (featureIds.length === 1) { lastFeatureId = featureIds[0]!; emit({ type: "mapCandidatesReported", featureIds }); focusDetails(); } else emit({ type: "mapCandidatesReported", featureIds }); }); adapter.onCameraChange?.(() => syncUrl()); adapter.onBasemapError?.((error) => emit({ type: "basemapFailed", error })); try { adapter.mount(map); const settings = mapSettings.getSettings(); adapter.setBasemapOpacity?.(settings.basemapOpacity); adapter.setHistoricalOpacity?.(settings.historicalOpacity); adapter.setHistoricalVisibility?.(settings.historicalVisible); if (requestedCamera) adapter.setCamera?.(requestedCamera); adapter.setViewport?.(bundle.dataset.bbox); adapter.setFeatures(state.visibleFeatures); adapter.setSelectedFeature(state.selectedFeatureId); syncUrl(); } catch { controller.reportBasemapFailure(copy.language === "ja" ? "地図の初期化に失敗しました。" : "Basemap or map rendering could not start."); } }, reportBasemapFailure(message) { emit({ type: "basemapFailed", error: message }); }, retry() { emit({ type: "retryStarted" }); }, destroy() { adapter?.destroy?.(); adapter = null; root.replaceChildren(); } };
  basemapRetry.addEventListener("click", () => { try { adapter?.retry?.(); emit({ type: "basemapRecovered" }); } catch { controller.reportBasemapFailure(copy.language === "ja" ? "背景地図を再起動できませんでした。" : "Basemap or map rendering could not restart."); } });
  retry.addEventListener("click", () => controller.retry()); emit({ type: "bundleReady", features: bundle.features, year: state.selectedYear });
  if (catalogOpen) queueMicrotask(() => { void openDatasetCatalog(); });
  if (builderOpen) queueMicrotask(() => openLessonWorkshop(options.initialBuilderInput ?? null));
  if (lessonPackOpen) queueMicrotask(() => openLessonPack());
  return controller;
}

function authoredYears(bundle: PublicBundle, fallback: number): readonly number[] { const years = [...recordedYears(bundle.features)]; if (!years.includes(fallback)) years.push(fallback); return years.sort((a, b) => a - b); }
function adjacentYear(years: readonly number[], current: number, direction: -1 | 1): number | null { if (!years.length) return null; const index = years.indexOf(current); if (index >= 0) return years[index + direction] ?? null; if (direction < 0) return [...years].reverse().find((year) => year < current) ?? null; return years.find((year) => year > current) ?? null; }
function datasetKey(id: string): string { return id.split(":", 1)[0] ?? id; }
function yearWithinDataset(year: number, dataset: Dataset): boolean { const minimum = dataset.temporalExtent.start?.earliestYear; const maximum = dataset.temporalExtent.end?.latestYear; return (minimum === null || minimum === undefined || year >= minimum) && (maximum === null || maximum === undefined || year <= maximum); }
function cameraFromSharedState(state: ReturnType<typeof parseSharedState>): MapCamera | null { return state.longitude !== undefined && state.latitude !== undefined && state.zoom !== undefined ? { longitude: state.longitude, latitude: state.latitude, zoom: state.zoom } : null; }
function button(text: string): HTMLButtonElement { const element = document.createElement("button"); element.type = "button"; element.textContent = text; return element; }
function cycleDialogFocus(dialog: HTMLElement, event: KeyboardEvent): void {
  const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) { event.preventDefault(); return; }
  const first = focusable[0]!;
  const last = focusable.at(-1)!;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
function tab(name: "list" | "detail", text: string): HTMLButtonElement { const element = button(text); element.id = `tab-${name}`; element.setAttribute("role", "tab"); element.setAttribute("aria-controls", `panel-${name}`); return element; }
function renderMapCandidates(container: HTMLElement, state: AppState, bundle: PublicBundle, copy: UiCopy, select: (id: string) => void): void { const features = (state.mapCandidateIds ?? []).map((id) => state.visibleFeatures.find((feature) => feature.id === id)).filter((feature): feature is NonNullable<typeof feature> => Boolean(feature)); container.hidden = features.length < 2; container.replaceChildren(); if (!features.length) return; const heading = document.createElement("h2"); heading.textContent = copy.mapCandidates; container.append(heading); for (const feature of features) { const candidate = button(localizedText(feature.properties.labels, bundle.dataset.defaultLanguage)); candidate.dataset.mapCandidateId = feature.id; candidate.addEventListener("click", () => select(feature.id)); container.append(candidate); } }
function statusText(state: AppState, copy: UiCopy): string { switch (state.status) { case "loading": return copy.language === "ja" ? "公開データを読み込んでいます…" : "Loading dataset…"; case "ready": return copy.language === "ja" ? "公開データを利用できます。" : "Dataset available."; case "no-match": return copy.language === "ja" ? "この収録年に一致する公開地物はありません。" : "No features match the selected year."; case "selection-cleared": return copy.language === "ja" ? "選択中の地物はこの年には表示されないため、選択を解除しました。" : "The selected feature is not visible for this year; selection cleared."; case "failed": return copy.language === "ja" ? `公開データを読み込めませんでした。${state.error ?? "再試行してください。"}` : `Dataset failed to load. ${state.error ?? "Please retry."}`; case "retrying": return copy.language === "ja" ? "公開データを再読み込みしています…" : "Retrying dataset load…"; } }
