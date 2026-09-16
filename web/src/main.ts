import "./styles.css";
import { loadPublicBundle } from "./domain/data-loader";
import { MapAdapter } from "./map/map-adapter";
import { mountUiShell } from "./ui/ui-shell";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Chronomap app root is missing.");
}

app.innerHTML = '<div class="app-shell"><p role="status">Loading Chronomap…</p></div>';

void loadPublicBundle("/data/synthetic")
  .then((bundle) => { const controller = mountUiShell(app, bundle, () => undefined); controller.setMapAdapter(new MapAdapter()); })
  .catch(() => { app.innerHTML = '<div class="app-shell"><p role="alert">Dataset failed to load. Please retry.</p></div>'; });
