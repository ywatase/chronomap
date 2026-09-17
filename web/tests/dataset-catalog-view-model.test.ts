import { describe, expect, it } from "vitest";
import { buildDatasetCatalogViewModel } from "../src/domain/dataset-catalog-view-model";
import type { DatasetCatalogSnapshots } from "../src/domain/dataset-catalog-view-model";
import type { Lesson } from "../src/domain/lesson";
import { DATASET_CATALOG } from "../src/domain/dataset-catalog";
import type { PublicBundle } from "../src/domain/types";

const feature = (id: string, year: number) => ({
  type: "Feature" as const,
  id,
  geometry: { type: "Point" as const, coordinates: [0, 0] },
  properties: {
    entityId: "entity",
    labels: { ja: id },
    description: { ja: "説明" },
    publicationStatus: "public" as const,
    temporal: { start: { earliestYear: year, latestYear: year, precision: "year" as const, qualifier: "exact" as const }, end: null },
    uncertainty: {
      temporal: { assessment: "unknown" as const, note: "", evidenceIds: [] },
      location: { assessment: "unknown" as const, note: "", evidenceIds: [] },
      geometry: { assessment: "unknown" as const, note: "", evidenceIds: [] },
      identity: { assessment: "unknown" as const, note: "", evidenceIds: [] },
    },
    evidenceIds: [],
    rights: { status: "public-domain" as const },
  },
});

const bundle = {
  dataset: {
    id: "ogurike:dataset:sample",
    schemaVersion: "1.0.0",
    title: { ja: "巨椋池", en: "Ogurike" },
    description: { ja: "巨椋池の説明", en: "Ogurike description" },
    defaultLanguage: "ja",
    bbox: [0, 0, 1, 1],
    temporalExtent: { start: { earliestYear: 1590, latestYear: 1590, precision: "year", qualifier: "exact" }, end: { earliestYear: 1910, latestYear: 1910, precision: "year", qualifier: "exact" } },
    rights: { status: "public-domain" },
    files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" },
  },
  entitiesById: {
    "ogurike:entity:one": { id: "ogurike:entity:one", type: "place", labels: { ja: "対象" }, description: { ja: "対象" } },
    "ogurike:entity:two": { id: "ogurike:entity:two", type: "place", labels: { ja: "対象2" }, description: { ja: "対象2" } },
  },
  sourcesById: { "ogurike:source:one": { id: "ogurike:source:one", type: "reference", citation: "出典", title: { ja: "資料" }, creators: [], publishedYear: 2020, url: "https://example.test/source", accessedDate: "2026-09-18", rights: { status: "public-domain" } } },
  evidenceById: {},
  features: [feature("first", 1590), feature("second", 1910)],
} as unknown as PublicBundle;

const lesson: Lesson = {
  id: "ogurike-intro",
  dataset: "ogurike",
  title: { ja: "巨椋池をたどる", en: "Trace Ogurike" },
  description: { ja: "教材", en: "Lesson" },
  durationMinutes: 15,
  steps: [
    { id: "first", year: 1590, featureId: "first", prompt: { ja: "問い", en: "Question" } },
  ],
};

describe("dataset catalog view model", () => {
  it("derives counts, recorded years, lesson metadata, and safe dataset URLs", () => {
    const snapshots: DatasetCatalogSnapshots = {
      ogurike: { bundle, lesson },
      tonegawa: { bundle: null, lesson: null },
    };
    const model = buildDatasetCatalogViewModel(DATASET_CATALOG, snapshots, "ja", "https://example.test/map");
    const ogurike = model.cards.find((card) => card.slug === "ogurike")!;
    const tonegawa = model.cards.find((card) => card.slug === "tonegawa")!;

    expect(ogurike.title).toBe("巨椋池");
    expect(ogurike.region).toBe("京都南部");
    expect(ogurike.years).toEqual([1590, 1910]);
    expect(ogurike.featureCount).toBe(2);
    expect(ogurike.entityCount).toBe(2);
    expect(ogurike.sourceCount).toBe(1);
    expect(ogurike.lesson).toMatchObject({ id: "ogurike-intro", durationMinutes: 15, stepCount: 1, firstStepId: "first", title: "巨椋池をたどる" });
    expect(ogurike.mapUrl).toBe("/map?dataset=ogurike");
    expect(ogurike.lessonUrl).toBe("/map?dataset=ogurike&lesson=ogurike-intro&step=first");

    expect(tonegawa.status).toBe("unavailable");
    expect(tonegawa.title).toBe("利根川東遷");
    expect(tonegawa.description).toBe("");
    expect(tonegawa.featureCount).toBe(0);
    expect(tonegawa.lesson).toBeNull();
    expect(tonegawa.lessonUrl).toBeNull();
  });

  it("uses English labels when the active dataset language is English", () => {
    const model = buildDatasetCatalogViewModel(DATASET_CATALOG.slice(0, 1), { ogurike: { bundle, lesson } }, "en", "/");
    expect(model.cards[0]).toMatchObject({ title: "Ogurike", description: "Ogurike description", region: "Southern Kyoto" });
    expect(model.cards[0]!.lesson?.title).toBe("Trace Ogurike");
  });
});
