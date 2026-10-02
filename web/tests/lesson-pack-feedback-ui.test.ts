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
    expect(host.querySelector("[data-lesson-pack-feedback-summary]")?.textContent).toContain("印刷画面を試していただきありがとうございます");
    expect(host.textContent).toContain("回答は自動送信・保存されません。文章を確認してから、ご自身でコピーまたは共有してください。再読み込みすると消えます。");
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

  it("keeps the completion card feedback-only by default and requires budget intent for consultation", () => {
    const host = document.createElement("section");
    const saved = { value: null as LessonPackFeedbackState | null };
    renderLessonPackFeedback(host, { ...context, observationFigure: true }, uiCopy("ja"), null, { onChange: (next) => { saved.value = next; } });
    showLessonPackFeedback(host, "student", uiCopy("ja"));
    expect(host.querySelector("[data-lesson-pack-completion-facts]")?.textContent).toContain("生徒用を印刷");
    expect(host.querySelector("[data-lesson-pack-pilot-budget]")).toHaveProperty("hidden", true);
    expect(host.querySelector<HTMLInputElement>('input[name="pilot-route"][value="consult"]')?.parentElement?.textContent).toContain("相談文を作る");

    host.querySelector<HTMLInputElement>('input[name="utilization"][value="近いうちに使いたい"]')!.checked = true;
    host.querySelector<HTMLInputElement>('input[name="nextFeature"][value="校内で共有"]')!.checked = true;
    const consultRoute = host.querySelector<HTMLInputElement>('input[name="pilot-route"][value="consult"]')!;
    consultRoute.checked = true;
    consultRoute.dispatchEvent(new Event("change", { bubbles: true }));
    expect(host.querySelector("[data-lesson-pack-pilot-budget]")).toHaveProperty("hidden", false);
    host.querySelector<HTMLFormElement>("[data-lesson-pack-pilot-form]")!.requestSubmit();
    expect(host.querySelector("[data-lesson-pack-pilot-error]")).toHaveProperty("hidden", false);
    expect(host.querySelector<HTMLTextAreaElement>("[data-lesson-pack-pilot-answer]")!.value).toBe("");

    host.querySelector<HTMLInputElement>('input[name="pilot-budget"][value="地域・内容・条件が合えば検討したい"]')!.click();
    host.querySelector<HTMLInputElement>('input[name="pilot-plan"][value="custom-region"]')!.click();
    host.querySelector<HTMLTextAreaElement>("[data-lesson-pack-pilot-region]")!.value = "奈良";
    host.querySelector<HTMLFormElement>("[data-lesson-pack-pilot-form]")!.requestSubmit();
    const answer = host.querySelector<HTMLTextAreaElement>("[data-lesson-pack-pilot-answer]")!;
    expect(answer.value).toContain("相談意向: 地域・内容・条件が合えば検討したい");
    expect(answer.value).toContain("導入プラン: 地域教材の個別制作");
    expect(answer.value).toContain("印刷範囲: 生徒用");
    expect(answer.value).toContain("希望地域・題材: 奈良");
    expect(host.querySelector("[data-lesson-pack-pilot-mail]")).toBeNull();
    expect(saved.value?.pilotAnswer).toContain("印刷範囲: 生徒用");
    host.querySelector<HTMLButtonElement>("[data-lesson-pack-pilot-back]")!.click();
    expect(saved.value?.pilotAnswer).toBe("");
  });
});
