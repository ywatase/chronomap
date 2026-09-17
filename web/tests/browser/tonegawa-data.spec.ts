import { expect, test } from "@playwright/test";

test.describe("Tone River eastward-shift dataset", () => {
  test("loads the second dataset, compares river snapshots, and restores the lesson URL", async ({ page }) => {
    await page.goto("/?dataset=tonegawa");
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
    await expect(page.getByRole("heading", { name: "利根川東遷パイロットデータ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "利根川東遷" })).toHaveAttribute("aria-current", "page");
    const snapshots = page.getByLabel(/収録時点|Recorded snapshots/);
    await expect(snapshots.locator("option")).toHaveCount(3);
    await expect(page.getByRole("button", { name: /利根川（1590年・東遷初期）/ })).toBeVisible();

    await snapshots.selectOption("1654");
    const after = page.getByRole("button", { name: /利根川（1654年・東遷後）/ });
    await expect(after).toBeVisible();
    await after.click();
    if (test.info().project.name === "mobile-chromium") await page.getByRole("tab", { name: /詳細|Details/ }).click();
    await page.getByRole("button", { name: /利根川の変化を比較|Compare 利根川 snapshots/ }).click();
    await expect(page.getByRole("heading", { name: /比較|Comparison/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /出典|Source/ })).toBeVisible();

    await page.goto("/?dataset=tonegawa&lesson=tonegawa-eastward&step=river-1654");
    await expect(page.getByRole("heading", { name: /利根川東遷を概略地図でたどる|Trace the Tone River eastward shift/ })).toBeVisible();
    await expect(page.locator("[data-lesson-progress]")).toContainText(/3\/3|3 of 3/);
  });

  test("switches back to the Ogurike dataset with a clean URL", async ({ page }) => {
    await page.goto("/?dataset=tonegawa&year=1654&feature=tonegawa%3Aversion%3Ariver-1654");
    await expect(page.getByRole("heading", { name: "利根川東遷パイロットデータ" })).toBeVisible();
    await page.getByRole("link", { name: "巨椋池" }).click();
    await expect(page).toHaveURL(/\?dataset=ogurike(?:&|$)/);
    await expect(page).not.toHaveURL(/tonegawa|kawamata|river-1654/);
    await expect(page.getByRole("heading", { name: "巨椋池パイロットデータ" })).toBeVisible();
    await expect(page.getByRole("button", { name: /宇治川（1590年・工事前）/ })).toBeVisible();
  });
});
