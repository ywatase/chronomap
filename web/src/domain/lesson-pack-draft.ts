import { datasetSlug } from "./lesson";
import {
  LESSON_PACK_CLASS_LABEL_MAX_LENGTH,
  LESSON_PACK_PROMPT_MAX_LENGTH,
  LESSON_PACK_TITLE_MAX_LENGTH,
  normalizeLessonPackCustomization,
  type LessonPackCustomization,
  type LessonPackCustomizationInput,
} from "./lesson-pack-customization";
import type { LessonPackModel } from "./lesson-pack-model";

export const LESSON_PACK_DRAFT_SCHEMA_VERSION = 1 as const;
export const LESSON_PACK_DRAFT_MAX_BYTES = 64 * 1024;

export interface LessonPackDraft {
  readonly schemaVersion: typeof LESSON_PACK_DRAFT_SCHEMA_VERSION;
  readonly dataset: string;
  readonly lesson: string;
  readonly customization: LessonPackCustomization;
}

export interface LessonPackDraftIdentity {
  readonly dataset: string;
  readonly lesson: string;
}

const DRAFT_KEYS = ["schemaVersion", "dataset", "lesson", "customization"] as const;
const CUSTOMIZATION_KEYS = ["title", "classLabel", "selectedStepIds", "promptsByStepId", "includeTeacher"] as const;

/** Project only normalized editor values into the portable, privacy-safe draft contract. */
export function buildLessonPackDraft(model: LessonPackModel, input: LessonPackCustomizationInput | null | undefined = {}): LessonPackDraft | null {
  const lesson = model.lessonId;
  if (typeof lesson !== "string" || lesson.length === 0) return null;
  const customization = normalizeLessonPackCustomization(model, input);
  if (!customization) return null;
  return Object.freeze({
    schemaVersion: LESSON_PACK_DRAFT_SCHEMA_VERSION,
    dataset: datasetSlug(model.datasetId),
    lesson,
    customization: Object.freeze({
      title: customization.title,
      classLabel: customization.classLabel,
      selectedStepIds: Object.freeze([...customization.selectedStepIds]),
      promptsByStepId: Object.freeze({ ...customization.promptsByStepId }),
      includeTeacher: customization.includeTeacher,
    }),
  });
}

/** Serialize a normalized draft as compact UTF-8 JSON, or return null for invalid input/oversize output. */
export function serializeLessonPackDraft(model: LessonPackModel, input: LessonPackCustomizationInput | null | undefined = {}): string | null {
  const draft = buildLessonPackDraft(model, input);
  if (!draft) return null;
  const serialized = JSON.stringify(draft);
  return utf8ByteLength(serialized) <= LESSON_PACK_DRAFT_MAX_BYTES ? serialized : null;
}

/** Read only the strict envelope identity before a matching lesson model is available. */
export function parseLessonPackDraftIdentity(serialized: unknown): LessonPackDraftIdentity | null {
  const value = parseDraftEnvelope(serialized);
  return value ? { dataset: value.dataset, lesson: value.lesson } : null;
}

/** Parse and strictly validate a portable draft against this exact dataset, lesson, and step set. */
export function parseLessonPackDraft(model: LessonPackModel, serialized: unknown): LessonPackCustomization | null {
  const value = parseDraftEnvelope(serialized);
  if (!value) return null;
  if (value.dataset !== datasetSlug(model.datasetId) || value.lesson !== model.lessonId) return null;
  if (!isPlainObject(value.customization) || !hasExactKeys(value.customization, CUSTOMIZATION_KEYS)) return null;

  const rawCustomization = value.customization;
  if (typeof rawCustomization.title !== "string" || rawCustomization.title.length > LESSON_PACK_TITLE_MAX_LENGTH) return null;
  if (typeof rawCustomization.classLabel !== "string" || rawCustomization.classLabel.length > LESSON_PACK_CLASS_LABEL_MAX_LENGTH) return null;
  if (typeof rawCustomization.includeTeacher !== "boolean") return null;
  if (!Array.isArray(rawCustomization.selectedStepIds) || rawCustomization.selectedStepIds.length === 0) return null;
  if (!isPlainObject(rawCustomization.promptsByStepId)) return null;

  const knownStepIds = new Set(model.steps.map((step) => step.id));
  const selectedStepIds = rawCustomization.selectedStepIds;
  const selectedSet = new Set<string>();
  for (const id of selectedStepIds) {
    if (typeof id !== "string" || !knownStepIds.has(id) || selectedSet.has(id)) return null;
    selectedSet.add(id);
  }
  for (const key of Object.keys(rawCustomization.promptsByStepId)) {
    if (key === "__proto__" || !knownStepIds.has(key) || !selectedSet.has(key) || typeof rawCustomization.promptsByStepId[key] !== "string") return null;
    if (rawCustomization.promptsByStepId[key].length > LESSON_PACK_PROMPT_MAX_LENGTH) return null;
  }
  for (const id of selectedSet) {
    if (!hasOwn(rawCustomization.promptsByStepId, id)) return null;
  }
  return normalizeLessonPackCustomization(model, rawCustomization);
}

/** Return the deterministic filename used by browser downloads. */
export function draftFilename(model: LessonPackModel): string {
  const dataset = safeFilenamePart(datasetSlug(model.datasetId)) || "dataset";
  const lesson = safeFilenamePart(model.lessonId ?? "lesson") || "lesson";
  return `chronomap-${dataset}-${lesson}-draft.json`;
}

export const exportLessonPackDraft = serializeLessonPackDraft;
export const importLessonPackDraft = parseLessonPackDraft;

function parseDraftEnvelope(serialized: unknown): (Record<string, any> & { dataset: string; lesson: string }) | null {
  if (typeof serialized !== "string" || utf8ByteLength(serialized) > LESSON_PACK_DRAFT_MAX_BYTES) return null;
  let value: unknown;
  try { value = JSON.parse(serialized); }
  catch { return null; }
  if (!isPlainObject(value) || !hasExactKeys(value, DRAFT_KEYS)) return null;
  if (value.schemaVersion !== LESSON_PACK_DRAFT_SCHEMA_VERSION || typeof value.dataset !== "string" || value.dataset.length === 0 || typeof value.lesson !== "string" || value.lesson.length === 0) return null;
  if (!isPlainObject(value.customization) || !hasExactKeys(value.customization, CUSTOMIZATION_KEYS)) return null;
  return value as Record<string, any> & { dataset: string; lesson: string };
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key) && key !== "__proto__");
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function safeFilenamePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}
