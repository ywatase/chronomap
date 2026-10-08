// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { uiCopy } from "../src/ui/copy";
import { createMapSettings } from "../src/ui/map-settings";

describe("map display settings", () => {
  it("localizes the controls and reports slider/visibility changes", () => {
    const changes: unknown[] = [];
    const settings = createMapSettings(uiCopy("ja"), (value) => changes.push(value));
    expect(settings.element.querySelector("summary")?.textContent).toBe("表示設定");
    expect(settings.element.querySelectorAll(".legend-item")).toHaveLength(5);
    expect(settings.element.textContent).toContain("領域・勢力圏（概略）");

    const historical = settings.element.querySelector<HTMLInputElement>("#historical-opacity")!;
    historical.value = "0.35";
    historical.dispatchEvent(new Event("input"));
    const visibility = settings.element.querySelector<HTMLInputElement>("#historical-visibility")!;
    visibility.checked = false;
    visibility.dispatchEvent(new Event("change"));
    const territoryVisibility = settings.element.querySelector<HTMLInputElement>("#territory-visibility")!;
    territoryVisibility.checked = false;
    territoryVisibility.dispatchEvent(new Event("change"));

    expect(settings.getSettings()).toEqual({ basemapOpacity: 1, historicalOpacity: 0.35, historicalVisible: false, territoryVisible: false });
    expect(changes).toEqual([
      { basemapOpacity: 1, historicalOpacity: 0.35, historicalVisible: true, territoryVisible: true },
      { basemapOpacity: 1, historicalOpacity: 0.35, historicalVisible: false, territoryVisible: true },
      { basemapOpacity: 1, historicalOpacity: 0.35, historicalVisible: false, territoryVisible: false },
    ]);
    expect(settings.element.querySelectorAll("output")[1]?.textContent).toBe("35%");
  });

  it("offers an independent historical-map toggle and opacity when an asset is available", () => {
    const changes: unknown[] = [];
    const settings = createMapSettings(uiCopy("ja"), (value) => changes.push(value), {
      id: "synthetic:historical-map:sample",
      title: { ja: "試験古地図" },
      description: { ja: "測位誤差を明示したコンテキスト画像" },
      tileTemplate: "https://tiles.example.invalid/ort/{z}/{x}/{y}.png",
      bbox: [135, 34, 136, 35],
      date: "1936–1942",
      accessedDate: "2026-10-04",
      georeference: { method: "提供元XYZタイル", error: "未評価" },
      sourceUrl: "https://example.invalid/source",
      attribution: "試験アーカイブ",
      rights: { status: "open-license" },
      minZoom: 13,
      maxZoom: 18,
    });

    expect(settings.element.textContent).toContain("試験古地図");
    const opacity = settings.element.querySelector<HTMLInputElement>("#historical-map-asset-opacity")!;
    opacity.value = "0.4";
    opacity.dispatchEvent(new Event("input"));
    const visible = settings.element.querySelector<HTMLInputElement>("#historical-map-asset-visibility")!;
    visible.checked = false;
    visible.dispatchEvent(new Event("change"));

    expect(settings.getSettings()).toMatchObject({ historicalMapAssetOpacity: 0.4, historicalMapAssetVisible: false });
    expect(changes.at(-1)).toMatchObject({ historicalMapAssetOpacity: 0.4, historicalMapAssetVisible: false });
  });

  it("switches between historical-map assets while retaining the display controls", () => {
    const first = {
      id: "synthetic:historical-map:first",
      title: { ja: "昭和初期空中写真" },
      description: { ja: "第一の後世コンテキスト" },
      tileTemplate: "https://tiles.example.invalid/first/{z}/{x}/{y}.png",
      bbox: [135, 34, 136, 35] as const,
      date: "1928年頃",
      accessedDate: "2026-10-04",
      georeference: { method: "提供元XYZタイル", error: "未評価" },
      sourceUrl: "https://example.invalid/source-first",
      attribution: "試験アーカイブ",
      rights: { status: "open-license" as const },
      minZoom: 13,
      maxZoom: 18,
    };
    const second = { ...first, id: "synthetic:historical-map:second", title: { ja: "戦前空中写真" }, description: { ja: "第二の後世コンテキスト" }, date: "1936〜1942年頃", sourceUrl: "https://example.invalid/source-second" };
    const selected: string[] = [];
    const settings = createMapSettings(uiCopy("ja"), () => undefined, [first, second], (asset) => selected.push(asset.id));
    const select = settings.element.querySelector<HTMLSelectElement>("#historical-map-asset-select")!;
    expect(select.options).toHaveLength(2);
    expect(settings.element.textContent).toContain("昭和初期空中写真");
    select.value = second.id;
    select.dispatchEvent(new Event("change"));
    expect(selected).toEqual([second.id]);
    expect(settings.element.textContent).toContain("戦前空中写真");
    settings.setHistoricalMapAsset(first);
    expect(select.value).toBe(first.id);
    expect(settings.element.textContent).toContain("1928年頃");
  });
});
