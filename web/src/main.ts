import "./styles.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Chronomap app root is missing.");
}

app.innerHTML = `
  <div class="app-shell" data-testid="app-shell">
    <h1>Chronomap</h1>
    <p role="status">Loading Chronomap…</p>
  </div>
`;
