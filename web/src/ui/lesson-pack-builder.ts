import { LESSON_PACK_CLASS_LABEL_MAX_LENGTH, LESSON_PACK_PROMPT_MAX_LENGTH, LESSON_PACK_TITLE_MAX_LENGTH, normalizeLessonPackCustomization } from "../domain/lesson-pack-customization";
import type { LessonPackCustomizationInput } from "../domain/lesson-pack-customization";
import type { LessonPackModel, LessonPackStep } from "../domain/lesson-pack-model";
import type { UiCopy } from "./copy";

export interface LessonPackBuilderActions {
  readonly onPreview: (input: LessonPackCustomizationInput) => void;
  readonly onClose: () => void;
  readonly onReset?: () => void;
  readonly onSaveDraft?: (input: LessonPackCustomizationInput) => void;
  readonly onDraftFile?: (file: File) => void;
}

/** Render the browser-only classroom-pack editor. */
export function renderLessonPackBuilder(
  container: HTMLElement,
  model: LessonPackModel,
  copy: UiCopy,
  actions: LessonPackBuilderActions,
  initialInput: LessonPackCustomizationInput | null | undefined = undefined,
): void {
  container.replaceChildren();
  container.className = "lesson-pack-builder";
  container.dataset.lessonPackBuilder = "";
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "true");
  container.setAttribute("aria-labelledby", "lesson-pack-builder-heading");

  const sheet = document.createElement("article");
  sheet.className = "lesson-pack-builder-sheet";
  container.append(sheet);

  const labels = builderLabels(copy);
  const heading = document.createElement("h2");
  heading.id = "lesson-pack-builder-heading";
  heading.textContent = labels.heading;
  sheet.append(heading);

  const lead = document.createElement("p");
  lead.className = "lesson-pack-builder-lead";
  lead.textContent = labels.lead;
  sheet.append(lead);

  const note = document.createElement("p");
  note.className = "lesson-pack-builder-note";
  note.dataset.lessonPackBuilderNote = "";
  note.textContent = labels.note;
  sheet.append(note);

  const draftSection = document.createElement("section");
  draftSection.className = "lesson-pack-builder-draft";
  draftSection.dataset.lessonPackDraftSection = "";
  const draftNote = document.createElement("p");
  draftNote.className = "lesson-pack-builder-draft-note";
  draftNote.textContent = labels.draftNote;
  const draftActions = document.createElement("div");
  draftActions.className = "lesson-pack-builder-draft-actions";
  const saveDraft = button(labels.draftSave, "lesson-pack-builder-draft-save");
  saveDraft.dataset.lessonPackDraftSave = "";
  const fileLabel = document.createElement("label");
  fileLabel.className = "lesson-pack-builder-draft-file-label";
  fileLabel.dataset.lessonPackDraftFileLabel = "";
  fileLabel.htmlFor = "lesson-pack-draft-file";
  fileLabel.textContent = labels.draftFileLabel;
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "lesson-pack-draft-file";
  fileInput.accept = ".json,application/json";
  fileInput.dataset.lessonPackDraftFile = "";
  const openDraft = button(labels.draftOpen, "lesson-pack-builder-draft-open");
  openDraft.dataset.lessonPackDraftOpen = "";
  draftActions.append(saveDraft, fileLabel, fileInput, openDraft);
  const draftStatus = document.createElement("p");
  draftStatus.className = "lesson-pack-builder-draft-status";
  draftStatus.dataset.lessonPackDraftStatus = "";
  draftStatus.setAttribute("role", "status");
  draftStatus.setAttribute("aria-live", "polite");
  draftSection.append(draftNote, draftActions, draftStatus);
  sheet.append(draftSection);

  const initial = initialValues(model, initialInput);
  const form = document.createElement("form");
  form.dataset.lessonPackBuilderForm = "";
  form.noValidate = true;

  const details = document.createElement("fieldset");
  details.className = "lesson-pack-builder-details";
  const detailsLegend = document.createElement("legend");
  detailsLegend.textContent = labels.details;
  details.append(detailsLegend);
  details.append(textField("lesson-pack-builder-title", "lesson-pack-title", labels.title, initial.title, LESSON_PACK_TITLE_MAX_LENGTH));
  details.append(textField("lesson-pack-builder-class-label", "lesson-pack-class-label", labels.classLabel, initial.classLabel, LESSON_PACK_CLASS_LABEL_MAX_LENGTH));
  form.append(details);

  const stepsFieldset = document.createElement("fieldset");
  stepsFieldset.className = "lesson-pack-builder-steps";
  const stepsLegend = document.createElement("legend");
  stepsLegend.textContent = labels.steps;
  stepsFieldset.append(stepsLegend);
  const selectedIds = new Set(initial.selectedStepIds);
  for (const [index, step] of model.steps.entries()) {
    stepsFieldset.append(renderStepEditor(step, index, selectedIds.has(step.id), initial.promptsByStepId[step.id] ?? step.prompt, labels));
  }
  form.append(stepsFieldset);

  const teacherLabel = document.createElement("label");
  teacherLabel.className = "lesson-pack-builder-teacher";
  const teacher = document.createElement("input");
  teacher.type = "checkbox";
  teacher.name = "includeTeacher";
  teacher.dataset.lessonPackIncludeTeacher = "";
  teacher.checked = initial.includeTeacher;
  teacherLabel.append(teacher, document.createTextNode(labels.includeTeacher));
  form.append(teacherLabel);

  const status = document.createElement("p");
  status.className = "lesson-pack-builder-status";
  status.dataset.lessonPackBuilderStatus = "";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  form.append(status);

  const actionsBar = document.createElement("div");
  actionsBar.className = "lesson-pack-builder-actions";
  const preview = button(labels.preview, "lesson-pack-builder-preview");
  preview.type = "submit";
  preview.dataset.lessonPackBuilderPreview = "";
  const reset = button(labels.reset, "lesson-pack-builder-reset");
  reset.dataset.lessonPackBuilderReset = "";
  const close = button(labels.close, "lesson-pack-builder-close");
  close.dataset.lessonPackBuilderClose = "";
  actionsBar.append(preview, reset, close);
  form.append(actionsBar);
  sheet.append(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = readInput(form);
    const normalized = normalizeLessonPackCustomization(model, input);
    if (!normalized) {
      status.textContent = labels.invalidSelection;
      status.setAttribute("role", "alert");
      status.dataset.valid = "false";
      return;
    }
    status.textContent = labels.previewReady;
    status.setAttribute("role", "status");
    status.dataset.valid = "true";
    actions.onPreview(input);
  });

  saveDraft.addEventListener("click", () => actions.onSaveDraft?.(readInput(form)));
  openDraft.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) actions.onDraftFile?.(file);
    fileInput.value = "";
  });

  reset.addEventListener("click", () => {
    resetInput(form, model);
    status.textContent = "";
    status.setAttribute("role", "status");
    status.dataset.valid = "";
    actions.onReset?.();
  });
  close.addEventListener("click", actions.onClose);
}

