import "./styles.css";
import { loadLessonManifests, loadPublicBundle } from "./domain/data-loader";
import { DATASET_CATALOG, datasetFromSearch, featuredLessonCatalogEntry, lessonCatalogEntry, type DatasetCatalogEntry } from "./domain/dataset-catalog";
import { selectAllowedLesson } from "./domain/lesson-selection";
import { buildLessonPackModel } from "./domain/lesson-pack-model";
import { LESSON_PACK_DRAFT_MAX_BYTES, parseLessonPackDraft, parseLessonPackDraftIdentity } from "./domain/lesson-pack-draft";
import type { DatasetCatalogSnapshots } from "./domain/dataset-catalog-view-model";
import type { Lesson } from "./domain/lesson";
import type { PublicBundle } from "./domain/types";
import { MapAdapter } from "./map/map-adapter";
import { mountUiShell, type UiShellOptions } from "./ui/ui-shell";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Chronomap app root is missing.");
}
const appRoot = app;
let controller: ReturnType<typeof mountUiShell> | null = null;
let requestId = 0;
let resumeRequestId = 0;
let activeDataset: DatasetCatalogEntry = datasetFromSearch(typeof window === "undefined" ? "" : window.location.search);

function renderLoading(retrying: boolean): void {
  document.documentElement.lang = "ja";
  appRoot.replaceChildren();
  const shell = document.createElement("main");
  shell.id = "chronomap-main";
  shell.className = "app-shell";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.textContent = retrying ? "公開データを再読み込みしています…" : "公開データを読み込んでいます…";
  shell.append(status);
  appRoot.append(shell);
}

function renderFailure(): void {
  appRoot.replaceChildren();
  const shell = document.createElement("main");
  shell.id = "chronomap-main";
  shell.className = "app-shell failure-shell";
  const card = document.createElement("section");
  card.className = "failure-card";
  const alert = document.createElement("p");
  alert.id = "dataset-failure";
  alert.setAttribute("role", "alert");
  const language = document.documentElement.lang.toLowerCase().startsWith("ja") ? "ja" : "en";
  alert.textContent = activeDataset.failureMessage[language];
  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "データを再読み込み";
  retry.addEventListener("click", () => void loadDataset(true));
  card.append(alert, retry);
  shell.append(card);
  appRoot.append(shell);
}

async function loadDataset(retrying = false): Promise<void> {
  const currentRequest = ++requestId;
  const entry = datasetFromSearch(typeof window === "undefined" ? "" : window.location.search);
  activeDataset = entry;
  controller?.destroy();
  controller = null;
  renderLoading(retrying);
  const loaded = await loadDatasetSnapshot(entry);
  if (currentRequest !== requestId) return;
  if (!loaded) { renderFailure(); return; }
  const requestedLessonId = parseRequestedLessonId();
  // The public entry point is the map viewer. A guided lesson is an explicit
  // mode selected through a lesson URL, never an implicit default.
  const lesson = requestedLessonId
    ? selectAllowedLesson(entry, loaded.lessons, requestedLessonId)
    : null;
  canonicalizeDatasetUrl(entry.slug, requestedLessonId ? Boolean(lesson) : false, requestedLessonId);
  mountLoadedDataset(entry, loaded.bundle, loaded.lessons, lesson, currentRequest);
}

export interface LoadedDataset {
  readonly bundle: PublicBundle;
  readonly lessons: Readonly<Record<string, Lesson | null>>;
}

export async function loadDatasetSnapshot(entry: DatasetCatalogEntry): Promise<LoadedDataset | null> {
  try {
    const bundle = await loadPublicBundle(entry.bundlePath);
    const lessons = await loadLessonManifests(entry.lessons, bundle);
    return { bundle, lessons };
  } catch {
    return null;
  }
}

