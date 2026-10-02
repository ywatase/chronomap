import {
  buildLessonPackFeedbackAnswer,
  NEXT_FEATURE_OPTIONS,
  UTILIZATION_OPTIONS,
  type LessonPackFeedbackInput,
  type LessonPackFeedbackContext,
} from "../domain/lesson-pack-feedback";
import { DEFAULT_LESSON_PACK_OFFER_PLAN, LESSON_PACK_BUDGET_INTENTS, LESSON_PACK_OFFER_PLANS, LESSON_PACK_PILOT_CONTACT, buildLessonPackPilotDownloadFilename, buildLessonPackPilotText, buildSafeLessonPackPilotMailto, type LessonPackOfferPlan, type LessonPackPilotContext, type LessonPackPilotInput } from "../domain/lesson-pack-pilot";
import type { UiCopy } from "./copy";

export interface LessonPackFeedbackState {
  readonly input: LessonPackFeedbackInput;
  readonly answer: string;
  readonly pilotInput?: LessonPackPilotInput;
  readonly pilotAnswer?: string;
}

export interface LessonPackFeedbackActions {
  readonly onChange?: (state: LessonPackFeedbackState) => void;
  readonly initialPilotPlan?: LessonPackOfferPlan;
  /** Optional host override; production defaults to the Vite build-time contact. */
  readonly pilotContact?: string | null;
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

  let pilotInput: LessonPackPilotInput | undefined = initialState?.pilotInput;
  let pilotAnswer = initialState?.pilotAnswer ?? "";
  const captureInput = (): LessonPackFeedbackInput => ({
    utilization: form.querySelector<HTMLInputElement>('input[name="utilization"]:checked')?.value,
    nextFeature: form.querySelector<HTMLInputElement>('input[name="nextFeature"]:checked')?.value,
    comment: comment.value,
  });
  const notify = (): void => {
    feedbackActions.onChange?.({ input: captureInput(), answer: answer.value, pilotInput, pilotAnswer });
  };

