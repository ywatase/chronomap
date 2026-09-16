import type { FeatureVersion } from "./types";

export function filterFeaturesByYear(
  features: readonly FeatureVersion[],
  year: number,
): readonly FeatureVersion[] {
  if (!Number.isFinite(year)) return [];

  return features.filter((feature) => {
    if (feature.properties.publicationStatus !== "public") return false;
    const start = feature.properties.temporal.start?.earliestYear ?? -Infinity;
    const end = feature.properties.temporal.end?.latestYear ?? Infinity;
    return start <= year && end >= year;
  });
}
