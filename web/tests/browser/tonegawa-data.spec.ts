import { expect, test } from "@playwright/test";

test.describe("Tone River eastward-shift dataset", () => {
  test("loads the second dataset, compares river snapshots, and restores the lesson URL", async ({ page }) => {
    await page.goto("/?dataset=tonegawa");
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
    await expect(page.getByRole("heading", { name: "利根川東遷パイロットデータ" })).toBeVisible();
    await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();
    const catalog = page.locator("[data-dataset-catalog-dialog]");
    await expect(catalog).toBeVisible();
    await expect(catalog.locator("[data-dataset-catalog-card]")).toHaveCount(2);
    await expect(catalog.locator('[data-dataset-catalog-card="tonegawa"]')).toContainText(/関東東部|Eastern Kanto/);
    await expect(catalog.locator('[data-dataset-catalog-card="tonegawa"]')).toContainText(/3件|3/);
    await catalog.locator('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-lesson]').click();
    await expect(page).toHaveURL(/dataset=tonegawa&lesson=tonegawa-eastward&step=river-1590/);
    await expect(catalog).toBeHidden();
    const snapshots = page.getByLabel(/収録時点|Recorded snapshots/);
    await expect(snapshots.locator("option")).toHaveCount(3);
    await expect(page.getByRole("tabpanel", { name: /詳細|Details/ }).getByText("利根川（1590年・東遷初期）", { exact: true })).toBeVisible();

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
    await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();
    await page.locator('[data-dataset-catalog-card="ogurike"] [data-dataset-catalog-map]').click();
    await expect(page).toHaveURL(/\?dataset=ogurike(?:&|$)/);
    await expect(page).not.toHaveURL(/tonegawa|kawamata|river-1654/);
    await expect(page.getByRole("heading", { name: "巨椋池パイロットデータ" })).toBeVisible();
    await expect(page.getByRole("button", { name: /宇治川（1590年・工事前）/ })).toBeVisible();
  });

  test("opens the catalog from a reloadable view parameter and isolates a failed card", async ({ page }, testInfo) => {
    await page.route("**/data/ogurike/entities.json", (route) => route.abort());
    await page.goto("/?dataset=tonegawa&view=catalog");
    const catalog = page.locator("[data-dataset-catalog-dialog]");
    await expect(catalog).toBeVisible();
    await expect(catalog.locator('[data-dataset-catalog-card="tonegawa"]')).toContainText(/利根川東遷/);
    await expect(catalog.locator('[data-dataset-catalog-card="ogurike"]')).toContainText(/読み込めません|利用できません|unavailable/i);
    await page.screenshot({ path: testInfo.outputPath("catalog.png"), fullPage: true });
    await page.reload();
    await expect(catalog).toBeVisible();
    const close = catalog.locator("[data-dataset-catalog-close]");
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(catalog.locator('[data-dataset-catalog-card="tonegawa"] [data-dataset-catalog-map]')).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(catalog).toBeHidden();
    await expect(page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ })).toBeFocused();
    await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();
    await expect(catalog).toBeVisible();
    await catalog.locator("[data-dataset-catalog-close]").click();
    await expect(catalog).toBeHidden();
  });

  test("creates the classroom pack from the Tone River lesson", async ({ page }) => {
    await page.goto("/?dataset=tonegawa");
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
    await page.getByRole("button", { name: /ガイド教材を始める|Start guided lesson/ }).click();
    await page.locator("[data-lesson-next]").click();
    await page.locator("[data-lesson-next]").click();
    await expect(page.locator("[data-lesson-pack-open]")).toBeVisible();
    await page.locator("[data-lesson-pack-open]").click();
    const dialog = page.locator("[data-lesson-pack-dialog]");
    await expect(dialog).toContainText(/利根川東遷を概略地図でたどる|Trace the Tone River eastward shift/);
    await expect(dialog.locator("[data-lesson-pack-student]")).toBeVisible();
    await expect(dialog.locator("[data-lesson-pack-teacher]")).toContainText(/会の川締切地点|川俣締切|Kawamata/);
    await expect(dialog.locator("[data-lesson-pack-sources]")).toContainText(/国土交通省|Ministry of Land/);
  });
});
