/** MapLibre filter: the feature's possible period `from_year..to_year` contains `year`. */
export function yearFilter(year: number): unknown[] {
  return ["all", ["<=", ["get", "from_year"], year], [">=", ["get", "to_year"], year]];
}

/** MapLibre filter: `year` is before the feature's records but within its reference display (docs/data/tiles.md). */
export function referenceFilter(year: number): unknown[] {
  return ["all", ["<=", ["get", "ref_from_year"], year], [">", ["get", "from_year"], year]];
}

/** Negative years are BC as in the sources (-500 is 500 BC); year 0 is shown as 1 BC. */
export function formatYear(year: number): string {
  return year > 0 ? `${year}年` : `紀元前${Math.max(1, -year)}年`;
}
