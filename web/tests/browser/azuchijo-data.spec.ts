import { expect, test } from "@playwright/test";

test("opens the Azuchi Castle pilot from the catalog and compares its dated castle, shore, and water-transport context", async ({ page }, testInfo) => {
  await page.goto("/?dataset=azuchijo");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();
  const catalog = page.locator("[data-dataset-catalog-dialog]");
  await expect(catalog.locator('[data-dataset-catalog-card="azuchijo"]')).toContainText(/安土城・琵琶湖東岸|Azuchi Castle/);
  const card = catalog.locator('[data-dataset-catalog-card="azuchijo"]');
  await expect(card).toContainText(/6件|6/);
  await expect(card).toContainText(/12分|12 min/);
  await expect(card.locator("[data-dataset-catalog-audit]")).toContainText(/公開監査済み|Public audit ready/);
  await card.locator('[data-dataset-catalog-lesson-row="azuchijo-intro"] [data-dataset-catalog-lesson]').click();
  await expect(page).toHaveURL(/dataset=azuchijo&lesson=azuchijo-intro&step=castle-start-1576/);
  await expect(page.locator("[data-feature-id]")).toHaveCount(4);
  await expect(page.locator("[data-lesson-progress]")).toContainText(/1\/5|1 of 5/);
  await page.getByRole("button", { name: /詳細を閉じる|Close details/ }).click();
  const featureSearch = page.getByLabel(/表示中の地物を検索|Search visible features/);
  const urlBeforeSearch = page.url();
  await featureSearch.fill("水運");
  await expect(page).toHaveURL(urlBeforeSearch);
  await expect(page.locator("[data-feature-id]")).toHaveCount(1);
  await expect(page.locator("[data-feature-id]")).toContainText(/水運|water transport/);
  await expect(page.locator(".feature-count")).toContainText(/4件中1件|1 of 4/);
  await featureSearch.fill("存在しない地物");
  await expect(page.locator("#panel-list [role=status]")).toContainText(/一致する地物はありません|No visible features match/);
  await featureSearch.fill("");
  await expect(page.locator("[data-feature-id]")).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath("azuchijo-1576.png"), fullPage: true });

  await page.locator("[data-lesson-next]").click();
  await expect(page).toHaveURL(/step=castle-complete-1579/);
  await expect(page.locator("[data-feature-id]")).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath("azuchijo-1579.png"), fullPage: true });

  await page.goto("/?dataset=azuchijo&year=1582&feature=azuchijo%3Aversion%3Acastle-1582");
  await expect(page.locator("[data-feature-id]")).toHaveCount(4);
  const detail = page.locator("#panel-detail");
  await expect(detail).toContainText("azuchijo:evidence:timeline");
  await expect(detail).toContainText(/主郭部焼失|main enclosure/);

  await page.goto("/?dataset=azuchijo&lesson=azuchijo-intro&step=water-transport-1576");
  await expect(page).toHaveURL(/dataset=azuchijo&lesson=azuchijo-intro&step=water-transport-1576/);
  await expect(page.locator("[data-lesson-progress]")).toContainText(/5\/5|5 of 5/);
  await expect(page.locator("#panel-detail")).toContainText(/湖上交通|water transport/);
  await expect(page.locator("#panel-detail")).toContainText("azuchijo:evidence:transport");
  await expect(page.locator("#panel-detail")).toContainText(/滋賀県『琵琶湖と人の長いつきあい』|Lake Biwa/);
  await page.screenshot({ path: testInfo.outputPath("azuchijo-water-transport.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
