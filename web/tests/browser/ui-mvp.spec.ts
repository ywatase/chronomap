import { expect, test } from "@playwright/test";

test.describe("Chronomap UI MVP", () => {
  test("territory visibility is independent from the feature list and details", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
    const settings = page.locator("[data-map-settings]");
    await settings.locator("summary").click();
    const territory = page.getByLabel(/territor|領域・勢力圏/i);
    await expect(territory).toBeChecked();
    await territory.uncheck();
    await settings.locator("summary").click();
    const river = page.getByRole("button", { name: /宇治川（1590年・工事前）/ });
    await expect(river).toBeVisible();
    await river.click();
    if (isMobileProject(test.info())) await page.getByRole("tab", { name: /Details|詳細/ }).click();
    await expect(page.getByRole("heading", { name: /Entity|歴史対象/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Evidence|根拠/ })).toBeVisible();
  });

  test("loads the Ogurike data and exposes point metadata", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
    await expect(page.getByRole("heading", { name: "巨椋池パイロットデータ" })).toBeVisible();
    await expect(page.getByRole("button", { name: /宇治川（1590年・工事前）/ })).toBeVisible();
    const mapCanvas = page.locator(".maplibregl-canvas");
    await mapCanvas.focus();
    await expect(mapCanvas).toBeFocused();
    await expect(page.getByText("Synthetic Private Polygon")).toHaveCount(0);

    await page.getByLabel(/Year|年/).fill("1942");
    await page.getByLabel(/Year|年/).press("Tab");
    const monument = page.getByRole("button", { name: /巨椋池干拓之碑/ });
    await expect(monument).toBeVisible();
    await monument.click();
    await expect(page.getByRole("button", { name: /巨椋池干拓之碑/, includeHidden: true })).toHaveAttribute("aria-pressed", "true");
    if (isMobileProject(test.info())) {
      await page.getByRole("tab", { name: /Details|詳細/ }).click();
    }
    await expect(page.getByRole("heading", { name: /Entity|歴史対象/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Version|時点・復元/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Evidence|根拠/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Source|出典/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Rights|権利・利用条件/ })).toBeVisible();
    await expect(page.getByText("引用メタデータのみを収録しています。原資料の本文・画像は転載していません。", { exact: true })).toBeVisible();
  });

  test("keyboard flow selects and closes a detail panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
    await page.getByLabel(/Year|年/).press("Tab");
    const river = page.getByRole("button", { name: /宇治川（1590年・工事前）/ });
    await river.focus();
    await page.keyboard.press("Enter");
    if (isMobileProject(test.info())) {
      const listTab = page.getByRole("tab", { name: /Feature list|地物一覧/ });
      const detailTab = page.getByRole("tab", { name: /Details|詳細/ });
      await expect(detailTab).toBeFocused();
      await expect(detailTab).toHaveAttribute("aria-selected", "true");
      await detailTab.press("ArrowLeft");
      await expect(listTab).toBeFocused();
      await expect(listTab).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel", { name: /Feature list|地物一覧/ })).toBeVisible();
      await listTab.press("ArrowRight");
      await expect(detailTab).toBeFocused();
      await expect(detailTab).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel", { name: /Details|詳細/ })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: /Entity|歴史対象/ })).toBeVisible();
    await page.getByRole("button", { name: /Close details|詳細を閉じる/ }).press("Enter");
    await expect(river).toBeFocused();
  });

  test("a blocked GSI basemap can retry without losing the selected detail", async ({ page }) => {
    let blockBasemap = true;
    await page.route(/(?:cyberjapandata|maps)\.gsi\.go\.jp/, (route) => blockBasemap ? route.abort() : route.continue());
    await page.goto("/");
    const river = page.getByRole("button", { name: /宇治川（1590年・工事前）/ });
    await expect(river).toBeVisible();
    const failure = page.getByRole("alert");
    await expect(failure).toBeVisible();
    await expect(failure).toContainText(/Basemap|背景地図|map rendering/i);
    await river.click();
    await expect(page.getByRole("heading", { name: /Entity|歴史対象/ })).toBeVisible();
    blockBasemap = false;
    await page.getByRole("button", { name: /Retry basemap|背景地図を再試行/ }).click();
    await expect(failure).toBeHidden();
    await expect(page.getByRole("heading", { name: /Entity|歴史対象/ })).toBeVisible();
  });

  test("a dataset failure can retry without exposing a stack", async ({ page }) => {
    let fail = true;
    await page.route("**/data/ogurike/dataset.json", (route) => fail ? route.abort() : route.continue());
    await page.goto("/");
    await expect(page.getByRole("alert")).toContainText(/巨椋池|Dataset|データ/i);
    await expect(page.locator("body")).not.toContainText("at loadPublicBundle");
    fail = false;
    await page.getByRole("button", { name: /Retry loading dataset|データ.*再読み込み/ }).click();
    await expect(page.locator("main [role=status]")).toContainText(/available|利用できます/i);
  });
});

function isMobileProject(info: ReturnType<typeof test.info>): boolean {
  return info.project.name === "mobile-chromium";
}
