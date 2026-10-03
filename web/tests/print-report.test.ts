// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderPrintReport } from "../src/ui/print-report";
import type { ReportModel } from "../src/domain/report-model";

const model: ReportModel = {
  language: "ja",
  datasetId: "ogurike:dataset:pilot",
  datasetTitle: "巨椋池パイロットデータ",
  datasetDescription: "説明",
  datasetRights: "オープンライセンス。表示: Chronomap",
  year: "1910年",
  visibleFeatureCount: 1,
  feature: {
    id: "feature:1910",
    entityLabel: "巨椋池",
    entityType: "水域",
    entityDescription: "歴史上の池",
    label: "巨椋池（1910年・概略）",
    description: "概略復元",
    period: "1910年時点（year・exact）。",
    geometry: "面",
    uncertainty: ["年代: 根拠が強い", "位置: 概略・近似"],
    rights: "オープンライセンス",
    evidence: [{ id: "evidence:map", supports: ["location"], locator: "図1", note: "引用メタデータのみ", citation: "資料図 1910", title: "資料図", url: "https://example.com/source", rights: "引用メタデータのみ", citationOnly: true }],
  },
  comparison: [],
  shareUrl: "https://example.com/?year=1910&feature=feature%3A1910",
  basemapError: null,
};

describe("print report", () => {
  it("renders selected feature, evidence, rights, and a safe source link", () => {
    const root = document.createElement("section");
    renderPrintReport(root, model, { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.getAttribute("role")).toBe("dialog");
    expect(root.querySelector("h2")?.textContent).toContain("1910年");
    expect(root.textContent).toContain("図1");
    expect(root.textContent).toContain("種別: 水域");
    expect(root.textContent).toContain("引用メタデータのみを収録しています");
    expect(root.querySelector("a[href='https://example.com/source']")?.textContent).toBe("出典を開く");
    expect(root.querySelector("[data-report-print]")).toBeTruthy();
  });

  it("announces a missing basemap without removing the text report", () => {
    const root = document.createElement("section");
    renderPrintReport(root, { ...model, basemapError: "tiles unavailable" }, { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.textContent).toContain("背景地図を取得できませんでした");
    expect(root.textContent).toContain("巨椋池（1910年・概略）");
  });
});
