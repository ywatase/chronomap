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
});
