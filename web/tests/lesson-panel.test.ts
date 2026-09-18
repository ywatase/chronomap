// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderLessonPanel } from "../src/ui/lesson-panel";
import { uiCopy } from "../src/ui/copy";
import type { Lesson } from "../src/domain/lesson";

const lesson: Lesson = {
  id: "intro", dataset: "ogurike", title: { ja: "巨椋池教材", en: "Ogurike lesson" }, description: { ja: "説明", en: "Description" }, durationMinutes: 15,
  steps: [
    { id: "first", year: 1590, featureId: "first", prompt: { ja: "問い", en: "Prompt" }, teacherNote: { ja: "教員だけの読み取り例", en: "Teacher-only reading example" } },
    { id: "last", year: 1596, featureId: "last", prompt: { ja: "最後の問い", en: "Last prompt" } },
  ],
};

function actions() {
  return { onStart: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn(), onClose: vi.fn(), onDetails: vi.fn(), onShare: vi.fn(), onReport: vi.fn(), onPack: vi.fn(), onWorkshop: vi.fn() };
}

describe("lesson panel", () => {
  it("renders the Japanese launch state and starts from one clear action", () => {
    const root = document.createElement("div");
    const callbacks = actions();
    renderLessonPanel(root, lesson, null, uiCopy("ja"), callbacks);
    expect(root.querySelector("[data-lesson-panel]")?.textContent).toContain("巨椋池教材");
    root.querySelector<HTMLButtonElement>("[data-lesson-start]")!.click();
    root.querySelector<HTMLButtonElement>("[data-lesson-workshop-open]")!.click();
    expect(callbacks.onStart).toHaveBeenCalledTimes(1);
    expect(callbacks.onWorkshop).toHaveBeenCalledTimes(1);
  });

  it("renders progress and completion actions on the final step", () => {
    const root = document.createElement("div");
    const callbacks = actions();
    renderLessonPanel(root, lesson, 1, uiCopy("ja"), callbacks);
    expect(root.querySelector("[data-lesson-progress]")?.textContent).toBe("2/2 · 1596年");
    root.querySelector<HTMLButtonElement>("[data-lesson-share]")!.click();
    root.querySelector<HTMLButtonElement>("[data-lesson-report]")!.click();
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-open]")!.click();
    root.querySelector<HTMLButtonElement>("[data-lesson-workshop-open]")!.click();
    expect(callbacks.onShare).toHaveBeenCalledTimes(1);
    expect(callbacks.onReport).toHaveBeenCalledTimes(1);
    expect(callbacks.onPack).toHaveBeenCalledTimes(1);
    expect(callbacks.onWorkshop).toHaveBeenCalledTimes(1);
  });

  it("keeps teacher notes out of the guided lesson panel", () => {
    const root = document.createElement("div");
    renderLessonPanel(root, lesson, 0, uiCopy("ja"), actions());
    expect(root.textContent).not.toContain("教員だけの読み取り例");
  });
});
