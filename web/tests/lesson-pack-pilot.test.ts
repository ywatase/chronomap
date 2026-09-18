import { describe, expect, it } from "vitest";
import { buildLessonPackPilotText, buildSafeLessonPackPilotMailto, normalizeLessonPackPilot } from "../src/domain/lesson-pack-pilot";

describe("lesson-pack pilot handoff", () => {
  const context = { datasetSlug: "heijokyo", lessonId: "intro", selectedStepCount: 3, includeTeacher: false, observationFigure: true, lastPrintScope: "student" as const, language: "ja" as const };

  it("requires only the consultation route's budget intention and excludes private editor fields", () => {
    expect(normalizeLessonPackPilot({ route: "consult", utilization: "近いうちに使いたい", nextFeature: "校内で共有" })).toBeNull();
    const answer = buildLessonPackPilotText({ route: "consult", utilization: "近いうちに使いたい", nextFeature: "校内で共有", budgetIntent: "校費・組織予算で相談したい", regionTopic: "奈良", comment: "相談したい", title: "秘密", prompt: "秘密の問い", teacherNote: "秘密メモ" }, context);
    expect(answer).toContain("校費・組織予算");
    expect(answer).toContain("生徒用資料: あり");
    expect(answer).toContain("印刷範囲: 生徒用");
    expect(answer).not.toContain("秘密");
    const feedbackOnly = buildLessonPackPilotText({ route: "feedback", utilization: "近いうちに使いたい", nextFeature: "校内で共有", budgetIntent: "校費・組織予算で相談したい", regionTopic: "秘密の地域", comment: "短い感想" }, context)!;
    expect(feedbackOnly).not.toContain("秘密の地域");
    expect(feedbackOnly).not.toContain("相談意向");
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
});