interface BuilderLabels {
  readonly heading: string;
  readonly lead: string;
  readonly note: string;
  readonly draftSave: string;
  readonly draftFileLabel: string;
  readonly draftOpen: string;
  readonly draftNote: string;
  readonly details: string;
  readonly title: string;
  readonly classLabel: string;
  readonly steps: string;
  readonly prompt: string;
  readonly includeTeacher: string;
  readonly preview: string;
  readonly reset: string;
  readonly close: string;
  readonly invalidSelection: string;
  readonly previewReady: string;
}

function builderLabels(copy: UiCopy): BuilderLabels {
  if (copy.language === "ja") {
    return {
      heading: copy.lessonWorkshopOpen,
      lead: "既存のガイド教材から、授業用のタイトル・問い・ステップを整えます。",
      note: "入力内容はこのブラウザ内だけで扱われ、再読み込みすると破棄されます。",
      draftSave: copy.lessonPackDraftSave,
      draftFileLabel: copy.lessonPackDraftFileLabel,
      draftOpen: copy.lessonPackDraftOpen,
      draftNote: copy.lessonPackDraftNote,
      details: "教材の基本情報",
      title: "教材タイトル",
      classLabel: copy.lessonPackClassLabel,
      steps: "使うステップと観察する問い",
      prompt: copy.lessonPackObservation,
      includeTeacher: "教員用参照資料を含める",
      preview: "プレビューを開く",
      reset: "初期値に戻す",
      close: "編集を閉じる",
      invalidSelection: "少なくとも1つのステップを選択してください。",
      previewReady: "プレビューを更新しました。",
    };
  }
  return {
    heading: copy.lessonWorkshopOpen,
    lead: "Shape a classroom pack from the guided lesson by choosing its title, prompts, and steps.",
    note: "Draft input stays in this browser and is discarded when the page reloads.",
    draftSave: copy.lessonPackDraftSave,
    draftFileLabel: copy.lessonPackDraftFileLabel,
    draftOpen: copy.lessonPackDraftOpen,
    draftNote: copy.lessonPackDraftNote,
    details: "Pack details",
    title: "Pack title",
    classLabel: copy.lessonPackClassLabel,
    steps: "Steps and observation prompts",
    prompt: copy.lessonPackObservation,
    includeTeacher: "Include teacher reference",
    preview: "Open preview",
    reset: "Reset",
    close: "Close editor",
    invalidSelection: "Select at least one step.",
    previewReady: "Preview updated.",
  };
}

