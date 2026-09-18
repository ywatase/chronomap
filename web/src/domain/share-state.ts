export interface SharedState {
  readonly dataset?: string;
  readonly view?: "catalog" | "pack" | "builder";
  readonly lessonId?: string;
  readonly lessonStepId?: string;
  readonly year?: number;
  readonly featureId?: string;
  readonly longitude?: number;
  readonly latitude?: number;
  readonly zoom?: number;
}

// Keep a small margin below MapLibre's projection clamp so restoring a URL
// cannot oscillate between the requested and clamped camera values.
const MAX_MERCATOR_LATITUDE = 85;
const MAX_MAP_ZOOM = 22;

export function parseSharedState(search: string): SharedState {
  const params = new URLSearchParams(search);
  const rawYear = params.get("year");
  const year = rawYear !== null && /^-?\d+$/.test(rawYear) ? Number(rawYear) : undefined;
  const featureId = params.get("feature")?.trim() || undefined;
  const dataset = params.get("dataset")?.trim() || undefined;
  const rawView = params.get("view");
  const view = rawView === "catalog" || rawView === "pack" || rawView === "builder" ? rawView : undefined;
  const lessonId = params.get("lesson")?.trim() || undefined;
  const lessonStepId = params.get("step")?.trim() || undefined;
  const longitude = boundedNumber(params.get("lng"), -180, 180);
  const latitude = boundedNumber(params.get("lat"), -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
  const zoom = boundedNumber(params.get("z"), 0, MAX_MAP_ZOOM);
  return {
    ...(dataset && /^[a-z0-9-]+$/.test(dataset) ? { dataset } : {}),
    ...(view ? { view } : {}),
    ...(lessonId && /^[a-z0-9-]+$/.test(lessonId) ? { lessonId } : {}),
    ...(lessonStepId && /^[a-z0-9-]+$/.test(lessonStepId) ? { lessonStepId } : {}),
    ...(typeof year === "number" && Number.isSafeInteger(year) ? { year } : {}),
    ...(featureId ? { featureId } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(zoom !== undefined ? { zoom } : {}),
  };
}

export function sharedQuery(state: { readonly dataset?: string | null; readonly view?: "catalog" | "pack" | "builder" | null; readonly lessonId?: string | null; readonly lessonStepId?: string | null; readonly year: number | null; readonly featureId: string | null; readonly longitude?: number | null; readonly latitude?: number | null; readonly zoom?: number | null }): string {
  const params = new URLSearchParams();
  if (state.dataset) params.set("dataset", state.dataset);
  if (state.view === "catalog" || state.view === "pack" || state.view === "builder") params.set("view", state.view);
  if (state.lessonId && /^[a-z0-9-]+$/.test(state.lessonId)) params.set("lesson", state.lessonId);
  if (state.lessonStepId && /^[a-z0-9-]+$/.test(state.lessonStepId)) params.set("step", state.lessonStepId);
  if (state.year !== null && Number.isSafeInteger(state.year)) params.set("year", String(state.year));
  if (state.featureId) params.set("feature", state.featureId);
  if (state.longitude !== undefined && state.longitude !== null && boundedNumber(state.longitude, -180, 180) !== undefined) params.set("lng", fixed(state.longitude, 5));
  if (state.latitude !== undefined && state.latitude !== null && boundedNumber(state.latitude, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE) !== undefined) params.set("lat", fixed(state.latitude, 5));
  if (state.zoom !== undefined && state.zoom !== null && boundedNumber(state.zoom, 0, MAX_MAP_ZOOM) !== undefined) params.set("z", fixed(state.zoom, 2));
  const value = params.toString();
  return value ? `?${value}` : "";
}

function boundedNumber(value: string | number | null, minimum: number, maximum: number): number | undefined {
  const number = typeof value === "number" ? value : value === null ? Number.NaN : Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : undefined;
}

function fixed(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}
