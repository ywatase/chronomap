import { describe, expect, it } from "vitest";
import type { LessonPackModel, LessonPackStep } from "../src/domain/lesson-pack-model";
import {
  LESSON_PACK_DRAFT_MAX_BYTES,
  buildLessonPackDraft,
  draftFilename,
  parseLessonPackDraftIdentity,
  parseLessonPackDraft,
  serializeLessonPackDraft,
} from "../src/domain/lesson-pack-draft";
import type { LessonPackCustomizationInput } from "../src/domain/lesson-pack-customization";

function step(id: string, year: number, prompt: string): LessonPackStep {
  return {
    id,
    year,
    yearLabel: `${year}年`,
    featureId: `feature-${id}`,
    label: `${id}の地物`,
    entityLabel: `${id}の対象`,
    entityDescription: "",
    description: `${id}の説明`,
    period: `${year}年頃`,
    geometry: "点",
    prompt,
    teacherNote: "教員だけの読み取り例",
    uncertainty: [],
    evidence: [{ id: `evidence-${id}`, sourceId: `source-${id}`, supports: ["location"], locator: "p.1", note: "note", citation: "citation", title: "source", url: "https://private.example/source", rights: "private", citationOnly: true }],
    comparison: [],
    shareUrl: `https://private.example/?step=${id}`,
  };
}

const model: LessonPackModel = {
  language: "ja",
  lessonId: "ogurike-intro",
  title: "元の教材",
  description: "元の説明",
  durationMinutes: 20,
  datasetId: "ogurike:dataset:pilot",
  datasetTitle: "巨椋池",
  datasetDescription: "説明",
  datasetRights: "open-license",
  steps: [step("first", 1590, "問い1"), step("second", 1596, "問い2")],
  sources: [{ id: "source-first", citation: "private source", title: "private", creators: ["author"], publishedYear: 2020, url: "https://private.example/source", accessedDate: "2026-09-18", rights: "private", citationOnly: true, evidence: [] }],
  startUrl: "https://private.example/?step=first",
};

const customization: LessonPackCustomizationInput = {
  title: "授業用教材",
  classLabel: "2年A組",
  selectedStepIds: ["second"],
  promptsByStepId: { first: "非選択の問い", second: "比較してみよう" },
  includeTeacher: false,
};

describe("lesson pack portable drafts", () => {
  it("round-trips a normalized customization with a stable filename and no private pack data", () => {
    const draft = buildLessonPackDraft(model, customization);
    expect(draft).toEqual({
      schemaVersion: 1,
      dataset: "ogurike",
      lesson: "ogurike-intro",
      customization: {
        title: "授業用教材",
        classLabel: "2年A組",
        selectedStepIds: ["second"],
        promptsByStepId: { second: "比較してみよう" },
        includeTeacher: false,
      },
    });
    const serialized = serializeLessonPackDraft(model, customization);
    expect(serialized).toBe(JSON.stringify(draft));
    expect(serialized).not.toContain("private.example");
    expect(serialized).not.toContain("source");
    expect(serialized).not.toContain("教員だけの読み取り例");
    expect(parseLessonPackDraft(model, serialized!)).toEqual(draft?.customization);
    expect(draftFilename(model)).toBe("chronomap-ogurike-ogurike-intro-draft.json");
  });

  it("normalizes editor values before export", () => {
    const draft = buildLessonPackDraft(model, {
      title: "  授業用教材  ",
      classLabel: "  2年A組 ",
      selectedStepIds: ["second"],
      promptsByStepId: { second: "  問い  " },
      includeTeacher: "false",
    });
    expect(draft?.customization).toEqual({
      title: "授業用教材",
      classLabel: "2年A組",
      selectedStepIds: ["second"],
      promptsByStepId: { second: "問い" },
      includeTeacher: true,
    });
  });

  it.each([
    ["array", "[]"],
    ["unknown top-level key", '{"schemaVersion":1,"dataset":"ogurike","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":["first"],"promptsByStepId":{"first":"x"},"includeTeacher":true},"extra":true}'],
    ["unknown customization key", '{"schemaVersion":1,"dataset":"ogurike","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":["first"],"promptsByStepId":{"first":"x"},"includeTeacher":true,"extra":true}}'],
    ["proto pollution key", '{"schemaVersion":1,"dataset":"ogurike","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":["first"],"promptsByStepId":{"first":"x","__proto__":"bad"},"includeTeacher":true}}'],
    ["wrong schema version", '{"schemaVersion":2,"dataset":"ogurike","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":["first"],"promptsByStepId":{"first":"x"},"includeTeacher":true}}'],
    ["wrong dataset", '{"schemaVersion":1,"dataset":"tonegawa","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":["first"],"promptsByStepId":{"first":"x"},"includeTeacher":true}}'],
    ["wrong lesson", '{"schemaVersion":1,"dataset":"ogurike","lesson":"other","customization":{"title":"x","classLabel":"","selectedStepIds":["first"],"promptsByStepId":{"first":"x"},"includeTeacher":true}}'],
    ["unknown step", '{"schemaVersion":1,"dataset":"ogurike","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":["missing"],"promptsByStepId":{"missing":"x"},"includeTeacher":true}}'],
    ["prompt for unselected step", '{"schemaVersion":1,"dataset":"ogurike","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":["first"],"promptsByStepId":{"first":"x","second":"extra"},"includeTeacher":true}}'],
    ["empty selection", '{"schemaVersion":1,"dataset":"ogurike","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":[],"promptsByStepId":{},"includeTeacher":true}}'],
    ["malformed JSON", "not json"],
  ] as const)("rejects %s without throwing or producing customization", (_label, serialized) => {
    expect(() => parseLessonPackDraft(model, serialized)).not.toThrow();
    expect(parseLessonPackDraft(model, serialized)).toBeNull();
  });

  it("rejects drafts over the UTF-8 byte limit", () => {
    const oversized = JSON.stringify({
      schemaVersion: 1,
      dataset: "ogurike",
      lesson: "ogurike-intro",
      customization: { title: "あ".repeat(LESSON_PACK_DRAFT_MAX_BYTES), classLabel: "", selectedStepIds: ["first"], promptsByStepId: { first: "x" }, includeTeacher: true },
    });
    expect(new TextEncoder().encode(oversized).byteLength).toBeGreaterThan(LESSON_PACK_DRAFT_MAX_BYTES);
    expect(parseLessonPackDraft(model, oversized)).toBeNull();
  });

  it("extracts only an allow-listed envelope identity before a dataset model is available", () => {
    const serialized = serializeLessonPackDraft(model, customization)!;
    expect(parseLessonPackDraftIdentity(serialized)).toEqual({ dataset: "ogurike", lesson: "ogurike-intro" });
    expect(parseLessonPackDraftIdentity('{"schemaVersion":1,"dataset":"ogurike","lesson":"ogurike-intro","customization":[]}')).toBeNull();
    expect(parseLessonPackDraftIdentity('{"schemaVersion":1,"dataset":"other","lesson":"ogurike-intro","customization":{"title":"x","classLabel":"","selectedStepIds":["first"],"promptsByStepId":{"first":"x"},"includeTeacher":true}}')).toEqual({ dataset: "other", lesson: "ogurike-intro" });
  });
});
