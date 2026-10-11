export interface ViewState {
  readonly zoom: number;
  readonly lat: number;
  readonly lng: number;
  readonly year: number;
  readonly hiddenThemes: readonly string[];
  readonly rasters: readonly string[];
}

export interface ViewLimits {
  readonly yearRange: { readonly min: number; readonly max: number };
  readonly themes: readonly string[];
  readonly rasters: readonly string[];
}

const round = (value: number, digits: number) => Number(value.toFixed(digits));

/** `#zoom/lat/lng/year?off=themes&raster=ids`. */
export function formatHash(state: ViewState): string {
  const path = `#${round(state.zoom, 2)}/${round(state.lat, 5)}/${round(state.lng, 5)}/${state.year}`;
  const options = [
    state.hiddenThemes.length ? `off=${state.hiddenThemes.join(",")}` : "",
    state.rasters.length ? `raster=${state.rasters.join(",")}` : "",
  ].filter(Boolean);
  return options.length ? `${path}?${options.join("&")}` : path;
}

function number(text: string | undefined, low: number, high: number): number | null {
  if (text === undefined || text.trim() === "") return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= low && value <= high ? value : null;
}

function list(text: string | null, allowed: readonly string[]): string[] {
  if (!text) return [];
  return [...new Set(text.split(","))].filter((item) => allowed.includes(item));
}

export function parseHash(hash: string, defaults: ViewState, limits: ViewLimits): ViewState {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const [zoomText, latText, lngText, yearText] = path.split("/");
  const zoom = number(zoomText, 0, 22);
  const lat = number(latText, -85.06, 85.06);
  const lng = number(lngText, -180, 180);
  if (zoom === null || lat === null || lng === null) {
    return defaults;
  }
  const year = number(yearText, limits.yearRange.min, limits.yearRange.max);
  const params = new URLSearchParams(query);
  return {
    zoom,
    lat,
    lng,
    year: year !== null && Number.isInteger(year) ? year : defaults.year,
    hiddenThemes: list(params.get("off"), limits.themes),
    rasters: list(params.get("raster"), limits.rasters),
  };
}
