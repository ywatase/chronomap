import { expect, test } from "@playwright/test";

test("opens the Azuchi Castle pilot from the catalog and compares its dated castle, shore, and water-transport context", async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  await page.goto("/?dataset=azuchijo");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();
  const catalog = page.locator("[data-dataset-catalog-dialog]");
  await expect(catalog.locator('[data-dataset-catalog-card="azuchijo"]')).toContainText(/安土城・琵琶湖東岸|Azuchi Castle/);
  const card = catalog.locator('[data-dataset-catalog-card="azuchijo"]');
  await expect(card).toContainText(/14件|14/);
  await expect(card).toContainText(/12分|12 min/);
  await expect(card.locator("[data-dataset-catalog-audit]")).toContainText(/公開監査済み|Public audit ready/);
  await card.locator('[data-dataset-catalog-lesson-row="azuchijo-intro"] [data-dataset-catalog-lesson]').click();
  await expect(page).toHaveURL(/dataset=azuchijo&lesson=azuchijo-intro&step=castle-start-1576/);
  await expect(page.locator("[data-feature-id]")).toHaveCount(11);
  await expect(page.locator("[data-lesson-progress]")).toContainText(/1\/5|1 of 5/);
  await page.getByRole("button", { name: /詳細を閉じる|Close details/ }).click();
  const featureSearch = page.getByLabel(/表示中の地物を検索|Search visible features/);
  const urlBeforeSearch = page.url();
  await featureSearch.fill("水運");
  await expect(page).toHaveURL(urlBeforeSearch);
  await expect(page.locator("[data-feature-id]")).toHaveCount(1);
  await expect(page.locator("[data-feature-id]")).toContainText(/水運|water transport/);
  await expect(page.locator(".feature-count")).toContainText(/11件中1件|1 of 11/);
  await featureSearch.fill("存在しない地物");
  await expect(page.locator("#panel-list [role=status]")).toContainText(/一致する地物はありません|No visible features match/);
  await featureSearch.fill("");
  await expect(page.locator("[data-feature-id]")).toHaveCount(11);
  await page.screenshot({ path: testInfo.outputPath("azuchijo-1576.png"), fullPage: true });

  await page.locator("[data-lesson-next]").click();
  await expect(page).toHaveURL(/step=castle-complete-1579/);
  await expect(page.locator("[data-feature-id]")).toHaveCount(11);
  await page.screenshot({ path: testInfo.outputPath("azuchijo-1579.png"), fullPage: true });

  await page.goto("/?dataset=azuchijo&year=1582&feature=azuchijo%3Aversion%3Acastle-1582");
  await expect(page.locator("[data-feature-id]")).toHaveCount(11);
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

test("shows the source-backed Omi sphere as a labeled, approximate territory", async ({ page }) => {
  await page.goto("/?dataset=azuchijo&year=1576");
  const territory = page.locator('[data-feature-id="azuchijo:version:omi-sphere-1576-broad"]');
  await expect(territory).toBeVisible();
  await expect(territory).toContainText(/勢力圏|Sphere of influence/);
  await territory.click();
  const detail = page.locator("#panel-detail");
  await expect(detail).toContainText(/勢力圏|Sphere of influence/);
  await expect(detail).toContainText(/概略|approximate/);
  await expect(detail).toContainText("azuchijo:evidence:omi-control");
  await expect(detail).toContainText("azuchijo:evidence:omi-shape");
  const settings = page.locator("[data-map-settings]");
  await settings.locator("summary").click();
  const territoryToggle = page.getByLabel(/領域・勢力圏を表示|Show territory and spheres of influence/);
  await expect(territoryToggle).toBeChecked();
  await territoryToggle.uncheck();
  await expect(territoryToggle).not.toBeChecked();
});

test("shows the source-backed Omi polity center as an approximate territory", async ({ page }) => {
  await page.goto("/?dataset=azuchijo&year=1576");
  const polity = page.locator('[data-feature-id="azuchijo:version:omi-polity-1576-azuchi"]');
  await expect(polity).toBeVisible();
  await expect(polity).toContainText(/政治主体|Polity/);
  await polity.click();
  const detail = page.locator("#panel-detail");
  await expect(detail).toContainText(/政治主体|Polity/);
  await expect(detail).toContainText(/安土城中心案|Azuchi center/);
  await expect(detail).toContainText(/仮説グループ|Hypothesis group/);
  await expect(detail).toContainText(/政治中枢|political center/);
  await expect(detail).toContainText("azuchijo:evidence:omi-polity");
  await expect(detail).toContainText("azuchijo:evidence:omi-polity-shape");
});

test("shows Jyorakuji port as an approximate source-backed point", async ({ page }) => {
  await page.goto("/?dataset=azuchijo&year=1576");
  const port = page.locator('[data-feature-id="azuchijo:version:jyorakuji-port-1576"]');
  await expect(port).toBeVisible();
  await expect(port).toContainText(/常楽寺湊|Jyorakuji port/);
  await port.click();
  const detail = page.locator("#panel-detail");
  await expect(detail).toContainText(/港|Port/);
  await expect(detail).toContainText(/概略|approximate/);
  await expect(detail).toContainText("azuchijo:evidence:omi-port");
  await expect(detail).toContainText("azuchijo:evidence:omi-port-shape");
});

test("shows the estimated Azuchi castle-town settlement separately from territories", async ({ page }) => {
  await page.goto("/?dataset=azuchijo&year=1576");
  const settlement = page.locator('[data-feature-id="azuchijo:version:azuchi-settlement-1576"]');
  await expect(settlement).toBeVisible();
  await expect(settlement).toContainText(/城下町|settlement/);
  await settlement.click();
  const detail = page.locator("#panel-detail");
  await expect(detail).toContainText(/集落|Settlement/);
  await expect(detail).toContainText(/推定|approximate/);
  await expect(detail).toContainText("azuchijo:evidence:omi-settlement");
  await expect(detail).toContainText("azuchijo:evidence:omi-settlement-shape");
});

test("shows the Shizugatake battlefield as an approximate historical point", async ({ page }) => {
  await page.goto("/?dataset=azuchijo&year=1583");
  const battlefield = page.locator('[data-feature-id="azuchijo:version:shizugatake-battlefield-1583"]');
  await expect(battlefield).toBeVisible();
  await expect(battlefield).toContainText(/賤ヶ岳古戦場|Shizugatake battlefield/);
  await battlefield.click();
  const detail = page.locator("#panel-detail");
  await expect(detail).toContainText(/古戦場|Battlefield/);
  await expect(detail).toContainText(/1583/);
  await expect(detail).toContainText(/概略|approximate/);
  await expect(detail).toContainText("azuchijo:evidence:shizugatake");
  await expect(detail).toContainText("azuchijo:evidence:shizugatake-shape");
});

test("shows Yogo Lake as an approximate waterbody context", async ({ page }) => {
  await page.goto("/?dataset=azuchijo&year=1583");
  const lake = page.locator('[data-feature-id="azuchijo:version:yogo-lake-1576"]');
  await expect(lake).toBeVisible();
  await expect(lake).toContainText(/余呉湖|Yogo Lake/);
  await lake.click();
  const detail = page.locator("#panel-detail");
  await expect(detail).toContainText(/水域|Waterbody/);
  await expect(detail).toContainText(/歴史的な湖岸線|historical shoreline/);
  await expect(detail).toContainText("azuchijo:evidence:yogo-lake");
  await expect(detail).toContainText("azuchijo:evidence:yogo-lake-shape");
});
