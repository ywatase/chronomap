import { displayYearLocalized, localizedText, recordedYears } from "./labels";
import type { Lesson } from "./lesson";
import type { DatasetCatalogEntry } from "./dataset-catalog";
import type { PublicBundle } from "./types";

export interface DatasetCatalogSnapshot {
  readonly bundle: PublicBundle | null;
  readonly lesson: Lesson | null;
}

export type DatasetCatalogSnapshots = Readonly<Record<string, DatasetCatalogSnapshot>>;

export interface DatasetCatalogLessonModel {
  readonly id: string;
  readonly title: string;
  readonly durationMinutes: number;
  readonly stepCount: number;
  readonly firstStepId: string;
}

export interface DatasetCatalogCardModel {
  readonly slug: string;
  readonly region: string;
  readonly title: string;
  readonly description: string;
  readonly years: readonly number[];
  readonly yearLabels: readonly string[];
  readonly featureCount: number;
  readonly entityCount: number;
  readonly sourceCount: number;
  readonly lesson: DatasetCatalogLessonModel | null;
  readonly status: "available" | "unavailable";
  readonly availabilityMessage: string;
  readonly mapUrl: string;
  readonly lessonUrl: string | null;
}

export interface DatasetCatalogViewModel {
  readonly language: "ja" | "en";
  readonly cards: readonly DatasetCatalogCardModel[];
}

export function buildDatasetCatalogViewModel(
  entries: readonly DatasetCatalogEntry[],
  snapshots: DatasetCatalogSnapshots,
  language: "ja" | "en",
  baseUrl: string,
): DatasetCatalogViewModel {
  const cards = entries.map((entry) => {
    const snapshot = snapshots[entry.slug];
    const bundle = snapshot?.bundle ?? null;
    const lesson = snapshot?.lesson ?? null;
    const years = bundle ? recordedYears(bundle.features) : [];
    const lessonModel = lesson ? lessonViewModel(lesson, language) : null;
    const mapUrl = datasetUrl(baseUrl, entry.slug);
    return Object.freeze({
      slug: entry.slug,
      region: entry.region[language],
      title: bundle ? localizedText(bundle.dataset.title, language) : entry.label[language],
      description: bundle ? localizedText(bundle.dataset.description, language) : "",
      years: Object.freeze([...years]),
      yearLabels: Object.freeze(years.map((year) => displayYearLocalized(year, language))),
      featureCount: bundle?.features.length ?? 0,
      entityCount: bundle ? Object.keys(bundle.entitiesById).length : 0,
      sourceCount: bundle ? Object.keys(bundle.sourcesById).length : 0,
      lesson: lessonModel,
      status: bundle ? "available" as const : "unavailable" as const,
      availabilityMessage: bundle ? "" : entry.failureMessage[language],
      mapUrl,
      lessonUrl: lessonModel ? datasetUrl(baseUrl, entry.slug, lessonModel.id, lessonModel.firstStepId) : null,
    });
  });
  return Object.freeze({ language, cards: Object.freeze(cards) });
}

function lessonViewModel(lesson: Lesson, language: "ja" | "en"): DatasetCatalogLessonModel {
  return Object.freeze({
    id: lesson.id,
    title: localizedText(lesson.title, language),
    durationMinutes: lesson.durationMinutes,
    stepCount: lesson.steps.length,
    firstStepId: lesson.steps[0]!.id,
  });
}

function datasetUrl(baseUrl: string, slug: string, lessonId?: string, stepId?: string): string {
  const url = new URL(baseUrl || "/", "https://chronomap.invalid");
  url.search = "";
  url.hash = "";
  url.searchParams.set("dataset", slug);
  if (lessonId) url.searchParams.set("lesson", lessonId);
  if (stepId) url.searchParams.set("step", stepId);
  return `${url.pathname || "/"}${url.search}`;
}
