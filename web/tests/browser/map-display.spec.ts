import { expect, test } from "@playwright/test";

for (const viewport of ["desktop", "mobile"] as const) {
  test(`adjusts map display settings without losing the historical map on ${viewport}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport === "desktop" ? { width: 1280, height: 900 } : { width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    const tools = page.locator("[data-map-settings]");
    await tools.locator("summary").click();
    await expect(tools).toHaveAttribute("open", "");

    const basemap = tools.getByRole("slider", { name: /背景地図の濃さ|Basemap opacity/ });
    const historical = tools.getByRole("slider", { name: /歴史地物の濃さ|Historical features opacity/ });
    await basemap.fill("0.45");
    await historical.fill("0.6");
    await expect(tools.locator("output").nth(0)).toHaveText("45%");
    await expect(tools.locator("output").nth(1)).toHaveText("60%");
    const visibility = tools.getByLabel(/歴史地物を表示|Show historical features/);
    await visibility.uncheck();
    await expect(visibility).not.toBeChecked();
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();

    await page.screenshot({ path: testInfo.outputPath("map-display.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
}

test("renders a validated historical-map asset with independent controls", async ({ page }) => {
  await page.route("**/data/ogurike/dataset.json", async (route) => {
    const response = await route.fetch();
    const dataset = await response.json() as Record<string, unknown>;
    dataset.historicalMapAssets = [{
      id: "synthetic:historical-map:browser",
      title: { ja: "試験古地図" },
      description: { ja: "測位誤差を明示したコンテキストタイル" },
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
    }];
    await route.fulfill({ response, json: dataset });
  });
  await page.route("https://tiles.example.invalid/**", (route) => route.abort());
  await page.goto("/?dataset=ogurike");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);

  const tools = page.locator("[data-map-settings]");
  await tools.locator("summary").click();
  await expect(tools).toContainText("試験古地図");
  await expect(tools.locator("[data-historical-map-asset-source]")).toHaveAttribute("href", "https://example.invalid/source");
  const assetOpacity = tools.getByRole("slider", { name: /古地図の濃さ|Historical map opacity/ });
  await assetOpacity.fill("0.4");
  await expect(tools.locator("#historical-map-asset-opacity")).toHaveValue("0.4");
  const assetVisibility = tools.getByLabel(/古地図を表示|Show historical map/);
  await assetVisibility.uncheck();
  await expect(assetVisibility).not.toBeChecked();
  await expect(page.locator(".feature-list")).toBeVisible();
});
