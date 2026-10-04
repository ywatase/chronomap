import { expect, test } from "@playwright/test";

test.describe("Osaka Ishiyama and Kawachi Bay pilot", () => {
  test("loads the source-backed Osaka bundle and exposes its historical map context", async ({ page }, testInfo) => {
    await page.goto("/?dataset=osaka");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await expect(page.getByRole("heading", { level: 1, name: /大坂・石山本願寺.*河内湾|Osaka.*Ishiyama/i })).toBeVisible();
    await expect(page.locator("[data-feature-id]")).toHaveCount(4);

    const settings = page.locator("[data-map-settings]");
    await settings.locator("summary").click();
    await expect(settings).toContainText(/陸地測量部空中写真|historical aerial photograph/i);
    await expect(settings.locator("[data-historical-map-asset-source]")).toHaveAttribute("href", "https://maps.gsi.go.jp/development/ichiran.html");
    const assetVisibility = settings.getByLabel(/古地図を表示|Show historical map/);
    await assetVisibility.uncheck();
    await expect(assetVisibility).not.toBeChecked();

    await page.getByLabel(/表示年|Year/).fill("1533");
    await page.getByLabel(/表示年|Year/).press("Enter");
    await expect(page.locator("[data-feature-id]")).toHaveCount(4);
    await expect(page.locator('[data-feature-id="osaka:version:ishiyama-honganji-1533"]')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("osaka-1533.png"), fullPage: true });
  });

  test("shows ancient Kawachi Bay as a bounded approximate waterbody", async ({ page }) => {
    await page.goto("/?dataset=osaka&year=-300");
    const waterbody = page.locator('[data-feature-id="osaka:version:kawachi-bay-300"]');
    await expect(waterbody).toBeVisible();
    await waterbody.click();
    const detail = page.locator("#panel-detail");
    await expect(detail).toContainText(/河内湾|Kawachi Bay/);
    await expect(detail).toContainText(/古代の海岸線|ancient shoreline/);
    await expect(detail).toContainText("osaka:evidence:kawachi-bay-shape");
  });

  test("keeps the approximate ancient coastline distinct from the waterbody area", async ({ page }) => {
    await page.goto("/?dataset=osaka&year=-300");
    const coastline = page.locator('[data-feature-id="osaka:version:ancient-coastline-300"]');
    await expect(coastline).toBeVisible();
    await coastline.click();
    const detail = page.locator("#panel-detail");
    await expect(detail).toContainText(/古代海岸線|ancient coastline/);
    await expect(detail).toContainText(/正確な古代海岸線|exact ancient shoreline/);
    await expect(detail).toContainText("osaka:evidence:ancient-coastline-shape");
  });
});
