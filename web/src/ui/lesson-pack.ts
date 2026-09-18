import { buildLessonPackAccessModel, type LessonPackAccessUrlModel } from "../domain/lesson-pack-access";
import { projectLessonPackFigureFromSteps } from "../domain/lesson-pack-figure";
import type { LessonPackModel, LessonPackSource, LessonPackStep } from "../domain/lesson-pack-model";
import type { UiCopy } from "./copy";
import { renderLessonPackFeedback, type LessonPackFeedbackActions, type LessonPackFeedbackState } from "./lesson-pack-feedback";
import { renderLessonPackFigure } from "./lesson-pack-figure";
import { renderLessonPackQr } from "./lesson-pack-qr";

export type LessonPackPrintScope = "student" | "teacher" | "full";

export interface LessonPackActions {
  readonly onClose: () => void;
  readonly onPrint: (scope: LessonPackPrintScope) => void;
  readonly onBack?: () => void;
  readonly initialFeedbackState?: LessonPackFeedbackState | null;
  readonly onFeedbackChange?: LessonPackFeedbackActions["onChange"];
}

/** Render a print-ready, citation-only classroom pack. */
export function renderLessonPack(container: HTMLElement, model: LessonPackModel, copy: UiCopy, actions: LessonPackActions): void {
  container.replaceChildren();
  container.className = "lesson-pack-dialog";
  container.dataset.lessonPackDialog = "";
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "true");
  container.setAttribute("aria-labelledby", "lesson-pack-heading");

  const toolbar = document.createElement("div");
  toolbar.className = "lesson-pack-actions";
  toolbar.dataset.lessonPackActions = "";
  const warning = document.createElement("p");
  warning.className = "lesson-pack-print-warning";
  warning.dataset.lessonPackPrintWarning = "";
  warning.textContent = copy.lessonPackStudentPrintWarning;
  const printStudent = button(copy.lessonPackPrintStudent, "lesson-pack-print lesson-pack-print-student");
  printStudent.dataset.lessonPackPrintStudent = "";
  printStudent.addEventListener("click", () => actions.onPrint("student"));
  const printTeacher = button(copy.lessonPackPrintTeacher, "lesson-pack-print lesson-pack-print-teacher");
  printTeacher.dataset.lessonPackPrintTeacher = "";
  printTeacher.addEventListener("click", () => actions.onPrint("teacher"));
  const printFull = button(copy.lessonPackPrintFull, "lesson-pack-print lesson-pack-print-full");
  printFull.dataset.lessonPackPrintFull = "";
  // Keep the original selector as the full-pack compatibility path.
  printFull.dataset.lessonPackPrint = "";
  printFull.addEventListener("click", () => actions.onPrint("full"));
  if (actions.onBack) {
    const back = button(copy.lessonWorkshopBack, "lesson-pack-back");
    back.dataset.lessonPackBack = "";
    back.addEventListener("click", actions.onBack);
    toolbar.append(back);
  }
  const close = button(copy.lessonPackClose, "lesson-pack-close");
  close.dataset.lessonPackClose = "";
  close.addEventListener("click", actions.onClose);
  toolbar.append(warning, printStudent);
  if (model.includeTeacher !== false) toolbar.append(printTeacher);
  toolbar.append(printFull, close);
  container.append(toolbar);

  const figureModel = projectLessonPackFigureFromSteps(
    model.steps.map((step, index) => ({
      featureId: step.featureId,
      geometry: step.featureGeometry,
      labels: { [copy.language]: step.label },
      label: step.label,
      yearLabel: step.yearLabel,
      stepNumber: index + 1,
    })),
    model.datasetBbox,
  );

  const feedbackHost = document.createElement("section");
  feedbackHost.dataset.lessonPackFeedbackHost = "";
  renderLessonPackFeedback(feedbackHost, {
    datasetSlug: model.datasetId.split(":", 1)[0] ?? model.datasetId,
    lessonId: model.lessonId ?? "",
    selectedStepCount: model.steps.length,
    includeTeacher: model.includeTeacher !== false,
    observationFigure: figureModel !== null,
    language: copy.language,
  }, copy, actions.initialFeedbackState ?? null, { onChange: actions.onFeedbackChange });
  container.append(feedbackHost);

  const sheet = document.createElement("article");
  sheet.className = "lesson-pack-sheet";
  const header = document.createElement("header");
  header.className = "lesson-pack-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Chronomap";
  const heading = document.createElement("h2");
  heading.id = "lesson-pack-heading";
  heading.textContent = copy.lessonPackTitle(model.title);
  const lead = document.createElement("p");
  lead.className = "lesson-pack-lead";
  lead.textContent = copy.lessonPackLead(model.durationMinutes);
  const beta = document.createElement("p");
  beta.className = "lesson-pack-beta";
  beta.textContent = copy.lessonPackBeta;
  header.append(eyebrow, heading, lead, beta);
  if (model.classLabel) {
    const classLabel = document.createElement("p");
    classLabel.className = "lesson-pack-class-label";
    classLabel.dataset.lessonPackClassLabel = "";
    classLabel.textContent = `${copy.lessonPackClassLabel}: ${model.classLabel}`;
    header.append(classLabel);
  }
  sheet.append(header);

  const student = page(copy.lessonPackStudent);
  student.dataset.lessonPackStudent = "";
  student.append(detail(`${copy.lessonPackDataset}: ${model.datasetTitle} (${model.datasetId})`));
  student.append(detail(model.description));
  student.append(detail(copy.lessonPackObjective));
  const access = buildLessonPackAccessModel(model.startUrl, model.steps.map((step) => step.shareUrl), copy.lessonPackUrlUnavailable);
  student.append(renderStartAccess(access.start, copy));
  for (const [index, step] of model.steps.entries()) {
    // Keep the original model URL available to the access projector, but only
    // render a link when the fail-closed URL model marks it as safe.
    student.append(renderStudentStep(step, index + 1, copy, access.steps[index]));
  }
  student.append(packNotice(copy.lessonPackApproximation));
  const studentRights = document.createElement("footer");
  studentRights.className = "lesson-pack-student-rights";
  studentRights.dataset.lessonPackStudentRights = "";
  studentRights.textContent = `${copy.lessonPackRights}: ${model.datasetRights}`;
  student.append(studentRights);
  sheet.append(student);

  const figurePage = page(copy.lessonPackFigureTitle);
  figurePage.dataset.lessonPackFigurePage = "";
  figurePage.append(renderLessonPackFigure(figureModel, {
    language: copy.language,
    title: copy.lessonPackFigureTitle,
    caption: copy.lessonPackFigureCaption,
    description: copy.lessonPackFigureDescription,
    fallback: copy.lessonPackFigureFallback,
    legendPoint: copy.lessonPackFigureLegendPoint,
    legendLine: copy.lessonPackFigureLegendLine,
    legendPolygon: copy.lessonPackFigureLegendPolygon,
  }));
  sheet.append(figurePage);

  if (model.includeTeacher !== false) {
    const teacher = page(copy.lessonPackTeacher);
    teacher.dataset.lessonPackTeacher = "";
    teacher.append(detail(model.datasetDescription));
    for (const [index, step] of model.steps.entries()) teacher.append(renderTeacherStep(step, index + 1, copy));
    sheet.append(teacher);
  }

  const sources = page(copy.lessonPackSources);
  sources.dataset.lessonPackSources = "";
  if (!model.sources.length) sources.append(detail(copy.lessonPackNoSources));
  for (const source of model.sources) sources.append(renderSource(source, copy));
  const rights = document.createElement("p");
  rights.className = "lesson-pack-rights";
  rights.textContent = `${copy.lessonPackDataset}: ${model.datasetRights}`;
  sources.append(rights);
  sources.append(packNotice(copy.lessonPackCitationOnly));
  sheet.append(sources);
  container.append(sheet);
}

