import { LESSON_PACK_CLASS_LABEL_MAX_LENGTH, LESSON_PACK_PROMPT_MAX_LENGTH, LESSON_PACK_TITLE_MAX_LENGTH, normalizeLessonPackCustomization } from "../domain/lesson-pack-customization";
import { projectLessonPackFigureFromSteps } from "../domain/lesson-pack-figure";
import type { LessonPackCustomizationInput } from "../domain/lesson-pack-customization";
import type { LessonPackModel, LessonPackStep } from "../domain/lesson-pack-model";
import type { LessonPackOfferPlan } from "../domain/lesson-pack-pilot";
import type { UiCopy } from "./copy";

export interface LessonPackBuilderActions {
  readonly onPreview: (input: LessonPackCustomizationInput) => void;
  readonly onClose: () => void;
  readonly onReset?: () => void;
  readonly onSaveDraft?: (input: LessonPackCustomizationInput) => void;
  readonly onDraftFile?: (file: File) => void;
  readonly initialOfferPlan?: LessonPackOfferPlan;
}

export type LessonPackBuilderSummaryState = "ready" | "editing" | "invalid";

/**
 * Privacy-safe, renderable facts about the classroom pack outcome.
 *
 * This view model intentionally contains counts and output capabilities only;
 * it never copies a title, class label, or observation prompt into the
 * summary surface.
 */
export interface LessonPackBuilderSummary {
  readonly state: LessonPackBuilderSummaryState;
  readonly selectedStepCount: number;
  readonly totalStepCount: number;
  readonly durationMinutes: number;
  readonly studentWorksheet: boolean;
  readonly teacherReference: boolean;
  readonly sources: boolean;
  readonly qrLinks: boolean;
  readonly observationFigure: boolean;
  readonly a4Pdf: boolean;
  readonly recipientPrint: boolean;
  readonly sourceCount: number;
  readonly canPreview: boolean;
}

