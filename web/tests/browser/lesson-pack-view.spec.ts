import { expect, test, type Page } from "@playwright/test";

async function completeLesson(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await page.getByRole("button", { name: /ガイド教材を始める|Start guided lesson/ }).click();
  for (let index = 0; index < 3; index += 1) await page.locator("[data-lesson-next]").click();
  await expect(page.locator("[data-lesson-pack-open]")).toBeVisible();
}

test.describe("classroom lesson pack", () => {
  test("opens a three-section pack, prints it, and restores focus", async ({ page }, testInfo) => {
    await page.addInitScript(() => { window.print = () => { document.body.dataset.printCalled = "true"; }; });
    await completeLesson(page);
    const trigger = page.locator("[data-lesson-pack-open]");
    await trigger.click();
    const dialog = page.locator("[data-lesson-pack-dialog]");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-lesson-pack-student]")).toContainText(/生徒用ワークシート|Student worksheet/);
    await expect(dialog.locator("[data-lesson-pack-teacher]")).toContainText(/教員用参照資料|Teacher reference/);
    await expect(dialog.locator("[data-lesson-pack-sources]")).toContainText(/出典・権利|Sources and rights/);
    await expect(dialog).toContainText(/β版では無料|Free during beta/);
    await expect(dialog.locator("a.lesson-pack-url")).toHaveCount(9);
    await expect(dialog).not.toContainText(/PRIVATE_SOURCE_BODY|秘密の原資料本文/);
    await expect(dialog).toContainText(/原資料の本文・画像・碑文は転載していません|no source body, image, or inscription is reproduced/i);
    await page.screenshot({ path: testInfo.outputPath("lesson-pack-preview.png"), fullPage: true });

    await dialog.locator("[data-lesson-pack-print]").click();
    await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
    await expect(page.locator("body")).toHaveAttribute("data-print-document", "lesson-pack");
    await page.emulateMedia({ media: "print" });
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: testInfo.outputPath("lesson-pack-print.png"), fullPage: true });
    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await dialog.locator("[data-lesson-pack-close]").click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("still creates the pack when the basemap is unavailable", async ({ page }) => {
    await page.route(/(?:cyberjapandata|maps)\.gsi\.go\.jp/, (route) => route.abort());
    await completeLesson(page);
    await page.locator("[data-lesson-pack-open]").click();
    await expect(page.locator("[data-lesson-pack-dialog]")).toContainText(/授業用教材パック|classroom pack/);
    await expect(page.locator("[data-lesson-pack-dialog]")).toContainText(/引用メタデータのみ|Citation-only metadata/);
  });
});
