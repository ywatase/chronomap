import { comparisonCandidates } from "./comparison-candidates";
import { filterFeaturesByYear } from "./temporal-filter";
import type { LocalizedText, PublicBundle } from "./types";

export interface LessonStep {
  readonly id: string;
  readonly year: number;
  readonly featureId: string;
  readonly prompt: LocalizedText;
  readonly teacherNote?: LocalizedText;
  readonly comparisonEntityId?: string;
}

export interface Lesson {
  readonly id: string;
  readonly dataset: string;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly durationMinutes: number;
  readonly steps: readonly LessonStep[];
}

/** Validates a static lesson against the already validated public bundle. */
export function parseLesson(value: unknown, bundle: PublicBundle): Lesson | null {
  if (!isRecord(value) || !isSlug(value.id) || value.dataset !== datasetSlug(bundle.dataset.id) || !isLocalizedText(value.title) || !isLocalizedText(value.description) || !isPositiveInteger(value.durationMinutes) || !Array.isArray(value.steps) || value.steps.length < 1 || value.steps.length > 12) return null;
  const steps: LessonStep[] = [];
  const ids = new Set<string>();
  const candidates = comparisonCandidates(bundle.features);
  for (const rawStep of value.steps) {
    if (!isRecord(rawStep) || !isSlug(rawStep.id) || ids.has(rawStep.id) || !isInteger(rawStep.year) || typeof rawStep.featureId !== "string" || !isLocalizedText(rawStep.prompt)) return null;
    const teacherNote = parseTeacherNote(rawStep.teacherNote, bundle.dataset.defaultLanguage);
    if (teacherNote === null) return null;
    const feature = bundle.features.find((candidate) => candidate.id === rawStep.featureId);
    if (!feature || feature.properties.publicationStatus !== "public" || filterFeaturesByYear([feature], rawStep.year).length !== 1) return null;
    if (rawStep.comparisonEntityId !== undefined && (typeof rawStep.comparisonEntityId !== "string" || !candidates.some((candidate) => candidate.entityId === rawStep.comparisonEntityId && candidate.versions.some((version) => version.feature.id === feature.id)))) return null;
    ids.add(rawStep.id);
    steps.push({ id: rawStep.id, year: rawStep.year, featureId: rawStep.featureId, prompt: rawStep.prompt, ...(teacherNote ? { teacherNote } : {}), ...(rawStep.comparisonEntityId ? { comparisonEntityId: rawStep.comparisonEntityId } : {}) });
  }
  return Object.freeze({ id: value.id, dataset: value.dataset, title: value.title, description: value.description, durationMinutes: value.durationMinutes, steps: Object.freeze(steps) });
}

export function datasetSlug(datasetId: string): string { return datasetId.split(":", 1)[0] ?? datasetId; }

export function lessonStepIndex(lesson: Lesson, stepId: string | undefined): number | null {
  if (stepId === undefined) return 0;
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : null;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isSlug(value: unknown): value is string { return typeof value === "string" && /^[a-z0-9-]+$/.test(value); }
function isInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value); }
function isPositiveInteger(value: unknown): value is number { return isInteger(value) && value > 0; }
function isLocalizedText(value: unknown): value is LocalizedText { return isRecord(value) && Object.keys(value).length > 0 && Object.values(value).every((text) => typeof text === "string" && text.length > 0); }

function parseTeacherNote(value: unknown, defaultLanguage: string): LocalizedText | null | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value) || Object.keys(value).length === 0 || typeof value[defaultLanguage] !== "string") return null;
  const normalized: Array<readonly [string, string]> = [];
  for (const [language, text] of Object.entries(value)) {
    if (typeof text !== "string") return null;
    const trimmed = text.trim();
    if (trimmed.length < 1 || trimmed.length > 500) return null;
    normalized.push([language, trimmed]);
  }
  return Object.freeze(Object.fromEntries(normalized));
}