function mountLoadedDataset(entry: DatasetCatalogEntry, bundle: PublicBundle, lessons: Readonly<Record<string, Lesson | null>>, lesson: Lesson | null, currentRequest: number, options: UiShellOptions = {}): void {
  if (currentRequest !== requestId) return;
  activeDataset = entry;
  let catalogPromise: Promise<DatasetCatalogSnapshots> | null = null;
  const catalogLoader = () => catalogPromise ??= loadCatalogSnapshots(bundle, lessons, entry.slug);
  const nextController = mountUiShell(appRoot, bundle, () => undefined, lesson, catalogLoader, { onResumeDraft: resumeDraft, ...options });
  controller = nextController;
  try {
    nextController.setMapAdapter(new MapAdapter());
  } catch {
    nextController.reportBasemapFailure("地図の初期化に失敗しました。");
  }
}

async function resumeDraft(file: File): Promise<boolean> {
  const currentResumeRequest = ++resumeRequestId;
  if (file.size > LESSON_PACK_DRAFT_MAX_BYTES) return false;
  let serialized: string;
  try { serialized = await file.text(); }
  catch { return false; }
  if (currentResumeRequest !== resumeRequestId) return false;
  const identity = parseLessonPackDraftIdentity(serialized);
  if (!identity) return false;
  const entry = DATASET_CATALOG.find((candidate) => candidate.slug === identity.dataset && lessonCatalogEntry(candidate, identity.lesson) !== null);
  if (!entry) return false;
  const loaded = await loadDatasetSnapshot(entry);
  if (!loaded) return false;
  const lesson = selectAllowedLesson(entry, loaded.lessons, identity.lesson);
  if (currentResumeRequest !== resumeRequestId || !lesson) return false;
  const model = buildLessonPackModel(lesson, loaded.bundle, typeof window === "undefined" ? "/" : window.location.href);
  if (!model) return false;
  const customization = parseLessonPackDraft(model, serialized);
  if (!customization || currentResumeRequest !== resumeRequestId) return false;
  const currentRequest = ++requestId;
  controller?.destroy();
  controller = null;
  mountLoadedDataset(entry, loaded.bundle, loaded.lessons, lesson, currentRequest, { initialBuilderOpen: true, initialBuilderInput: customization });
  return true;
}

function parseRequestedLessonId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("lesson")?.trim() || undefined;
}

async function loadCatalogSnapshots(activeBundle: PublicBundle, activeLessons: Readonly<Record<string, Lesson | null>>, activeSlug: string): Promise<DatasetCatalogSnapshots> {
  const entries = await Promise.all(DATASET_CATALOG.map(async (entry): Promise<readonly [string, DatasetCatalogSnapshots[string]]> => {
    if (entry.slug === activeSlug) return [entry.slug, { bundle: activeBundle, lessons: activeLessons, lesson: featuredLesson(entry, activeLessons) }];
    try {
      const bundle = await loadPublicBundle(entry.bundlePath);
      const lessons = await loadLessonManifests(entry.lessons, bundle);
      return [entry.slug, { bundle, lessons, lesson: featuredLesson(entry, lessons) }];
    } catch {
      return [entry.slug, { bundle: null, lessons: {}, lesson: null }];
    }
  }));
  return Object.freeze(Object.fromEntries(entries)) as DatasetCatalogSnapshots;
}

function featuredLesson(entry: DatasetCatalogEntry, lessons: Readonly<Record<string, Lesson | null>>): Lesson | null {
  const featured = featuredLessonCatalogEntry(entry);
  return featured ? lessons[featured.id] ?? null : null;
}

function canonicalizeDatasetUrl(slug: string, hasValidLesson: boolean, requestedLessonId: string | undefined): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("dataset");
  let changed = false;
  if (requested && requested !== slug) { params.set("dataset", slug); changed = true; }
  if (requestedLessonId && !hasValidLesson) {
    params.delete("lesson");
    params.delete("step");
    if (params.get("view") === "builder" || params.get("view") === "pack") params.delete("view");
    changed = true;
  } else if (!hasValidLesson && (params.get("view") === "builder" || params.get("view") === "pack")) {
    params.delete("view");
    params.delete("step");
    changed = true;
  }
  if (!changed) return;
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

void loadDataset();
