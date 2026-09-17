import { expect, test } from "@playwright/test";

test.describe("guided Ogurike lesson", () => {
  test("moves through the four steps and keeps the lesson share URL restorable", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);

    const launch = page.getByRole("button", { name: /ガイド教材を始める|Start guided lesson/ });
    await expect(launch).toBeVisible();
    await launch.click();
    await expect(page.locator("[data-lesson-progress]")).toHaveText(/1\/4|1 of 4/);
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1590");
    expect(page.url()).toContain("lesson=ogurike-intro");
    expect(page.url()).toContain("step=uji-1590");
    await page.screenshot({ path: testInfo.outputPath("lesson-start.png"), fullPage: true });

    await page.locator("[data-lesson-next]").click();
    await expect(page.locator("[data-lesson-progress]")).toHaveText(/2\/4|2 of 4/);
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1596");
    await expect(page.locator("[data-comparison-card]")).toBeVisible();
    expect(page.url()).toContain("step=uji-1596");
    await page.screenshot({ path: testInfo.outputPath("lesson-comparison.png"), fullPage: true });

    await page.locator("[data-lesson-next]").click();
    await expect(page.locator("[data-lesson-progress]")).toHaveText(/3\/4|3 of 4/);
    await page.locator("[data-lesson-next]").click();
    await expect(page.locator("[data-lesson-progress]")).toHaveText(/4\/4|4 of 4/);
    await expect(page.locator("[data-lesson-share]")).toBeVisible();
    await expect(page.locator("[data-lesson-report]")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("lesson-complete.png"), fullPage: true });

    await page.locator("[data-lesson-report]").click();
    await expect(page.locator("[data-report-dialog]")).toBeVisible();
    await page.reload();
    await expect(page.locator("[data-lesson-progress]")).toHaveText(/4\/4|4 of 4/);
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1942");
    expect(page.url()).toContain("step=monument-1942");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });

  test("ignores an invalid lesson step and keeps the normal historical view", async ({ page }) => {
    await page.goto("/?dataset=ogurike&lesson=ogurike-intro&step=missing&year=1910");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await expect(page.locator("[data-lesson-progress]")).toHaveCount(0);
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1910");
    expect(page.url()).not.toContain("lesson=ogurike-intro");
  });
});
