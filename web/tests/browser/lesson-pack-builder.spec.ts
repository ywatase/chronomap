import { expect, test } from "@playwright/test";

const lessons = [
  { slug: "ogurike", lesson: "ogurike-intro" },
  { slug: "ogurike", lesson: "ogurike-river-compare" },
  { slug: "tonegawa", lesson: "tonegawa-eastward" },
  { slug: "heijokyo", lesson: "heijokyo-intro" },
  { slug: "azuchijo", lesson: "azuchijo-intro" },
] as const;

for (const dataset of lessons) {
  test(`customizes ${dataset.slug}/${dataset.lesson} into a classroom pack`, async ({ page }, testInfo) => {
    test.setTimeout(45_000);
    const qrRequests: string[] = [];
    page.on("request", (request) => {
      if (/qrserver|quickchart|goqr|api\.qr/i.test(request.url())) qrRequests.push(request.url());
    });
    await page.addInitScript(() => {
      window.print = () => { document.body.dataset.printCalled = "true"; };
    });
    if (dataset.slug === "ogurike") {
      await page.goto(`/?dataset=${dataset.slug}`);
      await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
      await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();
      await page.locator(`[data-dataset-catalog-card="${dataset.slug}"] [data-dataset-catalog-lesson-row="${dataset.lesson}"] [data-dataset-catalog-builder]`).click();
      await expect.poll(() => {
        const url = new URL(page.url());
        return [url.searchParams.get("dataset"), url.searchParams.get("lesson"), url.searchParams.get("view")].join("|");
      }).toBe(`${dataset.slug}|${dataset.lesson}|builder`);
    } else {
      await page.goto(`/?dataset=${dataset.slug}&lesson=${dataset.lesson}&view=builder`);
    }
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);

    const builder = page.locator("[data-lesson-pack-builder]");
    await expect(builder).toBeVisible();
    await expect(builder.locator("[data-lesson-pack-builder-teaching-guide]")).toContainText(/利用の目安|Teaching fit/);
    await expect(builder.locator("[data-lesson-pack-builder-teaching-guide]")).toContainText(/学習のねらい|Learning goal/);
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
    await expect(pack.locator("[data-lesson-pack-figure] svg")).toBeVisible();
    expect(await pack.locator("[data-lesson-pack-figure-legend-step]").count()).toBe(await pack.locator("[data-lesson-pack-student] .lesson-pack-step").count());
    await expect(pack.locator("[data-lesson-pack-teacher]")).toHaveCount(0);
    await expect(pack.locator("[data-lesson-pack-teaching-guide]")).toHaveCount(0);
    await expect(pack.locator("[data-lesson-pack-qr]")).toHaveCount(1);
    await expect(pack.locator("[data-lesson-pack-qr]")).toHaveAttribute("role", "img");
    await expect(pack.locator("[data-lesson-pack-qr]")).toHaveAttribute("aria-label", "ガイド教材を開くQRコード");
    await expect(pack.locator("[data-lesson-pack-start-url]")).toHaveAttribute("href", /https?:\/\//);
    await expect(pack.locator("[data-lesson-pack-start-url]")).toContainText(/https?:\/\//);
    const stepLinks = pack.locator("[data-lesson-pack-step-link]");
    await expect(stepLinks).toHaveCount(await pack.locator("[data-lesson-pack-student] .lesson-pack-step").count());
    for (let index = 0; index < await stepLinks.count(); index += 1) {
      await expect(stepLinks.nth(index)).toHaveText("このステップをオンラインで開く");
      await expect(stepLinks.nth(index)).toHaveAttribute("href", /https?:\/\//);
    }
    expect(qrRequests).toHaveLength(0);
    await page.screenshot({ path: testInfo.outputPath(`${dataset.slug}-preview.png`), fullPage: true });
    await pack.locator("[data-lesson-pack-figure-page]").screenshot({ path: testInfo.outputPath(`${dataset.slug}-pack-with-figure.png`) });

    await pack.locator("[data-lesson-pack-print]").click();
    await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
    await expect(page.locator("body")).toHaveAttribute("data-print-document", "lesson-pack");
    await page.emulateMedia({ media: "print" });
    await expect(pack.locator("[data-lesson-pack-qr]")).toBeVisible();
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
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-lesson-pack-builder]")).toBeHidden();
    await expect(page.locator("[data-lesson-workshop-open]")).toBeFocused();
    await expect(page).not.toHaveURL(/view=builder/);
  });
}

test("collects copy-only feedback after a classroom-pack print attempt", async ({ page }) => {
  const qrRequests: string[] = [];
  page.on("request", (request) => {
    if (/qrserver|quickchart|goqr|api\.qr/i.test(request.url())) qrRequests.push(request.url());
  });
  await page.addInitScript(() => {
    window.print = () => { document.body.dataset.printCalled = "true"; };
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.goto("/?dataset=heijokyo&lesson=heijokyo-intro&view=builder");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);

  const builder = page.locator("[data-lesson-pack-builder]");
  await expect(builder).toBeVisible();
  await builder.locator("[data-lesson-pack-title]").fill("秘密タイトル");
  await builder.locator("[data-lesson-pack-class-label]").fill("秘密クラス");
  await builder.locator("[data-lesson-pack-prompt]").first().fill("秘密の問い");
  await builder.locator("[data-lesson-pack-include-teacher]").uncheck();
  await builder.locator("[data-lesson-pack-builder-preview]").click();

  const pack = page.locator("[data-lesson-pack-dialog]");
  await expect(pack.locator("[data-lesson-pack-qr]")).toHaveCount(1);
  await expect(pack.locator("[data-lesson-pack-qr]")).toHaveAttribute("role", "img");
  await expect(pack.locator("[data-lesson-pack-qr]")).toHaveAttribute("aria-label", "ガイド教材を開くQRコード");
  await expect(pack.locator("[data-lesson-pack-start-url]")).toHaveAttribute("href", /https?:\/\//);
  await expect(pack.locator("[data-lesson-pack-start-url]")).toContainText(/https?:\/\//);
  const stepLinks = pack.locator("[data-lesson-pack-step-link]");
  await expect(stepLinks).toHaveCount(await pack.locator("[data-lesson-pack-student] .lesson-pack-step").count());
  for (let index = 0; index < await stepLinks.count(); index += 1) {
    await expect(stepLinks.nth(index)).toHaveText("このステップをオンラインで開く");
    await expect(stepLinks.nth(index)).toHaveAttribute("href", /https?:\/\//);
  }
  const feedback = pack.locator("[data-lesson-pack-feedback-host]");
  await expect(feedback).toBeHidden();
  await pack.locator("[data-lesson-pack-print]").click();
  await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
  await expect(feedback).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(pack.locator("[data-lesson-pack-qr]")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.emulateMedia({ media: "screen" });
  expect(qrRequests).toHaveLength(0);
  await feedback.locator("[data-lesson-pack-feedback-generate]").click();
  await expect(feedback.locator("[data-lesson-pack-feedback-error]")).toContainText(/必須項目|required/i);
  await expect(feedback.locator("[data-lesson-pack-feedback-answer]")).toHaveValue("");

  await feedback.locator('input[name="utilization"][value="近いうちに使いたい"]').check();
  await feedback.locator('input[name="nextFeature"][value="校内で共有"]').check();
  await feedback.locator("[data-lesson-pack-feedback-comment]").fill("a".repeat(600));
  await feedback.locator("[data-lesson-pack-feedback-generate]").click();
  await expect(feedback.locator("[data-lesson-pack-feedback-comment]")).toHaveValue("a".repeat(500));

  const answer = feedback.locator("[data-lesson-pack-feedback-answer]");
  await expect(answer).toHaveValue(/heijokyo/);
  await expect(answer).toHaveValue(/heijokyo-intro|intro/);
  await expect(answer).toHaveValue(/選択ステップ数: \d+|Selected step count: \d+/);
  await expect(answer).toHaveValue(/教員用資料: なし|Teacher material: no/);
  const answerText = await answer.inputValue();
  expect(answerText).not.toContain("秘密タイトル");
  expect(answerText).not.toContain("秘密クラス");
  expect(answerText).not.toContain("秘密の問い");

  await feedback.locator("[data-lesson-pack-feedback-copy]").click();
  await expect(feedback.locator("[data-lesson-pack-feedback-status]")).toContainText(/コピーしました|copied/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

  const savedAnswer = await answer.inputValue();
  await pack.locator("[data-lesson-pack-back]").click();
  await expect(builder).toBeVisible();
  await builder.locator("[data-lesson-pack-builder-preview]").click();
  const reopenedPack = page.locator("[data-lesson-pack-dialog]");
  const reopenedFeedback = reopenedPack.locator("[data-lesson-pack-feedback-host]");
  await expect(reopenedFeedback.locator("[data-lesson-pack-feedback-answer]")).toHaveValue(savedAnswer);
  await expect(reopenedFeedback.locator('input[name="utilization"][value="近いうちに使いたい"]')).toBeChecked();
  await expect(reopenedFeedback.locator('input[name="nextFeature"][value="校内で共有"]')).toBeChecked();
  await expect(reopenedFeedback.locator("[data-lesson-pack-feedback-comment]")).toHaveValue("a".repeat(500));

  await page.reload();
  await expect(page.locator("[data-lesson-pack-builder]")).toBeVisible();
  await expect(page.locator("[data-lesson-pack-title]")).not.toHaveValue("秘密タイトル");
  await expect(page.locator("[data-lesson-pack-feedback-host]")).toHaveCount(0);
});

test("offers a privacy-bounded paid-interest consultation handoff after printing", async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.addInitScript(() => {
    window.print = () => { document.body.dataset.printCalled = "true"; };
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => undefined } });
  });
  await page.goto("/?dataset=heijokyo&lesson=heijokyo-intro&view=builder");
  const builder = page.locator("[data-lesson-pack-builder]");
  await builder.locator("[data-lesson-pack-title]").fill("秘密タイトル");
  await builder.locator("[data-lesson-pack-class-label]").fill("秘密クラス");
  await builder.locator("[data-lesson-pack-prompt]").first().fill("秘密の問い");
  await builder.locator("[data-lesson-pack-builder-preview]").click();
  const pack = page.locator("[data-lesson-pack-dialog]");
  const feedback = pack.locator("[data-lesson-pack-feedback-host]");
  await pack.locator("[data-lesson-pack-print-student]").click();
  await expect(feedback.locator("[data-lesson-pack-completion]")).toBeFocused();
  await expect(feedback.locator("[data-lesson-pack-completion-facts]")).toContainText("生徒用を印刷");

  await feedback.locator('input[name="utilization"][value="近いうちに使いたい"]').check();
  await feedback.locator('input[name="nextFeature"][value="校内で共有"]').check();
  await feedback.locator('input[name="pilot-route"][value="consult"]').check();
  await feedback.locator('input[name="pilot-budget"][value="地域・内容・条件が合えば検討したい"]').check();
  await feedback.locator("[data-lesson-pack-pilot-region]").fill("奈良の水路");
  await feedback.locator("[data-lesson-pack-pilot-form]").locator("button[type=submit]").click();
  const answer = feedback.locator("[data-lesson-pack-pilot-answer]");
  await expect(answer).toBeVisible();
  await expect(answer).toHaveValue(/地域・内容・条件が合えば検討したい/);
  await expect(answer).toHaveValue(/印刷範囲: 生徒用/);
  await expect(answer).toHaveValue(/希望地域・題材: 奈良の水路/);
  await expect(answer).not.toHaveValue(/秘密/);
  await expect(answer).not.toHaveValue(/授業設計メモ|Teaching guide|学習のねらい/);
  await expect(feedback.locator("[data-lesson-pack-pilot-mail]")).toHaveCount(0);
  await feedback.locator("[data-lesson-pack-pilot-copy]").click();
  await expect(feedback.locator("[data-lesson-pack-pilot-status]")).toContainText(/コピーしました|copied/i);
  expect(requests.some((url) => url.startsWith("mailto:"))).toBeFalsy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath("consultation-handoff.png"), fullPage: true });
});
