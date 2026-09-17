import { expect, test } from "@playwright/test";

test("keeps the map usable when a desktop viewport is short", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 400 });
  await page.goto("/");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  const layout = await page.evaluate(() => ({
    mapHeight: document.querySelector<HTMLElement>(".map-placeholder")?.getBoundingClientRect().height ?? 0,
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(layout.mapHeight).toBeGreaterThanOrEqual(480);
  expect(layout.documentHeight).toBeGreaterThan(layout.viewportHeight);
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
});
