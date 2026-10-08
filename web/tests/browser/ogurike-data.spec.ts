import { expect, test } from "@playwright/test";

test.describe("Ogurike data snapshots", () => {
  test("moves between the six authored snapshot years without inventing a feature", async ({ page }, testInfo) => {
    await page.goto("/?year=1590");
    const year = page.getByLabel(/表示年|Year/);
    const snapshots = page.getByLabel(/収録時点|Recorded snapshots/);
    const status = page.locator("main [role=status]");
    await expect(status).toContainText(/available|利用できます/i);

    await expect(snapshots.locator("option")).toHaveCount(6);
    await expect(snapshots).toHaveValue("1590");
    await expect(page.getByRole("button", { name: /宇治川（1590年・工事前）/ })).toBeVisible();
    await page.getByRole("button", { name: /次の収録年|Next recorded year/ }).click();
    await expect(year).toHaveValue("1596");
    await expect(page.getByRole("button", { name: /宇治川（1596年・工事後）/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /宇治川（1590年・工事前）/ })).toHaveCount(0);

    await snapshots.selectOption("1885");
    await expect(year).toHaveValue("1885");
    await expect(page.getByRole("button", { name: /巨椋池（1885年・工事前の概略）/ })).toBeVisible();

    await snapshots.selectOption("1910");
    await expect(year).toHaveValue("1910");
    await expect(page.getByRole("button", { name: /巨椋池（1910年・概略）/ })).toBeVisible();
    await page.getByRole("button", { name: /巨椋池（1910年・概略）/ }).click();
    await expect(page.getByText("近畿地方整備局の図④にある北西側の入り込み、東側の張り出し、南岸の凹凸を読めるよう現在の地図上に置いた概略復元です。精密な水域境界や794haから逆算した面積は示しません。", { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("ogurike-1910-outline.png"), fullPage: true });

    await snapshots.selectOption("1933");
    await expect(page.getByRole("button", { name: /巨椋池（1933年・残存水域の概略）/ })).toBeVisible();

    await snapshots.selectOption("1942");
    await expect(page.getByRole("button", { name: /巨椋池干拓之碑/ })).toBeVisible();
  });

  test("shows evidence, uncertainty, citation, and rights for point line and polygon", async ({ page }, testInfo) => {
    await page.goto("/");
    const snapshots = page.getByLabel(/収録時点|Recorded snapshots/);
    const detail = page.locator("#panel-detail");

    await snapshots.selectOption("1590");
    await page.getByRole("button", { name: /宇治川（1590年・工事前）/ }).click();
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("根拠");
    await expect(detail).toContainText("ogurike:evidence:ujigawa-1590-geometry");
    await expect(detail).toContainText("PDF p.2-22 図2.2-1①");
    await expect(detail).toContainText("国土交通省近畿地方整備局");
    await expect(detail).toContainText("オープンライセンス");

    await snapshots.selectOption("1910");
    await page.getByRole("button", { name: /巨椋池（1910年・概略）/ }).click();
    await expect(detail).toContainText("ogurike:evidence:waterbody-geometry");
    await expect(detail).toContainText("精密な境界");
    await expect(detail).toContainText("京都府レッドデータブック2015『巨椋池』");
    await expect(detail).toContainText("引用メタデータのみ");

    await snapshots.selectOption("1942");
    await page.getByRole("button", { name: /巨椋池干拓之碑（1942年）/ }).click();
    await expect(detail).toContainText("ogurike:evidence:monument-geometry");
    await expect(detail).toContainText("『作成方法』の1942年Pointに関する記録");
    await expect(detail).toContainText("京都市『巨椋池干拓碑』GA015");
    await expect(detail).toContainText("代表点加工");

    await page.screenshot({ path: testInfo.outputPath("ogurike-evidence.png"), fullPage: true });
  });
});
