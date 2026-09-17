import { expect, test } from "@playwright/test";

const lessons = [
  { slug: "ogurike", lesson: "ogurike-intro" },
  { slug: "tonegawa", lesson: "tonegawa-eastward" },
  { slug: "heijokyo", lesson: "heijokyo-intro" },
] as const;

for (const dataset of lessons) {
  test(`customizes ${dataset.slug} into a classroom pack`, async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.print = () => { document.body.dataset.printCalled = "true"; };
    });
    await page.goto(`/?dataset=${dataset.slug}&lesson=${dataset.lesson}&view=builder`);
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);

    const builder = page.locator("[data-lesson-pack-builder]");
    await expect(builder).toBeVisible();
    await expect(builder.locator("[data-lesson-pack-builder-note]")).toContainText(/再読み込み|reload/i);
    await builder.locator("[data-lesson-pack-title]").fill(`${dataset.slug} 授業用教材`);
    await builder.locator("[data-lesson-pack-class-label]").fill("中学2年A組");
    const prompts = builder.locator("[data-lesson-pack-prompt]");
    await prompts.last().fill("この時点の地図から、変化を一文で説明しよう。");
    await builder.locator("[data-lesson-pack-step-select]").first().uncheck();
    await builder.locator("[data-lesson-pack-include-teacher]").uncheck();
    await page.screenshot({ path: testInfo.outputPath(`${dataset.slug}-builder.png`), fullPage: true });

    await builder.locator("[data-lesson-pack-builder-preview]").click();
    const pack = page.locator("[data-lesson-pack-dialog]");
    await expect(pack).toBeVisible();
    await expect(pack).toContainText(`${dataset.slug} 授業用教材`);
    await expect(pack.locator("[data-lesson-pack-class-label]")).toContainText("中学2年A組");
    await expect(pack).toContainText("この時点の地図から、変化を一文で説明しよう。");
    expect(await pack.locator("[data-lesson-pack-student] .lesson-pack-step").count()).toBe(await builder.locator("[data-lesson-pack-step-select]").count() - 1);
    await expect(pack.locator("[data-lesson-pack-teacher]")).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`${dataset.slug}-preview.png`), fullPage: true });

    await pack.locator("[data-lesson-pack-print]").click();
    await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
    await expect(page.locator("body")).toHaveAttribute("data-print-document", "lesson-pack");
    await page.emulateMedia({ media: "print" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: testInfo.outputPath(`${dataset.slug}-print.png`), fullPage: true });
    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));

    await pack.locator("[data-lesson-pack-back]").click();
    await expect(builder).toBeVisible();
    await expect(builder.locator("[data-lesson-pack-title]")).toHaveValue(`${dataset.slug} 授業用教材`);
    await page.reload();
    await expect(page.locator("[data-lesson-pack-builder]")).toBeVisible();
    await expect(page.locator("[data-lesson-pack-title]")).not.toHaveValue(`${dataset.slug} 授業用教材`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
}
