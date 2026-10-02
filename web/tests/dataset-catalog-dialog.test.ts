// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderDatasetCatalog } from "../src/ui/dataset-catalog-dialog";
import type { DatasetCatalogViewModel } from "../src/domain/dataset-catalog-view-model";
import { uiCopy } from "../src/ui/copy";

const model: DatasetCatalogViewModel = {
  language: "ja",
  featured: {
    slug: "ogurike",
    title: "巨椋池",
    lessonTitle: "巨椋池をたどる",
    lessonDurationMinutes: 15,
    packUrl: "/?dataset=ogurike&lesson=ogurike-intro&view=pack",
    builderUrl: "/?dataset=ogurike&lesson=ogurike-intro&view=builder",
  },
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
      audit: { featureCount: 4, evidenceCount: 6, sourceCount: 2, uncertaintyDimensionCount: 4 },
      lesson: { id: "ogurike-intro", title: "巨椋池をたどる", durationMinutes: 15, stepCount: 4, recommendedFor: "地域史の導入に", learningGoal: "変化を説明する。", firstStepId: "uji-1590" },
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
      audit: null,
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
      audit: { featureCount: 3, evidenceCount: 3, sourceCount: 3, uncertaintyDimensionCount: 4 },
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
    expect(root.querySelector("[data-dataset-catalog-welcome]")?.textContent).toContain("QRコード");
    expect(root.querySelector("[data-dataset-catalog-welcome]")?.textContent).toContain("PDF");
    expect(root.querySelector("[data-dataset-catalog-welcome]")?.textContent).toContain("完成見本を見る");
    expect(root.querySelector("[data-dataset-catalog-welcome] h3")?.hasAttribute("aria-hidden")).toBe(false);
    expect(root.querySelector("[data-dataset-catalog-card] h3")?.hasAttribute("aria-hidden")).toBe(false);
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-featured-pack]")?.href).toContain("view=pack");
    expect(root.querySelectorAll("[data-dataset-catalog-step]")).toHaveLength(3);
    expect(root.querySelectorAll("[data-dataset-catalog-card]")).toHaveLength(3);
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"]')?.textContent).toContain("無料デモ");
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"]')?.textContent).toContain("教材パックはβ版無料");
    expect(root.querySelector('[data-dataset-catalog-lesson-row="ogurike-intro"] [data-dataset-catalog-lesson-guide]')?.textContent).toContain("利用の目安: 地域史の導入に");
    expect(root.querySelector('[data-dataset-catalog-lesson-row="ogurike-intro"] [data-dataset-catalog-lesson-goal]')?.textContent).toContain("学習のねらい: 変化を説明する。");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-lesson]")?.href).toContain("lesson=ogurike-intro");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-builder]")?.href).toContain("view=builder");
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"]')?.textContent).toContain("授業用に編集");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-map]")?.href).toContain("dataset=ogurike");
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"]')?.textContent).toContain("4");
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"] [data-dataset-catalog-audit]')?.textContent).toContain("公開監査済み");
    expect(root.querySelector('[data-dataset-catalog-card="ogurike"] [data-dataset-catalog-audit]')?.textContent).toContain("根拠6件");
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-audit]')).toBeNull();
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"]')?.textContent).toContain("読み込みに失敗しました");
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-lesson]')).toBeNull();
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-builder]')).toBeNull();
    expect(root.querySelector('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-map]')).toBeNull();
    expect(root.querySelector('[data-dataset-catalog-card="heijokyo"]')?.textContent).toContain("平城京の都市軸をたどる");
    expect(root.querySelector('[data-dataset-catalog-card="heijokyo"]')?.textContent).toContain("10分");
    expect(root.querySelector<HTMLAnchorElement>('[data-dataset-catalog-card="heijokyo"] [data-dataset-catalog-lesson]')?.href).toContain("lesson=heijokyo-intro");
    expect(root.querySelector("[data-dataset-catalog-free]")?.textContent).toContain("地図を見る");
    expect(root.querySelector("[data-dataset-catalog-future]")?.textContent).toContain("一括");
    expect(root.querySelectorAll("[data-dataset-catalog-offer]")).toHaveLength(3);
    expect(root.querySelectorAll("[data-dataset-catalog-offer-price]")).toHaveLength(3);
    expect(root.querySelector('[data-dataset-catalog-offer="classroom-pilot"] [data-dataset-catalog-offer-price]')?.textContent).toContain("¥49,800");
    expect(root.querySelector('[data-dataset-catalog-offer="classroom-pilot"]')?.textContent).toContain("授業パイロット");
    expect(root.querySelector('[data-dataset-catalog-offer="classroom-pilot"]')?.textContent).toContain("完成見本を確認して授業パイロットの相談文を作る");
    expect(root.querySelectorAll('[data-dataset-catalog-offer="classroom-pilot"] [data-dataset-catalog-offer-output]')).toHaveLength(3);
    expect(root.querySelector('[data-dataset-catalog-offer="classroom-pilot"]')?.textContent).toContain("生徒用ワークシート");
    expect(root.querySelector('[data-dataset-catalog-offer="custom-region"]')?.textContent).toContain("完成見本を確認して個別制作の相談文を作る");
    expect(root.querySelectorAll('[data-dataset-catalog-offer="custom-region"] [data-dataset-catalog-offer-output]')).toHaveLength(3);
    expect(root.querySelector('[data-dataset-catalog-offer="custom-region"]')?.textContent).toContain("希望地域・題材の出典整理");
    expect(root.querySelector<HTMLAnchorElement>('[data-dataset-catalog-offer="custom-region"] [data-dataset-catalog-offer-preview]')?.textContent).toContain("完成見本");
    expect(root.querySelector<HTMLAnchorElement>('[data-dataset-catalog-offer="custom-region"] [data-dataset-catalog-offer-preview]')?.href).toContain("offer=custom-region");
    expect(root.querySelector('[data-dataset-catalog-offer="free-explore"]')?.textContent).toContain("共有リンクとレポート");
    expect(root.querySelector<HTMLAnchorElement>('[data-dataset-catalog-offer="custom-region"] [data-dataset-catalog-offer-link]')?.href).toContain("offer=custom-region");
    expect(root.querySelector(".dataset-catalog-offer-pricing")?.textContent).toContain("価格");
    expect(root.querySelector("[data-dataset-catalog-process]")?.textContent).toContain("導入までの流れ");
    expect(root.querySelectorAll("[data-dataset-catalog-process-step]")).toHaveLength(3);
    expect(root.querySelector("[data-dataset-catalog-process]")?.textContent).toContain("範囲・価格・納期");
  });

  it("puts the value proposition and one next action above the root catalog", () => {
    const root = document.createElement("section");
    renderDatasetCatalog(root, model, uiCopy("ja"), { onClose: vi.fn(), isRoot: true });
    expect(root.querySelector("[data-dataset-catalog-hero]")).toBeTruthy();
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-hero-primary]")?.href).toContain("view=pack");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-hero-secondary]")?.getAttribute("href")).toBe("#dataset-catalog-cards");
    expect(root.querySelectorAll("[data-dataset-catalog-hero-proof]")).toHaveLength(3);
    expect(root.querySelector("[data-dataset-catalog-hero-trust]")?.textContent).toContain("登録・決済不要");
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

  it("renders a root purpose hub with explore, build, and local draft resume paths", () => {
    const root = document.createElement("section");
    const onResumeDraft = vi.fn();
    renderDatasetCatalog(root, model, uiCopy("ja"), { onClose: vi.fn(), onResumeDraft, isRoot: true });

    const hub = root.querySelector("[data-dataset-catalog-purpose-hub]");
    expect(hub).toBeTruthy();
    expect(hub?.textContent).toContain("調べる");
    expect(hub?.textContent).toContain("教材を作る");
    expect(hub?.textContent).toContain("下書きを再開");
    expect(hub?.textContent).toContain("現在の収録範囲: 2地域／2教材");
    expect(hub?.textContent).toContain("教員向け価値検証中");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-purpose-explore]")?.getAttribute("href")).toBe("#dataset-catalog-cards");
    expect(root.querySelector<HTMLAnchorElement>("[data-dataset-catalog-purpose-build]")?.getAttribute("href")).toContain("view=builder");
    const input = root.querySelector<HTMLInputElement>("[data-dataset-catalog-purpose-draft-file]");
    expect(input?.accept).toContain(".json");
    const file = new File(["draft"], "draft.json", { type: "application/json" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    input!.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onResumeDraft).toHaveBeenCalledWith(file);
  });
});
