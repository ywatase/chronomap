import { expect, test } from "@playwright/test";

test.describe("Sekigahara battlefield and Nakasendo dataset", () => {
  test("loads the source-backed battlefield pilot and its three context features", async ({ page }, testInfo) => {
    await page.goto("/?dataset=sekigahara");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await expect(page.getByRole("heading", { level: 1, name: /関ケ原古戦場・中山道|Sekigahara Battlefield and Nakasendo/i })).toBeVisible();
    await expect(page.locator("[data-feature-id]")).toHaveCount(3);
    await expect(page.locator('[data-feature-id="sekigahara:version:battlefield-1600"]')).toBeVisible();
    await expect(page.locator('[data-feature-id="sekigahara:version:nakasendo-1600"]')).toBeVisible();
    await expect(page.locator('[data-feature-id="sekigahara:version:sekigahara-juku-1600"]')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("sekigahara-overview.png"), fullPage: true });
  });

  test("shows the battlefield point's evidence and explicit geometry boundary", async ({ page }, testInfo) => {
    await page.goto("/?dataset=sekigahara");
    const battlefield = page.locator('[data-feature-id="sekigahara:version:battlefield-1600"]');
    await battlefield.click();
    const detail = page.locator("#panel-detail");
    await expect(detail).toContainText(/関ケ原古戦場|Sekigahara/);
    await expect(detail).toContainText("sekigahara:evidence:battlefield-shape");
    await expect(detail).toContainText(/戦場全体|entire battlefield/);
    await page.screenshot({ path: testInfo.outputPath("sekigahara-battlefield-detail.png"), fullPage: true });
  });

  test("keeps the route and post-station meanings distinct", async ({ page }) => {
    await page.goto("/?dataset=sekigahara");
    const route = page.locator('[data-feature-id="sekigahara:version:nakasendo-1600"]');
    await route.click();
    const detail = page.locator("#panel-detail");
    await expect(detail).toContainText(/中山道|Nakasendo/);
    await expect(detail).toContainText(/歴史的な街道中心線|not a historical road centerline/);
    await page.getByRole("button", { name: /詳細を閉じる|Close details/ }).click();
    await page.locator('[data-feature-id="sekigahara:version:sekigahara-juku-1600"]').click();
    await expect(detail).toContainText(/関ケ原宿|Sekigahara-juku/);
    await expect(detail).toContainText(/町域境界|town boundary/);
  });
});
