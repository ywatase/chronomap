import { displayYearLocalized, localizedText, recordedYears } from "./labels";
import type { Lesson } from "./lesson";
import type { DatasetCatalogEntry, DatasetCatalogLessonEntry } from "./dataset-catalog";
import type { PublicBundle } from "./types";

export interface DatasetCatalogSnapshot {
  readonly bundle: PublicBundle | null;
  /** Backward-compatible featured/active lesson projection. */
  readonly lesson?: Lesson | null;
  /** Lesson manifests keyed by the catalog allow-list ID. */
  readonly lessons?: Readonly<Record<string, Lesson | null>>;
}

export type DatasetCatalogSnapshots = Readonly<Record<string, DatasetCatalogSnapshot>>;

export interface DatasetCatalogLessonModel {
  readonly id: string;
  readonly title: string;
  readonly durationMinutes: number;
  readonly stepCount: number;
  readonly firstStepId: string;
  readonly path?: string;
  readonly featured?: boolean;
  readonly status?: "available" | "unavailable";
  readonly availabilityMessage?: string;
  readonly lessonUrl?: string;
  readonly builderUrl?: string;
  readonly packUrl?: string;
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
  readonly lessons?: readonly DatasetCatalogLessonModel[];
  readonly status: "available" | "unavailable";
  readonly availabilityMessage: string;
  readonly mapUrl: string;
  readonly lessonUrl: string | null;
  readonly builderUrl: string | null;
}

export interface DatasetCatalogFeaturedModel {
  readonly slug: string;
  readonly title: string;
  readonly lessonTitle: string;
  readonly lessonDurationMinutes: number;
  readonly packUrl: string;
  readonly builderUrl: string;
}

export interface DatasetCatalogViewModel {
  readonly language: "ja" | "en";
  readonly featured?: DatasetCatalogFeaturedModel | null;
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
    const years = bundle ? recordedYears(bundle.features) : [];
    const lessonModels = entry.lessons.map((catalogLesson) => {
      const lesson = lessonForEntry(snapshot, catalogLesson.id);
      return lessonViewModel(catalogLesson, lesson, language, baseUrl, entry.slug, bundle ? datasetUrl(baseUrl, entry.slug, catalogLesson.id, lesson?.steps[0]?.id) : undefined);
    });
    const lessonModel = featuredLessonModel(entry, lessonModels);
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
      lessons: Object.freeze(lessonModels),
      status: bundle ? "available" as const : "unavailable" as const,
      availabilityMessage: bundle ? "" : entry.failureMessage[language],
      mapUrl,
      lessonUrl: lessonModel?.lessonUrl ?? null,
      builderUrl: lessonModel?.builderUrl ?? null,
    });
  });
  const featuredCard = cards.find((card) => card.slug === "ogurike" && card.status === "available" && card.lesson)
    ?? cards.find((card) => card.status === "available" && card.lesson);
  const featured = featuredCard?.lesson
    ? Object.freeze({
      slug: featuredCard.slug,
      title: featuredCard.title,
      lessonTitle: featuredCard.lesson.title,
      lessonDurationMinutes: featuredCard.lesson.durationMinutes,
      packUrl: datasetUrl(baseUrl, featuredCard.slug, featuredCard.lesson.id, undefined, "pack"),
      builderUrl: featuredCard.builderUrl!,
    })
    : null;
  return Object.freeze({ language, featured, cards: Object.freeze(cards) });
}

function lessonForEntry(snapshot: DatasetCatalogSnapshot | undefined, lessonId: string): Lesson | null {
  if (!snapshot) return null;
  if (snapshot.lessons && Object.prototype.hasOwnProperty.call(snapshot.lessons, lessonId)) return snapshot.lessons[lessonId] ?? null;
  return snapshot.lesson?.id === lessonId ? snapshot.lesson : null;
}

function lessonViewModel(catalogLesson: DatasetCatalogLessonEntry, lesson: Lesson | null, language: "ja" | "en", baseUrl: string, slug: string, lessonUrl: string | undefined): DatasetCatalogLessonModel {
  const base = {
    id: catalogLesson.id,
    title: lesson ? localizedText(lesson.title, language) : catalogLesson.id,
    durationMinutes: lesson?.durationMinutes ?? 0,
    stepCount: lesson?.steps.length ?? 0,
    firstStepId: lesson?.steps[0]?.id ?? "",
    path: catalogLesson.path,
    featured: catalogLesson.featured === true,
    status: lesson ? "available" as const : "unavailable" as const,
    availabilityMessage: "",
  };
  return Object.freeze({
    ...base,
    ...(lesson ? {
      lessonUrl,
      builderUrl: datasetUrl(baseUrl, slug, lesson.id, undefined, "builder"),
      packUrl: datasetUrl(baseUrl, slug, lesson.id, undefined, "pack"),
    } : {}),
  });
}

function featuredLessonModel(entry: DatasetCatalogEntry, lessons: readonly DatasetCatalogLessonModel[]): DatasetCatalogLessonModel | null {
  const featuredIndex = entry.lessons.findIndex((lesson) => lesson.featured === true);
  const featured = featuredIndex >= 0 ? lessons[featuredIndex] : undefined;
  if (featured?.status === "available") return featured;
  return lessons.find((lesson) => lesson.status === "available") ?? null;
}

function datasetUrl(baseUrl: string, slug: string, lessonId?: string, stepId?: string, view?: "pack" | "builder"): string {
  const url = new URL(baseUrl || "/", "https://chronomap.invalid");
  url.search = "";
  url.hash = "";
  url.searchParams.set("dataset", slug);
  if (lessonId) url.searchParams.set("lesson", lessonId);
  if (stepId) url.searchParams.set("step", stepId);
  if (view) url.searchParams.set("view", view);
  return `${url.pathname || "/"}${url.search}`;
}