/** Derive the outcome summary from the model and the current editor values. */
export function deriveLessonPackBuilderSummary(
  model: LessonPackModel,
  input: LessonPackCustomizationInput | null | undefined = undefined,
): LessonPackBuilderSummary {
  const defaults = initialValues(model, undefined);
  const values = summaryValues(model, input, defaults);
  const selectedStepCount = values.selectedStepIds.length;
  const valid = selectedStepCount > 0;
  const sameAsDefaults = valid && builderValuesEqual(values, defaults);
  const selectedIds = new Set(values.selectedStepIds);
  const observationFigure = valid && projectLessonPackFigureFromSteps(
    model.steps
      .filter((step) => selectedIds.has(step.id))
      .map((step, index) => ({
        featureId: step.featureId,
        geometry: step.featureGeometry,
        label: step.label,
        yearLabel: step.yearLabel,
        stepNumber: index + 1,
      })),
    model.datasetBbox,
  ) !== null;
  return Object.freeze({
    state: valid ? (sameAsDefaults ? "ready" : "editing") : "invalid",
    selectedStepCount,
    totalStepCount: model.steps.length,
    durationMinutes: model.durationMinutes,
    studentWorksheet: valid,
    teacherReference: valid && values.includeTeacher,
    sources: valid && values.includeTeacher,
    qrLinks: valid && Boolean(model.startUrl || model.steps.some((step) => step.shareUrl)),
    observationFigure,
    a4Pdf: valid,
    recipientPrint: valid,
    sourceCount: model.sources.length,
    canPreview: valid,
  });
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

  if (actions.initialOfferPlan) {
    const offer = document.createElement("p");
    offer.className = "lesson-pack-builder-offer";
    offer.dataset.lessonPackBuilderOffer = actions.initialOfferPlan;
    offer.textContent = copy.lessonPackBuilderOffer(
      copy.datasetCatalogOfferTitles[actions.initialOfferPlan],
      copy.datasetCatalogOfferPrices[actions.initialOfferPlan],
    );
    sheet.append(offer);
  }

  const layout = document.createElement("div");
  layout.className = "lesson-pack-builder-layout";
  const summaryElements = renderSummaryShell(labels);
  if (model.teachingGuide) {
    const guide = document.createElement("section");
    guide.className = "lesson-pack-builder-guide";
    guide.dataset.lessonPackBuilderTeachingGuide = "";
    const heading = document.createElement("h4");
    heading.textContent = copy.language === "ja" ? "授業設計" : "Teaching fit";
    const fit = document.createElement("p");
    fit.append(label(copy.language === "ja" ? "利用の目安" : "Teaching fit"), document.createTextNode(model.teachingGuide.recommendedFor));
    const goal = document.createElement("p");
    goal.append(label(copy.language === "ja" ? "学習のねらい" : "Learning goal"), document.createTextNode(model.teachingGuide.learningGoal));
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = copy.language === "ja" ? "授業での使い方を見る" : "See classroom use";
    const preparation = document.createElement("h5");
    preparation.textContent = copy.language === "ja" ? "準備" : "Preparation";
    const list = document.createElement("ul");
    for (const item of model.teachingGuide.preparation) {
      const line = document.createElement("li");
      line.textContent = item;
      list.append(line);
    }
    const assessment = document.createElement("p");
    assessment.append(label(copy.language === "ja" ? "見取りの例" : "Assessment example"), document.createTextNode(model.teachingGuide.assessment));
    details.append(summary, preparation, list, assessment);
    if (model.teachingGuide.usageNote) {
      const note = document.createElement("p");
      note.append(label(copy.language === "ja" ? "調整メモ" : "Adaptation note"), document.createTextNode(model.teachingGuide.usageNote));
      details.append(note);
    }
    guide.append(heading, fit, goal, details);
    summaryElements.container.append(guide);
  }
  const main = document.createElement("div");
  main.className = "lesson-pack-builder-main";
  layout.append(summaryElements.container, main);
  sheet.append(layout, summaryElements.mobileAction);

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

  const initial = initialValues(model, initialInput);
  const form = document.createElement("form");
  form.id = "lesson-pack-builder-form";
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
  stepsFieldset.dataset.lessonPackBuilderSteps = "";
  stepsFieldset.tabIndex = -1;
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
  const preview = button(labels.summaryPreview, "lesson-pack-builder-preview");
  preview.type = "submit";
  preview.dataset.lessonPackBuilderPreview = "";
  const reset = button(labels.reset, "lesson-pack-builder-reset");
  reset.dataset.lessonPackBuilderReset = "";
  const close = button(labels.close, "lesson-pack-builder-close");
  close.dataset.lessonPackBuilderClose = "";
  actionsBar.append(preview, reset, close);
  form.append(actionsBar);
  main.append(form, draftSection);

  const refreshSummary = () => {
    renderSummary(summaryElements, deriveLessonPackBuilderSummary(model, readInput(form)), labels);
  };
  const focusInvalidSteps = () => {
    try { stepsFieldset.focus({ preventScroll: true }); } catch { stepsFieldset.focus(); }
    scrollBuilderElement(stepsFieldset, { block: "center", behavior: "smooth" });
  };
  const submitPreview = () => {
    const input = readInput(form);
    const normalized = normalizeLessonPackCustomization(model, input);
    if (!normalized) {
      status.textContent = labels.invalidSelection;
      status.setAttribute("role", "alert");
      status.dataset.valid = "false";
      refreshSummary();
      focusInvalidSteps();
      return;
    }
    status.textContent = labels.previewReady;
    status.setAttribute("role", "status");
    status.dataset.valid = "true";
    actions.onPreview(input);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitPreview();
  });
  form.addEventListener("input", () => {
    refreshSummary();
    if (status.dataset.valid === "false" && deriveLessonPackBuilderSummary(model, readInput(form)).canPreview) {
      status.textContent = "";
      status.setAttribute("role", "status");
      status.dataset.valid = "";
    }
  });
  form.addEventListener("change", () => {
    refreshSummary();
    if (status.dataset.valid === "false" && deriveLessonPackBuilderSummary(model, readInput(form)).canPreview) {
      status.textContent = "";
      status.setAttribute("role", "status");
      status.dataset.valid = "";
    }
  });

  summaryElements.preview.addEventListener("click", submitPreview);
  summaryElements.mobilePreview.addEventListener("click", submitPreview);
  summaryElements.edit.addEventListener("click", () => {
    scrollBuilderElement(form, { block: "start", behavior: "smooth" });
    form.querySelector<HTMLInputElement>("[data-lesson-pack-title]")?.focus();
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
    refreshSummary();
    actions.onReset?.();
  });
  close.addEventListener("click", actions.onClose);
  refreshSummary();
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
  readonly summaryHeading: string;
  readonly summaryLead: string;
  readonly summarySteps: (selected: number, total: number) => string;
  readonly summaryDurationLabel: string;
  readonly summaryDuration: (minutes: number) => string;
  readonly summaryStudent: string;
  readonly summaryTeacher: string;
  readonly summarySources: string;
  readonly summaryLinks: string;
  readonly summaryPrint: string;
  readonly summaryFigure: string;
  readonly summaryPreview: string;
  readonly summaryEdit: string;
  readonly summaryInvalid: string;
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
      note: "入力内容はこのブラウザ内だけで扱われます。保存しない編集は再読み込みで破棄されるため、必要なら下書きをファイル保存してください。",
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
      summaryHeading: copy.lessonPackBuilderSummary,
      summaryLead: copy.lessonPackBuilderSummaryLead,
      summarySteps: copy.lessonPackBuilderSummarySteps,
      summaryDurationLabel: copy.language === "ja" ? "所要時間" : "Duration",
      summaryDuration: copy.lessonPackBuilderSummaryDuration,
      summaryStudent: copy.lessonPackBuilderSummaryStudent,
      summaryTeacher: copy.lessonPackBuilderSummaryTeacher,
      summarySources: copy.lessonPackBuilderSummarySources,
      summaryLinks: copy.lessonPackBuilderSummaryLinks,
      summaryPrint: copy.lessonPackBuilderSummaryPrint,
      summaryFigure: copy.lessonPackBuilderSummaryFigure,
      summaryPreview: copy.lessonPackBuilderSummaryPreview,
      summaryEdit: copy.lessonPackBuilderSummaryEdit,
      summaryInvalid: copy.lessonPackBuilderSummaryInvalid,
      preview: copy.lessonPackBuilderSummaryPreview,
      reset: "初期値に戻す",
      close: "編集を閉じる",
      invalidSelection: "少なくとも1つのステップを選択してください。",
      previewReady: "プレビューを更新しました。",
    };
  }
  return {
    heading: copy.lessonWorkshopOpen,
    lead: "Shape a classroom pack from the guided lesson by choosing its title, prompts, and steps.",
    note: "Draft input stays in this browser. Unsaved edits are discarded on reload; save a draft file when you need to continue later.",
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
    summaryHeading: copy.lessonPackBuilderSummary,
    summaryLead: copy.lessonPackBuilderSummaryLead,
    summarySteps: copy.lessonPackBuilderSummarySteps,
    summaryDurationLabel: "Duration",
    summaryDuration: copy.lessonPackBuilderSummaryDuration,
    summaryStudent: copy.lessonPackBuilderSummaryStudent,
    summaryTeacher: copy.lessonPackBuilderSummaryTeacher,
    summarySources: copy.lessonPackBuilderSummarySources,
    summaryLinks: copy.lessonPackBuilderSummaryLinks,
    summaryPrint: copy.lessonPackBuilderSummaryPrint,
    summaryFigure: copy.lessonPackBuilderSummaryFigure,
    summaryPreview: copy.lessonPackBuilderSummaryPreview,
    summaryEdit: copy.lessonPackBuilderSummaryEdit,
    summaryInvalid: copy.lessonPackBuilderSummaryInvalid,
    preview: copy.lessonPackBuilderSummaryPreview,
    reset: "Reset",
    close: "Close editor",
    invalidSelection: "Select at least one step.",
    previewReady: "Preview updated.",
  };
}

