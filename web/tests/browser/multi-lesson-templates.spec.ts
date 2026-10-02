import { expect, test } from "@playwright/test";

test("shows purpose-specific lesson rows while keeping one map route", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.locator("aside[data-root-quickstart] [data-root-quickstart-secondary]").click();
  const catalog = page.locator("[data-dataset-catalog-dialog]");
  await expect(catalog).toBeVisible();
  const card = catalog.locator('[data-dataset-catalog-card="ogurike"]');
  await expect(card.locator("[data-dataset-catalog-lesson-row]")).toHaveCount(2);
  await expect(card.locator('[data-dataset-catalog-lesson-row="ogurike-intro"]')).toContainText(/15分|15 min/);
  await expect(card.locator('[data-dataset-catalog-lesson-row="ogurike-river-compare"]')).toContainText(/8分|8 min/);
  await expect(card.locator('[data-dataset-catalog-lesson-row="ogurike-intro"] [data-dataset-catalog-lesson-guide]')).toContainText(/利用の目安|Teaching fit/);
  await expect(card.locator('[data-dataset-catalog-lesson-row="ogurike-river-compare"] [data-dataset-catalog-lesson-goal]')).toContainText(/学習のねらい|Learning goal/);
  await expect(card.locator("[data-dataset-catalog-map]")).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("multi-lesson-catalog.png"), fullPage: true });
});

test("opens the registered Ogurike comparison lesson through pack and QR links", async ({ page }, testInfo) => {
  await page.goto("/?dataset=ogurike&lesson=ogurike-river-compare&view=pack");
  const pack = page.locator("[data-lesson-pack-dialog]");
  await expect(pack).toBeVisible();
  await expect(pack).toContainText(/宇治川の流路変化を比べる|Compare Ujigawa channel changes/);
  await expect(pack.locator("[data-lesson-pack-student] .lesson-pack-step")).toHaveCount(2);
  await expect(pack.locator("[data-lesson-pack-qr]")).toHaveAttribute("aria-label", /QR|教材|lesson/i);
  await expect(pack.locator("[data-lesson-pack-start-url]")).toHaveAttribute("href", /lesson=ogurike-river-compare/);
  await expect(pack.locator("[data-lesson-pack-teaching-guide]")).toHaveCount(1);
  await expect(pack.locator("[data-lesson-pack-teacher] [data-lesson-pack-teaching-guide]")).toContainText(/授業設計メモ|Teaching guide/);
  await page.screenshot({ path: testInfo.outputPath("ogurike-river-compare-pack.png"), fullPage: true });
});

test("rejects an unregistered lesson without arbitrary fetch or workshop state", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/?dataset=ogurike&lesson=not-registered&view=builder");
  await expect(page.locator("[data-lesson-pack-builder]")).toHaveCount(0);
  await expect(page.locator("[data-lesson-pack-dialog]")).toHaveCount(0);
  await expect(page).not.toHaveURL(/lesson=not-registered|view=builder/);
  expect(requests.some((url) => url.includes("/lessons/not-registered"))).toBe(false);
});

test("isolates a failed comparison manifest while retaining the featured lesson and map", async ({ page }) => {
  await page.route("**/lessons/ogurike-river-compare.json", (route) => route.fulfill({ status: 404, body: "missing" }));
  await page.goto("/?dataset=ogurike&view=catalog");
  const card = page.locator('[data-dataset-catalog-card="ogurike"]');
  await expect(card.locator('[data-dataset-catalog-lesson-row="ogurike-intro"] [data-dataset-catalog-builder]')).toHaveCount(1);
  await expect(card.locator('[data-dataset-catalog-lesson-row="ogurike-river-compare"]')).toContainText(/利用できません|not published|ガイド教材/);
  await expect(card.locator("[data-dataset-catalog-map]")).toHaveCount(1);
});
