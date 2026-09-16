import { expect, test } from "@playwright/test";

test.describe("Chronomap UI MVP", () => {
  test("mobile lists public hypotheses and exposes complete point metadata", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/available/i);
    await expect(page.getByRole("button", { name: /Synthetic Line Alternative A/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Synthetic Line Alternative B/ })).toBeVisible();
    await expect(page.getByText("Synthetic Private Polygon")).toHaveCount(0);

    await page.getByLabel(/Year|年/).fill("0");
    await page.getByLabel(/Year|年/).press("Tab");
    await expect(page.getByRole("button", { name: /Synthetic Open Boundary Point/ })).toBeVisible();
    const openPoint = page.locator('[data-feature-id="synthetic:version:point-open-boundary"]');
    await openPoint.click();
    await expect(openPoint).toHaveAttribute("aria-pressed", "true");
    if (isMobileProject(test.info())) {
      await page.getByRole("tab", { name: /Details|詳細/ }).click();
    }
    await expect(page.getByRole("heading", { name: "Entity" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Version" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Source" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rights" })).toBeVisible();
    await expect(page.getByText("Citation-only metadata; no authored source content is reproduced.", { exact: true })).toBeVisible();
  });

  test("keyboard flow selects and closes a detail panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/available/i);
    await page.getByLabel(/Year|年/).press("Tab");
    await page.getByRole("button", { name: /Synthetic Line Alternative A/ }).focus();
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
    await expect(page.getByRole("heading", { name: "Entity" })).toBeVisible();
    await page.getByRole("button", { name: /Close details/ }).press("Enter");
    await expect(page.getByRole("button", { name: /Synthetic Line Alternative A/ })).toBeFocused();
  });

  test("a blocked GSI basemap leaves the text list usable", async ({ page }) => {
    await page.route(/(?:cyberjapandata|maps)\.gsi\.go\.jp/, (route) => route.abort());
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Synthetic Line Alternative A/ })).toBeVisible();
    const failure = page.getByRole("alert");
    await expect(failure).toBeVisible();
    await expect(failure).toContainText(/Basemap|map rendering/i);
    await page.getByRole("button", { name: /Synthetic Line Alternative B/ }).click();
    await expect(page.getByRole("heading", { name: "Entity" })).toBeVisible();
  });

  test("a dataset failure can retry without exposing a stack", async ({ page }) => {
    let fail = true;
    await page.route("**/data/synthetic/dataset.json", (route) => fail ? route.abort() : route.continue());
    await page.goto("/");
    await expect(page.getByRole("alert")).toContainText(/Dataset failed to load/i);
    await expect(page.locator("body")).not.toContainText("at loadPublicBundle");
    fail = false;
    await page.getByRole("button", { name: /Retry loading dataset/ }).click();
    await expect(page.locator("main [role=status]")).toContainText(/available/i);
  });
});

function isMobileProject(info: ReturnType<typeof test.info>): boolean {
  return info.project.name === "mobile-chromium";
}
