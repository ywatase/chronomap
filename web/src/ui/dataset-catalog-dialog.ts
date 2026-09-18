import type { DatasetCatalogCardModel, DatasetCatalogViewModel } from "../domain/dataset-catalog-view-model";
import { LESSON_PACK_DRAFT_MAX_BYTES } from "../domain/lesson-pack-draft";
import type { UiCopy } from "./copy";

export interface DatasetCatalogDialogActions {
  readonly onClose: () => void;
  readonly isRoot?: boolean;
  readonly onResumeDraft?: (file: File) => Promise<boolean> | boolean;
}

/** Render the allow-listed region and lesson catalog without fetching or mutating application state. */
export function renderDatasetCatalog(container: HTMLElement, model: DatasetCatalogViewModel, copy: UiCopy, actions: DatasetCatalogDialogActions): void {
  container.replaceChildren();
  container.className = "dataset-catalog-dialog";
  container.dataset.datasetCatalogDialog = "";
  container.setAttribute("role", actions.isRoot ? "region" : "dialog");
  if (actions.isRoot) container.removeAttribute("aria-modal");
  else container.setAttribute("aria-modal", "true");
  container.setAttribute("aria-label", copy.datasetCatalogDialogLabel);

  const toolbar = document.createElement("div");
  toolbar.className = "dataset-catalog-toolbar";
  const close = button(copy.datasetCatalogClose, "dataset-catalog-close");
  close.dataset.datasetCatalogClose = "";
  close.addEventListener("click", actions.onClose);
  toolbar.append(close);
  container.append(toolbar);

  const sheet = document.createElement("article");
  sheet.className = "dataset-catalog-sheet";
  const header = document.createElement("header");
  header.className = "dataset-catalog-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Chronomap";
  const heading = document.createElement("h2");
  heading.dataset.datasetCatalogHeading = "";
  heading.textContent = copy.datasetCatalogHeading;
  const lead = document.createElement("p");
  lead.className = "dataset-catalog-lead";
  lead.textContent = copy.datasetCatalogLead;
  header.append(eyebrow, heading, lead);
  sheet.append(header);

  sheet.append(renderWelcome(model, copy, Boolean(actions.isRoot), actions));

  const grid = document.createElement("div");
  grid.className = "dataset-catalog-grid";
  grid.id = "dataset-catalog-cards";
  grid.tabIndex = -1;
  grid.setAttribute("aria-label", copy.datasetCatalogHeading);
  grid.dataset.datasetCatalogCards = "";
  for (const card of model.cards) grid.append(renderCard(card, copy, Boolean(actions.isRoot)));
  sheet.append(grid);

  const notes = document.createElement("div");
  notes.className = "dataset-catalog-notes";
  const free = note(copy.datasetCatalogFreeHeading, copy.datasetCatalogFreeCopy, "dataset-catalog-free");
  const future = note(copy.datasetCatalogFutureHeading, copy.datasetCatalogFutureCopy, "dataset-catalog-future");
  notes.append(free, future);
  sheet.append(notes);
  container.append(sheet);
}

function renderWelcome(model: DatasetCatalogViewModel, copy: UiCopy, isRoot: boolean, actions: DatasetCatalogDialogActions): HTMLElement {
  const welcome = document.createElement("section");
  welcome.className = "dataset-catalog-welcome";
  welcome.dataset.datasetCatalogWelcome = "";
  if (isRoot) {
    welcome.setAttribute("role", "region");
    welcome.setAttribute("aria-label", copy.datasetCatalogWelcomeTitle);
  }
  const heading = document.createElement("h3");
  heading.textContent = copy.datasetCatalogWelcomeTitle;
  if (isRoot) heading.setAttribute("aria-hidden", "true");
  const lead = document.createElement("p");
  lead.className = "dataset-catalog-welcome-lead";
  lead.textContent = copy.datasetCatalogWelcomeLead;
  welcome.append(heading, lead);

  if (isRoot && model.featured) welcome.append(renderFeatured(model, copy));

  if (isRoot) welcome.append(renderPurposeHub(model, copy, actions));

  const steps = document.createElement("ol");
  steps.className = "dataset-catalog-steps";
  for (const text of [copy.datasetCatalogStepObserve, copy.datasetCatalogStepWrite, copy.datasetCatalogStepShare]) {
    const step = document.createElement("li");
    step.dataset.datasetCatalogStep = "";
    step.textContent = text;
    steps.append(step);
  }
  welcome.append(steps);

  if (!isRoot && model.featured) welcome.append(renderFeatured(model, copy));

  return welcome;
}

