import type { Dataset, Entity, Evidence, FeatureVersion, Geometry, PublicBundle, Source, TemporalBoundary, TemporalExtent } from "./types";

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
  if (!isEntityArray(entities)) throw new BundleLoadError("entities.json");
  if (!isSourceArray(sources)) throw new BundleLoadError("sources.json");
  if (!isEvidenceArray(evidence)) throw new BundleLoadError("evidence.json");
  if (!isFeatureCollection(collection)) throw new BundleLoadError("feature-versions.geojson");

  for (const feature of collection.features) {
    if (hasPublicStatus(feature) && !isFeatureVersion(feature)) {
      throw new BundleLoadError("feature-versions.geojson");
    }
  }
  const publicFeatures = collection.features.filter(hasPublicStatus) as FeatureVersion[];
  return Object.freeze({
    dataset: freeze(dataset),
    entitiesById: indexById(entities),
    sourcesById: indexById(sources),
    evidenceById: indexById(evidence),
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

function isDataset(value: unknown): value is Dataset {
  return isRecord(value) && value.schemaVersion === "1.0.0" && typeof value.id === "string"
    && isTextMap(value.title) && isTextMap(value.description) && typeof value.defaultLanguage === "string"
    && isBbox(value.bbox) && isTemporalExtent(value.temporalExtent) && isRights(value.rights)
    && isRecord(value.files) && value.files.entities === "entities.json" && value.files.sources === "sources.json"
    && value.files.evidence === "evidence.json" && value.files.featureVersions === "feature-versions.geojson";
}

function isEntityArray(value: unknown): value is Entity[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.type === "string" && isTextMap(item.labels) && isTextMap(item.description));
}
function isSourceArray(value: unknown): value is Source[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.type === "string" && typeof item.citation === "string" && isTextMap(item.title) && Array.isArray(item.creators) && item.creators.every((creator) => typeof creator === "string") && isYear(item.publishedYear) && typeof item.url === "string" && isSafeHttpUrl(item.url) && typeof item.accessedDate === "string" && isRights(item.rights));
}

function isSafeHttpUrl(value: string): boolean { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
function isEvidenceArray(value: unknown): value is Evidence[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.sourceId === "string" && typeof item.locator === "string" && (item.usage === "citation" || item.usage === "derived-geometry") && Array.isArray(item.supports) && item.supports.length > 0 && item.supports.every((support) => ["temporal", "location", "geometry", "identity"].includes(support as string)) && typeof item.note === "string" && (item.publicationBasis === undefined || ["open-license", "public-domain", "permission", "original-reconstruction"].includes(item.publicationBasis as string)));
}

function isFeatureCollection(value: unknown): value is { features: unknown[] } {
  return isRecord(value) && value.type === "FeatureCollection" && Array.isArray(value.features);
}

function hasPublicStatus(value: unknown): boolean {
  return isRecord(value) && isRecord(value.properties) && value.properties.publicationStatus === "public";
}

function isFeatureVersion(value: unknown): value is FeatureVersion {
  return isRecord(value)
    && value.type === "Feature"
    && typeof value.id === "string"
    && isGeometry(value.geometry)
    && isRecord(value.properties)
    && typeof value.properties.entityId === "string"
    && isTextMap(value.properties.labels) && isTextMap(value.properties.description)
    && isTemporalExtent(value.properties.temporal)
    && isUncertainty(value.properties.uncertainty)
    && Array.isArray(value.properties.evidenceIds) && value.properties.evidenceIds.every((id) => typeof id === "string")
    && isRights(value.properties.rights)
    && isHypothesisPair(value.properties);
}

function isHypothesisPair(properties: Record<string, unknown>): boolean {
  const hasGroup = properties.hypothesisGroupId !== undefined;
  const hasLabel = properties.hypothesisLabel !== undefined;
  return hasGroup === hasLabel
    && (!hasGroup || (typeof properties.hypothesisGroupId === "string" && properties.hypothesisGroupId.length > 0 && isTextMap(properties.hypothesisLabel)));
}

function isTextMap(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length > 0 && Object.values(value).every((text) => typeof text === "string" && text.length > 0);
}

function isRights(value: unknown): boolean {
  return isRecord(value) && ["public-domain", "open-license", "permission", "restricted", "unknown"].includes(value.status as string)
    && (value.attribution === undefined || typeof value.attribution === "string")
    && (value.terms === undefined || typeof value.terms === "string");
}

function isUncertainty(value: unknown): boolean {
  return isRecord(value) && ["temporal", "location", "geometry", "identity"].every((dimension) => isAssessment(value[dimension]));
}

function isAssessment(value: unknown): boolean {
  return isRecord(value)
    && ["well-supported", "approximate", "disputed", "unknown", "not-applicable"].includes(value.assessment as string)
    && typeof value.note === "string"
    && Array.isArray(value.evidenceIds)
    && value.evidenceIds.every((id) => typeof id === "string");
}

function isBbox(value: unknown): boolean {
  return Array.isArray(value) && value.length === 4 && value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));
}

function isYear(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function isTemporalExtent(value: unknown): value is TemporalExtent {
  return isRecord(value)
    && isBoundaryOrNull(value.start)
    && isBoundaryOrNull(value.end)
    && !(value.start === null && value.end === null);
}

function isBoundaryOrNull(value: unknown): value is TemporalBoundary | null {
  return value === null
    || (isRecord(value)
      && isYearOrNull(value.earliestYear)
      && isYearOrNull(value.latestYear)
      && (value.earliestYear !== null || value.latestYear !== null)
      && !(typeof value.earliestYear === "number" && typeof value.latestYear === "number" && value.earliestYear > value.latestYear)
      && ["year", "decade", "century", "period", "unknown"].includes(value.precision as string)
      && ["exact", "circa", "before", "after", "unknown"].includes(value.qualifier as string));
}

function isYearOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value));
}

function isGeometry(value: unknown): value is Geometry {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  const depthByType: Readonly<Record<string, number>> = {
    Point: 0,
    MultiPoint: 1,
    LineString: 1,
    MultiLineString: 2,
    Polygon: 2,
    MultiPolygon: 3,
  };
  const depth = depthByType[value.type];
  return depth !== undefined && isCoordinates(value.coordinates, depth);
}

function isCoordinates(value: unknown, depth: number): boolean {
  if (depth === 0) {
    return Array.isArray(value)
      && value.length === 2
      && value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));
  }
  return Array.isArray(value) && value.every((coordinate) => isCoordinates(coordinate, depth - 1));
}

function indexById<T extends { readonly id: string }>(records: readonly T[]): Readonly<Record<string, T>> {
  const indexed: Record<string, T> = {};
  for (const record of records) indexed[record.id] = freeze(record);
  return Object.freeze(indexed);
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
