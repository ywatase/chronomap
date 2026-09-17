import type { Dataset, FeatureVersion, TemporalBoundary } from "./types";

export function displayYear(year: number): string {
  return year <= 0 ? `${1 - year} BCE` : `${year} CE`;
}

/** A compact Japanese year label used by the public pilot UI. */
export function displayYearLocalized(year: number, language: string): string {
  if (language.toLowerCase().startsWith("ja")) {
    return year <= 0 ? `紀元前${1 - year}年` : `${year}年`;
  }
  return displayYear(year);
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

/**
 * Return authored years at which the public bundle has a temporal boundary.
 *
 * Historical features often have long possible intervals, but the UI should
 * not ask people to step through thousands of years that have no authored
 * snapshot. Open boundaries contribute no synthetic year, and private
 * features never leak into the public navigation.
 */
export function recordedYears(features: readonly FeatureVersion[]): readonly number[] {
  const years = new Set<number>();
  for (const feature of features) {
    if (feature.properties.publicationStatus !== "public") continue;
    for (const boundary of [feature.properties.temporal.start, feature.properties.temporal.end]) {
      if (!boundary) continue;
      if (typeof boundary.earliestYear === "number" && Number.isFinite(boundary.earliestYear)) years.add(boundary.earliestYear);
      if (typeof boundary.latestYear === "number" && Number.isFinite(boundary.latestYear)) years.add(boundary.latestYear);
    }
  }
  return [...years].sort((a, b) => a - b);
}

function finiteYear(year: TemporalBoundary["latestYear"] | undefined): number | undefined {
  return typeof year === "number" && Number.isFinite(year) ? year : undefined;
}
