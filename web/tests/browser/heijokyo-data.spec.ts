import { expect, test, type Page } from "@playwright/test";

async function selectFeatureFromList(page: Page, name: RegExp): Promise<void> {
  const feature = page.getByRole("button", { name });
  if (!(await feature.isVisible())) {
    const listTab = page.getByRole("tab", { name: /地物一覧|Feature list/ });
    if (await listTab.isVisible()) await listTab.click();
    else await page.getByRole("button", { name: /詳細を閉じる|Close details/ }).click();
  }
  await feature.click();
}

const heijokyoFixture = {
  "dataset.json": {
    schemaVersion: "1.0.0",
    id: "heijokyo:dataset:pilot",
    title: { ja: "平城京パイロットデータ", en: "Heijokyo pilot dataset" },
    description: { ja: "平城京の小規模な公開データです。", en: "A small public dataset for Heijokyo." },
    defaultLanguage: "ja",
    bbox: [135.77, 34.66, 135.83, 34.72],
    temporalExtent: {
      start: { earliestYear: 710, latestYear: 710, precision: "year", qualifier: "exact" },
      end: { earliestYear: 710, latestYear: 710, precision: "year", qualifier: "exact" },
    },
    rights: { status: "open-license", attribution: "Chronomap", terms: "引用メタデータのみ。" },
    files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" },
  },
  "entities.json": [
    { id: "heijokyo:entity:capital", type: "settlement", labels: { ja: "平城京", en: "Heijokyo" }, description: { ja: "710年に築かれた古代の都城。", en: "The capital established in 710." } },
    { id: "heijokyo:entity:palace", type: "archaeological-site", labels: { ja: "平城宮", en: "Heijo Palace" }, description: { ja: "平城京の中心部に置かれた宮。", en: "The palace at the center of Heijokyo." } },
    { id: "heijokyo:entity:suzaku-avenue", type: "route", labels: { ja: "朱雀大路", en: "Suzaku Avenue" }, description: { ja: "平城京の中心軸として知られる大路。", en: "The central avenue of Heijokyo." } },
  ],
  "sources.json": [
    { id: "heijokyo:source:nara-heijokyo", type: "official-web-page", citation: "奈良市『奈良のあゆみ－明治以前－』", title: { ja: "奈良のあゆみ－明治以前－" }, creators: ["奈良市"], publishedYear: 2019, url: "https://www.city.nara.lg.jp/soshiki/3/148230.html", accessedDate: "2026-09-18", rights: { status: "restricted", terms: "引用メタデータのみ。" } },
    { id: "heijokyo:source:nara-suzaku", type: "official-web-page", citation: "奈良市『平城京朱雀大路跡』", title: { ja: "平城京朱雀大路跡" }, creators: ["奈良市"], publishedYear: 2021, url: "https://www.city.nara.lg.jp/site/bunkazai/2438.html", accessedDate: "2026-09-18", rights: { status: "restricted", terms: "引用メタデータのみ。" } },
    { id: "heijokyo:source:shape-notes", type: "original-reconstruction-notes", citation: "Chronomap『平城京パイロット形状作成メモ』", title: { ja: "平城京パイロット形状作成メモ" }, creators: ["Chronomap contributors"], publishedYear: 2026, url: "https://github.com/ywatase/chronomap/blob/main/docs/data/heijokyo-shape-notes.md", accessedDate: "2026-09-18", rights: { status: "open-license", attribution: "Chronomap contributors" } },
  ],
  "evidence.json": [
    { id: "heijokyo:evidence:nara", sourceId: "heijokyo:source:nara-heijokyo", locator: "平城京の解説", usage: "citation", supports: ["temporal", "location", "identity"], note: "引用メタデータ。" },
    { id: "heijokyo:evidence:suzaku", sourceId: "heijokyo:source:nara-suzaku", locator: "朱雀大路の解説", usage: "citation", supports: ["temporal", "location", "identity"], note: "引用メタデータ。" },
    { id: "heijokyo:evidence:shape", sourceId: "heijokyo:source:shape-notes", locator: "作成方法", usage: "derived-geometry", supports: ["geometry", "location"], note: "独自の概略復元。", publicationBasis: "original-reconstruction" },
  ],
  "feature-versions.geojson": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "heijokyo:version:capital-710",
        geometry: { type: "Polygon", coordinates: [[[135.77, 34.66], [135.83, 34.66], [135.83, 34.72], [135.77, 34.72], [135.77, 34.66]]] },
        properties: {
          entityId: "heijokyo:entity:capital",
          labels: { ja: "平城京（710年・概略範囲）", en: "Heijokyo (710 approximate extent)" },
          description: { ja: "平城京の粗い概略範囲です。", en: "A rough approximate extent for Heijokyo." },
          temporal: { start: { earliestYear: 710, latestYear: 710, precision: "year", qualifier: "exact" }, end: null },
          uncertainty: {
            temporal: { assessment: "approximate", note: "単年表示は概略です。", evidenceIds: ["heijokyo:evidence:nara"] },
            location: { assessment: "approximate", note: "都城の表示範囲を粗く置いたものです。", evidenceIds: ["heijokyo:evidence:shape"] },
            geometry: { assessment: "approximate", note: "正確な都城境界ではありません。", evidenceIds: ["heijokyo:evidence:shape"] },
            identity: { assessment: "approximate", note: "資料解説に基づく概略です。", evidenceIds: ["heijokyo:evidence:nara"] },
          },
          evidenceIds: ["heijokyo:evidence:nara", "heijokyo:evidence:shape"],
          publicationStatus: "public",
          rights: { status: "open-license", attribution: "Chronomap", terms: "外部図版は再現しない。" },
        },
      },
      {
        type: "Feature",
        id: "heijokyo:version:palace-710",
        geometry: { type: "Point", coordinates: [135.79, 34.69] },
        properties: {
          entityId: "heijokyo:entity:palace",
          labels: { ja: "平城宮（710年・代表点）", en: "Heijo Palace (710 representative point)" },
          description: { ja: "平城宮を示す代表点です。", en: "A representative point for Heijo Palace." },
          temporal: { start: { earliestYear: 710, latestYear: 710, precision: "year", qualifier: "exact" }, end: null },
          uncertainty: {
            temporal: { assessment: "approximate", note: "単年表示は概略です。", evidenceIds: ["heijokyo:evidence:nara"] },
            location: { assessment: "approximate", note: "平城宮の代表位置です。", evidenceIds: ["heijokyo:evidence:shape"] },
            geometry: { assessment: "approximate", note: "宮域の正確な境界ではありません。", evidenceIds: ["heijokyo:evidence:shape"] },
            identity: { assessment: "approximate", note: "資料解説に基づきます。", evidenceIds: ["heijokyo:evidence:nara"] },
          },
          evidenceIds: ["heijokyo:evidence:nara", "heijokyo:evidence:shape"],
          publicationStatus: "public",
          rights: { status: "open-license", attribution: "Chronomap", terms: "外部図版は再現しない。" },
        },
      },
      {
        type: "Feature",
        id: "heijokyo:version:suzaku-avenue-710",
        geometry: { type: "LineString", coordinates: [[135.8, 34.675], [135.8, 34.705]] },
        properties: {
          entityId: "heijokyo:entity:suzaku-avenue",
          labels: { ja: "朱雀大路（710年・概略軸）", en: "Suzaku Avenue (710 approximate axis)" },
          description: { ja: "朱雀大路を示す粗い概略線です。", en: "A rough approximate axis for Suzaku Avenue." },
          temporal: { start: { earliestYear: 710, latestYear: 710, precision: "year", qualifier: "exact" }, end: null },
          uncertainty: {
            temporal: { assessment: "approximate", note: "単年表示は概略です。", evidenceIds: ["heijokyo:evidence:suzaku"] },
            location: { assessment: "approximate", note: "南北軸の概略位置です。", evidenceIds: ["heijokyo:evidence:shape"] },
            geometry: { assessment: "approximate", note: "精密線形ではありません。", evidenceIds: ["heijokyo:evidence:shape"] },
            identity: { assessment: "approximate", note: "資料解説に基づきます。", evidenceIds: ["heijokyo:evidence:suzaku"] },
          },
          evidenceIds: ["heijokyo:evidence:suzaku", "heijokyo:evidence:shape"],
          publicationStatus: "public",
          rights: { status: "open-license", attribution: "Chronomap", terms: "外部図版は再現しない。" },
        },
      },
    ],
  },
} as const;

