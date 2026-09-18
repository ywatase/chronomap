import {
  buildLessonPackFeedbackAnswer,
  NEXT_FEATURE_OPTIONS,
  UTILIZATION_OPTIONS,
  type LessonPackFeedbackInput,
  type LessonPackFeedbackContext,
} from "../domain/lesson-pack-feedback";
import type { UiCopy } from "./copy";

export interface LessonPackFeedbackState {
  readonly input: LessonPackFeedbackInput;
  readonly answer: string;
}

export interface LessonPackFeedbackActions {
  readonly onChange?: (state: LessonPackFeedbackState) => void;
}

/** Render the in-memory, copy-only feedback form below a lesson-pack toolbar. */
export function renderLessonPackFeedback(
  container: HTMLElement,
  context: LessonPackFeedbackContext,
  copy: UiCopy,
  initialState: LessonPackFeedbackState | null = null,
  feedbackActions: LessonPackFeedbackActions = {},
): void {
  container.replaceChildren();
  container.className = "lesson-pack-feedback-host";
  container.dataset.lessonPackFeedbackHost = "";
  container.hidden = true;

  const details = document.createElement("details");
  details.className = "lesson-pack-feedback";
  details.dataset.lessonPackFeedbackDetails = "";
  const summary = document.createElement("summary");
  summary.dataset.lessonPackFeedbackSummary = "";
  summary.textContent = copy.lessonPackFeedbackSummary;
  details.append(summary);

  const content = document.createElement("div");
  content.className = "lesson-pack-feedback-content";
  const lead = document.createElement("p");
  lead.className = "lesson-pack-feedback-lead";
  lead.textContent = copy.lessonPackFeedbackLead;
  const notice = document.createElement("p");
  notice.className = "lesson-pack-feedback-notice";
  notice.textContent = copy.lessonPackFeedbackNotice;
  content.append(lead, notice);

  const form = document.createElement("form");
  form.className = "lesson-pack-feedback-form";
  form.dataset.lessonPackFeedbackForm = "";
  form.noValidate = true;

  const utilization = fieldset(copy.lessonPackFeedbackUtilization, "utilization", UTILIZATION_OPTIONS, copy.lessonPackFeedbackUtilizationOptions);
  const nextFeature = fieldset(copy.lessonPackFeedbackNextFeature, "nextFeature", NEXT_FEATURE_OPTIONS, copy.lessonPackFeedbackNextFeatureOptions);
  form.append(utilization, nextFeature);

  const commentLabel = document.createElement("label");
  commentLabel.className = "lesson-pack-feedback-comment-label";
  commentLabel.textContent = copy.lessonPackFeedbackComment;
  const comment = document.createElement("textarea");
  comment.name = "comment";
  comment.rows = 3;
  comment.maxLength = 500;
  comment.placeholder = copy.lessonPackFeedbackCommentHint;
  comment.setAttribute("aria-describedby", "lesson-pack-feedback-comment-hint");
  comment.dataset.lessonPackFeedbackComment = "";
  const commentHint = document.createElement("span");
  commentHint.id = "lesson-pack-feedback-comment-hint";
  commentHint.className = "lesson-pack-feedback-hint";
  commentHint.textContent = copy.lessonPackFeedbackCommentHint;
  commentLabel.append(comment, commentHint);
  form.append(commentLabel);

  const error = document.createElement("p");
  error.className = "lesson-pack-feedback-error";
  error.dataset.lessonPackFeedbackError = "";
  error.setAttribute("role", "alert");
  error.hidden = true;
  error.textContent = copy.lessonPackFeedbackRequired;
  form.append(error);

  const actionRow = document.createElement("div");
  actionRow.className = "lesson-pack-feedback-actions";
  const generate = document.createElement("button");
  generate.type = "submit";
  generate.className = "lesson-pack-feedback-generate";
  generate.dataset.lessonPackFeedbackGenerate = "";
  generate.textContent = copy.lessonPackFeedbackGenerate;
  actionRow.append(generate);
  form.append(actionRow);

  const answerLabel = document.createElement("label");
  answerLabel.className = "lesson-pack-feedback-answer-label";
  answerLabel.textContent = copy.lessonPackFeedbackAnswer;
  const answer = document.createElement("textarea");
  answer.className = "lesson-pack-feedback-answer";
  answer.dataset.lessonPackFeedbackAnswer = "";
  answer.readOnly = true;
  answer.rows = 9;
  answer.spellcheck = false;
  answerLabel.append(answer);
  form.append(answerLabel);

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "lesson-pack-feedback-copy";
  copyButton.dataset.lessonPackFeedbackCopy = "";
  copyButton.textContent = copy.lessonPackFeedbackCopy;
  form.append(copyButton);

  const status = document.createElement("p");
  status.className = "lesson-pack-feedback-status";
  status.dataset.lessonPackFeedbackStatus = "";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  form.append(status);

  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
    const selected = input.name === "utilization" ? initialState?.input.utilization : initialState?.input.nextFeature;
    input.checked = input.value === selected;
  }
  comment.value = typeof initialState?.input.comment === "string" ? initialState.input.comment.trim().slice(0, 500) : "";
  // A previous answer is a generated artifact, not trusted state. Regenerate it
  // against the current preview metadata so changed step/teacher settings cannot
  // carry stale metadata across the builder back button.
  answer.value = initialState?.answer
    ? buildLessonPackFeedbackAnswer(initialState.input, context) ?? ""
    : "";
  error.hidden = Boolean(answer.value);

  const captureInput = (): LessonPackFeedbackInput => ({
    utilization: form.querySelector<HTMLInputElement>('input[name="utilization"]:checked')?.value,
    nextFeature: form.querySelector<HTMLInputElement>('input[name="nextFeature"]:checked')?.value,
    comment: comment.value,
  });
  const notify = (): void => {
    feedbackActions.onChange?.({ input: captureInput(), answer: answer.value });
  };

  const update = (): boolean => {
    const value = buildLessonPackFeedbackAnswer(captureInput(), context);
    answer.value = value ?? "";
    error.hidden = value !== null;
    notify();
    return value !== null;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
    input.addEventListener("change", () => { if (answer.value) update(); else notify(); });
  }
  comment.addEventListener("input", () => { if (answer.value) update(); else notify(); });
  copyButton.addEventListener("click", () => { void copyAnswer(answer, status, copy, update); });

  content.append(form);
  details.append(content);
  container.append(details);
}

