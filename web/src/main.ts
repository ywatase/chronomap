import "./styles.css";
import { loadLessonManifest, loadPublicBundle } from "./domain/data-loader";
import { datasetFromSearch, type DatasetCatalogEntry } from "./domain/dataset-catalog";
import { parseLesson } from "./domain/lesson";
import { MapAdapter } from "./map/map-adapter";
import { mountUiShell } from "./ui/ui-shell";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Chronomap app root is missing.");
}
const appRoot = app;
let controller: ReturnType<typeof mountUiShell> | null = null;
let requestId = 0;
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
  activeDataset = datasetFromSearch(typeof window === "undefined" ? "" : window.location.search);
  canonicalizeDatasetUrl(activeDataset.slug);
  controller?.destroy();
  controller = null;
  renderLoading(retrying);
  let bundle;
  try {
    bundle = await loadPublicBundle(activeDataset.bundlePath);
  } catch {
    if (currentRequest === requestId) renderFailure();
    return;
  }
  if (currentRequest !== requestId) return;
  const lessonManifest = await loadLessonManifest(activeDataset.lessonPath);
  if (currentRequest !== requestId) return;
  const lesson = lessonManifest ? parseLesson(lessonManifest, bundle) : null;
  const nextController = mountUiShell(appRoot, bundle, () => undefined, lesson);
  controller = nextController;
  try {
    nextController.setMapAdapter(new MapAdapter());
  } catch {
    nextController.reportBasemapFailure("地図の初期化に失敗しました。");
  }
}

function canonicalizeDatasetUrl(slug: string): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("dataset");
  if (!requested || requested === slug) return;
  params.set("dataset", slug);
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}?${query}${window.location.hash}`);
}

void loadDataset();