async function routeHeijokyoFixture(page: Page): Promise<void> {
  await page.route("**/data/heijokyo/**", async (route) => {
    const resource = new URL(route.request().url()).pathname.split("/").at(-1);
    const body = resource ? heijokyoFixture[resource as keyof typeof heijokyoFixture] : undefined;
    if (!body) return route.continue();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test("opens the Heijokyo lesson from the three-entry catalog using a bundle fixture", async ({ page }) => {
  await routeHeijokyoFixture(page);
  await page.goto("/");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await page.getByRole("button", { name: /地域・教材を選ぶ|Choose a region or lesson/ }).click();

  const catalog = page.locator("[data-dataset-catalog-dialog]");
  await expect(catalog).toBeVisible();
  await expect(catalog.locator("[data-dataset-catalog-card]")).toHaveCount(4);
  const heijokyo = catalog.locator('[data-dataset-catalog-card="heijokyo"]');
  await expect(heijokyo).toContainText(/平城京|Heijokyo/);
  await expect(heijokyo).toContainText(/10分|10 min/);
  await heijokyo.locator("[data-dataset-catalog-lesson]").click();

  await expect(page).toHaveURL(/dataset=heijokyo&lesson=heijokyo-intro&step=capital-710/);
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await expect(page.getByRole("heading", { name: /平城京パイロットデータ|Heijokyo pilot dataset/ })).toBeVisible();
  await expect(page.locator("[data-lesson-progress]")).toContainText(/1\/3|1 of 3/);
  await expect(page.locator("[data-comparison-cta]")).toHaveCount(0);
  await page.locator("[data-lesson-next]").click();
  await page.locator("[data-lesson-next]").click();
  await expect(page.locator("[data-lesson-progress]")).toContainText(/3\/3|3 of 3/);
});

test("loads the checked-in Heijokyo bundle and completes its single-year lesson", async ({ page }) => {
  await page.goto("/?dataset=heijokyo");
  await expect(page.locator("main [role=status]")).toContainText(/利用できます|available/i);
  await expect(page.getByRole("heading", { name: /平城京パイロットデータ|Heijokyo pilot dataset/ })).toBeVisible();
  await expect(page.getByLabel(/収録時点|Recorded snapshots/).locator("option")).toHaveCount(1);
  await expect(page.locator("[data-feature-id]")).toHaveCount(3);
  await expect(page.locator("[data-comparison-cta]")).toHaveCount(0);

  await page.getByRole("button", { name: /ガイド教材を始める|Start guided lesson/ }).click();
  await expect(page.locator("[data-lesson-progress]")).toContainText(/1\/3|1 of 3/);
  await page.locator("[data-lesson-next]").click();
  await page.locator("[data-lesson-next]").click();
  await expect(page.locator("[data-lesson-progress]")).toContainText(/3\/3|3 of 3/);
  await expect(page.locator("[data-lesson-pack-open]")).toBeVisible();
});

test("shows evidence, uncertainty, citation, and rights for Heijokyo polygon point and line snapshots", async ({ page }, testInfo) => {
  await page.goto("/?dataset=heijokyo");
  const snapshots = page.getByLabel(/収録時点|Recorded snapshots/);
  const detail = page.locator("#panel-detail");

  await snapshots.selectOption("710");
  await selectFeatureFromList(page, /平城京（710年・概略範囲）/);
  await expect(detail).toBeVisible();
  await expect(detail).toContainText("heijokyo:evidence:shape");
  await expect(detail).toContainText("作成方法と限界");
  await expect(detail).toContainText("奈良市『奈良のあゆみ－明治以前－』");
  await expect(detail).toContainText("正確な都城境界");
  await expect(detail).toContainText("引用メタデータのみ");

  await selectFeatureFromList(page, /平城宮（710年・代表点）/);
  await expect(detail).toContainText("平城宮（710年・代表点）");
  await expect(detail).toContainText("宮域の正確な境界");

  await selectFeatureFromList(page, /朱雀大路（710年・概略軸）/);
  await expect(detail).toContainText("朱雀大路（710年・概略軸）");
  await expect(detail).toContainText("heijokyo:evidence:suzaku");
  await expect(detail).toContainText("奈良市『平城京朱雀大路跡』");
  await expect(detail).toContainText("精密な道路線形");

  await page.screenshot({ path: testInfo.outputPath("heijokyo-evidence.png"), fullPage: true });
});
