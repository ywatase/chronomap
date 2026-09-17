import { expect, test } from "@playwright/test";

for (const viewport of ["desktop", "mobile"] as const) {
  test(`compares Ujigawa snapshots and keeps the shared URL synchronized on ${viewport}`, async ({ page }) => {
    await page.setViewportSize(viewport === "desktop" ? { width: 1280, height: 900 } : { width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await page.getByRole("button", { name: "宇治川の変化を比較" }).click();
    const card = page.locator("[data-comparison-card]"); await expect(card).toBeVisible();
    await card.getByRole("button", { name: "1590年" }).click();
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1590"); expect(page.url()).toContain("feature=ogurike%3Aversion%3Aujigawa-1590");
    await card.getByRole("button", { name: "1596年" }).click();
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1596"); expect(page.url()).toContain("feature=ogurike%3Aversion%3Aujigawa-1596");
    await page.reload(); await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1596");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
}
