import type { FeatureVersion } from "./types";

export interface ComparisonCandidate {
  readonly entityId: string;
  readonly versions: readonly { readonly feature: FeatureVersion; readonly year: number }[];
}

/** Returns only public, exact single-year versions that offer a real A/B comparison. */
export function comparisonCandidates(features: readonly FeatureVersion[]): readonly ComparisonCandidate[] {
  const grouped = new Map<string, { feature: FeatureVersion; year: number }[]>();
  for (const feature of features) {
    const year = singleSnapshotYear(feature);
    if (feature.properties.publicationStatus !== "public" || year === null) continue;
    grouped.set(feature.properties.entityId, [...(grouped.get(feature.properties.entityId) ?? []), { feature, year }]);
  }
  return [...grouped.entries()]
    .map(([entityId, versions]) => ({ entityId, versions: versions.sort((a, b) => a.year - b.year || a.feature.id.localeCompare(b.feature.id)) }))
    .filter((candidate) => candidate.versions.length >= 2);
}

function singleSnapshotYear(feature: FeatureVersion): number | null {
  const { start, end } = feature.properties.temporal;
  if (!start || !end || start.precision !== "year" || end.precision !== "year" || start.qualifier !== "exact" || end.qualifier !== "exact") return null;
  const year = start.earliestYear;
  return year !== null && year === start.latestYear && year === end.earliestYear && year === end.latestYear ? year : null;
}
