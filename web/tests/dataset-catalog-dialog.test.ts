// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderDatasetCatalog } from "../src/ui/dataset-catalog-dialog";
import type { DatasetCatalogViewModel } from "../src/domain/dataset-catalog-view-model";
import { uiCopy } from "../src/ui/copy";

const model: DatasetCatalogViewModel = {
  language: "ja",
  cards: [
    {
      slug: "ogurike",
      region: "京都南部",
      title: "巨椋池",
      description: "1590年からの説明",
      years: [1590, 1910],
      yearLabels: ["1590年", "1910年"],
      featureCount: 4,
      entityCount: 3,
      sourceCount: 2,
      lesson: { id: "ogurike-intro", title: "巨椋池をたどる", durationMinutes: 15, stepCount: 4, firstStepId: "uji-1590" },
      status: "available",
      availabilityMessage: "",
      mapUrl: "/?dataset=ogurike",
      lessonUrl: "/?dataset=ogurike&lesson=ogurike-intro&step=uji-1590",
      builderUrl: "/?dataset=ogurike&lesson=ogurike-intro&view=builder",
    },
    {
      slug: "tonegawa",
      region: "関東東部",
      title: "利根川東遷",
      description: "読み込みに失敗しました",
      years: [],
      yearLabels: [],
      featureCount: 0,
      entityCount: 0,
      sourceCount: 0,
      lesson: null,
      status: "unavailable",
      availabilityMessage: "読み込みに失敗しました",
      mapUrl: "/?dataset=tonegawa",
      lessonUrl: null,
      builderUrl: null,
    },
    {
      slug: "heijokyo",
      region: "奈良盆地北部",
      title: "平城京",
      description: "平城京の説明",
      years: [710],
      yearLabels: ["710年"],
      featureCount: 3,
      entityCount: 3,
      sourceCount: 3,
      lesson: { id: "heijokyo-intro", title: "平城京の都市軸をたどる", durationMinutes: 10, stepCount: 3, firstStepId: "capital-710" },
      status: "available",
      availabilityMessage: "",
      mapUrl: "/?dataset=heijokyo",
      lessonUrl: "/?dataset=heijokyo&lesson=heijokyo-intro&step=capital-710",
      builderUrl: "/?dataset=heijokyo&lesson=heijokyo-intro&view=builder",
    },
  ],
};

describe("dataset catalog dialog", () => {
  it("renders available and unavailable cards with honest capabilities and CTAs", () => {
    const root = document.createElement("section");
    renderDatasetCatalog(root, model, uiCopy("ja"), { onClose: vi.fn() });

    expect(root.getAttribute("role")).toBe("dialog");
    expect(root.querySelector("[data-dataset-catalog-heading]")?.textContent).toContain("地域・教材");
    expect(root.querySelectorAll("[data-dataset-catalog-card]")).toHaveLength(3);
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"]')?.textContent).toContain("無料デモ");
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"]')?.textContent).toContain("教材パックはβ版無料");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-lesson]")?.href).toContain("lesson=ogurike-intro");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-builder]")?.href).toContain("view=builder");
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"]')?.textContent).toContain("授業用に編集");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-map]")?.href).toContain("dataset=ogurike");
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"]')?.textContent).toContain("4");
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"]')?.textContent).toContain("読み込みに失敗しました");
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-lesson]')).toBeNull();
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-builder]')).toBeNull();
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-map]')).toBeNull();
    expect(root.querySelector('[data-dataset-catalog-card="heijokyo"]')?.textContent).toContain("平城京の都市軸をたどる");
    expect(root.querySelector('[data-dataset-catalog-card="heijokyo"]')?.textContent).toContain("10分");
    expect(root.querySelector<HTMLAnchorElement>('[data-dataset-catalog-card="heijokyo"] [data-dataset-catalog-lesson]')?.href).toContain("lesson=heijokyo-intro");
    expect(root.querySelector("[data-dataset-catalog-free]")?.textContent).toContain("地図を見る");
    expect(root.querySelector("[data-dataset-catalog-future]")?.textContent).toContain("一括");
  });

  it("calls the close action from the dialog toolbar", () => {
    const onClose = vi.fn();
    const root = document.createElement("section");
    renderDatasetCatalog(root, model, uiCopy("ja"), { onClose });
    root.querySelector<HTMLButtonElement>("[data-dataset-catalog-close]")!.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not advertise a classroom pack when a bundle has no lesson", () => {
    const noLesson = {
      ...model.cards[0]!,
      lesson: null,
      lessonUrl: null,
      builderUrl: null,
    };
    const root = document.createElement("section");
    renderDatasetCatalog(root, { ...model, cards: [noLesson] }, uiCopy("ja"), { onClose: vi.fn() });
    const card = root.querySelector("[data-dataset-catalog-card]")!;
    expect(card.textContent).not.toContain("授業用教材パックを作成");
    expect(card.textContent).toContain("ガイド教材はまだ公開されていません");
    expect(card.querySelector("[data-dataset-catalog-map]")).toBeTruthy();
  });
});
