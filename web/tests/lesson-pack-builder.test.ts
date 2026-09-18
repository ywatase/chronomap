// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { LessonPackModel, LessonPackStep } from "../src/domain/lesson-pack-model";
import { applyLessonPackBuilderInput, readLessonPackBuilderInput, renderLessonPackBuilder } from "../src/ui/lesson-pack-builder";
import { uiCopy } from "../src/ui/copy";

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
    uncertainty: [],
    evidence: [],
    comparison: [],
    shareUrl: `https://example.test/?step=${id}`,
  };
}

const model: LessonPackModel = {
  language: "ja",
  title: "元の教材",
  description: "元の説明",
  durationMinutes: 20,
  datasetId: "dataset:demo",
  datasetTitle: "デモ",
  datasetDescription: "デモの説明",
  datasetRights: "open-license",
  steps: [step("first", 1590, "問い1"), step("second", 1596, "問い2")],
  sources: [],
  startUrl: "https://example.test/?step=first",
};

function submit(root: HTMLElement): void {
  root.querySelector<HTMLFormElement>("[data-lesson-pack-builder-form]")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("lesson pack builder", () => {
  it("renders editable labels, steps, prompts, and teacher visibility, then previews the draft", () => {
    const root = document.createElement("div");
    const onPreview = vi.fn();
    renderLessonPackBuilder(root, model, uiCopy("ja"), { onPreview, onClose: vi.fn() });

    expect(root.dataset.lessonPackBuilder).toBeDefined();
    expect(root.querySelector(".lesson-pack-builder-sheet")).toBeTruthy();
    expect(root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")?.value).toBe("元の教材");
    expect(root.querySelector<HTMLInputElement>("[data-lesson-pack-class-label]")?.value).toBe("");
    expect(root.querySelectorAll("[data-lesson-pack-step-select]")).toHaveLength(2);
    expect(root.querySelectorAll("[data-lesson-pack-prompt]")).toHaveLength(2);
    expect(root.querySelector<HTMLInputElement>("[data-lesson-pack-include-teacher]")?.checked).toBe(true);
    expect(root.querySelector("[data-lesson-pack-builder-note]")?.textContent).toContain("再読み込み");

    root.querySelector<HTMLInputElement>('[data-lesson-pack-step-select][data-step-id="first"]')!.checked = false;
    root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")!.value = "  授業用教材  ";
    root.querySelector<HTMLInputElement>("[data-lesson-pack-class-label]")!.value = "  2年A組 ";
    root.querySelector<HTMLTextAreaElement>('[data-lesson-pack-prompt][data-step-id="second"]')!.value = "  比較してみよう  ";
    root.querySelector<HTMLInputElement>("[data-lesson-pack-include-teacher]")!.checked = false;
    submit(root);

    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview.mock.calls[0]?.[0]).toEqual({
      title: "  授業用教材  ",
      classLabel: "  2年A組 ",
      selectedStepIds: ["second"],
      promptsByStepId: { first: "問い1", second: "  比較してみよう  " },
      includeTeacher: false,
    });
  });

  it("shows validation and does not preview when every step is deselected", () => {
    const root = document.createElement("div");
    const onPreview = vi.fn();
    renderLessonPackBuilder(root, model, uiCopy("ja"), { onPreview, onClose: vi.fn() });
    for (const checkbox of root.querySelectorAll<HTMLInputElement>("[data-lesson-pack-step-select]")) checkbox.checked = false;
    submit(root);

    expect(onPreview).not.toHaveBeenCalled();
    expect(root.querySelector("[data-lesson-pack-builder-status]")?.textContent).toContain("1");
    expect(root.querySelector("[data-lesson-pack-builder-status]")?.getAttribute("role")).toBe("alert");
  });

  it("resets editor fields and invokes close/reset actions", () => {
    const root = document.createElement("div");
    const onClose = vi.fn();
    const onReset = vi.fn();
    renderLessonPackBuilder(root, model, uiCopy("ja"), { onPreview: vi.fn(), onClose, onReset });
    root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")!.value = "変更後";
    root.querySelector<HTMLInputElement>('[data-lesson-pack-step-select][data-step-id="second"]')!.checked = false;
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-builder-reset]")!.click();

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")?.value).toBe("元の教材");
    expect(root.querySelectorAll<HTMLInputElement>("[data-lesson-pack-step-select]:checked")).toHaveLength(2);
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-builder-close]")!.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("extracts and reapplies all portable draft fields", () => {
    const root = document.createElement("div");
    renderLessonPackBuilder(root, model, uiCopy("ja"), { onPreview: vi.fn(), onClose: vi.fn() });
    root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")!.value = "授業用教材";
    root.querySelector<HTMLInputElement>("[data-lesson-pack-class-label]")!.value = "2年A組";
    root.querySelector<HTMLInputElement>('[data-lesson-pack-step-select][data-step-id="first"]')!.checked = false;
    root.querySelector<HTMLTextAreaElement>('[data-lesson-pack-prompt][data-step-id="second"]')!.value = "比較しよう";
    root.querySelector<HTMLInputElement>("[data-lesson-pack-include-teacher]")!.checked = false;
    const extracted = readLessonPackBuilderInput(root);
    expect(extracted).toEqual({ title: "授業用教材", classLabel: "2年A組", selectedStepIds: ["second"], promptsByStepId: { first: "問い1", second: "比較しよう" }, includeTeacher: false });

    root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")!.value = "別の教材";
    expect(applyLessonPackBuilderInput(root, model, extracted)).toBe(true);
    expect(readLessonPackBuilderInput(root)).toEqual(extracted);
  });

  it("keeps the existing form unchanged when a draft cannot be applied", () => {
    const root = document.createElement("div");
    renderLessonPackBuilder(root, model, uiCopy("ja"), { onPreview: vi.fn(), onClose: vi.fn() });
    root.querySelector<HTMLInputElement>("[data-lesson-pack-title]")!.value = "編集中の教材";
    const before = readLessonPackBuilderInput(root);

    expect(applyLessonPackBuilderInput(root, model, {
      title: "壊れた下書き",
      classLabel: "2年A組",
      selectedStepIds: [],
      promptsByStepId: {},
      includeTeacher: false,
    })).toBe(false);
    expect(readLessonPackBuilderInput(root)).toEqual(before);
  });

  it("renders labeled draft controls and sends current state to save", () => {
    const root = document.createElement("div");
    const onSaveDraft = vi.fn();
    renderLessonPackBuilder(root, model, uiCopy("ja"), { onPreview: vi.fn(), onClose: vi.fn(), onSaveDraft });
    expect(root.querySelector("[data-lesson-pack-draft-section]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-draft-file-label]")?.textContent).toContain("下書きファイル");
    expect(root.querySelector<HTMLInputElement>("[data-lesson-pack-draft-file]")?.accept).toContain(".json");
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-draft-save]")!.click();
    expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ selectedStepIds: ["first", "second"] }));
  });
});
