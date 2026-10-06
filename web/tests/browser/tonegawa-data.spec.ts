import { expect, test } from "@playwright/test";

async function selectFeatureFromList(page: import("@playwright/test").Page, name: RegExp): Promise<void> {
  const feature = page.getByRole("button", { name });
  if (!(await feature.isVisible())) {
    const listTab = page.getByRole("tab", { name: /地物一覧|Feature list/ });
    if (await listTab.isVisible()) await listTab.click();
    else await page.getByRole("button", { name: /詳細を閉じる|Close details/ }).click();
  }
  await feature.click();
}

test.describe("Tone River eastward-shift dataset", () => {
  test("loads the second dataset, compares river snapshots, and restores the lesson URL", async ({ page }) => {
    await page.goto("/?dataset=tonegawa");
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
    await expect(page.getByRole("heading", { name: "利根川東遷パイロットデータ" })).toBeVisible();
    await page.locator("[data-dataset-catalog-open]").click();
    const catalog = page.locator("[data-dataset-catalog-dialog]");
    await expect(catalog).toBeVisible();
    await expect(catalog.locator("[data-dataset-catalog-card]")).toHaveCount(7);
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
    await page.locator("[data-dataset-catalog-open]").click();
    await page.locator('[data-dataset-catalog-card="ogurike"] [data-dataset-catalog-map]').click();
    await expect(page).toHaveURL(/\?dataset=ogurike(?:&|$)/);
    await expect(page).not.toHaveURL(/tonegawa|kawamata|river-1654/);
    await expect(page.getByRole("heading", { name: "巨椋池パイロットデータ" })).toBeVisible();
    await expect(page.getByRole("button", { name: /巨椋池（1910年・概略）/ })).toBeVisible();
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
    await expect(catalog.locator('[data-dataset-catalog-card="sekigahara"] [data-dataset-catalog-map]')).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(catalog).toBeHidden();
    await expect(page.locator("[data-dataset-catalog-open]")).toBeFocused();
    await page.locator("[data-dataset-catalog-open]").click();
    await expect(catalog).toBeVisible();
    await catalog.locator("[data-dataset-catalog-close]").click();
    await expect(catalog).toBeHidden();
  });

  test("creates the classroom pack from the Tone River lesson", async ({ page }) => {
    await page.goto("/?dataset=tonegawa&lesson=tonegawa-eastward&step=river-1590");
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
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

  test("shows evidence, uncertainty, citation, and rights for Tone River line and point snapshots", async ({ page }, testInfo) => {
    await page.goto("/?dataset=tonegawa");
    const snapshots = page.getByLabel(/収録時点|Recorded snapshots/);
    const detail = page.locator("#panel-detail");

    await snapshots.selectOption("1590");
    await selectFeatureFromList(page, /利根川（1590年・東遷初期）/);
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("tonegawa:evidence:river-1590-geometry");
    await expect(detail).toContainText("1590年LineString");
    await expect(detail).toContainText("国土交通省『利根川』日本の川");
    await expect(detail).toContainText("概略・近似");
    await expect(detail).toContainText("引用メタデータのみ");

    await snapshots.selectOption("1594");
    await selectFeatureFromList(page, /会の川締切地点（1594年・代表点）/);
    await expect(detail).toContainText("tonegawa:evidence:closure-geometry");
    await expect(detail).toContainText("1594年Point");
    await expect(detail).toContainText("埼玉県『埼玉県の文化財』");
    await expect(detail).toContainText("精密な位置や形状");

    await snapshots.selectOption("1654");
    await selectFeatureFromList(page, /利根川（1654年・東遷後）/);
    await expect(detail).toContainText("tonegawa:evidence:river-1654-geometry");
    await expect(detail).toContainText("1654年LineString");
    await expect(detail).toContainText("国土交通省『利根川水系河川整備基本方針』");

    await page.screenshot({ path: testInfo.outputPath("tonegawa-evidence.png"), fullPage: true });
  });
});
