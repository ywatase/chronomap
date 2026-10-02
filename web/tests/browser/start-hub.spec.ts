import { expect, test } from "@playwright/test";

test("shows the historical map first with one primary and one secondary action", async ({ page }, testInfo) => {
  await page.goto("/");
  const quickStart = page.locator("aside[data-root-quickstart]");
  await expect(quickStart).toBeVisible();
  await expect(page.locator("[data-dataset-catalog-dialog]")).toBeHidden();
  await expect(page.locator("[data-map-host]")).toBeVisible();
  await expect(quickStart.locator("[data-root-quickstart-primary]")).toContainText(/巨椋池の変化を見る|See Ogurike change/i);
  await expect(quickStart.locator("[data-root-quickstart-secondary]")).toContainText(/地域を選ぶ|Choose a region/i);
  await expect(quickStart.locator("a,button")).toHaveCount(2);
  const mapTop = await page.locator("[data-map-host]").evaluate((element) => element.getBoundingClientRect().top);
  expect(mapTop).toBeLessThan(testInfo.project.name === "mobile-chromium" ? 520 : 620);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("separates explore, build, and local draft resume at the root", async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto("/");
  await page.locator("aside[data-root-quickstart] [data-root-quickstart-secondary]").click();
  const hub = page.locator("[data-dataset-catalog-purpose-hub]");
  await expect(hub).toBeVisible();
  await expect(hub).toContainText(/調べる|Explore the map/);
  await expect(hub).toContainText(/教材を作る|Make a classroom pack/);
  await expect(hub).toContainText(/下書きを再開|Resume a draft/);
  await expect(hub).toContainText(/現在の収録範囲|Coverage/);
  await expect(hub).toContainText(/教員向け価値検証中|teacher value/);
  const build = hub.locator("[data-dataset-catalog-purpose-build]");
  await expect(build).toBeVisible();

  await hub.locator("[data-dataset-catalog-purpose-explore]").click();
  await expect(page.locator("#dataset-catalog-cards")).toBeFocused();
  expect(page.url()).not.toContain("#dataset-catalog-cards");

  const content = JSON.stringify({
    schemaVersion: 1,
    dataset: "heijokyo",
    lesson: "heijokyo-intro",
    customization: {
      title: "再開する平城京教材",
      classLabel: "中学1年",
      selectedStepIds: ["capital-710"],
      promptsByStepId: { "capital-710": "保存した問い" },
      includeTeacher: false,
    },
  });
  await hub.locator("[data-dataset-catalog-purpose-draft-file]").setInputFiles({ name: "heijokyo-draft.json", mimeType: "application/json", buffer: Buffer.from(content) });
  await expect(page.locator("[data-lesson-pack-builder]")).toBeVisible();
  await expect(page.locator("[data-lesson-pack-title]")).toBeFocused();
  await expect.poll(() => {
    const url = new URL(page.url());
    return [url.searchParams.get("dataset"), url.searchParams.get("lesson"), url.searchParams.get("view")].join("|");
  }).toBe("heijokyo|heijokyo-intro|builder");
  await expect(page.locator("[data-lesson-pack-title]")).toHaveValue("再開する平城京教材");
  await expect(page.locator("[data-lesson-pack-class-label]")).toHaveValue("中学1年");
  await expect(page.locator("[data-lesson-pack-step-select]").first()).toBeChecked();
  await expect(page.locator("[data-lesson-pack-step-select]").nth(1)).not.toBeChecked();
  await expect(page.locator("[data-lesson-pack-prompt]").first()).toHaveValue("保存した問い");
  await expect(page.locator("[data-lesson-pack-include-teacher]")).not.toBeChecked();
  expect(page.url()).not.toContain("再開する");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("surfaces the public evidence audit before opening a region map", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.locator("aside[data-root-quickstart] [data-root-quickstart-secondary]").click();
  const cards = page.locator("[data-dataset-catalog-card]");
  await expect(cards).toHaveCount(4);
  for (const slug of ["ogurike", "tonegawa", "heijokyo", "azuchijo"]) {
    const card = page.locator(`[data-dataset-catalog-card="${slug}"]`);
    await expect(card.locator("[data-dataset-catalog-audit]")).toBeVisible();
    await expect(card.locator("[data-dataset-catalog-audit]")).toContainText(/公開監査済み|Public audit ready/);
    await expect(card.locator("[data-dataset-catalog-audit-link]")).toHaveAttribute("href", new RegExp(`dataset=${slug}`));
  }
  await page.screenshot({ path: testInfo.outputPath("catalog-audit-status.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("keeps the root hub when a malformed draft is selected", async ({ page }) => {
  await page.goto("/");
  await page.locator("aside[data-root-quickstart] [data-root-quickstart-secondary]").click();
  const hub = page.locator("[data-dataset-catalog-purpose-hub]");
  await hub.locator("[data-dataset-catalog-purpose-draft-file]").setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from("not json") });
  await expect(hub).toBeVisible();
  await expect(hub.locator("[data-dataset-catalog-purpose-status]")).toContainText(/下書きを読み込めませんでした|Could not load this draft/);
  expect(page.url()).not.toContain("invalid.json");
});

test("carries an adoption path from the catalog into the consultation handoff", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => { document.body.dataset.printCalled = "true"; };
  });
  await page.goto("/");
  await page.locator("aside[data-root-quickstart] [data-root-quickstart-secondary]").click();
  const offers = page.locator("[data-dataset-catalog-offers]");
  await expect(offers).toBeVisible();
  await expect(offers.locator("[data-dataset-catalog-offer]")).toHaveCount(3);
  await expect(offers.locator("[data-dataset-catalog-offer=classroom-pilot] [data-dataset-catalog-offer-price]")).toContainText(/¥49,800|49,800/);
  await expect(offers.locator("[data-dataset-catalog-offer=custom-region] [data-dataset-catalog-offer-price]")).toContainText(/¥198,000|198,000/);
  await expect(offers.locator("[data-dataset-catalog-offer=custom-region]")).toContainText(/地域教材の個別制作|Custom regional production/);
  await expect(offers.locator("[data-dataset-catalog-offer=free-explore] [data-dataset-catalog-offer-output]")).toHaveCount(3);
  await expect(offers.locator("[data-dataset-catalog-offer=classroom-pilot] [data-dataset-catalog-offer-output]")).toHaveCount(3);
  await expect(offers.locator("[data-dataset-catalog-offer=custom-region]")).toContainText(/希望地域・題材の出典整理|Region\/topic source curation/);
  const process = offers.locator("[data-dataset-catalog-process]");
  await expect(process).toBeVisible();
  await expect(process.locator("[data-dataset-catalog-process-step]")).toHaveCount(3);
  await expect(process).toContainText(/範囲・価格・納期|scope, price, and delivery/);
  await offers.locator("[data-dataset-catalog-offer=custom-region] [data-dataset-catalog-offer-link]").click();
  await expect.poll(() => new URL(page.url()).searchParams.get("offer")).toBe("custom-region");
  const builder = page.locator("[data-lesson-pack-builder]");
  await expect(builder).toBeVisible();
  await expect(builder.locator("[data-lesson-pack-builder-offer]")).toContainText(/地域教材の個別制作|Custom regional production/);
  await expect(builder.locator("[data-lesson-pack-builder-offer]")).toContainText(/¥198,000|198,000/);
  await builder.locator("[data-lesson-pack-builder-preview]").click();
  const pack = page.locator("[data-lesson-pack-dialog]");
  await pack.locator("[data-lesson-pack-print-student]").click();
  const feedback = pack.locator("[data-lesson-pack-feedback-host]");
  await feedback.locator('input[name="utilization"][value="近いうちに使いたい"]').check();
  await feedback.locator('input[name="nextFeature"][value="自分の地域・題材を追加"]').check();
  await feedback.locator('input[name="pilot-route"][value="consult"]').check();
  await feedback.locator('input[name="pilot-budget"][value="地域・内容・条件が合えば検討したい"]').check();
  await feedback.locator("[data-lesson-pack-pilot-form]").locator("button[type=submit]").click();
  await expect(feedback.locator("[data-lesson-pack-pilot-answer]")).toHaveValue(/導入プラン: 地域教材の個別制作|Offer path: Custom regional lesson production/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
