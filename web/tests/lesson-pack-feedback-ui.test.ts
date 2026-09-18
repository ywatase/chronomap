// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { NEXT_FEATURE_OPTIONS, UTILIZATION_OPTIONS } from "../src/domain/lesson-pack-feedback";
import { renderLessonPackFeedback, showLessonPackFeedback, type LessonPackFeedbackState } from "../src/ui/lesson-pack-feedback";
import { uiCopy } from "../src/ui/copy";

const context = {
  datasetSlug: "heijokyo",
  lessonId: "intro",
  selectedStepCount: 2,
  includeTeacher: true,
};

describe("lesson pack feedback form", () => {
  it("starts hidden and exposes the exact no-save notice", () => {
    const host = document.createElement("section");
    renderLessonPackFeedback(host, context, uiCopy("ja"));
    expect(host.hidden).toBe(true);
    expect(host.querySelector("[data-lesson-pack-feedback-details]")).toBeTruthy();
    expect(host.textContent).toContain("回答は自動送信・保存されません。コピーして、案内された連絡先へお送りください。再読み込みすると消えます。");
    expect(host.querySelectorAll<HTMLInputElement>("input[type=radio][required]")).toHaveLength(7);
    expect(host.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-answer]")?.readOnly).toBe(true);
  });

  it("blocks unanswered generation, then renders a privacy-bounded answer", () => {
    const host = document.createElement("section");
    renderLessonPackFeedback(host, { ...context, includeTeacher: false }, uiCopy("ja"));
    showLessonPackFeedback(host);
    expect(host.hidden).toBe(false);

    const form = host.querySelector<HTMLFormElement>("[data-lesson-pack-feedback-form]")!;
    form.requestSubmit();
    expect(host.querySelector("[data-lesson-pack-feedback-error]")?.textContent).toContain("必須");
    expect(host.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-answer]")?.value).toBe("");

    const utilization = host.querySelector<HTMLInputElement>(`input[name=utilization][value="${UTILIZATION_OPTIONS[0]}"]`)!;
    const nextFeature = host.querySelector<HTMLInputElement>(`input[name=nextFeature][value="${NEXT_FEATURE_OPTIONS[3]}"]`)!;
    utilization.checked = true;
    nextFeature.checked = true;
    host.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-comment]")!.value = "授業で試したい";
    form.requestSubmit();
    const answer = host.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-answer]")!;
    expect(answer.value).toContain("heijokyo");
    expect(answer.value).toContain("intro");
    expect(answer.value).toContain("教員用資料: なし");
    expect(answer.value).not.toContain("title");
  });

  it("reports clipboard success and failure through an aria-live status", async () => {
    const host = document.createElement("section");
    renderLessonPackFeedback(host, context, uiCopy("en"));
    const form = host.querySelector<HTMLFormElement>("[data-lesson-pack-feedback-form]")!;
    host.querySelector<HTMLInputElement>(`input[name=utilization][value="${UTILIZATION_OPTIONS[2]}"]`)!.checked = true;
    host.querySelector<HTMLInputElement>(`input[name=nextFeature][value="${NEXT_FEATURE_OPTIONS[1]}"]`)!.checked = true;
    form.requestSubmit();

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    await host.querySelector<HTMLButtonElement>("[data-lesson-pack-feedback-copy]")!.click();
    expect(writeText).toHaveBeenCalledOnce();
    expect(host.querySelector("[data-lesson-pack-feedback-status]")?.textContent).toContain("copied");

    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    writeText.mockRejectedValueOnce(new Error("denied"));
    await host.querySelector<HTMLButtonElement>("[data-lesson-pack-feedback-copy]")!.click();
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(host.querySelector("[data-lesson-pack-feedback-status]")?.textContent).toContain("copied");

    execCommand.mockReturnValue(false);
    writeText.mockRejectedValueOnce(new Error("denied again"));
    await host.querySelector<HTMLButtonElement>("[data-lesson-pack-feedback-copy]")!.click();
    expect(host.querySelector("[data-lesson-pack-feedback-status]")?.textContent).toContain("Could not");
  });

  it("restores a generated answer and reports in-memory changes for a later preview", () => {
    let state: LessonPackFeedbackState | null = null;
    const host = document.createElement("section");
    renderLessonPackFeedback(host, context, uiCopy("ja"), null, { onChange: (next) => { state = next; } });
    const form = host.querySelector<HTMLFormElement>("[data-lesson-pack-feedback-form]")!;
    host.querySelector<HTMLInputElement>(`input[name=utilization][value="${UTILIZATION_OPTIONS[0]}"]`)!.checked = true;
    host.querySelector<HTMLInputElement>(`input[name=nextFeature][value="${NEXT_FEATURE_OPTIONS[3]}"]`)!.checked = true;
    host.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-comment]")!.value = "同じページで保持";
    form.requestSubmit();
    const savedState = state as unknown as LessonPackFeedbackState;
    expect(savedState.answer).toContain("heijokyo");

    const restored = document.createElement("section");
    renderLessonPackFeedback(restored, context, uiCopy("ja"), savedState, {});
    expect(restored.querySelector<HTMLInputElement>(`input[name=utilization][value="${UTILIZATION_OPTIONS[0]}"]`)!.checked).toBe(true);
    expect(restored.querySelector<HTMLInputElement>(`input[name=nextFeature][value="${NEXT_FEATURE_OPTIONS[3]}"]`)!.checked).toBe(true);
    expect(restored.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-comment]")!.value).toBe("同じページで保持");
    expect(restored.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-answer]")!.value).toBe(savedState.answer);

    const changedContext = { ...context, selectedStepCount: 4, includeTeacher: false };
    const changedPreview = document.createElement("section");
    renderLessonPackFeedback(changedPreview, changedContext, uiCopy("ja"), savedState, {});
    const changedAnswer = changedPreview.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-answer]")!;
    expect(changedAnswer.value).toContain("選択ステップ数: 4");
    expect(changedAnswer.value).toContain("教員用資料: なし");
  });
});
