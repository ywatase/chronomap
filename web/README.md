# Chronomap viewer

A static MapLibre GL viewer for the national tiles in `public/chronomap/`
(see the [tile contract](../docs/data/tiles.md)). Build those tiles first from
the repository root:

```sh
uv run chronomap-data build-tiles data imports --output web/public/chronomap
```

Vite caches the list of files under `public/` when the dev server starts.
After a rebuild that adds datasets, restart `npm run dev`; otherwise new
detail shards are answered with `index.html`.

## Screen

- Full-screen map over GSI tiles (pale, standard, or photo; adjustable
  strength).
- Left panel: place search (GSI address search), ten theme layers with a
  legend, GSI historical rasters (Meiji-era lowland, landform classification,
  1945–50 and 1961–69 aerial photos), and the list of datasets with their
  attribution.
- Bottom timeline: the current year, a non-linear slider (early-modern Japan
  gets more room) with a tick for every recorded year, previous/next recorded
  year buttons, and a year input. Keyboard on the slider: ←/→ one year,
  PageDown/PageUp previous/next recorded year, Home/End range ends.
- Click a feature for its possible period, description, four-part uncertainty,
  evidence with locators, sources, and rights. The top-most feature opens;
  other features at the same spot (for example the village's domain and
  province) are listed below it. With the keyboard, focus the map, pan with the
  arrow keys, and press Enter to open the features at the centre.

## URL

`#<zoom>/<lat>/<lng>/<year>?off=<themes>&raster=<ids>` — for example
`#11/34.913/135.776/1590?off=route&raster=swale`. Negative years are BC.
Invalid parts fall back to the defaults (Japan, the manifest's
`defaultYear`).

## Commands

```sh
npm run dev           # development server
npm test              # unit tests (vitest)
npm run build         # type-check and production build
npm run test:browser  # Playwright at 390×844 and 1440×900
```

The browser tests read `public/chronomap/manifest.json`, so build the tiles
(at least from `data/`) before running them.

## Layout

```text
src/domain/   pure logic: manifest, URL state, year filter, timeline, detail shards
src/map/      MapLibre style and the map adapter (PMTiles protocol)
src/ui/       layer panel, timeline bar, detail panel
```
