import type { Dataset, Entity, Evidence, FeatureVersion, PublicBundle, Source, TemporalBoundary, TemporalExtent } from "./types";

const resources = ["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"] as const;

export class BundleLoadError extends Error {
  readonly resource: string;

  constructor(resource: string) {
    super(`Unable to load ${resource}.`);
    this.name = "BundleLoadError";
    this.resource = resource;
  }
}

export async function loadPublicBundle(baseUrl: string): Promise<PublicBundle> {
  const [dataset, entities, sources, evidence, collection] = await Promise.all(
    resources.map((resource) => loadResource(joinUrl(baseUrl, resource), resource)),
  );

  if (!isDataset(dataset)) throw new BundleLoadError("dataset.json");
  if (!isRecordArray(entities)) throw new BundleLoadError("entities.json");
  if (!isRecordArray(sources)) throw new BundleLoadError("sources.json");
  if (!isRecordArray(evidence)) throw new BundleLoadError("evidence.json");
  if (!isFeatureCollection(collection)) throw new BundleLoadError("feature-versions.geojson");

  const publicFeatures = collection.features.filter(isPublicFeature);
  return Object.freeze({
    dataset: freeze(dataset),
    entitiesById: indexById(entities) as Readonly<Record<string, Entity>>,
    sourcesById: indexById(sources) as Readonly<Record<string, Source>>,
    evidenceById: indexById(evidence) as Readonly<Record<string, Evidence>>,
    features: Object.freeze(publicFeatures.map((feature) => freeze(feature))),
  });
}

async function loadResource(url: string, resource: string): Promise<unknown> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new BundleLoadError(resource);
    return await response.json();
  } catch (error) {
    if (error instanceof BundleLoadError) throw error;
    throw new BundleLoadError(resource);
  }
}

function joinUrl(baseUrl: string, resource: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${resource}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((record) => isRecord(record) && typeof record.id === "string");
}

function isDataset(value: unknown): value is Dataset {
  return isRecord(value) && typeof value.id === "string" && isTemporalExtent(value.temporalExtent);
}

function isFeatureCollection(value: unknown): value is { features: unknown[] } {
  return isRecord(value) && value.type === "FeatureCollection" && Array.isArray(value.features);
}

function isPublicFeature(value: unknown): value is FeatureVersion {
  return isRecord(value)
    && value.type === "Feature"
    && typeof value.id === "string"
    && isRecord(value.geometry)
    && isRecord(value.properties)
    && value.properties.publicationStatus === "public"
    && isTemporalExtent(value.properties.temporal);
}

function isTemporalExtent(value: unknown): value is TemporalExtent {
  return isRecord(value) && isBoundaryOrNull(value.start) && isBoundaryOrNull(value.end);
}

function isBoundaryOrNull(value: unknown): value is TemporalBoundary | null {
  return value === null || (isRecord(value) && isYearOrNull(value.earliestYear) && isYearOrNull(value.latestYear));
}

function isYearOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function indexById(records: readonly Record<string, unknown>[]): Readonly<Record<string, Record<string, unknown>>> {
  const indexed: Record<string, Record<string, unknown>> = {};
  for (const record of records) indexed[record.id as string] = freeze(record);
  return Object.freeze(indexed);
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
