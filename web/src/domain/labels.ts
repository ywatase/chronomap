import type { Dataset, TemporalBoundary } from "./types";

export function displayYear(year: number): string {
  return year <= 0 ? `${1 - year} BCE` : `${year} CE`;
}

export function initialYear(dataset: Dataset): number {
  const { start, end } = dataset.temporalExtent;
  const preferred = finiteYear(start?.latestYear) ?? finiteYear(end?.latestYear) ?? 0;
  const earliest = finiteYear(start?.earliestYear);
  const latest = finiteYear(end?.latestYear);
  return Math.min(Math.max(preferred, earliest ?? -Infinity), latest ?? Infinity);
}

export function localizedText(
  values: Readonly<Record<string, string>>,
  defaultLanguage: string,
): string {
  const fallbackLanguage = Object.keys(values).sort()[0];
  return values[defaultLanguage] ?? (fallbackLanguage === undefined ? "" : values[fallbackLanguage]);
}

function finiteYear(year: TemporalBoundary["latestYear"] | undefined): number | undefined {
  return typeof year === "number" && Number.isFinite(year) ? year : undefined;
}
