import { expect, test } from "@playwright/test";

test.describe("Kinugawa and Kokaigawa river-history dataset", () => {
  test("loads the source-backed fifth pilot and restores its lesson URL", async ({ page }, testInfo) => {
    await page.goto("/?dataset=kinugawa");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await expect(page.getByRole("heading", { name: /鬼怒川・小貝川の河道変遷パイロット|Kinugawa.*Kokaigawa/ })).toBeVisible();
    await expect(page.getByLabel(/収録時点|Recorded snapshots/).locator("option")).toHaveCount(3);
    await expect(page.locator("[data-feature-id]")).toHaveCount(1);

    await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();
    const catalog = page.locator("[data-dataset-catalog-dialog]");
    await expect(catalog.locator("[data-dataset-catalog-card]")).toHaveCount(5);
    const card = catalog.locator('[data-dataset-catalog-card="kinugawa"]');
    await expect(card).toContainText(/鬼怒川・小貝川|Kinugawa/);
    await expect(card).toContainText(/4件|4/);
    await expect(card).toContainText(/12分|12 min/);
    await expect(card.locator("[data-dataset-catalog-audit]")).toContainText(/公開監査済み|Public audit ready/);
    await card.locator('[data-dataset-catalog-lesson-row="kinugawa-history"] [data-dataset-catalog-lesson]').click();
    await expect(page).toHaveURL(/dataset=kinugawa&lesson=kinugawa-history&step=channel-768/);
    await expect(page.locator("[data-lesson-progress]")).toContainText(/1\/4|1 of 4/);
    await page.screenshot({ path: testInfo.outputPath("kinugawa-768.png"), fullPage: true });
  });

  test("shows evidence and approximation boundaries for the river, separation point, and current snapshot", async ({ page }, testInfo) => {
    await page.goto("/?dataset=kinugawa");
    const snapshots = page.getByLabel(/収録時点|Recorded snapshots/);
    const detail = page.locator("#panel-detail");

    await snapshots.selectOption("768");
    await page.getByRole("button", { name: /鬼怒川（768年・流路開削の概略）/ }).click();
    await expect(detail).toContainText("kinugawa:evidence:old-geometry");
    await expect(detail).toContainText("国土交通省関東地方整備局『鬼怒川・小貝川の歴史（治水）』");
    await expect(detail).toContainText(/概略|approximate/);

    await snapshots.selectOption("1629");
    await page.getByRole("button", { name: /鬼怒川・小貝川分離（1629年・代表点）/ }).click();
    await expect(detail).toContainText("kinugawa:evidence:separation-geometry");
    await expect(detail).toContainText(/代表点|representative point/);

    await page.getByRole("button", { name: /詳細を閉じる|Close details/ }).click();
    await snapshots.selectOption("2020");
    await page.getByRole("button", { name: /鬼怒川（2020年・現在流路の概略）/ }).click();
    await expect(detail).toContainText("kinugawa:evidence:current-geometry");
    await expect(detail).toContainText(/現在の河道中心線ではありません|not a current channel centerline/);
    await page.screenshot({ path: testInfo.outputPath("kinugawa-evidence.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
});
