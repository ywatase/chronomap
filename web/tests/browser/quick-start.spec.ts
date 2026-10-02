import { expect, test } from "@playwright/test";

test("turns the root map-first welcome into a pack preview and classroom editor path", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.print = () => { document.body.dataset.printCalled = "true"; };
  });
  await page.goto("/");

  const catalog = page.locator("[data-dataset-catalog-dialog]");
  await expect(page.locator("aside[data-root-quickstart]")).toBeVisible();
  await expect(catalog).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("root-map-first.png"), fullPage: true });
  await page.locator("aside[data-root-quickstart] [data-root-quickstart-secondary]").click();
  await expect(catalog).toBeVisible();
  const welcome = catalog.locator("[data-dataset-catalog-welcome]");
  await expect(welcome).toContainText(/根拠付きワークシート|evidence-backed worksheet/i);
  const hero = catalog.locator("[data-dataset-catalog-hero]");
  await expect(hero).toBeVisible();
  await expect(hero.locator("[data-dataset-catalog-hero-proof]")).toHaveCount(3);
  await expect(hero.locator("[data-dataset-catalog-hero-trust]")).toContainText(/登録・決済不要|no account or payment/i);
  await expect(hero.locator("[data-dataset-catalog-hero-primary]")).toBeVisible();
  await expect(hero.locator("[data-dataset-catalog-hero-secondary]")).toContainText(/まず地図を調べる|Explore the map first/i);
  await expect(catalog.locator("[data-dataset-catalog-step]")).toHaveCount(3);
  const featuredPack = catalog.locator("[data-dataset-catalog-featured-pack]");
  await expect(featuredPack).toContainText(/完成見本を見る|See the finished example/i);
  expect(await featuredPack.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  })).toBeTruthy();
  await expect(page).toHaveURL(/view=catalog/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

  await catalog.locator("[data-dataset-catalog-featured-pack]").click();
  const pack = page.locator("[data-lesson-pack-dialog]");
  await expect(pack).toBeVisible();
  await expect.poll(() => {
    const url = new URL(page.url());
    return [url.searchParams.get("dataset"), url.searchParams.get("lesson"), url.searchParams.get("view")].join("|");
  }).toBe("ogurike|ogurike-intro|pack");
  await expect(pack.locator("[data-lesson-pack-qr]")).toHaveCount(1);
  await expect(pack.locator("[data-lesson-pack-print]")).toBeVisible();
  await expect(pack.locator("[data-lesson-pack-back]")).toBeVisible();

  await page.reload();
  await expect(page.locator("[data-lesson-pack-dialog]")).toBeVisible();
  await expect(page.locator("[data-lesson-pack-qr]")).toHaveCount(1);

  await page.locator("[data-lesson-pack-back]").click();
  const builder = page.locator("[data-lesson-pack-builder]");
  await expect(builder).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get("view")).toBe("builder");
  await builder.locator("[data-lesson-pack-builder-preview]").click();
  await expect(page.locator("[data-lesson-pack-dialog]")).toBeVisible();
  await page.locator("[data-lesson-pack-print]").click();
  await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
  await expect(page.locator("[data-lesson-pack-feedback-host]")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

  await page.reload();
  await expect(page.locator("[data-lesson-pack-builder]")).toBeVisible();
  await expect(page.locator("[data-lesson-pack-dialog]")).toBeHidden();
});

test("keeps the map-first hierarchy calm and touchable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const quickStart = page.locator("aside[data-root-quickstart]");
  await expect(quickStart).toBeVisible();
  await expect.poll(() => quickStart.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  const targets = await quickStart.locator("a,button").evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().height)));
  expect(targets.every((height) => height >= 44)).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
