import { expect, test } from "@playwright/test";

test.describe("viewer-first historical map", () => {
  test("opens Ogurike as a free map viewer with the waterbody snapshot in view", async ({ page }, testInfo) => {
    await page.goto("/?dataset=ogurike");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);

    await expect(page.locator("[data-viewer-mode]")).toContainText(/ビューアー|Viewer/i);
    await expect(page.locator("[data-lesson-progress]")).toHaveCount(0);
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1910");
    await expect(page.locator("[data-viewer-timeline]")).toBeVisible();
    await expect(page.locator('[data-viewer-snapshot="1910"]')).toHaveAttribute("aria-current", "step");
    await expect(page.getByRole("button", { name: /巨椋池（1910年/ })).toBeVisible();
    await expect(page.locator("[data-dataset-catalog-open]")).toHaveText("地域を選ぶ");
    await expect(page.locator("[data-dataset-catalog-open]")).not.toContainText("料金");
    await expect(page.locator("[data-viewer-approximation]")).toContainText("概略");
    await expect(page.locator("[data-temporal-compare]")).toContainText("前の時点");
    await expect(page.locator("[data-map-legend] .map-legend-previous")).toBeHidden();
    await expect(page.locator("body")).not.toContainText("¥198,000");
    await expect(page.locator("body")).not.toContainText("¥49,800");

    await page.screenshot({ path: testInfo.outputPath("viewer-ogurike-1910.png"), fullPage: true });
  });

  test("gives the map most of the first viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?dataset=ogurike");
    const map = page.locator("[data-map-host]");
    await expect(map).toBeVisible();
    const box = await map.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(450);
  });

  test("moves between authored snapshots without entering lesson mode", async ({ page }) => {
    await page.goto("/?dataset=ogurike");
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1910");

    const compare = page.locator("[data-temporal-compare]");
    await expect(compare).toBeEnabled();
    await compare.click();
    await expect(compare).toHaveAttribute("aria-pressed", "true");
    await expect(compare).toContainText("非表示");
    await expect(page.locator("[data-map-legend] .map-legend-previous")).toBeVisible();
    await expect(page.locator("[data-map-legend] .map-legend-previous")).toContainText("1885");
    await compare.click();
    await expect(compare).toHaveAttribute("aria-pressed", "false");

    await page.locator('[data-viewer-snapshot="1590"]').click();
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1590");
    await expect(page.locator('[data-viewer-snapshot="1590"]')).toHaveAttribute("aria-current", "step");
    await expect(page.getByRole("button", { name: /宇治川（1590年・工事前）/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /巨椋池（1910年/ })).toHaveCount(0);
    await expect(page.locator("[data-lesson-progress]")).toHaveCount(0);

    await page.locator('[data-viewer-snapshot="1910"]').click();
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1910");
    await expect(page.getByRole("button", { name: /巨椋池（1910年/ })).toBeVisible();
  });

  for (const viewport of ["desktop", "mobile"] as const) {
    test(`searches all historical snapshots and moves the map on ${viewport}`, async ({ page }) => {
      await page.setViewportSize(viewport === "desktop" ? { width: 1440, height: 900 } : { width: 390, height: 844 });
      await page.goto("/?dataset=ogurike");
      await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);

      const mapSearch = page.locator("[data-map-search]");
      await mapSearch.locator("summary").click();
      const input = mapSearch.locator("[data-map-feature-search]");
      await input.fill("巨椋池（1590");
      const result = mapSearch.locator('[data-map-feature-result][data-map-feature-id="ogurike:version:waterbody-1590"]');
      await expect(result).toBeVisible();
      await result.click();

      await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1590");
      await expect(page.locator(".detail-panel")).toContainText("巨椋池");
      await expect(page.locator('[data-map-feature-result][data-map-feature-id="ogurike:version:waterbody-1590"]')).toHaveAttribute("aria-pressed", "true");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    });
  }

  test("keeps education optional in the region catalog", async ({ page }) => {
    await page.goto("/");
    await page.locator("aside[data-root-quickstart] [data-root-quickstart-secondary]").click();
    await expect(page.locator("[data-dataset-catalog-dialog]")).toBeVisible();
    await expect(page.locator("[data-dataset-catalog-offers]")).toHaveCount(0);
    await expect(page.locator("[data-dataset-catalog-lesson-mode]")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("¥198,000");
    await expect(page.locator("body")).not.toContainText("¥49,800");
  });
});
