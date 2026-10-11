import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../../public/chronomap/manifest.json", import.meta.url), "utf-8")) as {
  defaultYear: number;
  themes: { id: string }[];
};
const formatYear = (year: number) => (year > 0 ? `${year}年` : `紀元前${Math.max(1, -year)}年`);

test.describe("national viewer", () => {
  test("opens a full-screen map at the default year without lesson or pricing UI", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#map canvas.maplibregl-canvas")).toBeVisible();
    await expect(page.locator("#timeline-year")).toHaveText(formatYear(manifest.defaultYear));
    await expect(page).toHaveURL(new RegExp(`#[\\d.]+/[\\d.-]+/[\\d.-]+/${manifest.defaultYear}$`));
    await expect(page.getByText(/教材|価格|相談/)).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("moves between recorded years and keeps the year in the URL", async ({ page }) => {
    await page.goto("/#11/34.92/135.765/1590");
    await expect(page.locator("#timeline-year")).toHaveText("1590年");
    await page.locator("#next-year").click();
    await expect(page.locator("#timeline-year")).not.toHaveText("1590年");
    const year = Number(await page.locator("#year-input").inputValue());
    expect(year).toBeGreaterThan(1590);
    await expect(page).toHaveURL(new RegExp(`/${year}$`));

    await page.locator("#year-input").fill("1910");
    await page.locator("#year-input").press("Enter");
    await expect(page.locator("#timeline-year")).toHaveText("1910年");
    await page.locator("#year-slider").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#timeline-year")).toHaveText("1911年");
  });

  test("restores the year and hidden themes from a shared URL", async ({ page, isMobile }) => {
    await page.goto("/#9/35/136/1596?off=lake");
    await expect(page.locator("#timeline-year")).toHaveText("1596年");
    if (isMobile) await page.getByRole("button", { name: "レイヤー" }).click();
    await expect(page.locator('input[name="theme"][value="lake"]')).not.toBeChecked();
    await page.locator('input[name="theme"][value="river"]').uncheck();
    await expect(page).toHaveURL(/off=lake,river/);
  });

  test("shows the feature detail with uncertainty and sources when a feature is clicked", async ({ page }) => {
    await page.goto("/#12/34.9132/135.7763/1590");
    await expect(page.locator("#map canvas.maplibregl-canvas")).toBeVisible();
    await page.waitForFunction(() => document.querySelector("#map")?.classList.contains("maplibregl-map"));
    await page.waitForTimeout(2500);
    const box = await page.locator("#map").boundingBox();
    if (!box) throw new Error("map has no box");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const detail = page.locator("#detail");
    await expect(detail).toBeVisible();
    await expect(detail.locator("#detail-title")).not.toHaveText("");
    const others = detail.locator("#other-features .choice", { hasText: "巨椋池" });
    if ((await detail.locator("#detail-title").innerText()).includes("巨椋池") === false) await others.first().click();
    await expect(detail.locator("#detail-title")).toContainText("巨椋池");
    await expect(detail).toContainText("可能期間");
    await expect(detail).toContainText("確からしさ");
    await expect(detail.locator(".evidence-list li").first()).toBeVisible();
    await detail.getByRole("button", { name: "詳細を閉じる" }).click();
    await expect(detail).toBeHidden();
  });

  test("lists every theme and the historical map layers in the panel", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "レイヤー" }).click();
    await expect(page.locator('input[name="theme"]')).toHaveCount(manifest.themes.length);
    await expect(page.locator('input[name="raster"][value="swale"]')).toBeVisible();
    await page.locator('input[name="raster"][value="swale"]').check();
    await expect(page).toHaveURL(/raster=swale/);
  });

  test("explains a failed manifest load and offers a retry", async ({ page }) => {
    await page.route("**/chronomap/manifest.json", (route) => route.fulfill({ status: 500, body: "" }));
    await page.goto("/");
    await expect(page.getByRole("alert")).toContainText("地図データを読み込めませんでした");
    await page.unroute("**/chronomap/manifest.json");
    await page.getByRole("button", { name: "再読み込み" }).click();
    await expect(page.locator("#timeline-year")).toBeVisible();
  });
});