  const update = (): boolean => {
    const value = buildLessonPackFeedbackAnswer(captureInput(), context);
    answer.value = value ?? "";
    error.hidden = value !== null;
    pilotAnswer = "";
    clearPilotReview(content);
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
  renderPilotHandoff(content, context, copy, initialState, {
    initialPilotPlan: feedbackActions.initialPilotPlan,
    pilotContact: feedbackActions.pilotContact,
    onChange: (nextInput, nextAnswer) => {
      pilotInput = nextInput;
      pilotAnswer = nextAnswer;
      notify();
    },
  });
  const completion = content.querySelector<HTMLElement>("[data-lesson-pack-completion]");
  if (completion) content.insertBefore(completion, form);
  details.append(content);
  container.append(details);
}

/** Reveal the completion card after printing and focus the first control in it. */
export function showLessonPackFeedback(container: HTMLElement, scope: "student" | "teacher" | "full" = "full", copy?: UiCopy): void {
  container.hidden = false;
  container.dataset.lessonPackLastPrintScope = scope;
  const details = container.querySelector<HTMLDetailsElement>("[data-lesson-pack-feedback-details]");
  if (details) details.open = true;
  const facts = container.querySelector<HTMLElement>("[data-lesson-pack-completion-facts]");
  if (facts && copy) {
    facts.textContent = copy.lessonPackCompletionFacts(
      Number(facts.dataset.steps ?? "0"),
      scope,
      facts.dataset.includeTeacher === "true",
      facts.dataset.observationFigure !== "false",
    );
  }
  clearPilotReview(container);
  container.querySelector<HTMLElement>("[data-lesson-pack-completion]")?.focus();
}

interface PilotHandoffActions {
  readonly onChange: (input: LessonPackPilotInput, answer: string) => void;
}

function renderPilotHandoff(content: HTMLElement, context: LessonPackFeedbackContext, copy: UiCopy, state: LessonPackFeedbackState | null, actions: PilotHandoffActions & { readonly initialPilotPlan?: LessonPackOfferPlan; readonly pilotContact?: string | null }): void {
  const contact = actions.pilotContact === undefined ? LESSON_PACK_PILOT_CONTACT : actions.pilotContact;
  const card = document.createElement("section");
  card.className = "lesson-pack-completion";
  card.dataset.lessonPackCompletion = "";
  card.tabIndex = -1;
  const heading = document.createElement("h3");
  heading.textContent = copy.lessonPackCompletionSummary;
  const summary = document.createElement("p");
  summary.dataset.lessonPackCompletionFacts = "";
  summary.dataset.steps = String(context.selectedStepCount);
  summary.dataset.includeTeacher = String(context.includeTeacher);
  summary.dataset.observationFigure = String(context.observationFigure !== false);
  summary.textContent = copy.lessonPackCompletionFacts(context.selectedStepCount, "full", context.includeTeacher, context.observationFigure !== false);
  const privacy = document.createElement("p");
  privacy.className = "lesson-pack-pilot-privacy";
  privacy.textContent = copy.lessonPackPilotPrivacy;
  card.append(heading, summary, privacy);
  if (!contact) {
    const noContact = document.createElement("p");
    noContact.className = "lesson-pack-pilot-no-contact";
    noContact.dataset.lessonPackPilotNoContact = "";
    noContact.textContent = copy.lessonPackPilotNoContact;
    card.append(noContact);
  }

  const form = document.createElement("form");
  form.dataset.lessonPackPilotForm = "";
  form.noValidate = true;
  const route = document.createElement("fieldset");
  route.className = "lesson-pack-pilot-route";
  const routeLegend = document.createElement("legend");
  routeLegend.textContent = copy.lessonPackFeedbackSummary;
  route.append(routeLegend);
  for (const [value, label] of [["feedback", copy.lessonPackPilotFeedbackRoute], ["consult", copy.lessonPackPilotConsultRoute]] as const) {
    const option = document.createElement("label");
    option.className = "lesson-pack-completion-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "pilot-route";
    input.value = value;
    input.checked = (state?.pilotInput?.route ?? "feedback") === value;
    option.append(input, document.createTextNode(label));
    route.append(option);
  }

  const plan = document.createElement("fieldset");
  plan.className = "lesson-pack-pilot-plan";
  plan.dataset.lessonPackPilotPlan = "";
  plan.tabIndex = -1;
  const planLegend = document.createElement("legend");
  planLegend.textContent = copy.lessonPackPilotPlan;
  const planNote = document.createElement("p");
  planNote.className = "lesson-pack-pilot-plan-note";
  planNote.dataset.lessonPackPilotPlanNote = "";
  planNote.textContent = copy.datasetCatalogOfferPricing;
  plan.append(planLegend, planNote);
  const initialPlan = state?.pilotInput?.plan && LESSON_PACK_OFFER_PLANS.includes(state.pilotInput.plan as LessonPackOfferPlan)
    ? state.pilotInput.plan as LessonPackOfferPlan
    : actions.initialPilotPlan ?? DEFAULT_LESSON_PACK_OFFER_PLAN;
  for (const value of LESSON_PACK_OFFER_PLANS) {
    const option = document.createElement("label");
    option.className = "lesson-pack-completion-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "pilot-plan";
    input.value = value;
    input.checked = initialPlan === value;
    const planLabel = copy.lessonPackPilotPlanOptions[value] ?? value;
    const planPrice = copy.datasetCatalogOfferPrices[value];
    option.append(input, document.createTextNode(planPrice ? `${planLabel} · ${planPrice}` : planLabel));
    plan.append(option);
  }

  const budget = document.createElement("fieldset");
  budget.className = "lesson-pack-pilot-budget";
  budget.dataset.lessonPackPilotBudget = "";
  budget.tabIndex = -1;
  const budgetLegend = document.createElement("legend");
  budgetLegend.textContent = copy.lessonPackPilotBudget;
  budget.append(budgetLegend);
  for (const value of LESSON_PACK_BUDGET_INTENTS) {
    const option = document.createElement("label");
    option.className = "lesson-pack-completion-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "pilot-budget";
    input.value = value;
    input.checked = state?.pilotInput?.budgetIntent === value;
    option.append(input, document.createTextNode(copy.lessonPackPilotBudgetOptions[value] ?? value));
    budget.append(option);
  }

  const regionLabel = document.createElement("label");
  regionLabel.className = "lesson-pack-pilot-region";
  regionLabel.textContent = copy.lessonPackPilotRegionTopic;
  const region = document.createElement("textarea");
  region.rows = 2;
  region.maxLength = 200;
  region.dataset.lessonPackPilotRegion = "";
  region.value = typeof state?.pilotInput?.regionTopic === "string" ? state.pilotInput.regionTopic : "";
  const regionHint = document.createElement("span");
  regionHint.className = "lesson-pack-feedback-hint";
  regionHint.textContent = copy.lessonPackPilotRegionHint;
  regionLabel.append(region, regionHint);

  const review = document.createElement("button");
  review.type = "submit";
  review.textContent = copy.lessonPackPilotReview;
  review.dataset.lessonPackPilotReview = "";
  const error = document.createElement("p");
  error.className = "lesson-pack-feedback-error";
  error.dataset.lessonPackPilotError = "";
  error.setAttribute("role", "alert");
  error.hidden = true;
  error.textContent = copy.lessonPackFeedbackRequired;
  const answerLabel = document.createElement("label");
  answerLabel.className = "lesson-pack-feedback-answer-label";
  answerLabel.textContent = copy.lessonPackFeedbackAnswer;
  const answer = document.createElement("textarea");
  answer.readOnly = true;
  answer.rows = 10;
  answer.spellcheck = false;
  answer.dataset.lessonPackPilotAnswer = "";
  answerLabel.append(answer);
  const actionsRow = document.createElement("div");
  actionsRow.className = "lesson-pack-feedback-actions";
  const back = document.createElement("button");
  back.type = "button";
  back.textContent = copy.lessonPackPilotBackToEdit;
  back.dataset.lessonPackPilotBack = "";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = copy.lessonPackPilotCopy;
  copyButton.dataset.lessonPackPilotCopy = "";
  const shareButton = document.createElement("button");
  shareButton.type = "button";
  shareButton.textContent = copy.lessonPackPilotShare;
  shareButton.dataset.lessonPackPilotShare = "";
  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.textContent = copy.lessonPackPilotDownload;
  downloadButton.dataset.lessonPackPilotDownload = "";
  const mail = contact ? document.createElement("a") : null;
  if (mail) {
    mail.textContent = copy.lessonPackPilotMail;
    mail.dataset.lessonPackPilotMail = "";
    mail.className = "lesson-pack-pilot-mail";
  }
  const status = document.createElement("p");
  status.className = "lesson-pack-feedback-status";
  status.dataset.lessonPackPilotStatus = "";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  actionsRow.append(back, copyButton, shareButton, downloadButton);
  if (mail) actionsRow.append(mail);
  form.append(route, plan, budget, regionLabel, review, error, answerLabel, actionsRow, status);
  card.append(form);
  content.append(card);

  const routeValue = (): "feedback" | "consult" => form.querySelector<HTMLInputElement>('input[name="pilot-route"]:checked')?.value === "consult" ? "consult" : "feedback";
  const pilotInput = (): LessonPackPilotInput => ({
    route: routeValue(),
    plan: form.querySelector<HTMLInputElement>('input[name="pilot-plan"]:checked')?.value,
    utilization: content.querySelector<HTMLInputElement>('input[name="utilization"]:checked')?.value,
    nextFeature: content.querySelector<HTMLInputElement>('input[name="nextFeature"]:checked')?.value,
    budgetIntent: form.querySelector<HTMLInputElement>('input[name="pilot-budget"]:checked')?.value,
    regionTopic: region.value,
    comment: content.querySelector<HTMLTextAreaElement>("[data-lesson-pack-feedback-comment]")?.value,
  });
  const setRouteVisibility = (): void => {
    const consultation = routeValue() === "consult";
    plan.hidden = !consultation;
    budget.hidden = !consultation;
    regionLabel.hidden = !consultation;
    review.textContent = consultation ? copy.lessonPackPilotReviewConsult : copy.lessonPackPilotReviewFeedback;
    plan.setAttribute("aria-hidden", String(!consultation));
    budget.setAttribute("aria-hidden", String(!consultation));
    regionLabel.setAttribute("aria-hidden", String(!consultation));
  };
  const setReview = (visible: boolean): void => {
    if (!visible) {
      answer.value = "";
      status.textContent = "";
      mail?.removeAttribute("href");
    }
    answer.hidden = !visible;
    answerLabel.hidden = !visible;
    back.hidden = !visible;
    copyButton.hidden = !visible;
    shareButton.hidden = !visible || typeof navigator === "undefined" || typeof navigator.share !== "function";
    downloadButton.hidden = !visible;
    if (mail) mail.hidden = !visible || !Boolean(mail.href);
  };
  const scope = (): LessonPackPilotContext["lastPrintScope"] => {
    const value = content.closest<HTMLElement>("[data-lesson-pack-feedback-host]")?.dataset.lessonPackLastPrintScope;
    return value === "student" || value === "teacher" || value === "full" ? value : "full";
  };
  const notify = (): void => actions.onChange(pilotInput(), answer.value);
  const reviewText = (): string | null => buildLessonPackPilotText(pilotInput(), {
    datasetSlug: context.datasetSlug,
    lessonId: context.lessonId,
    selectedStepCount: context.selectedStepCount,
    includeTeacher: context.includeTeacher,
    observationFigure: context.observationFigure !== false,
    lastPrintScope: scope(),
    language: context.language,
  });
  setRouteVisibility();
  setReview(Boolean(state?.pilotAnswer));
  if (state?.pilotAnswer) answer.value = buildLessonPackPilotText(state.pilotInput ?? {}, {
    datasetSlug: context.datasetSlug,
    lessonId: context.lessonId,
    selectedStepCount: context.selectedStepCount,
    includeTeacher: context.includeTeacher,
    observationFigure: context.observationFigure !== false,
    lastPrintScope: scope(),
    language: context.language,
  }) ?? "";
  for (const input of form.querySelectorAll<HTMLInputElement>('input[name="pilot-route"], input[name="pilot-plan"], input[name="pilot-budget"]')) {
    input.addEventListener("change", () => { setRouteVisibility(); setReview(false); error.hidden = true; notify(); });
  }
  for (const input of [region, ...Array.from(content.querySelectorAll<HTMLInputElement>('input[name="utilization"], input[name="nextFeature"]'))]) {
    input.addEventListener("input", () => { if (answer.value) setReview(false); notify(); });
    input.addEventListener("change", () => { if (answer.value) setReview(false); notify(); });
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = reviewText();
    if (!text) {
      error.hidden = false;
      const utilizationChoice = content.querySelector<HTMLInputElement>('input[name="utilization"]:checked');
      const nextFeatureChoice = content.querySelector<HTMLInputElement>('input[name="nextFeature"]:checked');
      const budgetChoice = form.querySelector<HTMLInputElement>('input[name="pilot-budget"]:checked');
      if (!utilizationChoice) content.querySelector<HTMLElement>('input[name="utilization"]')?.focus();
      else if (!nextFeatureChoice) content.querySelector<HTMLElement>('input[name="nextFeature"]')?.focus();
      else if (routeValue() === "consult" && !budgetChoice) budget.focus();
      else review.focus();
      notify();
      return;
    }
    error.hidden = true;
    answer.value = text;
    const subject = copy.lessonPackPilotSubject;
    const href = buildSafeLessonPackPilotMailto(contact, subject, text);
    if (mail) {
      if (href) { mail.href = href; mail.hidden = false; } else { mail.removeAttribute("href"); mail.hidden = true; }
    }
    setReview(true);
    notify();
    answer.focus();
  });
  back.addEventListener("click", () => { setReview(false); error.hidden = true; notify(); review.focus(); });
  copyButton.addEventListener("click", () => { void copyPilotAnswer(answer.value, status, copy); });
  downloadButton.addEventListener("click", () => {
    downloadPilotAnswer(answer.value, context, status, copy);
  });
  shareButton.addEventListener("click", () => {
    if (!answer.value || typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    try {
      void navigator.share({ title: copy.lessonPackPilotSubject, text: answer.value }).then(() => {
        status.textContent = copy.lessonPackPilotCopied;
      }).catch(() => {
        status.textContent = copy.lessonPackPilotShareFailed;
      });
    } catch {
      status.textContent = copy.lessonPackPilotShareFailed;
    }
  });
  mail?.addEventListener("click", () => { status.textContent = copy.lessonPackPilotMailOpened; });
}

function clearPilotReview(container: HTMLElement): void {
  const answer = container.querySelector<HTMLTextAreaElement>("[data-lesson-pack-pilot-answer]");
  if (answer) { answer.value = ""; answer.hidden = true; answer.closest("label")?.setAttribute("hidden", ""); }
  const error = container.querySelector<HTMLElement>("[data-lesson-pack-pilot-error]");
  if (error) error.hidden = true;
  const status = container.querySelector<HTMLElement>("[data-lesson-pack-pilot-status]");
  if (status) status.textContent = "";
  for (const selector of ["[data-lesson-pack-pilot-copy]", "[data-lesson-pack-pilot-share]", "[data-lesson-pack-pilot-download]", "[data-lesson-pack-pilot-mail]", "[data-lesson-pack-pilot-back]"]) {
    const element = container.querySelector<HTMLElement>(selector);
    if (element) element.hidden = true;
  }
}

function downloadPilotAnswer(value: string, context: LessonPackFeedbackContext, status: HTMLElement, copy: UiCopy): void {
  if (!value) {
    status.textContent = copy.lessonPackFeedbackRequired;
    return;
  }
  if (typeof Blob === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    status.textContent = copy.lessonPackPilotDownloadFailed;
    return;
  }
  let objectUrl: string | null = null;
  try {
    const blob = new Blob([`\ufeff${value}`], { type: "text/plain;charset=utf-8" });
    objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = buildLessonPackPilotDownloadFilename(context.datasetSlug, context.lessonId);
    link.rel = "noopener";
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    status.textContent = copy.lessonPackPilotDownloaded;
    const url = objectUrl;
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    status.textContent = copy.lessonPackPilotDownloadFailed;
  }
}

async function copyPilotAnswer(value: string, status: HTMLElement, copy: UiCopy): Promise<void> {
  if (!value) { status.textContent = copy.lessonPackFeedbackRequired; return; }
  try {
    let copied = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(value); copied = true; } catch { copied = false; }
    }
    if (!copied) copied = fallbackCopy(value);
    status.textContent = copied ? copy.lessonPackPilotCopied : copy.lessonPackPilotCopyFailed;
  } catch { status.textContent = copy.lessonPackPilotCopyFailed; }
}

function fieldset<T extends readonly string[]>(legendText: string, name: string, values: T, labels: Readonly<Record<T[number], string>>): HTMLFieldSetElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "lesson-pack-feedback-fieldset";
  fieldset.tabIndex = -1;
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
