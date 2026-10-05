export interface DatasetCatalogLessonEntry {
  readonly id: string;
  readonly path: string;
  readonly featured?: boolean;
}

export interface DatasetCatalogEntry {
  readonly slug: string;
  readonly bundlePath: string;
  readonly lessons: readonly DatasetCatalogLessonEntry[];
  /** @deprecated Use the explicit lessons allow-list. */
  readonly lessonPath: string;
  readonly label: Readonly<{ ja: string; en: string }>;
  readonly region: Readonly<{ ja: string; en: string }>;
  readonly failureMessage: Readonly<{ ja: string; en: string }>;
}

/**
 * The dataset catalog is deliberately static and allow-listed. A URL can
 * select one of these bundles, but it can never turn into an arbitrary fetch
 * path.
 */
export const DATASET_CATALOG: readonly DatasetCatalogEntry[] = Object.freeze([
  {
    slug: "ogurike",
    bundlePath: "/data/ogurike/",
    lessons: Object.freeze([
      Object.freeze({ id: "ogurike-intro", path: "/lessons/ogurike-intro.json", featured: true }),
      Object.freeze({ id: "ogurike-river-compare", path: "/lessons/ogurike-river-compare.json", featured: false }),
    ]),
    lessonPath: "/lessons/ogurike-intro.json",
    label: { ja: "巨椋池", en: "Ogurike" },
    region: { ja: "京都南部", en: "Southern Kyoto" },
    failureMessage: { ja: "巨椋池の公開データを読み込めませんでした。再試行してください。", en: "The Ogurike public dataset could not be loaded. Please retry." },
  },
  {
    slug: "tonegawa",
    bundlePath: "/data/tonegawa/",
    lessons: Object.freeze([
      Object.freeze({ id: "tonegawa-eastward", path: "/lessons/tonegawa-eastward.json", featured: true }),
    ]),
    lessonPath: "/lessons/tonegawa-eastward.json",
    label: { ja: "利根川東遷", en: "Tone River eastward shift" },
    region: { ja: "関東東部", en: "Eastern Kanto" },
    failureMessage: { ja: "利根川東遷の公開データを読み込めませんでした。再試行してください。", en: "The Tone River eastward-shift dataset could not be loaded. Please retry." },
  },
  {
    slug: "heijokyo",
    bundlePath: "/data/heijokyo/",
    lessons: Object.freeze([
      Object.freeze({ id: "heijokyo-intro", path: "/lessons/heijokyo-intro.json", featured: true }),
    ]),
    lessonPath: "/lessons/heijokyo-intro.json",
    label: { ja: "平城京", en: "Heijokyo" },
    region: { ja: "奈良盆地北部", en: "Northern Nara Basin" },
    failureMessage: { ja: "平城京の公開データを読み込めませんでした。再試行してください。", en: "The Heijokyo public dataset could not be loaded. Please retry." },
  },
  {
    slug: "azuchijo",
    bundlePath: "/data/azuchijo/",
    lessons: Object.freeze([
      Object.freeze({ id: "azuchijo-intro", path: "/lessons/azuchijo-intro.json", featured: true }),
    ]),
    lessonPath: "/lessons/azuchijo-intro.json",
    label: { ja: "安土城・琵琶湖東岸", en: "Azuchi Castle and Lake Biwa's east shore" },
    region: { ja: "近江八幡・安土", en: "Azuchi, Omi-Hachiman" },
    failureMessage: { ja: "安土城・琵琶湖東岸の公開データを読み込めませんでした。再試行してください。", en: "The Azuchi Castle public dataset could not be loaded. Please retry." },
  },
  {
    slug: "kinugawa",
    bundlePath: "/data/kinugawa/",
    lessons: Object.freeze([
      Object.freeze({ id: "kinugawa-history", path: "/lessons/kinugawa-history.json", featured: true }),
    ]),
    lessonPath: "/lessons/kinugawa-history.json",
    label: { ja: "鬼怒川・小貝川", en: "Kinugawa and Kokaigawa" },
    region: { ja: "鬼怒川・小貝川流域", en: "Kinugawa–Kokaigawa basin" },
    failureMessage: { ja: "鬼怒川・小貝川の公開データを読み込めませんでした。再試行してください。", en: "The Kinugawa–Kokaigawa public dataset could not be loaded. Please retry." },
  },
  {
    slug: "osaka",
    bundlePath: "/data/osaka/",
    lessons: Object.freeze([
      Object.freeze({ id: "osaka-intro", path: "/lessons/osaka-intro.json", featured: true }),
    ]),
    lessonPath: "/lessons/osaka-intro.json",
    label: { ja: "大坂・石山本願寺", en: "Osaka and Ishiyama Honganji" },
    region: { ja: "大阪市・上町台地", en: "Osaka City and Uemachi Plateau" },
    failureMessage: { ja: "大坂・石山本願寺の公開データを読み込めませんでした。再試行してください。", en: "The Osaka and Ishiyama Honganji public dataset could not be loaded. Please retry." },
  },
  {
    slug: "sekigahara",
    bundlePath: "/data/sekigahara/",
    lessons: Object.freeze([
      Object.freeze({ id: "sekigahara-intro", path: "/lessons/sekigahara-intro.json", featured: true }),
    ]),
    lessonPath: "/lessons/sekigahara-intro.json",
    label: { ja: "関ケ原古戦場・中山道", en: "Sekigahara Battlefield and Nakasendo" },
    region: { ja: "岐阜県関ケ原町", en: "Sekigahara, Gifu" },
    failureMessage: { ja: "関ケ原古戦場の公開データを読み込めませんでした。再試行してください。", en: "The Sekigahara Battlefield public dataset could not be loaded. Please retry." },
  },
]);

const DEFAULT_DATASET = DATASET_CATALOG[0]!;

export function datasetCatalogEntry(slug: string | null | undefined): DatasetCatalogEntry {
  return DATASET_CATALOG.find((entry) => entry.slug === slug) ?? DEFAULT_DATASET;
}

export function datasetFromSearch(search: string): DatasetCatalogEntry {
  return datasetCatalogEntry(new URLSearchParams(search).get("dataset"));
}

export function lessonCatalogEntry(entry: DatasetCatalogEntry, lessonId: string | null | undefined): DatasetCatalogLessonEntry | null {
  if (!lessonId) return null;
  return entry.lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

export function featuredLessonCatalogEntry(entry: DatasetCatalogEntry): DatasetCatalogLessonEntry | null {
  return entry.lessons.find((lesson) => lesson.featured === true) ?? entry.lessons[0] ?? null;
}