function renderFeatured(model: DatasetCatalogViewModel, copy: UiCopy): HTMLElement {
  const featured = document.createElement("section");
  featured.className = "dataset-catalog-featured";
  featured.dataset.datasetCatalogFeatured = "";
  const featuredHeading = document.createElement("h4");
  featuredHeading.textContent = copy.datasetCatalogFeaturedHeading;
  const featuredLead = document.createElement("p");
  featuredLead.textContent = copy.datasetCatalogFeaturedLead(model.featured!.lessonTitle, model.featured!.lessonDurationMinutes);
  const actions = document.createElement("div");
  actions.className = "dataset-catalog-featured-actions";
  actions.append(
    link(model.featured!.packUrl, copy.datasetCatalogFeaturedPack, "dataset-catalog-featured-pack", true),
    link(model.featured!.builderUrl, copy.datasetCatalogCustomize, "dataset-catalog-featured-builder", false),
  );
  featured.append(featuredHeading, featuredLead, actions);
  return featured;
}

function renderPurposeHub(model: DatasetCatalogViewModel, copy: UiCopy, actions: DatasetCatalogDialogActions): HTMLElement {
  const hub = document.createElement("section");
  hub.className = "dataset-catalog-purpose-hub";
  hub.dataset.datasetCatalogPurposeHub = "";
  const heading = document.createElement("h3");
  heading.textContent = copy.datasetCatalogPurposeHeading;
  hub.append(heading);

  const availableCards = model.cards.filter((card) => card.status === "available");
  const lessonCount = availableCards.reduce((count, card) => count + (card.lessons ?? (card.lesson ? [card.lesson] : [])).filter((lesson) => lesson.status !== "unavailable").length, 0);
  const valueStrip = document.createElement("div");
  valueStrip.className = "dataset-catalog-purpose-strip";
  const coverage = document.createElement("p");
  coverage.dataset.datasetCatalogPurposeCoverage = "";
  coverage.textContent = copy.datasetCatalogPurposeCoverage(availableCards.length, lessonCount);
  const value = document.createElement("p");
  value.dataset.datasetCatalogPurposeValue = "";
  value.textContent = copy.datasetCatalogPurposeValue;
  valueStrip.append(coverage, value);
  hub.append(valueStrip);

  const cards = document.createElement("div");
  cards.className = "dataset-catalog-purpose-cards";
  const explore = purposeCard(copy.datasetCatalogPurposeExplore, copy.datasetCatalogPurposeExploreLead);
  explore.dataset.datasetCatalogPurpose = "explore";
  const exploreLink = link("#dataset-catalog-cards", copy.datasetCatalogPurposeExplore, "dataset-catalog-purpose-explore", true);
  exploreLink.addEventListener("click", (event) => {
    const target = document.getElementById("dataset-catalog-cards");
    if (!target) return;
    event.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  });
  explore.append(exploreLink);
  cards.append(explore);

  const build = purposeCard(copy.datasetCatalogPurposeBuild, copy.datasetCatalogPurposeBuildLead);
  build.dataset.datasetCatalogPurpose = "build";
  const builderUrl = model.featured?.builderUrl ?? model.cards.find((card) => card.builderUrl)?.builderUrl;
  if (builderUrl) build.append(link(builderUrl, copy.datasetCatalogPurposeBuild, "dataset-catalog-purpose-build", true));
  else build.append(disabledPurposeAction(copy.datasetCatalogPurposeBuild));
  cards.append(build);

  const resume = purposeCard(copy.datasetCatalogPurposeResume, copy.datasetCatalogPurposeResumeLead);
  resume.dataset.datasetCatalogPurpose = "resume";
  const fileLabel = document.createElement("label");
  fileLabel.className = "dataset-catalog-purpose-file-label";
  fileLabel.dataset.datasetCatalogPurposeDraftLabel = "";
  fileLabel.htmlFor = "dataset-catalog-purpose-draft-file";
  fileLabel.append(document.createTextNode(copy.datasetCatalogPurposeResumeOpen));
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "dataset-catalog-purpose-draft-file";
  fileInput.accept = ".json,application/json";
  fileInput.dataset.datasetCatalogPurposeDraftFile = "";
  fileLabel.append(fileInput);
  resume.append(fileLabel);
  const status = document.createElement("p");
  status.className = "dataset-catalog-purpose-status";
  status.dataset.datasetCatalogPurposeStatus = "";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  resume.append(status);
  let resumeAttempt = 0;
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    const attempt = ++resumeAttempt;
    if (file.size > LESSON_PACK_DRAFT_MAX_BYTES) {
      status.textContent = copy.datasetCatalogPurposeResumeInvalid;
      status.dataset.valid = "false";
      status.setAttribute("role", "alert");
      return;
    }
    status.textContent = copy.datasetCatalogPurposeResumeLoading;
    status.dataset.valid = "";
    const result = actions.onResumeDraft?.(file);
    if (result === undefined) {
      status.textContent = copy.datasetCatalogPurposeResumeInvalid;
      status.dataset.valid = "false";
      status.setAttribute("role", "alert");
      return;
    }
    Promise.resolve(result).then((ok) => {
      if (attempt !== resumeAttempt) return;
      if (ok) {
        status.textContent = "";
        status.dataset.valid = "true";
        status.setAttribute("role", "status");
      } else {
        status.textContent = copy.datasetCatalogPurposeResumeInvalid;
        status.dataset.valid = "false";
        status.setAttribute("role", "alert");
      }
    }).catch(() => {
      if (attempt !== resumeAttempt) return;
      status.textContent = copy.datasetCatalogPurposeResumeInvalid;
      status.dataset.valid = "false";
      status.setAttribute("role", "alert");
    });
  });
  cards.append(resume);
  hub.append(cards);
  return hub;
}

