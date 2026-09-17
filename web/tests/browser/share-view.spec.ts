import { expect, test } from "@playwright/test";

test.describe("shareable historical views", () => {
  test("restores a shared year and feature, then keeps the URL in sync", async ({ page }) => {
    await page.goto("/?dataset=ogurike&year=1910&feature=ogurike%3Aversion%3Awaterbody-1910&lng=135.75&lat=34.89&z=11.5");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1910");
    await expect(page.getByRole("heading", { name: /地物の詳細|Feature details/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /巨椋池（1910年・概略）/ , includeHidden: true })).toHaveAttribute("aria-pressed", "true");
    expect(page.url()).toContain("dataset=ogurike");
    expect(page.url()).toContain("year=1910");
    expect(page.url()).toContain("feature=ogurike%3Aversion%3Awaterbody-1910");

    await page.getByLabel(/収録時点|Recorded snapshots/).selectOption("1596");
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1596");
    expect(page.url()).toContain("year=1596");
    expect(page.url()).not.toContain("feature=");
    await page.getByRole("button", { name: /宇治川（1596年・工事後）/ }).click();
    expect(page.url()).toContain("feature=ogurike%3Aversion%3Aujigawa-1596");

    await page.reload();
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await expect(page.getByLabel(/表示年|Year/)).toHaveValue("1596");
    await expect(page.getByRole("heading", { name: /地物の詳細|Feature details/ })).toBeVisible();
  });

  test("offers a one-action share control with an accessible result", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
    await page.getByRole("button", { name: /この表示を共有|Share this view/ }).click();
    await expect(page.locator("[data-share-feedback]")).toContainText(/コピー|URL|copied|ready/i);
  });
});
