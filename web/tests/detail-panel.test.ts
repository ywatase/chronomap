// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { ResolvedDetail } from "../src/domain/details";
import { mountDetailPanel } from "../src/ui/detail-panel";

const assessment = { assessment: "approximate", note: "概略", evidenceIds: [] };
function resolved(display?: { toYear: number; nextVersionYear: number }): ResolvedDetail {
  return {
    id: "ogurike:version:waterbody-1590",
    dataset: "ogurike",
    entity: null,
    evidence: [],
    feature: {
      entityId: "ogurike:entity:waterbody",
      labels: { ja: "巨椋池（1590年）" },
      description: { ja: "概略" },
      temporal: { start: { earliestYear: 1590, latestYear: 1590, precision: "year", qualifier: "exact" }, end: { earliestYear: 1590, latestYear: 1590, precision: "year", qualifier: "exact" } },
      uncertainty: { temporal: assessment, location: assessment, geometry: assessment, identity: assessment },
      evidenceIds: [],
      rights: { status: "open-license" },
      ...(display ? { display } : {}),
    },
  };
}

describe("detail panel", () => {
  it("explains when a snapshot is held until the next version", () => {
    const root = document.createElement("section");
    const panel = mountDetailPanel(root, [], { onClose: () => {}, onChoose: () => {} });

    panel.detail(resolved({ toYear: 1595, nextVersionYear: 1596 }));

    expect(root.textContent).toContain("可能期間 1590年");
    expect(root.querySelector(".detail-held")?.textContent).toBe("次の資料（1596年）の前年まで、この形を表示しています。その間の変化は示していません。");
  });

  it("says nothing about holding for other features", () => {
    const root = document.createElement("section");
    mountDetailPanel(root, [], { onClose: () => {}, onChoose: () => {} }).detail(resolved());
    expect(root.querySelector(".detail-held")).toBeNull();
  });
});

describe("reference display", () => {
  it("explains that the earliest record's shape is shown as a reference", () => {
    const root = document.createElement("section");
    mountDetailPanel(root, [], { onClose: () => {}, onChoose: () => {} }).detail(resolved({ toYear: 1595, nextVersionYear: 1596 }), [], true);
    expect(root.querySelector(".detail-reference")?.textContent).toBe("この年の形を示す資料はありません。最古の資料（1590年）の形を参考として破線で表示しています。");
    expect(root.textContent).not.toContain("次の資料");
  });
});
