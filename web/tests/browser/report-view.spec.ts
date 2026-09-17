import { expect, test } from "@playwright/test";

test.describe("printable historical map reports", () => {
  test("prints the selected feature with evidence, rights, and a share URL", async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.print = () => { document.body.dataset.printCalled = "true"; };
    });
    await page.setViewportSize(testInfo.project.name === "mobile-chromium" ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await page.getByLabel(/収録時点|Recorded snapshots/).selectOption("1910");
    await page.getByRole("button", { name: /巨椋池（1910年・概略）/ }).click();
    const reportButton = page.getByRole("button", { name: /レポートを出力|Print \/ save report/ });
    await expect(reportButton).toBeVisible();
    await reportButton.click();
    const dialog = page.locator("[data-report-dialog]");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /1910年の表示レポート|report for 1910/ })).toBeVisible();
    await expect(dialog).toContainText(/参照位置|locator/i);
    await expect(dialog).toContainText(/引用メタデータのみ|citation-only/i);
    await expect(dialog).toContainText(/共有|再び開く|Reopen this view/);
    await page.screenshot({ path: testInfo.outputPath("report.png"), fullPage: true });

    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".map-placeholder")).toBeVisible();
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.emulateMedia({ media: "screen" });

    await dialog.getByRole("button", { name: /印刷 \/ PDF保存|Print \/ save as PDF/ }).click();
    await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
  });

  test("keeps the report available when the basemap fails", async ({ page }) => {
    await page.route(/(?:cyberjapandata|maps)\.gsi\.go\.jp/, (route) => route.abort());
    await page.goto("/");
    await page.getByLabel(/収録時点|Recorded snapshots/).selectOption("1910");
    await page.getByRole("button", { name: /巨椋池（1910年・概略）/ }).click();
    await page.getByRole("button", { name: /レポートを出力|Print \/ save report/ }).click();
    await expect(page.locator("[data-report-dialog]")).toContainText(/背景地図を取得できませんでした|basemap could not be retrieved/i);
    await expect(page.locator("[data-report-dialog]")).toContainText(/根拠|Evidence/);
  });

  test("does not offer a report when the public dataset fails", async ({ page }) => {
    await page.route("**/data/ogurike/dataset.json", (route) => route.abort());
    await page.goto("/");
    await expect(page.getByRole("alert")).toContainText(/データ|Dataset/i);
    await expect(page.getByRole("button", { name: /レポートを出力|Print \/ save report/ })).toBeHidden();
  });
});
