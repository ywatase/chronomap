import type { LessonPackModel, LessonPackStep } from "./lesson-pack-model";

export const LESSON_PACK_TITLE_MAX_LENGTH = 120;
export const LESSON_PACK_CLASS_LABEL_MAX_LENGTH = 80;
export const LESSON_PACK_PROMPT_MAX_LENGTH = 500;

/** Untrusted values collected by the classroom-pack editor. */
export interface LessonPackCustomizationInput {
  readonly title?: unknown;
  readonly classLabel?: unknown;
  readonly selectedStepIds?: unknown;
  readonly promptsByStepId?: unknown;
  readonly includeTeacher?: unknown;
}

/** A validated, normalized classroom-pack customization. */
export interface LessonPackCustomization {
  readonly title: string;
  readonly classLabel: string;
  readonly selectedStepIds: readonly string[];
  readonly promptsByStepId: Readonly<Record<string, string>>;
  readonly includeTeacher: boolean;
}

/**
 * A lesson pack after applying editor choices. The extra fields are kept at
 * this boundary so the existing lesson-pack model and renderer remain useful
 * for the uncustomized pack.
 */
export interface CustomizedLessonPackModel extends LessonPackModel {
  readonly classLabel: string;
  readonly includeTeacher: boolean;
  readonly customization: LessonPackCustomization;
}

/**
 * Normalize editor input against a lesson-pack model.
 *
 * An omitted selection means all lesson steps. An explicit selection must
 * leave at least one known step, otherwise the editor fails closed. Labels and
 * blank prompt overrides fall back to the source model's values.
 */
export function normalizeLessonPackCustomization(
  model: LessonPackModel,
  input: LessonPackCustomizationInput | null | undefined = {},
): LessonPackCustomization | null {
  const draft = isRecord(input) ? input : {};
  const title = boundedText(draft.title, LESSON_PACK_TITLE_MAX_LENGTH) ?? boundedText(model.title, LESSON_PACK_TITLE_MAX_LENGTH) ?? "Chronomap lesson pack";
  const classLabel = boundedText(draft.classLabel, LESSON_PACK_CLASS_LABEL_MAX_LENGTH) ?? boundedText(model.classLabel, LESSON_PACK_CLASS_LABEL_MAX_LENGTH) ?? "";
  const selectedStepIds = selectStepIds(model.steps, draft.selectedStepIds);
  if (!selectedStepIds.length) return null;

  const promptsByStepId = normalizePrompts(model.steps, selectedStepIds, draft.promptsByStepId);
  const includeTeacher = typeof draft.includeTeacher === "boolean" ? draft.includeTeacher : true;
  return Object.freeze({
    title,
    classLabel,
    selectedStepIds: Object.freeze(selectedStepIds),
    promptsByStepId: Object.freeze(promptsByStepId),
    includeTeacher,
  });
}

/** Apply a normalized editor input and remove evidence belonging to omitted steps. */
export function customizeLessonPackModel(
  model: LessonPackModel,
  input: LessonPackCustomizationInput | null | undefined = {},
): CustomizedLessonPackModel | null {
  const customization = normalizeLessonPackCustomization(model, input);
  if (!customization) return null;
  return projectCustomizedModel(model, customization);
}

/** Apply an already-normalized customization, useful when the editor validates before preview. */
export function applyLessonPackCustomization(
  model: LessonPackModel,
  customization: LessonPackCustomization,
): CustomizedLessonPackModel | null {
  const selectedStepIds = selectStepIds(model.steps, customization.selectedStepIds);
  if (!selectedStepIds.length) return null;
  const normalized: LessonPackCustomization = Object.freeze({
    title: boundedText(customization.title, LESSON_PACK_TITLE_MAX_LENGTH) ?? boundedText(model.title, LESSON_PACK_TITLE_MAX_LENGTH) ?? "Chronomap lesson pack",
    classLabel: boundedText(customization.classLabel, LESSON_PACK_CLASS_LABEL_MAX_LENGTH) ?? boundedText(model.classLabel, LESSON_PACK_CLASS_LABEL_MAX_LENGTH) ?? "",
    selectedStepIds: Object.freeze(selectedStepIds),
    promptsByStepId: Object.freeze(normalizePrompts(model.steps, selectedStepIds, customization.promptsByStepId)),
    includeTeacher: typeof customization.includeTeacher === "boolean" ? customization.includeTeacher : true,
  });
  return projectCustomizedModel(model, normalized);
}

function projectCustomizedModel(model: LessonPackModel, customization: LessonPackCustomization): CustomizedLessonPackModel {
  const selectedIds = new Set(customization.selectedStepIds);
  const steps = model.steps
    .filter((step) => selectedIds.has(step.id))
    .map((step) => Object.freeze({ ...step, prompt: customization.promptsByStepId[step.id] ?? step.prompt }));
  const evidenceIds = new Set(steps.flatMap((step) => step.evidence.map((item) => item.id)));
  const sourceIds = new Set(steps.flatMap((step) => step.evidence.map((item) => item.sourceId)));
  const sources = model.sources
    .filter((source) => sourceIds.has(source.id))
    .map((source) => Object.freeze({ ...source, evidence: Object.freeze(source.evidence.filter((item) => evidenceIds.has(item.id))) }))
    .filter((source) => source.evidence.length > 0);
  const startUrl = steps[0]?.shareUrl || model.startUrl;
  return Object.freeze({
    ...model,
    title: customization.title,
    classLabel: customization.classLabel,
    includeTeacher: customization.includeTeacher,
    customization,
    steps: Object.freeze(steps),
    sources: Object.freeze(sources),
    startUrl,
  });
}

function selectStepIds(steps: readonly LessonPackStep[], rawSelection: unknown): string[] {
  if (rawSelection === undefined || rawSelection === null) return steps.map((step) => step.id);
  if (!Array.isArray(rawSelection)) return [];
  const requested = new Set(rawSelection.flatMap((value) => {
    const id = nonEmptyText(value);
    return id ? [id] : [];
  }));
  return steps.filter((step) => requested.has(step.id)).map((step) => step.id);
}

function normalizePrompts(
  steps: readonly LessonPackStep[],
  selectedStepIds: readonly string[],
  rawPrompts: unknown,
): Record<string, string> {
  const values = isRecord(rawPrompts) ? rawPrompts : {};
  const selected = new Set(selectedStepIds);
  return Object.fromEntries(
    steps
      .filter((step) => selected.has(step.id))
      .map((step) => [step.id, boundedText(values[step.id], LESSON_PACK_PROMPT_MAX_LENGTH) ?? boundedText(step.prompt, LESSON_PACK_PROMPT_MAX_LENGTH) ?? ""]),
  );
}

function boundedText(value: unknown, maximum: number): string | null {
  const text = nonEmptyText(value);
  return text ? text.slice(0, maximum) : null;
}

function nonEmptyText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
