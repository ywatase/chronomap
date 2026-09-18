import { expect, test } from "@playwright/test";

const lessons = [
  { slug: "ogurike", lesson: "ogurike-intro" },
  { slug: "tonegawa", lesson: "tonegawa-eastward" },
  { slug: "heijokyo", lesson: "heijokyo-intro" },
] as const;

for (const dataset of lessons) {
  test(`round-trips a portable ${dataset.slug} draft`, async ({ page }, testInfo) => {
    test.setTimeout(45_000);
    await page.addInitScript(() => {
      window.print = () => { document.body.dataset.printCalled = "true"; };
    });
    await page.goto(`/?dataset=${dataset.slug}&lesson=${dataset.lesson}&view=builder`);
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);

    const builder = page.locator("[data-lesson-pack-builder]");
    await expect(builder).toBeVisible();
    await builder.locator("[data-lesson-pack-title]").fill(`${dataset.slug} 持ち運び教材`);
    await builder.locator("[data-lesson-pack-class-label]").fill("中学2年A組");
    await builder.locator("[data-lesson-pack-prompt]").last().fill("保存して戻せる問い");
    await builder.locator("[data-lesson-pack-step-select]").first().uncheck();
    await builder.locator("[data-lesson-pack-include-teacher]").uncheck();

    const downloadPromise = page.waitForEvent("download");
    await builder.locator("[data-lesson-pack-draft-save]").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`chronomap-${dataset.slug}-${dataset.lesson}-draft.json`);
    const draftPath = await download.path();
    expect(draftPath).toBeTruthy();

    await page.reload();
    await expect(page.locator("[data-lesson-pack-builder]")).toBeVisible();
    const reloadedBuilder = page.locator("[data-lesson-pack-builder]");
    await expect(reloadedBuilder.locator("[data-lesson-pack-title]")).not.toHaveValue(`${dataset.slug} 持ち運び教材`);
    await reloadedBuilder.locator("[data-lesson-pack-draft-file]").setInputFiles(draftPath!);
    await expect(reloadedBuilder.locator("[data-lesson-pack-draft-status]")).toHaveText("下書きを読み込みました。内容を確認してプレビューしてください。");
    await expect(reloadedBuilder.locator("[data-lesson-pack-title]")).toHaveValue(`${dataset.slug} 持ち運び教材`);
    await expect(reloadedBuilder.locator("[data-lesson-pack-class-label]")).toHaveValue("中学2年A組");
    await expect(reloadedBuilder.locator("[data-lesson-pack-step-select]").first()).not.toBeChecked();
    await expect(reloadedBuilder.locator("[data-lesson-pack-step-select]").nth(1)).toBeChecked();
    await expect(reloadedBuilder.locator("[data-lesson-pack-prompt]").last()).toHaveValue("保存して戻せる問い");
    await expect(reloadedBuilder.locator("[data-lesson-pack-include-teacher]")).not.toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

    await reloadedBuilder.locator("[data-lesson-pack-builder-preview]").click();
    const pack = page.locator("[data-lesson-pack-dialog]");
    await expect(pack).toBeVisible();
    await expect(pack).toContainText("保存して戻せる問い");
    await pack.locator("[data-lesson-pack-print]").click();
    await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
    await page.emulateMedia({ media: "print" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: testInfo.outputPath(`${dataset.slug}-draft-print.png`), fullPage: true });
  });
}
