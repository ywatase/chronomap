import "./styles.css";
import { loadPublicBundle } from "./domain/data-loader";
import { MapAdapter } from "./map/map-adapter";
import { mountUiShell } from "./ui/ui-shell";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Chronomap app root is missing.");
}
const appRoot = app;

let controller: ReturnType<typeof mountUiShell> | null = null;
let requestId = 0;

function renderLoading(retrying: boolean): void {
  appRoot.replaceChildren();
  const shell = document.createElement("div");
  shell.className = "app-shell";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.textContent = retrying ? "Retrying dataset load…" : "Loading dataset…";
  shell.append(status);
  appRoot.append(shell);
}

function renderFailure(): void {
  appRoot.replaceChildren();
  const shell = document.createElement("div");
  shell.className = "app-shell";
  const alert = document.createElement("p");
  alert.setAttribute("role", "alert");
  alert.textContent = "Dataset failed to load. The public demo data could not be read. Please retry.";
  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Retry loading dataset";
  retry.addEventListener("click", () => void loadDataset(true));
  shell.append(alert, retry);
  appRoot.append(shell);
}

async function loadDataset(retrying = false): Promise<void> {
  const currentRequest = ++requestId;
  controller?.destroy();
  controller = null;
  renderLoading(retrying);
  try {
    const bundle = await loadPublicBundle("/data/synthetic/");
    if (currentRequest !== requestId) return;
    const nextController = mountUiShell(appRoot, bundle, () => undefined);
    controller = nextController;
    nextController.setMapAdapter(new MapAdapter());
  } catch {
    if (currentRequest === requestId) renderFailure();
  }
}

void loadDataset();
