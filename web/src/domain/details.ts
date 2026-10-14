import { fnv1a32 } from "./fnv1a";
import type { TextMap } from "./manifest";

export interface TemporalBoundary {
  readonly earliestYear: number | null;
  readonly latestYear: number | null;
  readonly precision: string;
  readonly qualifier: string;
}

export interface Assessment {
  readonly assessment: string;
  readonly note: string;
  readonly evidenceIds: readonly string[];
}

export interface Rights {
  readonly status: string;
  readonly attribution?: string;
  readonly terms?: string;
}

export interface FeatureDetail {
  readonly entityId: string;
  readonly labels: TextMap;
  readonly description: TextMap;
  readonly temporal: { readonly start: TemporalBoundary | null; readonly end: TemporalBoundary | null };
  readonly uncertainty: Readonly<Record<"temporal" | "location" | "geometry" | "identity", Assessment>>;
  readonly evidenceIds: readonly string[];
  readonly rights: Rights;
  readonly hypothesisLabel?: TextMap;
  /** Present when the map keeps this snapshot visible until the next version (docs/data/tiles.md). */
  readonly display?: { readonly toYear: number; readonly nextVersionYear: number };
}

export interface EntityRecord {
  readonly id: string;
  readonly type: string;
  readonly labels: TextMap;
  readonly description: TextMap;
}

export interface SourceRecord {
  readonly id: string;
  readonly citation: string;
  readonly title?: TextMap;
  readonly url?: string;
  readonly rights?: Rights;
}

export interface EvidenceRecord {
  readonly id: string;
  readonly sourceId: string;
  readonly locator?: string;
  readonly usage?: string;
  readonly note?: string;
}

interface DetailShard {
  readonly features: Readonly<Record<string, FeatureDetail>>;
  readonly entities: Readonly<Record<string, EntityRecord>>;
  readonly evidence: Readonly<Record<string, EvidenceRecord>>;
  readonly sources: Readonly<Record<string, SourceRecord>>;
}

export interface ResolvedDetail {
  readonly id: string;
  readonly dataset: string;
  readonly feature: FeatureDetail;
  readonly entity: EntityRecord | null;
  readonly evidence: readonly (EvidenceRecord & { readonly source: SourceRecord | null })[];
}

export function detailShardPath(dataset: string, featureVersionId: string, shards: number): string {
  return `details/${dataset}/${fnv1a32(featureVersionId) % shards}.json`;
}

export type FetchJson = (url: string) => Promise<unknown>;

/** Lazily loads and caches detail shards, resolving a FeatureVersion with its reachable records. */
export function createDetailStore(baseUrl: string, shardsByDataset: Readonly<Record<string, number>>, fetchJson: FetchJson) {
  const cache = new Map<string, Promise<DetailShard>>();
  return {
    async load(dataset: string, featureVersionId: string): Promise<ResolvedDetail | null> {
      const shards = shardsByDataset[dataset];
      if (!shards) return null;
      const url = baseUrl + detailShardPath(dataset, featureVersionId, shards);
      let pending = cache.get(url);
      if (!pending) {
        pending = fetchJson(url) as Promise<DetailShard>;
        cache.set(url, pending);
        pending.catch(() => cache.delete(url));
      }
      const shard = await pending;
      const feature = shard.features[featureVersionId];
      if (!feature) return null;
      return {
        id: featureVersionId,
        dataset,
        feature,
        entity: shard.entities[feature.entityId] ?? null,
        evidence: feature.evidenceIds
          .map((id) => shard.evidence[id])
          .filter((record): record is EvidenceRecord => Boolean(record))
          .map((record) => ({ ...record, source: shard.sources[record.sourceId] ?? null })),
      };
    },
  };
}
