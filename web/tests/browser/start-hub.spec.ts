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
  await expect(cards).toHaveCount(7);
  for (const slug of ["ogurike", "tonegawa", "heijokyo", "azuchijo", "kinugawa", "osaka", "sekigahara"]) {
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

test("keeps education optional and prices out of the catalog", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.locator("aside[data-root-quickstart] [data-root-quickstart-secondary]").click();
  await expect(page.locator("[data-dataset-catalog-offers]")).toHaveCount(0);
  await expect(page.locator("[data-dataset-catalog-lesson-mode]")).toContainText(/教材モード（任意）|Optional guided lesson/);
  await expect(page.locator("body")).not.toContainText("¥198,000");
  await expect(page.locator("body")).not.toContainText("¥49,800");
  await page.screenshot({ path: testInfo.outputPath("catalog-viewer-first.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("opens a guided lesson only from an explicit lesson URL", async ({ page }) => {
  await page.goto("/?dataset=ogurike&lesson=ogurike-intro&step=uji-1590");
  await expect(page.locator("[data-lesson-progress]")).toContainText(/1\/4|1 of 4/);
  await expect(page.locator("[data-viewer-mode]")).toContainText(/ビューアー|Viewer/);
  await expect(page.locator("body")).not.toContainText("¥198,000");
  await expect(page.locator("body")).not.toContainText("¥49,800");
});
