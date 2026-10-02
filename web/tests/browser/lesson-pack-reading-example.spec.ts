import { expect, test } from "@playwright/test";

const lessons = [
  { slug: "ogurike", lesson: "ogurike-intro", steps: 4 },
  { slug: "ogurike", lesson: "ogurike-river-compare", steps: 2 },
  { slug: "tonegawa", lesson: "tonegawa-eastward", steps: 3 },
  { slug: "heijokyo", lesson: "heijokyo-intro", steps: 3 },
  { slug: "azuchijo", lesson: "azuchijo-intro", steps: 5 },
] as const;

for (const lesson of lessons) {
  test(`shows ${lesson.slug} ${lesson.lesson} reading examples only in the teacher page`, async ({ page }) => {
    await page.goto(`/?dataset=${lesson.slug}&lesson=${lesson.lesson}&view=pack`);
    const dialog = page.locator("[data-lesson-pack-dialog]");
    await expect(dialog).toBeVisible();
    const teacher = dialog.locator("[data-lesson-pack-teacher]");
    const student = dialog.locator("[data-lesson-pack-student]");
    await expect(teacher.locator("[data-lesson-pack-reading-example]")).toHaveCount(lesson.steps);
    await expect(teacher.locator("[data-lesson-pack-reading-example]").first()).toContainText(/読み取り例（唯一の正答ではありません）|Reading example \(not the only correct answer\)/);
    const studentText = await student.textContent();
    for (const note of await teacher.locator("[data-lesson-pack-reading-example] p").allTextContents()) {
      expect(studentText).not.toContain(note);
    }
    expect(studentText).not.toContain("読み取り例");
    expect(studentText).not.toContain("Reading example");
  });
}
