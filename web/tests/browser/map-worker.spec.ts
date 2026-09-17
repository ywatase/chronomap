import { expect, test } from "@playwright/test";

test("serves the bundled MapLibre worker used by historical overlays", async ({ page }) => {
  const workerResponse = page.waitForResponse((response) => response.url().includes("maplibre-gl-worker"));
  await page.goto("/");
  const response = await workerResponse;
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/javascript/i);
  expect((await response.text()).slice(0, 200)).not.toMatch(/<!doctype html|<html/i);
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
});