interface BuilderSummaryElements {
  readonly container: HTMLElement;
  readonly status: HTMLElement;
  readonly count: HTMLElement;
  readonly duration: HTMLElement;
  readonly outputs: HTMLElement;
  readonly preview: HTMLButtonElement;
  readonly mobilePreview: HTMLButtonElement;
  readonly mobileAction: HTMLElement;
  readonly edit: HTMLButtonElement;
}

function renderSummaryShell(labels: BuilderLabels): BuilderSummaryElements {
  const container = document.createElement("aside");
  container.className = "lesson-pack-builder-summary";
  container.dataset.lessonPackBuilderSummary = "";
  container.setAttribute("aria-labelledby", "lesson-pack-builder-summary-heading");

  const heading = document.createElement("h3");
  heading.id = "lesson-pack-builder-summary-heading";
  heading.textContent = labels.summaryHeading;
  const lead = document.createElement("p");
  lead.className = "lesson-pack-builder-summary-lead";
  lead.textContent = labels.summaryLead;
  const status = document.createElement("p");
  status.className = "lesson-pack-builder-summary-status";
  status.id = "lesson-pack-builder-summary-status";
  status.dataset.lessonPackSummaryStatus = "";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const facts = document.createElement("dl");
  facts.className = "lesson-pack-builder-summary-facts";
  const countTerm = document.createElement("dt");
  countTerm.textContent = labels.steps;
  const count = document.createElement("dd");
  count.dataset.lessonPackSummaryCount = "";
  const durationTerm = document.createElement("dt");
  durationTerm.textContent = labels.summaryDurationLabel;
  const duration = document.createElement("dd");
  duration.dataset.lessonPackSummaryDuration = "";
  facts.append(countTerm, count, durationTerm, duration);
  const outputs = document.createElement("ul");
  outputs.className = "lesson-pack-builder-summary-outputs";
  outputs.dataset.lessonPackSummaryOutputs = "";
  const actions = document.createElement("div");
  actions.className = "lesson-pack-builder-summary-actions";
  const preview = button(labels.summaryPreview, "lesson-pack-builder-summary-preview");
  preview.dataset.lessonPackBuilderSummaryCta = "";
  preview.setAttribute("aria-describedby", "lesson-pack-builder-summary-status");
  const edit = button(labels.summaryEdit, "lesson-pack-builder-summary-edit");
  edit.dataset.lessonPackBuilderEdit = "";
  edit.setAttribute("aria-controls", "lesson-pack-builder-form");
  actions.append(preview, edit);
  const mobileAction = document.createElement("div");
  mobileAction.className = "lesson-pack-builder-mobile-action";
  const mobilePreview = button(labels.summaryPreview, "lesson-pack-builder-mobile-preview");
  mobilePreview.dataset.lessonPackBuilderSummaryCta = "";
  mobilePreview.dataset.lessonPackBuilderMobilePreview = "";
  mobilePreview.setAttribute("aria-describedby", "lesson-pack-builder-summary-status");
  mobileAction.append(mobilePreview);
  container.append(heading, lead, status, facts, outputs, actions);
  return { container, status, count, duration, outputs, preview, mobilePreview, mobileAction, edit };
}

