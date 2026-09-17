import { expect, test } from "@playwright/test";

test("captures the responsive initial, detail, and data-failure states", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  const layout = await page.evaluate(() => {
    const map = document.querySelector<HTMLElement>(".map-placeholder");
    return { viewportWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth, mapHeight: map?.getBoundingClientRect().height ?? 0, viewportHeight: window.innerHeight };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.mapHeight).toBeGreaterThanOrEqual(layout.viewportHeight * (testInfo.project.name === "mobile-chromium" ? 0.45 : 0.5));
  await page.screenshot({ path: testInfo.outputPath("initial.png"), fullPage: true });

  await page.getByLabel(/収録時点|Recorded snapshots/).selectOption("1910");
  await page.getByRole("button", { name: /巨椋池（1910年・概略）/ }).click();
  if (testInfo.project.name === "mobile-chromium") await page.getByRole("tab", { name: /詳細|Details/ }).click();
  await expect(page.getByRole("heading", { name: /地物の詳細|Feature details/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("detail.png"), fullPage: true });

  await page.route("**/data/ogurike/dataset.json", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(/巨椋池|データ|Dataset/i);
  await page.screenshot({ path: testInfo.outputPath("failure.png"), fullPage: true });
});
