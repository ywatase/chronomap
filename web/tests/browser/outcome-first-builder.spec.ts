import { expect, test, type Page } from "@playwright/test";

async function openBuilder(page: Page): Promise<void> {
  await page.goto("/?dataset=heijokyo&lesson=heijokyo-intro&view=builder");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await expect(page.locator("[data-lesson-pack-builder]")).toBeVisible();
}

test.describe("outcome-first classroom builder", () => {
  test("shows the finished outcome above the fold and reaches the existing pack in one click", async ({ page }, testInfo) => {
    await openBuilder(page);
    const builder = page.locator("[data-lesson-pack-builder]");
    const summary = builder.locator("[data-lesson-pack-builder-summary]");
    const totalSteps = await builder.locator("[data-lesson-pack-step-select]").count();
    await expect(summary).toBeVisible();
    await expect(summary.locator("[data-lesson-pack-summary-count]")).toContainText(`${totalSteps}`);
    await expect(summary.locator('[data-lesson-pack-summary-output="student"]')).toBeVisible();
    await expect(summary.locator('[data-lesson-pack-summary-output="teacher"]')).toBeVisible();
    await expect(summary.locator('[data-lesson-pack-summary-output="sources"]')).toBeVisible();
    await expect(summary.locator('[data-lesson-pack-summary-output="links"]')).toBeVisible();
    await expect(summary.locator('[data-lesson-pack-summary-output="print"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    const summaryBox = await summary.boundingBox();
    expect(summaryBox).not.toBeNull();
    expect(summaryBox!.y).toBeGreaterThanOrEqual(0);
    expect(summaryBox!.y + summaryBox!.height).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));
    await page.screenshot({ path: testInfo.outputPath("outcome-summary.png"), fullPage: false });

    await summary.locator("[data-lesson-pack-builder-summary-cta]").first().click();
    const pack = page.locator("[data-lesson-pack-dialog]");
    await expect(pack).toBeVisible();
    await expect(pack.locator("[data-lesson-pack-student]")).toBeVisible();
    await expect(pack.locator("[data-lesson-pack-teacher]")).toBeVisible();
    await expect(pack.locator("[data-lesson-pack-sources]")).toBeVisible();
    await expect(pack.locator("[data-lesson-pack-qr]")).toHaveCount(1);
    await expect(pack.locator("[data-lesson-pack-print]")).toBeVisible();
  });

  test("updates output facts live, rejects zero steps, and recovers focus", async ({ page }) => {
    await openBuilder(page);
    const builder = page.locator("[data-lesson-pack-builder]");
    const summary = builder.locator("[data-lesson-pack-builder-summary]");
    const steps = builder.locator("[data-lesson-pack-step-select]");
    const totalSteps = await steps.count();
    await steps.first().uncheck();
    await expect(summary.locator("[data-lesson-pack-summary-count]")).toContainText(`${totalSteps - 1}`);
    await builder.locator("[data-lesson-pack-include-teacher]").uncheck();
    await expect(summary.locator('[data-lesson-pack-summary-output="teacher"]')).toHaveCount(0);
    await expect(summary.locator('[data-lesson-pack-summary-output="sources"]')).toHaveCount(0);

    for (const checkbox of await steps.all()) await checkbox.uncheck();
    await expect(summary).toHaveAttribute("data-state", "invalid");
    await summary.locator("[data-lesson-pack-builder-summary-cta]").first().click();
    await expect(builder.locator("[data-lesson-pack-builder-status]")).toHaveAttribute("role", "alert");
    await expect(builder.locator("[data-lesson-pack-builder-steps]")).toBeFocused();
    await steps.first().check();
    await expect(summary).toHaveAttribute("data-state", "editing");
    await summary.locator("[data-lesson-pack-builder-summary-cta]").first().click();
    await expect(page.locator("[data-lesson-pack-dialog]")).toBeVisible();
    await expect(page.locator("[data-lesson-pack-dialog] [data-lesson-pack-teacher]")).toHaveCount(0);
  });

  test("keeps the mobile bottom action safe while the form scrolls", async ({ page }) => {
    await openBuilder(page);
    const action = page.locator("[data-lesson-pack-builder-mobile-preview]").locator("..");
    const position = await page.locator("[data-lesson-pack-builder-mobile-preview]").evaluate((element) => getComputedStyle(element.parentElement!).position);
    if (await page.evaluate(() => window.innerWidth < 768)) {
      expect(position).toBe("fixed");
      const bar = await action.boundingBox();
      expect(bar).not.toBeNull();
      expect(bar!.y + bar!.height).toBeGreaterThanOrEqual(await page.evaluate(() => window.innerHeight - 2));
      await page.locator("[data-lesson-pack-prompt]").last().scrollIntoViewIfNeeded();
      const inputBox = await page.locator("[data-lesson-pack-prompt]").last().boundingBox();
      const updatedBar = await action.boundingBox();
      expect(inputBox).not.toBeNull();
      expect(updatedBar).not.toBeNull();
      expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(updatedBar!.y);
    } else {
      expect(position).toBe("static");
    }
  });
});