function purposeCard(title: string, lead: string): HTMLElement {
  const card = document.createElement("article");
  card.className = "dataset-catalog-purpose-card";
  const heading = document.createElement("h4");
  heading.textContent = title;
  const description = document.createElement("p");
  description.textContent = lead;
  card.append(heading, description);
  return card;
}

function disabledPurposeAction(text: string): HTMLSpanElement {
  const action = document.createElement("span");
  action.className = "dataset-catalog-cta dataset-catalog-cta-disabled";
  action.textContent = text;
  action.setAttribute("aria-disabled", "true");
  return action;
}

function renderCard(card: DatasetCatalogCardModel, copy: UiCopy, isRoot: boolean): HTMLElement {
  const article = document.createElement("article");
  article.className = `dataset-catalog-card dataset-catalog-card-${card.status}`;
  article.dataset.datasetCatalogCard = card.slug;
  if (isRoot) article.setAttribute("aria-label", `${copy.datasetCatalogCardPrefix}: ${card.title}`);
  const heading = document.createElement("h3");
  heading.textContent = card.title;
  if (isRoot) heading.setAttribute("aria-hidden", "true");
  article.append(heading);
  const region = document.createElement("p");
  region.className = "dataset-catalog-region";
  region.append(label(copy.datasetCatalogRegion), document.createTextNode(card.region));
  article.append(region);
  const description = document.createElement("p");
  description.className = "dataset-catalog-description";
  description.textContent = card.description;
  if (card.description) article.append(description);

  const badges = document.createElement("div");
  badges.className = "dataset-catalog-badges";
  if (card.status === "available") badges.append(badge(copy.datasetCatalogFreeDemo));
  if (card.lesson) badges.append(badge(copy.datasetCatalogPackBeta));
  article.append(badges);

  const lessonRows = card.lessons ?? (card.lesson ? [{ ...card.lesson, lessonUrl: card.lessonUrl ?? card.lesson.lessonUrl, builderUrl: card.builderUrl ?? card.lesson.builderUrl }] : []);
  if (card.status === "unavailable") {
    const unavailable = document.createElement("p");
    unavailable.className = "dataset-catalog-unavailable";
    unavailable.setAttribute("role", "status");
    unavailable.textContent = card.availabilityMessage || copy.datasetCatalogUnavailable;
    article.append(unavailable);
    if (lessonRows.length) article.append(renderLessonRows(lessonRows, copy));
  } else {
    article.append(renderStats(card, copy));
    article.append(renderCapabilities(copy, lessonRows.some((lesson) => lesson.status !== "unavailable")));
    if (lessonRows.length) article.append(renderLessonRows(lessonRows, copy));
    else {
      const lessonUnavailable = document.createElement("p");
      lessonUnavailable.className = "dataset-catalog-lesson-unavailable";
      lessonUnavailable.textContent = copy.datasetCatalogLessonUnavailable;
      article.append(lessonUnavailable);
    }
  }

  const actions = document.createElement("div");
  actions.className = "dataset-catalog-actions";
  if (card.status === "available") {
    actions.append(link(card.mapUrl, copy.datasetCatalogViewMap, "dataset-catalog-map", false));
    article.append(actions);
  }
  return article;
}

function renderStats(card: DatasetCatalogCardModel, copy: UiCopy): HTMLElement {
  const stats = document.createElement("dl");
  stats.className = "dataset-catalog-stats";
  stats.append(stat(copy.datasetCatalogYears, card.yearLabels.length ? card.yearLabels.join("・") : "—"));
  stats.append(stat(copy.datasetCatalogFeatures, String(card.featureCount)));
  stats.append(stat(copy.datasetCatalogEntities, String(card.entityCount)));
  stats.append(stat(copy.datasetCatalogSources, String(card.sourceCount)));
  return stats;
}

