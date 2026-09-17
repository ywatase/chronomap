import { expect, test } from "@playwright/test";

test("ignores a camera outside the Web Mercator bounds without looping", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/?dataset=ogurike&year=1910&lng=135&lat=90&z=24");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await page.waitForTimeout(300);
  expect(pageErrors).toEqual([]);
  expect(new URL(page.url()).searchParams.get("lat")).not.toBe("90");
  expect(new URL(page.url()).searchParams.get("z")).not.toBe("24");
});
