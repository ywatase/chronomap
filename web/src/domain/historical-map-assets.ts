import type { HistoricalMapAsset, LocalizedText, Rights } from "./types";

/** Validate the optional raster overlay contract before it reaches MapLibre. */
export function isHistoricalMapAsset(value: unknown): value is HistoricalMapAsset {
  if (!isRecord(value)
    || typeof value.id !== "string" || value.id.length === 0
    || !isTextMap(value.title) || !isTextMap(value.description)
    || !isBbox(value.bbox)
    || typeof value.date !== "string" || value.date.trim().length === 0
    || typeof value.accessedDate !== "string" || !isIsoDate(value.accessedDate)
    || !isGeoreference(value.georeference)
    || !isSafeHttpsUrl(value.sourceUrl)
    || typeof value.attribution !== "string" || value.attribution.trim().length === 0
    || !isRights(value.rights) || value.rights.status === "unknown"
    || !isZoom(value.minZoom) || !isZoom(value.maxZoom)
    || value.minZoom > value.maxZoom) {
    return false;
  }

  const hasTileTemplate = typeof value.tileTemplate === "string";
  const hasImageUrl = typeof value.imageUrl === "string";
  if (hasTileTemplate === hasImageUrl) return false;
  if (hasTileTemplate && !isTileTemplate(value.tileTemplate as string)) return false;
  if (hasImageUrl && !isSafeHttpsUrl(value.imageUrl as string)) return false;
  return true;
}

export function validHistoricalMapAssets(value: unknown): readonly HistoricalMapAsset[] | null {
  if (!Array.isArray(value)) return null;
  const assets = value.filter(isHistoricalMapAsset);
  return assets.length === value.length ? Object.freeze(assets) : null;
}

/** Keep the bundle usable when one authored asset is malformed. */
export function filterHistoricalMapAssets(value: unknown): readonly HistoricalMapAsset[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isHistoricalMapAsset);
}

/** MapLibre can consume XYZ templates; image assets stay metadata-only for now. */
export function isTileHistoricalMapAsset(asset: HistoricalMapAsset): boolean {
  return typeof asset.tileTemplate === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTextMap(value: unknown): value is LocalizedText {
  return isRecord(value) && Object.keys(value).length > 0 && Object.values(value).every((text) => typeof text === "string" && text.length > 0);
}

function isRights(value: unknown): value is Rights {
  return isRecord(value)
    && ["public-domain", "open-license", "permission", "restricted", "unknown"].includes(value.status as string)
    && (value.attribution === undefined || typeof value.attribution === "string")
    && (value.terms === undefined || typeof value.terms === "string");
}

function isBbox(value: unknown): value is readonly [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4 || !value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))) return false;
  const [west, south, east, north] = value;
  return west >= -180 && east <= 180 && south >= -90 && north <= 90 && west <= east && south <= north;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isGeoreference(value: unknown): value is { method: string; error: string } {
  return isRecord(value)
    && typeof value.method === "string" && value.method.trim().length > 0
    && typeof value.error === "string" && value.error.trim().length > 0;
}

function isSafeHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function isTileTemplate(value: string): boolean {
  return isSafeHttpsUrl(value.replace("{z}", "0").replace("{x}", "0").replace("{y}", "0"))
    && value.includes("{z}") && value.includes("{x}") && value.includes("{y}");
}

function isZoom(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 24;
}