function renderLessonRows(lessons: readonly NonNullable<DatasetCatalogCardModel["lessons"]>[number][], copy: UiCopy): HTMLElement {
  const section = document.createElement("section");
  section.className = "dataset-catalog-lessons";
  section.setAttribute("aria-label", copy.datasetCatalogLesson);
  for (const lesson of lessons) {
    const row = document.createElement("article");
    row.className = `dataset-catalog-lesson-row dataset-catalog-lesson-row-${lesson.status ?? "available"}`;
    row.dataset.datasetCatalogLessonRow = lesson.id;
    const heading = document.createElement("h4");
    heading.textContent = lesson.title;
    row.append(heading);
    const meta = document.createElement("p");
    meta.className = "dataset-catalog-lesson";
    meta.append(label(copy.datasetCatalogLesson), document.createTextNode(`${lesson.durationMinutes}${copy.language === "ja" ? "分" : " min"} · ${lesson.stepCount}${copy.language === "ja" ? "ステップ" : " steps"}`));
    row.append(meta);
    if (lesson.recommendedFor && lesson.learningGoal) {
      const fit = document.createElement("p");
      fit.className = "dataset-catalog-lesson-guide";
      fit.dataset.datasetCatalogLessonGuide = "";
      fit.append(strong(copy.language === "ja" ? "利用の目安" : "Teaching fit"), document.createTextNode(lesson.recommendedFor));
      const goal = document.createElement("p");
      goal.className = "dataset-catalog-lesson-guide";
      goal.dataset.datasetCatalogLessonGoal = "";
      goal.append(strong(copy.language === "ja" ? "学習のねらい" : "Learning goal"), document.createTextNode(lesson.learningGoal));
      row.append(fit, goal);
    }
    if (lesson.status === "unavailable") {
      const unavailable = document.createElement("p");
      unavailable.className = "dataset-catalog-lesson-unavailable";
      unavailable.textContent = copy.datasetCatalogLessonUnavailable;
      row.append(unavailable);
    } else {
      const actions = document.createElement("div");
      actions.className = "dataset-catalog-lesson-actions";
      if (lesson.builderUrl) actions.append(link(lesson.builderUrl, copy.datasetCatalogCustomize, "dataset-catalog-builder", true));
      if (lesson.lessonUrl) actions.append(link(lesson.lessonUrl, copy.datasetCatalogStartLesson, "dataset-catalog-lesson", false));
      row.append(actions);
    }
    section.append(row);
  }
  return section;
}

function renderCapabilities(copy: UiCopy, hasLesson: boolean): HTMLElement {
  const section = document.createElement("section");
  section.className = "dataset-catalog-capabilities";
  const heading = document.createElement("h4");
  heading.textContent = copy.datasetCatalogCapabilities;
  const list = document.createElement("ul");
  const values = [copy.datasetCatalogCompare, copy.datasetCatalogEvidence, copy.datasetCatalogShare, copy.datasetCatalogReport];
  if (hasLesson) values.push(copy.datasetCatalogPack);
  for (const value of values) {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  }
  section.append(heading, list);
  return section;
}

function note(headingText: string, text: string, dataName: "dataset-catalog-free" | "dataset-catalog-future"): HTMLElement {
  const section = document.createElement("section");
  section.className = "dataset-catalog-note";
  section.setAttribute(`data-${dataName}`, "");
  const heading = document.createElement("h3");
  heading.textContent = headingText;
  const body = document.createElement("p");
  body.textContent = text;
  section.append(heading, body);
  return section;
}

function strong(text: string): HTMLElement {
  const element = document.createElement("strong");
  element.textContent = `${text}: `;
  return element;
}

function badge(text: string): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = "dataset-catalog-badge";
  element.textContent = text;
  return element;
}

function stat(term: string, value: string): HTMLElement {
  const wrapper = document.createElement("div");
  const title = document.createElement("dt");
  title.textContent = term;
  const detail = document.createElement("dd");
  detail.textContent = value;
  wrapper.append(title, detail);
  return wrapper;
}

function label(text: string): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = "dataset-catalog-label";
  element.textContent = `${text}: `;
  return element;
}

function link(href: string, text: string, dataName: "dataset-catalog-builder" | "dataset-catalog-lesson" | "dataset-catalog-map" | "dataset-catalog-featured-pack" | "dataset-catalog-featured-builder" | "dataset-catalog-purpose-explore" | "dataset-catalog-purpose-build", primary: boolean): HTMLAnchorElement {
  const element = document.createElement("a");
  element.href = href;
  element.textContent = text;
  element.className = primary ? "dataset-catalog-cta dataset-catalog-cta-primary" : "dataset-catalog-cta";
  element.setAttribute(`data-${dataName}`, "");
  return element;
}

function button(text: string, className: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = text;
  return element;
}