/** Reveal the callout after the print action and return keyboard focus to its summary. */
export function showLessonPackFeedback(container: HTMLElement): void {
  container.hidden = false;
  container.querySelector<HTMLElement>("[data-lesson-pack-feedback-summary]")?.focus();
}

function fieldset<T extends readonly string[]>(legendText: string, name: string, values: T, labels: Readonly<Record<T[number], string>>): HTMLFieldSetElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "lesson-pack-feedback-fieldset";
  const legend = document.createElement("legend");
  legend.textContent = legendText;
  fieldset.append(legend);
  for (const value of values) {
    const label = document.createElement("label");
    label.className = "lesson-pack-feedback-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = value;
    input.required = true;
    label.append(input, document.createTextNode(labels[value as T[number]] ?? value));
    fieldset.append(label);
  }
  return fieldset;
}

async function copyAnswer(answer: HTMLTextAreaElement, status: HTMLElement, copy: UiCopy, update: () => boolean): Promise<void> {
  if (!answer.value && !update()) {
    status.textContent = copy.lessonPackFeedbackRequired;
    return;
  }
  const value = answer.value;
  try {
    let copied = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) copied = fallbackCopy(value);
    if (!copied) throw new Error("clipboard unavailable");
    status.textContent = copy.lessonPackFeedbackCopied;
  } catch {
    status.textContent = copy.lessonPackFeedbackCopyFailed;
  }
}

function fallbackCopy(value: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  let copied = false;
  try {
    copied = typeof document.execCommand === "function" && document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}
