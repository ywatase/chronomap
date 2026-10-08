import type { FeatureVersion, PublicBundle } from "../domain/types";

/** Return true when a public feature matches a free-text map/list query. */
export function featureMatches(feature: FeatureVersion, bundle: PublicBundle, query: string): boolean {
  const entity = bundle.entitiesById[feature.properties.entityId];
  const values = [
    feature.id,
    feature.properties.entityId,
    ...Object.values(feature.properties.labels),
    ...Object.values(feature.properties.description),
    ...(feature.properties.hypothesisLabel ? Object.values(feature.properties.hypothesisLabel) : []),
    ...(entity ? Object.values(entity.labels) : []),
    ...(entity ? Object.values(entity.description) : []),
  ];
  const normalizedQuery = normalizeSearch(query);
  return normalizedQuery === "" || values.some((value) => normalizeSearch(value).includes(normalizedQuery));
}

export function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase();
}