function renderStudentStep(step: LessonPackStep, number: number, copy: UiCopy, access: LessonPackAccessUrlModel | undefined): HTMLElement {
  const article = document.createElement("article");
  article.className = "lesson-pack-step";
  const heading = document.createElement("h3");
  heading.textContent = `${number}. ${step.yearLabel} — ${step.label}`;
  const prompt = document.createElement("p");
  prompt.className = "lesson-pack-prompt";
  prompt.textContent = `${copy.lessonPackObservation}: ${step.prompt}`;
  const linkLabel = document.createElement("p");
  linkLabel.className = "lesson-pack-link-label";
  if (access?.href) {
    const link = document.createElement("a");
    link.href = access.href;
    link.textContent = copy.lessonPackStepOnlineLink;
    link.dataset.lessonPackStepLink = "";
    link.className = "lesson-pack-url";
    linkLabel.append(link);
  } else {
    linkLabel.textContent = `${copy.lessonPackStepOnlineLink}: ${access?.displayText ?? copy.lessonPackUrlUnavailable}`;
  }
  const answer = document.createElement("div");
  answer.className = "lesson-pack-answer-space";
  answer.setAttribute("aria-label", copy.lessonPackAnswer);
  for (let index = 0; index < 3; index += 1) answer.append(document.createElement("span"));
  article.append(heading, prompt, linkLabel, answer);
  return article;
}