interface BuilderValues {
  readonly title: string;
  readonly classLabel: string;
  readonly selectedStepIds: readonly string[];
  readonly promptsByStepId: Readonly<Record<string, string>>;
  readonly includeTeacher: boolean;
}

function initialValues(model: LessonPackModel, input: LessonPackCustomizationInput | null | undefined): BuilderValues {
  const normalized = input === undefined || input === null ? null : normalizeLessonPackCustomization(model, input);
  const promptsByStepId: Record<string, string> = {};
  for (const step of model.steps) promptsByStepId[step.id] = normalized?.promptsByStepId[step.id] ?? step.prompt;
  return {
    title: normalized?.title ?? model.title,
    classLabel: normalized?.classLabel ?? model.classLabel ?? "",
    selectedStepIds: normalized?.selectedStepIds ?? model.steps.map((step) => step.id),
    promptsByStepId,
    includeTeacher: normalized?.includeTeacher ?? model.includeTeacher !== false,
  };
}

function renderStepEditor(step: LessonPackStep, index: number, selected: boolean, prompt: string, labels: BuilderLabels): HTMLElement {
  const article = document.createElement("article");
  article.className = "lesson-pack-builder-step";
  article.dataset.lessonPackBuilderStep = step.id;

  const selectLabel = document.createElement("label");
  selectLabel.className = "lesson-pack-builder-step-select";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "selectedStepIds";
  checkbox.value = step.id;
  checkbox.dataset.lessonPackStepSelect = "";
  checkbox.dataset.stepId = step.id;
  checkbox.checked = selected;
  const stepText = document.createElement("span");
  stepText.textContent = `${index + 1}. ${step.yearLabel} — ${step.label}`;
  selectLabel.append(checkbox, stepText);

  const promptLabel = document.createElement("label");
  promptLabel.className = "lesson-pack-builder-prompt-label";
  const promptId = `lesson-pack-builder-prompt-${index}`;
  promptLabel.htmlFor = promptId;
  promptLabel.textContent = labels.prompt;
  const textarea = document.createElement("textarea");
  textarea.id = promptId;
  textarea.name = `prompt-${step.id}`;
  textarea.dataset.lessonPackPrompt = "";
  textarea.dataset.stepId = step.id;
  textarea.rows = 3;
  textarea.maxLength = LESSON_PACK_PROMPT_MAX_LENGTH;
  textarea.value = prompt;
  promptLabel.append(textarea);
  article.append(selectLabel, promptLabel);
  return article;
}

function textField(id: string, dataName: string, labelText: string, value: string, maxLength: number): HTMLElement {
  const wrapper = document.createElement("label");
  wrapper.className = "lesson-pack-builder-field";
  wrapper.htmlFor = id;
  wrapper.append(document.createTextNode(labelText));
  const input = document.createElement("input");
  input.type = "text";
  input.id = id;
  input.name = dataName;
  input.setAttribute(`data-${dataName}`, "");
  input.maxLength = maxLength;
  input.value = value;
  wrapper.append(input);
  return wrapper;
}

