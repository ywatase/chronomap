import { expect, test } from "@playwright/test";

const lessons = [
  { slug: "ogurike", lesson: "ogurike-intro" },
  { slug: "tonegawa", lesson: "tonegawa-eastward" },
  { slug: "heijokyo", lesson: "heijokyo-intro" },
] as const;

for (const lesson of lessons) {
  test(`prints ${lesson.slug} by recipient scope without leaking sections`, async ({ page }, testInfo) => {
    test.setTimeout(45_000);
    await page.addInitScript(() => { window.print = () => { document.body.dataset.printCalled = "true"; }; });
    await page.goto(`/?dataset=${lesson.slug}&lesson=${lesson.lesson}&view=pack`);
    const pack = page.locator("[data-lesson-pack-dialog]");
    await expect(pack).toBeVisible();
    const toolbar = pack.locator("[data-lesson-pack-actions]");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    for (const button of await toolbar.locator("button").all()) {
      expect(await button.evaluate((element) => element.getBoundingClientRect().height >= 44)).toBeTruthy();
    }
    await page.screenshot({ path: testInfo.outputPath(`${lesson.slug}-toolbar.png`), fullPage: false });

    const student = pack.locator("[data-lesson-pack-student]");
    const teacher = pack.locator("[data-lesson-pack-teacher]");
    const sources = pack.locator("[data-lesson-pack-sources]");
    for (const scope of ["student", "teacher", "full"] as const) {
      await page.emulateMedia({ media: "screen" });
      await pack.locator(`[data-lesson-pack-print-${scope}]`).click();
      await expect(page.locator("body")).toHaveAttribute("data-print-document", "lesson-pack");
      await expect(page.locator("body")).toHaveAttribute("data-lesson-pack-print-scope", scope);
      await page.emulateMedia({ media: "print" });
      if (scope === "student") {
        await expect(student).toBeVisible();
        await expect(teacher).toBeHidden();
        await expect(sources).toBeHidden();
        await expect(student.locator("[data-lesson-pack-student-rights]")).toBeVisible();
        await expect(student).not.toContainText(/読み取り例|Reading example/);
        await page.screenshot({ path: testInfo.outputPath(`${lesson.slug}-student-print.png`), fullPage: true });
      } else if (scope === "teacher") {
        await expect(student).toBeHidden();
        await expect(teacher).toBeVisible();
        await expect(sources).toBeVisible();
        await expect(teacher.locator("[data-lesson-pack-reading-example]").first()).toBeVisible();
        await expect(student.locator("[data-lesson-pack-qr]")).toBeHidden();
        await page.screenshot({ path: testInfo.outputPath(`${lesson.slug}-teacher-print.png`), fullPage: true });
      } else {
        await expect(student).toBeVisible();
        await expect(teacher).toBeVisible();
        await expect(sources).toBeVisible();
      }
      await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
      await expect.poll(() => page.evaluate(() => [document.body.dataset.printDocument, document.body.dataset.lessonPackPrintScope])).toEqual([undefined, undefined]);
    }
    await page.emulateMedia({ media: "screen" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
}

test("keeps student and full print controls when teacher material is disabled", async ({ page }) => {
  await page.addInitScript(() => { window.print = () => undefined; });
  await page.goto("/?dataset=heijokyo&lesson=heijokyo-intro&view=builder");
  const builder = page.locator("[data-lesson-pack-builder]");
  await expect(builder).toBeVisible();
  await builder.locator("[data-lesson-pack-include-teacher]").uncheck();
  await builder.locator("[data-lesson-pack-builder-preview]").click();
  const pack = page.locator("[data-lesson-pack-dialog]");
  await expect(pack.locator("[data-lesson-pack-print-teacher]")).toHaveCount(0);
  await expect(pack.locator("[data-lesson-pack-print-student]")).toHaveCount(1);
  await expect(pack.locator("[data-lesson-pack-print-full]")).toHaveCount(1);
  await pack.locator("[data-lesson-pack-print-full]").click();
  await expect(page.locator("body")).toHaveAttribute("data-lesson-pack-print-scope", "full");
  await page.emulateMedia({ media: "print" });
  await expect(pack.locator("[data-lesson-pack-student]")).toBeVisible();
  await expect(pack.locator("[data-lesson-pack-sources]")).toBeVisible();
  await expect(pack.locator("[data-lesson-pack-teacher]")).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect.poll(() => page.evaluate(() => document.body.dataset.lessonPackPrintScope)).toBeUndefined();
  await page.emulateMedia({ media: "screen" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