function renderSummary(elements: BuilderSummaryElements, summary: LessonPackBuilderSummary, labels: BuilderLabels): void {
  elements.container.dataset.state = summary.state;
  elements.container.dataset.canPreview = String(summary.canPreview);
  elements.status.textContent = summary.state === "invalid" ? labels.summaryInvalid : labels.summarySteps(summary.selectedStepCount, summary.totalStepCount);
  elements.count.textContent = labels.summarySteps(summary.selectedStepCount, summary.totalStepCount);
  elements.duration.textContent = labels.summaryDuration(summary.durationMinutes);
  elements.outputs.replaceChildren();
  if (summary.studentWorksheet) appendSummaryOutput(elements.outputs, "student", labels.summaryStudent);
  if (summary.teacherReference) appendSummaryOutput(elements.outputs, "teacher", labels.summaryTeacher);
  if (summary.sources) appendSummaryOutput(elements.outputs, "sources", labels.summarySources);
  if (summary.qrLinks) appendSummaryOutput(elements.outputs, "links", labels.summaryLinks);
  if (summary.observationFigure) appendSummaryOutput(elements.outputs, "figure", labels.summaryFigure);
  if (summary.a4Pdf && summary.recipientPrint) appendSummaryOutput(elements.outputs, "print", labels.summaryPrint);
}

function appendSummaryOutput(container: HTMLElement, output: string, text: string): void {
  const item = document.createElement("li");
  item.dataset.lessonPackSummaryOutput = output;
  item.textContent = text;
  if (output === "teacher") item.dataset.lessonPackSummaryTeacher = "";
  if (output === "sources") item.dataset.lessonPackSummarySources = "";
  container.append(item);
}

function scrollBuilderElement(element: HTMLElement, options: ScrollIntoViewOptions): void {
  if (typeof element.scrollIntoView !== "function") return;
  try { element.scrollIntoView(options); } catch { element.scrollIntoView(); }
}

interface BuilderValues {
  readonly title: string;
  readonly classLabel: string;
  readonly selectedStepIds: readonly string[];
  readonly promptsByStepId: Readonly<Record<string, string>>;
  readonly includeTeacher: boolean;
}

function summaryValues(model: LessonPackModel, input: LessonPackCustomizationInput | null | undefined, defaults: BuilderValues): BuilderValues {
  if (input === undefined || input === null) return defaults;
  const normalized = normalizeLessonPackCustomization(model, input);
  const raw = isRecord(input) ? input : {};
  const selectedStepIds = knownSelection(model, raw.selectedStepIds);
  if (!normalized) return { ...defaults, selectedStepIds };
  return {
    title: normalized.title,
    classLabel: normalized.classLabel,
    selectedStepIds,
    promptsByStepId: normalized.promptsByStepId,
    includeTeacher: typeof raw.includeTeacher === "boolean" ? raw.includeTeacher : normalized.includeTeacher,
  };
}

function knownSelection(model: LessonPackModel, raw: unknown): readonly string[] {
  if (raw === undefined || raw === null) return model.steps.map((step) => step.id);
  if (!Array.isArray(raw)) return [];
  const requested = new Set(raw.filter((value): value is string => typeof value === "string"));
  return model.steps.filter((step) => requested.has(step.id)).map((step) => step.id);
}

function builderValuesEqual(left: BuilderValues, right: BuilderValues): boolean {
  if (left.title !== right.title || left.classLabel !== right.classLabel || left.includeTeacher !== right.includeTeacher) return false;
  if (left.selectedStepIds.length !== right.selectedStepIds.length || left.selectedStepIds.some((id, index) => id !== right.selectedStepIds[index])) return false;
  return left.selectedStepIds.every((id) => left.promptsByStepId[id] === right.promptsByStepId[id]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
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
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
}

function button(label: string, className: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}

function label(text: string): HTMLElement {
  const element = document.createElement("strong");
  element.textContent = `${text}: `;
  return element;
}
