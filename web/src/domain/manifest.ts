export type TextMap = Readonly<Record<string, string>>;

export interface ThemeEntry {
  readonly id: string;
  readonly labels: TextMap;
}

export interface RasterEntry {
  readonly id: string;
  readonly dataset: string;
  readonly title: TextMap;
  readonly description: TextMap;
  readonly date: string;
  readonly tileTemplate: string;
  readonly attribution: string;
  readonly bbox: readonly [number, number, number, number];
  readonly minZoom: number;
  readonly maxZoom: number;
}

export interface DatasetEntry {
  readonly slug: string;
  readonly id: string;
  readonly title: TextMap;
  readonly defaultLanguage: string;
  readonly bbox: readonly [number, number, number, number];
  readonly attribution: string | null;
  readonly minZoom: number;
  readonly maxZoom: number;
  /** Polygons of this dataset are drawn as the period's sea in the base map's sea colour. */
  readonly seaMask?: boolean;
  readonly detailShards: number;
  readonly features: number;
}

export interface Manifest {
  readonly tiles: string;
  readonly sourceLayer: string;
  readonly yearRange: { readonly min: number; readonly max: number };
  readonly years: readonly number[];
  readonly defaultYear: number;
  readonly themes: readonly ThemeEntry[];
  readonly rasters: readonly RasterEntry[];
  readonly datasets: readonly DatasetEntry[];
}

function fail(field: string): never {
  throw new Error(`manifest.json: invalid ${field}`);
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value);

/** Validate the tile manifest (schema version 2, see docs/data/tiles.md). */
export function parseManifest(value: unknown): Manifest {
  if (!isRecord(value)) fail("document");
  if (value.schemaVersion !== 2) fail("schemaVersion");
  if (typeof value.tiles !== "string") fail("tiles");
  if (typeof value.sourceLayer !== "string") fail("sourceLayer");
  if (!Array.isArray(value.years) || !value.years.every(isInteger)) fail("years");
  if (!Array.isArray(value.themes) || !value.themes.every((theme) => isRecord(theme) && typeof theme.id === "string" && isRecord(theme.labels))) fail("themes");
  if (!Array.isArray(value.rasters) || !value.rasters.every((raster) => isRecord(raster) && typeof raster.id === "string" && typeof raster.tileTemplate === "string")) fail("rasters");
  if (!Array.isArray(value.datasets) || !value.datasets.every((dataset) => isRecord(dataset) && typeof dataset.slug === "string" && isInteger(dataset.detailShards))) fail("datasets");
  const years = value.years as number[];
  const range = isRecord(value.yearRange) ? value.yearRange : fail("yearRange");
  const min = isInteger(range.min) ? range.min : years[0] ?? 0;
  const max = isInteger(range.max) ? range.max : years[years.length - 1] ?? 0;
  const defaultYear = isInteger(value.defaultYear) ? value.defaultYear : years[0] ?? 0;
  return {
    tiles: value.tiles,
    sourceLayer: value.sourceLayer,
    yearRange: { min, max },
    years,
    defaultYear,
    themes: value.themes as ThemeEntry[],
    rasters: value.rasters as RasterEntry[],
    datasets: value.datasets as DatasetEntry[],
  };
}
