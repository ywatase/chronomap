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

const teachingGuide = {
  recommendedFor: { ja: "  地域の変化を読む導入に ", en: "An introduction to reading regional change" },
  learningGoal: { ja: "図の根拠を使って変化を一文で説明する。", en: "Explain change in one sentence using figure evidence." },
  preparation: [{ ja: "印刷したワークシート", en: "Printed worksheet" }, { ja: "筆記具", en: "Writing utensil" }],
  assessment: { ja: "図の位置関係を根拠とともに説明できるか。", en: "Can learners explain the positional relationship with evidence?" },
  usageNote: { ja: "学年や地域の文脈に合わせて問いを調整します。", en: "Adapt the prompt to the grade and local context." },
};

describe("guided lesson manifest", () => {
  it("validates public features and comparison entities against the bundle", () => {
    const lesson = parseLesson(valid, bundle);
    expect(lesson?.steps).toHaveLength(2);
    expect(lesson && lessonStepIndex(lesson, "second")).toBe(1);
    expect(lesson && lessonStepIndex(lesson, "missing")).toBeNull();
  });

  it("accepts and trims localized teacher notes when every default-language string is bounded", () => {
    const parsed = parseLesson({
      ...valid,
      steps: [{ ...valid.steps[0], teacherNote: { ja: "  形状の向きを確認します。 ", en: "  Check the shape direction. " } }],
    }, bundle);
    expect(parsed?.steps[0]?.teacherNote).toEqual({ ja: "形状の向きを確認します。", en: "Check the shape direction." });
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], teacherNote: { ja: "日本語だけの読み取り例" } }] }, bundle)?.steps[0]?.teacherNote).toEqual({ ja: "日本語だけの読み取り例" });
  });

  it("rejects malformed teacher notes and notes missing the dataset default language", () => {
    const baseStep = valid.steps[0];
    expect(parseLesson({ ...valid, steps: [{ ...baseStep, teacherNote: { en: "English only" } }] }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...baseStep, teacherNote: { ja: "   " } }] }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...baseStep, teacherNote: { ja: "x".repeat(501) } }] }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...baseStep, teacherNote: { ja: 123 } }] }, bundle)).toBeNull();
  });

  it("rejects mismatched dataset, private features, and invalid comparison references", () => {
    expect(parseLesson({ ...valid, dataset: "other" }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], featureId: "missing" }] }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], featureId: first.id, year: 1800 }] }, bundle)).toBeNull();
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], featureId: first.id, comparisonEntityId: "missing" }] }, bundle)).toBeNull();
    const privateBundle = { ...bundle, features: [feature(first.id, first.properties.entityId, 1590, "private")] } as unknown as PublicBundle;
    expect(parseLesson({ ...valid, steps: [{ ...valid.steps[0], featureId: first.id }] }, privateBundle)).toBeNull();
  });

  it("parses and freezes the bounded bilingual teaching guide while keeping older manifests compatible", () => {
    const parsed = parseLesson({ ...valid, teachingGuide }, bundle);
    expect(parsed?.teachingGuide).toMatchObject({ recommendedFor: { ja: "地域の変化を読む導入に", en: "An introduction to reading regional change" } });
    expect(parsed?.teachingGuide?.preparation[0]).toEqual({ ja: "印刷したワークシート", en: "Printed worksheet" });
    expect(Object.isFrozen(parsed?.teachingGuide)).toBe(true);
    expect(Object.isFrozen(parsed?.teachingGuide?.preparation)).toBe(true);
    expect(parseLesson(valid, bundle)?.teachingGuide).toBeUndefined();
  });

  it("rejects teaching guides that are incomplete, unknown, out of bounds, or use invalid locale keys", () => {
    const invalid = (guide: Record<string, unknown>) => parseLesson({ ...valid, teachingGuide: { ...teachingGuide, ...guide } }, bundle);
    expect(invalid({ recommendedFor: { en: "English only" } })).toBeNull();
    expect(invalid({ learningGoal: { ja: "   " } })).toBeNull();
    expect(invalid({ preparation: [] })).toBeNull();
    expect(invalid({ preparation: [...teachingGuide.preparation, ...teachingGuide.preparation, ...teachingGuide.preparation] })).toBeNull();
    expect(invalid({ assessment: { ja: "x".repeat(301) } })).toBeNull();
    expect(invalid({ usageNote: { ja: "x".repeat(301) } })).toBeNull();
    expect(invalid({ extra: "not allowed" })).toBeNull();
    expect(invalid({ recommendedFor: { ja_JP: "invalid locale" } })).toBeNull();
    expect(invalid({ preparation: [{ ja: "x".repeat(161) }] })).toBeNull();
  });
});
