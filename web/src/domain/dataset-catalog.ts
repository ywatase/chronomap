export interface DatasetCatalogEntry {
  readonly slug: string;
  readonly bundlePath: string;
  readonly lessonPath: string;
  readonly label: Readonly<{ ja: string; en: string }>;
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
    lessonPath: "/lessons/ogurike-intro.json",
    label: { ja: "巨椋池", en: "Ogurike" },
    failureMessage: { ja: "巨椋池の公開データを読み込めませんでした。再試行してください。", en: "The Ogurike public dataset could not be loaded. Please retry." },
  },
  {
    slug: "tonegawa",
    bundlePath: "/data/tonegawa/",
    lessonPath: "/lessons/tonegawa-eastward.json",
    label: { ja: "利根川東遷", en: "Tone River eastward shift" },
    failureMessage: { ja: "利根川東遷の公開データを読み込めませんでした。再試行してください。", en: "The Tone River eastward-shift dataset could not be loaded. Please retry." },
  },
]);

const DEFAULT_DATASET = DATASET_CATALOG[0]!;

export function datasetCatalogEntry(slug: string | null | undefined): DatasetCatalogEntry {
  return DATASET_CATALOG.find((entry) => entry.slug === slug) ?? DEFAULT_DATASET;
}

export function datasetFromSearch(search: string): DatasetCatalogEntry {
  return datasetCatalogEntry(new URLSearchParams(search).get("dataset"));
}
