import { describe, expect, it } from "vitest";
import {
  NEXT_FEATURE_OPTIONS,
  UTILIZATION_OPTIONS,
  buildLessonPackFeedbackAnswer,
  generateLessonPackFeedbackText,
  normalizeLessonPackFeedback,
} from "../src/domain/lesson-pack-feedback";

describe("lesson pack feedback", () => {
  it("normalizes allow-listed answers and trims comments to 500 characters", () => {
    const normalized = normalizeLessonPackFeedback({
      utilization: UTILIZATION_OPTIONS[1],
      nextFeature: NEXT_FEATURE_OPTIONS[0],
      comment: `  ${"あ".repeat(600)}  `,
    });

    expect(normalized).toEqual({
      utilization: "内容を直せば使いたい",
      nextFeature: "教材を保存して後から再編集",
      comment: "あ".repeat(500),
    });
  });

  it("rejects missing or non-allow-listed required answers", () => {
    expect(normalizeLessonPackFeedback({ nextFeature: NEXT_FEATURE_OPTIONS[0] })).toBeNull();
    expect(normalizeLessonPackFeedback({ utilization: UTILIZATION_OPTIONS[0], nextFeature: "other" })).toBeNull();
    expect(normalizeLessonPackFeedback({ utilization: null, nextFeature: NEXT_FEATURE_OPTIONS[0] })).toBeNull();
  });

  it("generates a Japanese answer with only the approved metadata", () => {
    const answer = buildLessonPackFeedbackAnswer(
      {
        utilization: UTILIZATION_OPTIONS[0],
        nextFeature: NEXT_FEATURE_OPTIONS[3],
        comment: "  校内で共有して試したい  ",
        title: "秘密のタイトル",
        classLabel: "秘密のクラス",
        prompt: "秘密の問い",
        mapPosition: "秘密の位置",
      },
      {
        datasetSlug: "heijokyo",
        lessonId: "intro",
        selectedStepCount: 3,
        includeTeacher: false,
        language: "ja",
        title: "秘密の教材",
      },
    );

    expect(answer).toContain("近いうちに使いたい");
    expect(answer).toContain("校内で共有");
    expect(answer).toContain("校内で共有して試したい");
    expect(answer).toContain("heijokyo");
    expect(answer).toContain("intro");
    expect(answer).toContain("3");
    expect(answer).toContain("教員用資料: なし");
    expect(answer).not.toContain("秘密のタイトル");
    expect(answer).not.toContain("秘密のクラス");
    expect(answer).not.toContain("秘密の問い");
    expect(answer).not.toContain("秘密の位置");
  });

  it("supports English answer copy and deterministic generation", () => {
    const feedback = normalizeLessonPackFeedback({
      utilization: UTILIZATION_OPTIONS[2],
      nextFeature: NEXT_FEATURE_OPTIONS[1],
      comment: "",
    });
    expect(feedback).not.toBeNull();
    const context = { datasetSlug: "tonegawa", lessonId: "flow", selectedStepCount: 0, includeTeacher: true, language: "en" as const };
    expect(generateLessonPackFeedbackText(feedback!, context)).toContain("I will not use it this time");
    expect(generateLessonPackFeedbackText(feedback!, context)).toContain("Bulk export for multiple classes and materials");
    expect(generateLessonPackFeedbackText(feedback!, context)).not.toContain("Comment:");
    expect(generateLessonPackFeedbackText(feedback!, context)).toBe(generateLessonPackFeedbackText(feedback!, context));
  });
});