function renderStartAccess(start: LessonPackAccessUrlModel, copy: UiCopy): HTMLElement {
  const access = document.createElement("section");
  access.className = "lesson-pack-start-access";
  access.dataset.lessonPackStartAccess = "";
  const hint = document.createElement("p");
  hint.className = "lesson-pack-start-qr-hint";
  hint.textContent = copy.lessonPackStartQrHint;
  access.append(hint);

  const qrHost = document.createElement("div");
  qrHost.className = "lesson-pack-qr-host";
  if (start.qrPayload && renderLessonPackQr(qrHost, start.qrPayload, { ariaLabel: copy.lessonPackStartQrLabel })) {
    access.append(qrHost);
  } else {
    const unavailable = document.createElement("p");
    unavailable.className = "lesson-pack-qr-unavailable";
    unavailable.textContent = copy.lessonPackQrUnavailable;
    access.append(unavailable);
  }

  const fallback = document.createElement("p");
  fallback.className = "lesson-pack-link-label lesson-pack-start-url-fallback";
  if (start.href) {
    const link = document.createElement("a");
    link.href = start.href;
    link.textContent = start.displayText;
    link.className = "lesson-pack-url";
    link.dataset.lessonPackStartUrl = "";
    fallback.append(document.createTextNode(`${copy.lessonPackStartLink}: `), link);
  } else {
    fallback.textContent = `${copy.lessonPackStartLink}: ${copy.lessonPackUrlUnavailable}`;
  }
  access.append(fallback);
  return access;
}

function renderTeacherStep(step: LessonPackStep, number: number, copy: UiCopy): HTMLElement {
  const article = document.createElement("article");
  article.className = "lesson-pack-step lesson-pack-reference";
  const heading = document.createElement("h3");
  heading.textContent = `${number}. ${step.yearLabel} — ${step.label}`;
  article.append(heading);
  const prompt = document.createElement("p");
  prompt.className = "lesson-pack-prompt";
  prompt.textContent = `${copy.lessonPackObservation}: ${step.prompt}`;
  article.append(prompt);
  if (step.teacherNote) {
    const readingExample = document.createElement("aside");
    readingExample.className = "lesson-pack-reading-example";
    readingExample.dataset.lessonPackReadingExample = "";
    const label = document.createElement("strong");
    label.textContent = copy.lessonPackReadingExample;
    const note = document.createElement("p");
    note.textContent = step.teacherNote;
    readingExample.append(label, note);
    article.append(readingExample);
  }
  article.append(detail(`${copy.lessonPackEntity}: ${step.entityLabel}`));
  if (step.entityDescription) article.append(detail(step.entityDescription));
  article.append(detail(`${copy.lessonPackDescription}: ${step.description}`));
  article.append(detail(`${copy.lessonPackPeriod}: ${step.period}`));
  article.append(detail(`${copy.lessonPackGeometry}: ${step.geometry}`));
  const uncertainty = document.createElement("ul");
  uncertainty.className = "lesson-pack-uncertainty";
  for (const item of step.uncertainty) {
    const line = document.createElement("li");
    line.textContent = item;
    uncertainty.append(line);
  }
  article.append(labelHeading(copy.lessonPackUncertainty), uncertainty);
  if (step.comparison.length > 1) {
    article.append(labelHeading(copy.lessonPackComparison));
    const comparison = document.createElement("ul");
    comparison.className = "lesson-pack-comparison";
    for (const version of step.comparison) {
      const item = document.createElement("li");
      item.textContent = `${version.year}: ${version.label} — ${version.description} (${version.uncertainty})`;
      comparison.append(item);
    }
    article.append(comparison);
  }
  if (step.evidence.length) {
    article.append(labelHeading(copy.lessonPackEvidence));
    const evidence = document.createElement("ul");
    evidence.className = "lesson-pack-evidence-list";
    for (const item of step.evidence) {
      const line = document.createElement("li");
      line.textContent = `${item.id}: ${item.locator}`;
      evidence.append(line);
    }
    article.append(evidence);
  }
  return article;
}

function renderSource(source: LessonPackSource, copy: UiCopy): HTMLElement {
  const article = document.createElement("article");
  article.className = "lesson-pack-source";
  const heading = document.createElement("h3");
  heading.textContent = source.citation;
  article.append(heading);
  article.append(detail(source.title));
  article.append(detail(`${source.creators.join(", ")} · ${source.publishedYear} · ${copy.lessonPackAccessed}: ${source.accessedDate}`));
  for (const item of source.evidence) {
    const evidence = document.createElement("p");
    evidence.className = "lesson-pack-evidence";
    evidence.textContent = `${item.id} — ${copy.lessonPackLocator}: ${item.locator} — ${item.note}`;
    article.append(evidence);
  }
  if (isSafeHttpUrl(source.url)) {
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "lesson-pack-url";
    article.append(link);
  }
  article.append(detail(`${copy.lessonPackRights}: ${source.rights}`));
  if (source.citationOnly) article.append(packNotice(copy.lessonPackCitationOnly));
  return article;
}

function page(title: string): HTMLElement {
  const element = document.createElement("section");
  element.className = "lesson-pack-page";
  const heading = document.createElement("h2");
  heading.textContent = title;
  element.append(heading);
  return element;
}

function labelHeading(title: string): HTMLHeadingElement {
  const heading = document.createElement("h4");
  heading.textContent = title;
  return heading;
}

function packNotice(text: string): HTMLParagraphElement {
  const notice = document.createElement("p");
  notice.className = "lesson-pack-notice";
  notice.textContent = text;
  return notice;
}

function detail(text: string): HTMLParagraphElement {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  return paragraph;
}

function button(label: string, className: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
