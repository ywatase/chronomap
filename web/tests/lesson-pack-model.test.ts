import { describe, expect, it } from "vitest";
import { buildLessonPackModel } from "../src/domain/lesson-pack-model";
import type { Lesson } from "../src/domain/lesson";
import type { FeatureVersion, PublicBundle } from "../src/domain/types";

function feature(id: string, year: number, evidenceId: string): FeatureVersion {
  return {
    type: "Feature", id, geometry: { type: "Point", coordinates: [135, 35] },
    properties: {
      entityId: "ogurike:entity:river", labels: { ja: `宇治川${year}年` }, description: { ja: `説明${year}` }, publicationStatus: "public",
      temporal: { start: { earliestYear: year, latestYear: year, precision: "year", qualifier: "exact" }, end: { earliestYear: year, latestYear: year, precision: "year", qualifier: "exact" } },
      uncertainty: {
        temporal: { assessment: "well-supported", note: "根拠", evidenceIds: [evidenceId] },
        location: { assessment: "approximate", note: "概略", evidenceIds: [evidenceId] },
        geometry: { assessment: "approximate", note: "概略", evidenceIds: [evidenceId] },
        identity: { assessment: "well-supported", note: "", evidenceIds: [evidenceId] },
      },
      evidenceIds: [evidenceId], rights: { status: "open-license" },
    },
  };
}

const first = feature("ogurike:version:first", 1590, "ogurike:evidence:river");
const second = feature("ogurike:version:second", 1596, "ogurike:evidence:river");
const bundle = {
  dataset: {
    id: "ogurike:dataset", schemaVersion: "1.0.0", title: { ja: "巨椋池" }, description: { ja: "説明" }, defaultLanguage: "ja",
    bbox: [134, 34, 136, 36], temporalExtent: { start: { earliestYear: 1590, latestYear: 1590, precision: "year", qualifier: "exact" }, end: { earliestYear: 1596, latestYear: 1596, precision: "year", qualifier: "exact" } },
    rights: { status: "open-license", attribution: "Chronomap", terms: "terms" }, files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" },
  },
  entitiesById: { "ogurike:entity:river": { id: "ogurike:entity:river", type: "river", labels: { ja: "宇治川" }, description: { ja: "水系" } } },
  sourcesById: { "ogurike:source:one": { id: "ogurike:source:one", type: "reference", citation: "出典", title: { ja: "資料" }, creators: ["作成者"], publishedYear: 2020, url: "https://example.test/source", accessedDate: "2026-09-18", rights: { status: "restricted" } } },
  evidenceById: { "ogurike:evidence:river": { id: "ogurike:evidence:river", sourceId: "ogurike:source:one", locator: "p.2", usage: "citation", supports: ["location"], note: "相対位置" } },
  features: [first, second],
} as unknown as PublicBundle;

const lesson: Lesson = {
  id: "intro", dataset: "ogurike", title: { ja: "教材" }, description: { ja: "説明" }, durationMinutes: 15,
  steps: [
    { id: "first", year: 1590, featureId: first.id, prompt: { ja: "問い" }, teacherNote: { ja: "形状の向きを確認します。" } },
    { id: "second", year: 1596, featureId: second.id, prompt: { ja: "問い2" }, comparisonEntityId: "ogurike:entity:river" },
  ],
};

describe("lesson pack model", () => {
  it("projects ordered steps, deduplicated sources, comparison, and share URLs", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/app/?year=1596");
    expect(model?.steps.map((step) => step.year)).toEqual([1590, 1596]);
    expect(model?.datasetBbox).toEqual([134, 34, 136, 36]);
    expect(model?.steps[0]?.featureGeometry?.type).toBe("Point");
    expect(model?.steps[0]?.shareUrl).toContain("lesson=intro");
    expect(model?.steps[0]?.shareUrl).toContain("step=first");
    expect(model?.steps[1]?.comparison).toHaveLength(2);
    expect(model?.sources).toHaveLength(1);
    expect(model?.sources[0]?.citationOnly).toBe(true);
    expect(model?.sources[0]?.evidence[0]?.locator).toBe("p.2");
    expect(model?.steps[0]?.description).not.toContain("secret");
    expect(model?.steps[0]?.teacherNote).toEqual("形状の向きを確認します。");
    expect(model?.steps[1]?.teacherNote).toBeUndefined();
  });

  it("fails closed when lesson evidence cannot be resolved", () => {
    const broken = { ...bundle, evidenceById: {} } as unknown as PublicBundle;
    expect(buildLessonPackModel(lesson, broken, "https://example.test/app/")).toBeNull();
  });

  it("falls back to the only localized teacher note when a directly supplied model lacks the bundle language", () => {
    const englishBundle = { ...bundle, dataset: { ...bundle.dataset, defaultLanguage: "en" } } as unknown as PublicBundle;
    const japaneseOnly = { ...lesson, steps: [{ ...lesson.steps[0], teacherNote: { ja: "日本語の読み取り例" } }] };
    expect(buildLessonPackModel(japaneseOnly, englishBundle, "https://example.test/app/")?.steps[0]?.teacherNote).toBe("日本語の読み取り例");
  });

  it("projects teaching-guide copy in the selected language without mutating the lesson", () => {
    const lessonWithGuide: Lesson = {
      ...lesson,
      teachingGuide: {
        recommendedFor: { ja: "地域史の導入に", en: "For a local-history introduction" },
        learningGoal: { ja: "変化を説明する。", en: "Explain change." },
        preparation: [{ ja: "ワークシート", en: "Worksheet" }],
        assessment: { ja: "根拠を示せるか。", en: "Can learners show evidence?" },
        usageNote: { ja: "問いを調整する。", en: "Adapt the prompt." },
      },
    };
    const model = buildLessonPackModel(lessonWithGuide, bundle, "https://example.test/")!;
    expect(model.teachingGuide).toEqual({ recommendedFor: "地域史の導入に", learningGoal: "変化を説明する。", preparation: ["ワークシート"], assessment: "根拠を示せるか。", usageNote: "問いを調整する。" });
    expect(lessonWithGuide.teachingGuide?.preparation[0]?.ja).toBe("ワークシート");
    const englishBundle = { ...bundle, dataset: { ...bundle.dataset, defaultLanguage: "en" } } as unknown as PublicBundle;
    expect(buildLessonPackModel(lessonWithGuide, englishBundle, "https://example.test/")?.teachingGuide).toMatchObject({ recommendedFor: "For a local-history introduction", preparation: ["Worksheet"] });
  });
});
