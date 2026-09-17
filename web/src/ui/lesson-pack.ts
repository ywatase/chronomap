import type { LessonPackModel, LessonPackSource, LessonPackStep } from "../domain/lesson-pack-model";
import type { UiCopy } from "./copy";
import { renderLessonPackFeedback } from "./lesson-pack-feedback";

export interface LessonPackActions {
  readonly onClose: () => void;
  readonly onPrint: () => void;
  readonly onBack?: () => void;
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
  const print = button(copy.lessonPackPrint, "lesson-pack-print");
  print.dataset.lessonPackPrint = "";
  print.addEventListener("click", actions.onPrint);
  if (actions.onBack) {
    const back = button(copy.lessonWorkshopBack, "lesson-pack-back");
    back.dataset.lessonPackBack = "";
    back.addEventListener("click", actions.onBack);
    toolbar.append(back);
  }
  const close = button(copy.lessonPackClose, "lesson-pack-close");
  close.dataset.lessonPackClose = "";
  close.addEventListener("click", actions.onClose);
  toolbar.append(print, close);
  container.append(toolbar);

  const feedbackHost = document.createElement("section");
  feedbackHost.dataset.lessonPackFeedbackHost = "";
  renderLessonPackFeedback(feedbackHost, {
    datasetSlug: model.datasetId.split(":", 1)[0] ?? model.datasetId,
    lessonId: model.lessonId ?? "",
    selectedStepCount: model.steps.length,
    includeTeacher: model.includeTeacher !== false,
    language: copy.language,
  }, copy);
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
  const startLink = document.createElement("a");
  startLink.href = model.startUrl;
  startLink.textContent = model.startUrl;
  startLink.className = "lesson-pack-url";
  const startLinkLabel = document.createElement("p");
  startLinkLabel.className = "lesson-pack-link-label";
  startLinkLabel.append(document.createTextNode(`${copy.lessonPackStartLink}: `), startLink);
  student.append(startLinkLabel);
  for (const [index, step] of model.steps.entries()) student.append(renderStudentStep(step, index + 1, copy));
  student.append(packNotice(copy.lessonPackApproximation));
  sheet.append(student);

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

function renderStudentStep(step: LessonPackStep, number: number, copy: UiCopy): HTMLElement {
  const article = document.createElement("article");
  article.className = "lesson-pack-step";
  const heading = document.createElement("h3");
  heading.textContent = `${number}. ${step.yearLabel} — ${step.label}`;
  const prompt = document.createElement("p");
  prompt.className = "lesson-pack-prompt";
  prompt.textContent = `${copy.lessonPackObservation}: ${step.prompt}`;
  const link = document.createElement("a");
  link.href = step.shareUrl;
  link.textContent = step.shareUrl;
  link.className = "lesson-pack-url";
  const linkLabel = document.createElement("p");
  linkLabel.className = "lesson-pack-link-label";
  linkLabel.append(document.createTextNode(`${copy.lessonPackStepLink}: `), link);
  const answer = document.createElement("div");
  answer.className = "lesson-pack-answer-space";
  answer.setAttribute("aria-label", copy.lessonPackAnswer);
  for (let index = 0; index < 3; index += 1) answer.append(document.createElement("span"));
  article.append(heading, prompt, linkLabel, answer);
  return article;
}

function renderTeacherStep(step: LessonPackStep, number: number, copy: UiCopy): HTMLElement {
  const article = document.createElement("article");
  article.className = "lesson-pack-step lesson-pack-reference";
  const heading = document.createElement("h3");
  heading.textContent = `${number}. ${step.yearLabel} — ${step.label}`;
  article.append(heading);
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