function readInput(form: HTMLFormElement): LessonPackCustomizationInput {
  const title = form.querySelector<HTMLInputElement>("[data-lesson-pack-title]")?.value ?? "";
  const classLabel = form.querySelector<HTMLInputElement>("[data-lesson-pack-class-label]")?.value ?? "";
  const selectedStepIds = [...form.querySelectorAll<HTMLInputElement>("[data-lesson-pack-step-select]:checked")].map((input) => input.value);
  const promptsByStepId = Object.fromEntries(
    [...form.querySelectorAll<HTMLTextAreaElement>("[data-lesson-pack-prompt]")]
      .map((input) => [input.dataset.stepId ?? "", input.value])
      .filter(([id]) => id.length > 0),
  );
  const includeTeacher = form.querySelector<HTMLInputElement>("[data-lesson-pack-include-teacher]")?.checked ?? true;
  return { title, classLabel, selectedStepIds, promptsByStepId, includeTeacher };
}

/** Read the current editor fields for portable draft export. */
export function readLessonPackBuilderInput(container: ParentNode): LessonPackCustomizationInput {
  const form = container.querySelector<HTMLFormElement>("[data-lesson-pack-builder-form]");
  return form ? readInput(form) : { title: "", classLabel: "", selectedStepIds: [], promptsByStepId: {}, includeTeacher: true };
}

/** Apply a validated draft to the rendered editor without changing unrelated page state. */
export function applyLessonPackBuilderInput(
  container: ParentNode,
  model: LessonPackModel,
  input: LessonPackCustomizationInput,
): boolean {
  const form = container.querySelector<HTMLFormElement>("[data-lesson-pack-builder-form]");
  if (!form) return false;
  const normalized = normalizeLessonPackCustomization(model, input);
  if (!normalized) return false;
  const title = form.querySelector<HTMLInputElement>("[data-lesson-pack-title]");
  if (title) title.value = normalized.title;
  const classLabel = form.querySelector<HTMLInputElement>("[data-lesson-pack-class-label]");
  if (classLabel) classLabel.value = normalized.classLabel;
  const selectedIds = new Set(normalized.selectedStepIds);
  for (const checkbox of form.querySelectorAll<HTMLInputElement>("[data-lesson-pack-step-select]")) {
    checkbox.checked = selectedIds.has(checkbox.dataset.stepId ?? "");
  }
  for (const textarea of form.querySelectorAll<HTMLTextAreaElement>("[data-lesson-pack-prompt]")) {
    const stepId = textarea.dataset.stepId ?? "";
    const step = model.steps.find((candidate) => candidate.id === stepId);
    textarea.value = normalized.promptsByStepId[stepId] ?? step?.prompt ?? "";
  }
  const includeTeacher = form.querySelector<HTMLInputElement>("[data-lesson-pack-include-teacher]");
  if (includeTeacher) includeTeacher.checked = normalized.includeTeacher;
  return true;
}

function resetInput(form: HTMLFormElement, model: LessonPackModel): void {
  const title = form.querySelector<HTMLInputElement>("[data-lesson-pack-title]");
  if (title) title.value = model.title;
  const classLabel = form.querySelector<HTMLInputElement>("[data-lesson-pack-class-label]");
  if (classLabel) classLabel.value = model.classLabel ?? "";
  const selectedIds = new Set(model.steps.map((step) => step.id));
  for (const checkbox of form.querySelectorAll<HTMLInputElement>("[data-lesson-pack-step-select]")) checkbox.checked = selectedIds.has(checkbox.dataset.stepId ?? "");
  for (const textarea of form.querySelectorAll<HTMLTextAreaElement>("[data-lesson-pack-prompt]")) {
    const step = model.steps.find((candidate) => candidate.id === textarea.dataset.stepId);
    if (step) textarea.value = step.prompt;
  }
  const includeTeacher = form.querySelector<HTMLInputElement>("[data-lesson-pack-include-teacher]");
  if (includeTeacher) includeTeacher.checked = model.includeTeacher !== false;
}

function button(label: string, className: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}
