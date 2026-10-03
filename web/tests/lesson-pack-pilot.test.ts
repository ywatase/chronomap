import { describe, expect, it } from "vitest";
import { buildLessonPackPilotText, buildSafeLessonPackPilotMailto, buildLessonPackPilotDownloadFilename, normalizeLessonPackPilot, normalizeLessonPackPilotContact } from "../src/domain/lesson-pack-pilot";

describe("lesson-pack pilot handoff", () => {
  const context = { datasetSlug: "heijokyo", lessonId: "intro", selectedStepCount: 3, includeTeacher: false, observationFigure: true, lastPrintScope: "student" as const, language: "ja" as const };

  it("requires only the consultation route's budget intention and excludes private editor fields", () => {
    expect(normalizeLessonPackPilot({ route: "consult", utilization: "近いうちに使いたい", nextFeature: "校内で共有" })).toBeNull();
    const answer = buildLessonPackPilotText({ route: "consult", utilization: "近いうちに使いたい", nextFeature: "校内で共有", budgetIntent: "校費・組織予算で相談したい", regionTopic: "奈良", comment: "相談したい", title: "秘密", prompt: "秘密の問い", teacherNote: "秘密メモ" }, context);
    expect(answer).toContain("校費・組織予算");
    expect(answer).toContain("生徒用資料: あり");
    expect(answer).toContain("印刷範囲: 生徒用");
    expect(answer).toContain("希望成果物: 生徒用資料、QR・開始リンク、出典・権利、観察用概略図（印刷範囲: 生徒用）");
    expect(answer).toContain("相談で確認する項目: 対象範囲、出典整理、納品形式、納期、最終見積。");
    expect(answer).not.toContain("秘密");
    const feedbackOnly = buildLessonPackPilotText({ route: "feedback", utilization: "近いうちに使いたい", nextFeature: "校内で共有", budgetIntent: "校費・組織予算で相談したい", regionTopic: "秘密の地域", comment: "短い感想" }, context)!;
    expect(feedbackOnly).not.toContain("秘密の地域");
    expect(feedbackOnly).not.toContain("相談意向");
  });

  it("keeps the selected offer path allow-listed and visible only in consultation text", () => {
    const input = { route: "consult", plan: "custom-region", utilization: "近いうちに使いたい", nextFeature: "自分の地域・題材を追加", budgetIntent: "地域・内容・条件が合えば検討したい" };
    expect(normalizeLessonPackPilot(input)?.plan).toBe("custom-region");
    expect(buildLessonPackPilotText(input, context)).toContain("導入プラン: 地域教材の個別制作");
    expect(buildLessonPackPilotText({ ...input, plan: "unexpected" }, context)).toContain("導入プラン: 授業パイロット");
    expect(buildLessonPackPilotText({ ...input, route: "feedback", plan: "custom-region" }, context)).not.toContain("導入プラン");
  });

  it("keeps quote-scoping choices allow-listed and consultation-only", () => {
    const input = {
      route: "consult",
      plan: "classroom-pilot",
      utilization: "近いうちに使いたい",
      nextFeature: "自分の地域・題材を追加",
      budgetIntent: "地域・内容・条件が合えば検討したい",
      audience: "中学校",
      lessonDuration: "45〜50分",
      deliveryFormat: "印刷用PDF",
    };
    expect(normalizeLessonPackPilot(input)).toMatchObject({ audience: "中学校", lessonDuration: "45〜50分", deliveryFormat: "印刷用PDF" });
    const answer = buildLessonPackPilotText(input, context)!;
    expect(answer).toContain("対象: 中学校");
    expect(answer).toContain("授業時間: 45〜50分");
    expect(answer).toContain("希望納品: 印刷用PDF");

    const feedback = buildLessonPackPilotText({ ...input, route: "feedback" }, context)!;
    expect(feedback).not.toContain("対象: 中学校");
    expect(feedback).not.toContain("授業時間");
    expect(feedback).not.toContain("希望納品");
    expect(normalizeLessonPackPilot({ ...input, audience: "秘密の学校" })?.audience).toBe("未定");
  });

  it("tailors the consultation deliverables to the current teacher scope", () => {
    const answer = buildLessonPackPilotText({ route: "consult", utilization: "近いうちに使いたい", nextFeature: "校内で共有", budgetIntent: "まず無料試用を続けたい" }, {
      ...context,
      includeTeacher: true,
      observationFigure: false,
      lastPrintScope: "teacher",
      language: "en",
    });
    expect(answer).toContain("Requested deliverables: student worksheet, QR/start links, sources/rights, teacher reference (print scope: Teacher)");
    expect(answer).toContain("Consultation checklist: confirm regional scope, source curation, delivery format, schedule, and final quote.");
    expect(answer).not.toContain("observation figure");
  });

  it("builds only a CRLF-safe encoded mailto URL for a configured mailto address", () => {
    const answer = buildLessonPackPilotText({ route: "feedback", utilization: "近いうちに使いたい", nextFeature: "校内で共有", comment: "x\r\nBcc: no" }, context)!;
    const href = buildSafeLessonPackPilotMailto("mailto:pilot@example.test\r\nBcc:x", "Pilot\r\nBcc:x", answer);
    expect(href).toBeNull();
    expect(buildSafeLessonPackPilotMailto("mailto:pilot%0d%0a@example.test", "Pilot", answer)).toBeNull();
    const safe = buildSafeLessonPackPilotMailto("mailto:pilot@example.test", "Pilot\r\nBcc:x", answer)!;
    expect(safe).toMatch(/^mailto:pilot@example\.test\?subject=/);
    expect(safe).not.toContain("\r");
    expect(safe).not.toContain("\n");
  });

  it("accepts only a public, single-address build-time contact", () => {
    expect(normalizeLessonPackPilotContact(" mailto:pilot@example.test ")).toBe("mailto:pilot@example.test");
    expect(normalizeLessonPackPilotContact("mailto:pilot%0d%0a@example.test")).toBeNull();
    expect(normalizeLessonPackPilotContact("https://example.test/contact")).toBeNull();
    expect(normalizeLessonPackPilotContact("mailto:pilot@example.test\r\nBcc:other@example.test")).toBeNull();
  });

  it("creates a safe, stable text-download filename from public lesson identifiers", () => {
    expect(buildLessonPackPilotDownloadFilename("heijokyo", "heijokyo-intro")).toBe("chronomap-heijokyo-heijokyo-intro-consultation.txt");
    expect(buildLessonPackPilotDownloadFilename("../秘密地域", "lesson/1\r\n")).toBe("chronomap-dataset-lesson-1-consultation.txt");
    expect(buildLessonPackPilotDownloadFilename("", "")).toBe("chronomap-dataset-lesson-consultation.txt");
  });
});
