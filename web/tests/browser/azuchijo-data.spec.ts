import { expect, test } from "@playwright/test";

test("opens the Azuchi Castle pilot from the catalog and compares its dated point and shore", async ({ page }, testInfo) => {
  await page.goto("/?dataset=azuchijo");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();
  const catalog = page.locator("[data-dataset-catalog-dialog]");
  await expect(catalog.locator('[data-dataset-catalog-card="azuchijo"]')).toContainText(/安土城・琵琶湖東岸|Azuchi Castle/);
  const card = catalog.locator('[data-dataset-catalog-card="azuchijo"]');
  await expect(card).toContainText(/5件|5/);
  await expect(card).toContainText(/10分|10 min/);
  await expect(card.locator("[data-dataset-catalog-audit]")).toContainText(/公開監査済み|Public audit ready/);
  await card.locator('[data-dataset-catalog-lesson-row="azuchijo-intro"] [data-dataset-catalog-lesson]').click();
  await expect(page).toHaveURL(/dataset=azuchijo&lesson=azuchijo-intro&step=castle-start-1576/);
  await expect(page.locator("[data-feature-id]")).toHaveCount(3);
  await expect(page.locator("[data-lesson-progress]")).toContainText(/1\/4|1 of 4/);
  await page.screenshot({ path: testInfo.outputPath("azuchijo-1576.png"), fullPage: true });

  await page.locator("[data-lesson-next]").click();
  await expect(page).toHaveURL(/step=castle-complete-1579/);
  await expect(page.locator("[data-feature-id]")).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath("azuchijo-1579.png"), fullPage: true });

  await page.goto("/?dataset=azuchijo&year=1582&feature=azuchijo%3Aversion%3Acastle-1582");
  await expect(page.locator("[data-feature-id]")).toHaveCount(3);
  const detail = page.locator("#panel-detail");
  await expect(detail).toContainText("azuchijo:evidence:timeline");
  await expect(detail).toContainText(/主郭部焼失|main enclosure/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
