export type LocalizedText = Readonly<Record<string, string>>;
export type RightsStatus = "public-domain" | "open-license" | "permission" | "restricted" | "unknown";
export type TemporalPrecision = "year" | "decade" | "century" | "period" | "unknown";
export type TemporalQualifier = "exact" | "circa" | "before" | "after" | "unknown";
export const ENTITY_TYPES = ["waterbody", "watercourse", "coastline", "fortification", "settlement", "port", "battlefield", "route", "boundary", "polity", "sphere-of-influence", "archaeological-site", "other"] as const;
export type EntityType = typeof ENTITY_TYPES[number];

export interface Rights {
  readonly status: RightsStatus;
  readonly attribution?: string;
  readonly terms?: string;
}

export interface TemporalBoundary {
  readonly earliestYear: number | null;
  readonly latestYear: number | null;
  readonly precision: TemporalPrecision;
  readonly qualifier: TemporalQualifier;
}

export interface TemporalExtent {
  readonly start: TemporalBoundary | null;
  readonly end: TemporalBoundary | null;
}

/**
 * Metadata for an optional historical raster overlay.
 *
 * The overlay is deliberately separate from FeatureVersion geometry: it is a
 * visual context layer and never substitutes for evidence or a reconstructed
 * boundary. Exactly one of tileTemplate and imageUrl is expected at runtime.
 */
export interface HistoricalMapAsset {
  readonly id: string;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly tileTemplate?: string;
  readonly imageUrl?: string;
  readonly bbox: readonly [number, number, number, number];
  readonly date: string;
  readonly accessedDate: string;
  readonly georeference: Readonly<{ method: string; error: string }>;
  readonly sourceUrl: string;
  readonly attribution: string;
  readonly rights: Rights;
  readonly minZoom: number;
  readonly maxZoom: number;
}

export interface Dataset {
  readonly id: string;
  readonly schemaVersion: "1.0.0";
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly defaultLanguage: string;
  readonly bbox: readonly [number, number, number, number];
  readonly temporalExtent: TemporalExtent;
  readonly rights: Rights;
  readonly files: Readonly<{ entities: "entities.json"; sources: "sources.json"; evidence: "evidence.json"; featureVersions: "feature-versions.geojson" }>;
  readonly historicalMapAssets?: readonly HistoricalMapAsset[];
}

export interface Entity {
  readonly id: string;
  readonly type: EntityType;
  readonly labels: LocalizedText;
  readonly description: LocalizedText;
}

export interface Source {
  readonly id: string;
  readonly type: string;
  readonly citation: string;
  readonly title: LocalizedText;
  readonly creators: readonly string[];
  readonly publishedYear: number;
  readonly url: string;
  readonly accessedDate: string;
  readonly rights: Rights;
}

export interface Evidence {
  readonly id: string;
  readonly sourceId: string;
  readonly locator: string;
  readonly usage: "citation" | "derived-geometry";
  readonly supports: readonly ("temporal" | "location" | "geometry" | "identity")[];
  readonly note: string;
  readonly publicationBasis?: "open-license" | "public-domain" | "permission" | "original-reconstruction";
}

export interface UncertaintyAssessment {
  readonly assessment: "well-supported" | "approximate" | "disputed" | "unknown" | "not-applicable";
  readonly note: string;
  readonly evidenceIds: readonly string[];
}

export interface Uncertainty {
  readonly temporal: UncertaintyAssessment;
  readonly location: UncertaintyAssessment;
  readonly geometry: UncertaintyAssessment;
  readonly identity: UncertaintyAssessment;
}

export type GeometryType = "Point" | "MultiPoint" | "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon";

export interface Geometry {
  readonly type: GeometryType;
  readonly coordinates: readonly unknown[];
}

export interface FeatureProperties {
  readonly entityId: string;
  /** Derived from the referenced Entity when a public bundle is loaded. */
  readonly entityType?: EntityType;
  readonly labels: LocalizedText;
  readonly description: LocalizedText;
  readonly temporal: TemporalExtent;
  readonly uncertainty: Uncertainty;
  readonly evidenceIds: readonly string[];
  readonly publicationStatus?: "public" | "private";
  readonly rights: Rights;
  readonly hypothesisGroupId?: string;
  readonly hypothesisLabel?: LocalizedText;
}

export interface FeatureVersion {
  readonly type: "Feature";
  readonly id: string;
  readonly geometry: Geometry;
  readonly properties: FeatureProperties;
}

export interface PublicBundle {
  readonly dataset: Dataset;
  readonly entitiesById: Readonly<Record<string, Entity>>;
  readonly sourcesById: Readonly<Record<string, Source>>;
  readonly evidenceById: Readonly<Record<string, Evidence>>;
  readonly features: readonly FeatureVersion[];
}
