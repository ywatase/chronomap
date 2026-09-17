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
