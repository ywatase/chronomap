import { describe, expect, it } from "vitest";
import { lessonStepIndex, parseLesson } from "../src/domain/lesson";
import type { FeatureVersion, PublicBundle } from "../src/domain/types";

function feature(id: string, entityId: string, year: number, publicationStatus: "public" | "private" = "public"): FeatureVersion {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: {
      entityId,
      labels: { ja: id },
      description: { ja: id },
      publicationStatus,
      temporal: { start: { earliestYear: year, latestYear: year, precision: "year", qualifier: "exact" }, end: { earliestYear: year, latestYear: year, precision: "year", qualifier: "exact" } },
      uncertainty: {
        temporal: { assessment: "unknown", note: "", evidenceIds: [] },
        location: { assessment: "unknown", note: "", evidenceIds: [] },
        geometry: { assessment: "unknown", note: "", evidenceIds: [] },
        identity: { assessment: "unknown", note: "", evidenceIds: [] },
      },
      evidenceIds: [],
      rights: { status: "public-domain" },
    },
  };
}

const first = feature("ogurike:version:first", "ogurike:entity:uji", 1590);
const second = feature("ogurike:version:second", "ogurike:entity:uji", 1596);
const bundle = {
  dataset: {
    id: "ogurike:dataset", schemaVersion: "1.0.0", title: { ja: "巨椋池" }, description: { ja: "説明" }, defaultLanguage: "ja",
    bbox: [0, 0, 1, 1], temporalExtent: { start: { earliestYear: 1590, latestYear: 1590, precision: "year", qualifier: "exact" }, end: { earliestYear: 1596, latestYear: 1596, precision: "year", qualifier: "exact" } },
    rights: { status: "public-domain" }, files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" },
  },
  entitiesById: {}, sourcesById: {}, evidenceById: {}, features: [first, second],
} as unknown as PublicBundle;

const valid = {
  id: "intro", dataset: "ogurike", title: { ja: "教材", en: "Lesson" }, description: { ja: "説明", en: "Description" }, durationMinutes: 15,
  steps: [
    { id: "first", year: 1590, featureId: first.id, prompt: { ja: "問い", en: "Prompt" } },
    { id: "second", year: 1596, featureId: second.id, prompt: { ja: "問い2", en: "Prompt 2" }, comparisonEntityId: "ogurike:entity:uji" },
  ],
};

describe("guided lesson manifest", () => {
  it("validates public features and comparison entities against the bundle", () => {
    const lesson = parseLesson(valid, bundle);
    expect(lesson?.steps).toHaveLength(2);
    expect(lesson && lessonStepIndex(lesson, "second")).toBe(1);
    expect(lesson && lessonStepIndex(lesson, "missing")).toBeNull();
  });

  it("rejects mismatched dataset, private features, and invalid comparison references", () => {
    expect(parseLesson({ ...valid, dataset: "other" }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], featureId: "missing" }] }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], featureId: first.id, year: 1800 }] }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], featureId: first.id, comparisonEntityId: "missing" }] }, bundle)).toBeNull();
    const privateBundle = { ...bundle, features: [feature(first.id, first.properties.entityId, 1590, "private")] } as unknown as PublicBundle;
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], featureId: first.id }] }, privateBundle)).toBeNull();
  });
});
