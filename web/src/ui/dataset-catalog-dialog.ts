import type { DatasetCatalogCardModel, DatasetCatalogViewModel } from "../domain/dataset-catalog-view-model";
import type { UiCopy } from "./copy";

export interface DatasetCatalogDialogActions {
  readonly onClose: () => void;
  readonly isRoot?: boolean;
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

  sheet.append(renderWelcome(model, copy, Boolean(actions.isRoot)));

  const grid = document.createElement("div");
  grid.className = "dataset-catalog-grid";
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

function renderWelcome(model: DatasetCatalogViewModel, copy: UiCopy, isRoot: boolean): HTMLElement {
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

  const steps = document.createElement("ol");
  steps.className = "dataset-catalog-steps";
  for (const text of [copy.datasetCatalogStepObserve, copy.datasetCatalogStepWrite, copy.datasetCatalogStepShare]) {
    const step = document.createElement("li");
    step.dataset.datasetCatalogStep = "";
    step.textContent = text;
    steps.append(step);
  }
  welcome.append(steps);

  if (model.featured) {
    const featured = document.createElement("section");
    featured.className = "dataset-catalog-featured";
    featured.dataset.datasetCatalogFeatured = "";
    const featuredHeading = document.createElement("h4");
    featuredHeading.textContent = copy.datasetCatalogFeaturedHeading;
    const featuredLead = document.createElement("p");
    featuredLead.textContent = copy.datasetCatalogFeaturedLead(model.featured.lessonTitle, model.featured.lessonDurationMinutes);
    const actions = document.createElement("div");
    actions.className = "dataset-catalog-featured-actions";
    actions.append(
      link(model.featured.packUrl, copy.datasetCatalogFeaturedPack, "dataset-catalog-featured-pack", true),
      link(model.featured.builderUrl, copy.datasetCatalogCustomize, "dataset-catalog-featured-builder", false),
    );
    featured.append(featuredHeading, featuredLead, actions);
    welcome.append(featured);
  }
  return welcome;
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

  if (card.status === "unavailable") {
    const unavailable = document.createElement("p");
    unavailable.className = "dataset-catalog-unavailable";
    unavailable.setAttribute("role", "status");
    unavailable.textContent = card.availabilityMessage || copy.datasetCatalogUnavailable;
    article.append(unavailable);
  } else {
    article.append(renderStats(card, copy));
    article.append(renderCapabilities(copy, Boolean(card.lesson)));
    if (card.lesson) article.append(renderLessonMeta(card, copy));
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
    if (card.builderUrl) actions.append(link(card.builderUrl, copy.datasetCatalogCustomize, "dataset-catalog-builder", true));
    if (card.lessonUrl) actions.append(link(card.lessonUrl, copy.datasetCatalogStartLesson, "dataset-catalog-lesson", false));
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

function renderLessonMeta(card: DatasetCatalogCardModel, copy: UiCopy): HTMLElement {
  const lesson = card.lesson!;
  const meta = document.createElement("p");
  meta.className = "dataset-catalog-lesson";
  meta.append(label(copy.datasetCatalogLesson), document.createTextNode(`${lesson.title} · ${lesson.durationMinutes}${copy.language === "ja" ? "分" : " min"} · ${lesson.stepCount}${copy.language === "ja" ? "ステップ" : " steps"}`));
  return meta;
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

function link(href: string, text: string, dataName: "dataset-catalog-builder" | "dataset-catalog-lesson" | "dataset-catalog-map" | "dataset-catalog-featured-pack" | "dataset-catalog-featured-builder", primary: boolean): HTMLAnchorElement {
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
