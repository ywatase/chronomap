import { describe, expect, it } from "vitest";
import { applyLessonPackCustomization, customizeLessonPackModel, normalizeLessonPackCustomization } from "../src/domain/lesson-pack-customization";
import type { LessonPackEvidence, LessonPackModel, LessonPackSource, LessonPackStep } from "../src/domain/lesson-pack-model";

function evidence(id: string, sourceId: string): LessonPackEvidence {
  return {
    id,
    sourceId,
    supports: ["location"],
    locator: `${id}-locator`,
    note: `${id}-note`,
    citation: `${sourceId}-citation`,
    title: `${sourceId}-title`,
    url: `https://example.test/${sourceId}`,
    rights: "open-license",
    citationOnly: false,
  };
}

function step(id: string, prompt: string, evidenceItems: readonly LessonPackEvidence[]): LessonPackStep {
  return {
    id,
    year: id === "first" ? 1590 : 1596,
    yearLabel: id === "first" ? "1590年" : "1596年",
    featureId: `feature-${id}`,
    label: `${id}-label`,
    entityLabel: `${id}-entity`,
    entityDescription: `${id}-entity-description`,
    description: `${id}-description`,
    period: `${id}-period`,
    geometry: "点",
    prompt,
    uncertainty: [`${id}-uncertainty`],
    evidence: evidenceItems,
    comparison: [],
    shareUrl: `https://example.test/app?lesson=intro&step=${id}`,
  };
}

function source(id: string, evidenceItems: readonly LessonPackEvidence[]): LessonPackSource {
  return {
    id,
    citation: `${id}-citation`,
    title: `${id}-title`,
    creators: ["Chronomap"],
    publishedYear: 2020,
    url: `https://example.test/${id}`,
    accessedDate: "2026-09-18",
    rights: "open-license",
    citationOnly: false,
    evidence: evidenceItems,
  };
}

const firstEvidence = evidence("evidence-first", "source-first");
const sharedFirstEvidence = evidence("evidence-shared-first", "source-shared");
const sharedSecondEvidence = evidence("evidence-shared-second", "source-shared");
const firstStep = step("first", "元の問い1", [firstEvidence, sharedFirstEvidence]);
const secondStep = step("second", "元の問い2", [sharedSecondEvidence]);

const model: LessonPackModel = {
  language: "ja",
  title: "元の教材",
  description: "元の説明",
  durationMinutes: 20,
  datasetId: "dataset:demo",
  datasetTitle: "データセット",
  datasetDescription: "データセットの説明",
  datasetRights: "open-license",
  steps: [firstStep, secondStep],
  sources: [source("source-first", [firstEvidence]), source("source-shared", [sharedFirstEvidence, sharedSecondEvidence])],
  startUrl: firstStep.shareUrl,
};

describe("lesson pack customization", () => {
  it("normalizes labels, prompts, order, and teacher visibility while projecting selected evidence", () => {
    const customized = customizeLessonPackModel(model, {
      title: "  授業用の教材  ",
      classLabel: "  中学二年  ",
      selectedStepIds: ["second", "second", "missing"],
      promptsByStepId: { second: "  新しい問い  ", first: "除外される問い" },
      includeTeacher: false,
    });

    expect(customized).not.toBeNull();
    expect(customized?.title).toBe("授業用の教材");
    expect(customized?.classLabel).toBe("中学二年");
    expect(customized?.includeTeacher).toBe(false);
    expect(customized?.customization.selectedStepIds).toEqual(["second"]);
    expect(customized?.steps.map((item) => item.id)).toEqual(["second"]);
    expect(customized?.steps.map((item) => item.prompt)).toEqual(["新しい問い"]);
    expect(customized?.startUrl).toBe(secondStep.shareUrl);
    expect(customized?.sources.map((item) => item.id)).toEqual(["source-shared"]);
    expect(customized?.sources[0]?.evidence.map((item) => item.id)).toEqual(["evidence-shared-second"]);
  });

  it("falls back from blank labels and prompts, and defaults an omitted selection to every step", () => {
    const normalized = normalizeLessonPackCustomization(model, {
      title: "\n  ",
      classLabel: "\t",
      promptsByStepId: { first: "  ", second: null },
    });
    expect(normalized).not.toBeNull();
    expect(normalized?.title).toBe("元の教材");
    expect(normalized?.classLabel).toBe("");
    expect(normalized?.selectedStepIds).toEqual(["first", "second"]);
    expect(normalized?.promptsByStepId).toEqual({ first: "元の問い1", second: "元の問い2" });
    expect(normalized?.includeTeacher).toBe(true);

    const customized = customizeLessonPackModel(model, {
      title: " ",
      classLabel: " ",
      promptsByStepId: { first: "  ", second: null },
    });
    expect(customized?.steps.map((item) => item.prompt)).toEqual(["元の問い1", "元の問い2"]);
  });

  it("preserves an existing class label when an edited label is blank", () => {
    const labeledModel = { ...model, classLabel: "既存の対象" };
    const normalized = normalizeLessonPackCustomization(labeledModel, { classLabel: "  " });
    expect(normalized?.classLabel).toBe("既存の対象");
    const applied = applyLessonPackCustomization(labeledModel, {
      title: "編集タイトル",
      classLabel: "",
      selectedStepIds: ["first"],
      promptsByStepId: {},
      includeTeacher: true,
    });
    expect(applied?.classLabel).toBe("既存の対象");
  });

  it("rejects an explicit selection with no surviving steps", () => {
    expect(normalizeLessonPackCustomization(model, { selectedStepIds: [] })).toBeNull();
    expect(customizeLessonPackModel(model, { selectedStepIds: ["missing"] })).toBeNull();
  });

  it("bounds editable labels and prompts", () => {
    const customized = customizeLessonPackModel(model, {
      title: "t".repeat(200),
      classLabel: "c".repeat(200),
      promptsByStepId: { first: "p".repeat(700) },
    });
    expect(customized?.title).toHaveLength(120);
    expect(customized?.classLabel).toHaveLength(80);
    expect(customized?.steps[0]?.prompt).toHaveLength(500);
  });

  it("removes evidence and sources that belong only to an excluded step", () => {
    const secondOnlyEvidence = evidence("evidence-second-only", "source-second-only");
    const modelWithSecondOnly: LessonPackModel = {
      ...model,
      steps: [firstStep, { ...secondStep, evidence: [sharedSecondEvidence, secondOnlyEvidence] }],
      sources: [...model.sources, source("source-second-only", [secondOnlyEvidence])],
    };
    const customized = customizeLessonPackModel(modelWithSecondOnly, { selectedStepIds: ["first"] });
    expect(customized?.steps.map((item) => item.id)).toEqual(["first"]);
    expect(customized?.sources.map((item) => item.id)).toEqual(["source-first", "source-shared"]);
    expect(customized?.sources.find((item) => item.id === "source-shared")?.evidence.map((item) => item.id)).toEqual(["evidence-shared-first"]);
    expect(customized?.sources.find((item) => item.id === "source-second-only")).toBeUndefined();
  });
});
