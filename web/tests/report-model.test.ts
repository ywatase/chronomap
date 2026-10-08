import { describe, expect, it } from "vitest";
import { buildReportModel } from "../src/domain/report-model";
import type { AppState } from "../src/app/state";
import type { PublicBundle } from "../src/domain/types";
import { comparisonCandidates } from "../src/domain/comparison-candidates";

const first = {
  type: "Feature" as const,
  id: "ogurike:version:waterbody-1910",
  geometry: { type: "Polygon" as const, coordinates: [] },
  properties: {
    entityId: "ogurike:entity:ogurike",
    labels: { ja: "巨椋池" },
    description: { ja: "概略復元" },
    hypothesisGroupId: "ogurike:hypothesis:waterbody-shape",
    hypothesisLabel: { ja: "概略復元案" },
    temporal: { start: { earliestYear: 1910, latestYear: 1910, precision: "year" as const, qualifier: "exact" as const }, end: { earliestYear: 1910, latestYear: 1910, precision: "year" as const, qualifier: "exact" as const } },
    uncertainty: {
      temporal: { assessment: "well-supported" as const, note: "年次資料", evidenceIds: ["evidence:map"] },
      location: { assessment: "approximate" as const, note: "概略", evidenceIds: ["evidence:map"] },
      geometry: { assessment: "approximate" as const, note: "", evidenceIds: [] },
      identity: { assessment: "unknown" as const, note: "", evidenceIds: [] },
    },
    evidenceIds: ["evidence:map"],
    publicationStatus: "public" as const,
    rights: { status: "open-license" as const, attribution: "Chronomap" },
  },
};
const second = { ...first, id: "ogurike:version:waterbody-1942", properties: { ...first.properties, labels: { ja: "巨椋池（1942年）" }, temporal: { ...first.properties.temporal, start: { ...first.properties.temporal.start, earliestYear: 1942, latestYear: 1942 }, end: { ...first.properties.temporal.end, earliestYear: 1942, latestYear: 1942 } } } };
const bundle = {
  dataset: { id: "ogurike:dataset:pilot", schemaVersion: "1.0.0", title: { ja: "巨椋池" }, description: { ja: "説明" }, defaultLanguage: "ja", bbox: [0, 0, 1, 1], temporalExtent: { start: null, end: null }, rights: { status: "open-license", attribution: "Chronomap" }, files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" } },
  entitiesById: { "ogurike:entity:ogurike": { id: "ogurike:entity:ogurike", type: "waterbody", labels: { ja: "巨椋池" }, description: { ja: "歴史上の池" } } },
  sourcesById: { "source:map": { id: "source:map", type: "map", citation: "資料図 1910", title: { ja: "資料図" }, creators: ["作成者"], publishedYear: 1910, url: "https://example.com/source", accessedDate: "2026-09-18", rights: { status: "restricted" } } },
  evidenceById: { "evidence:map": { id: "evidence:map", sourceId: "source:map", locator: "図1", usage: "citation", supports: ["location", "geometry"], note: "引用メタデータのみ" } },
  features: [first, second],
} as unknown as PublicBundle;

const state: AppState = {
  status: "ready",
  selectedYear: 1910,
  visibleFeatures: [first],
  selectedFeatureId: first.id,
  activeMobileTab: "detail",
  error: null,
  allFeatures: [first, second],
};

const historicalMapAsset = {
  id: "ogurike:historical-map:sample",
  title: { ja: "測量部地図（1910年頃）" },
  description: { ja: "後世の地理コンテキスト" },
  tileTemplate: "https://tiles.example.invalid/{z}/{x}/{y}.png",
  bbox: [0, 0, 1, 1] as const,
  date: "1910年頃",
  accessedDate: "2026-10-08",
  georeference: { method: "提供元XYZタイル", error: "歴史geometryとの時代差は未評価" },
  sourceUrl: "https://example.com/historical-map",
  attribution: "国土地理院",
  rights: { status: "open-license" as const, attribution: "国土地理院", terms: "利用規約" },
  minZoom: 13,
  maxZoom: 18,
};

describe("report model", () => {
  it("projects a selected feature with citation-only evidence and comparison versions", () => {
    const model = buildReportModel(bundle, state, "https://example.com/?year=1910", comparisonCandidates(bundle.features)[0]!, historicalMapAsset);
    expect(model).not.toBeNull();
    expect(model?.feature.label).toBe("巨椋池");
    expect(model?.feature.entityType).toBe("水域");
    expect(model?.feature.period).toContain("1910年");
    expect(model?.feature.geometry).toBe("面");
    expect((model?.feature as unknown as { hypothesis?: string }).hypothesis).toBe("概略復元案");
    expect(model?.feature.evidence[0]?.citationOnly).toBe(true);
    expect(model?.feature.evidence[0]?.locator).toBe("図1");
    expect(model?.comparison.map((version) => version.year)).toEqual(["1910年", "1942年"]);
    expect(model?.historicalMapAsset?.title).toBe("測量部地図（1910年頃）");
    expect(model?.historicalMapAsset?.georeference).toContain("未評価");
    expect(model?.historicalMapAsset?.rights).toContain("利用規約");
    expect(model?.shareUrl).toContain("year=1910");
  });

  it("does not expose a report before a public feature is selected", () => {
    expect(buildReportModel(bundle, { ...state, selectedFeatureId: null }, "", null)).toBeNull();
  });
});
