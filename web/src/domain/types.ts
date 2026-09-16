export interface TemporalBoundary {
  readonly earliestYear: number | null;
  readonly latestYear: number | null;
}

export interface TemporalExtent {
  readonly start: TemporalBoundary | null;
  readonly end: TemporalBoundary | null;
}

export interface Dataset {
  readonly id?: string;
  readonly temporalExtent: TemporalExtent;
  readonly [key: string]: unknown;
}

export interface Entity {
  readonly id: string;
  readonly [key: string]: unknown;
}

export interface Source {
  readonly id: string;
  readonly [key: string]: unknown;
}

export interface Evidence {
  readonly id: string;
  readonly [key: string]: unknown;
}

export interface FeatureVersion {
  readonly type: "Feature";
  readonly id: string;
  readonly geometry: Readonly<Record<string, unknown>>;
  readonly properties: {
    readonly publicationStatus?: "public" | "private";
    readonly temporal: TemporalExtent;
    readonly [key: string]: unknown;
  };
}

export interface PublicBundle {
  readonly dataset: Dataset;
  readonly entitiesById: Readonly<Record<string, Entity>>;
  readonly sourcesById: Readonly<Record<string, Source>>;
  readonly evidenceById: Readonly<Record<string, Evidence>>;
  readonly features: readonly FeatureVersion[];
}
