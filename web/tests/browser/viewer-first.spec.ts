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
    await expect(page.locator("body")).not.toContainText("¥198,000");
    await expect(page.locator("body")).not.toContainText("¥49,800");

    await page.screenshot({ path: testInfo.outputPath("viewer-ogurike-1910.png"), fullPage: true });
  });

  test("moves between authored snapshots without entering lesson mode", async ({ page }) => {
    await page.goto("/?dataset=ogurike");
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1910");

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
