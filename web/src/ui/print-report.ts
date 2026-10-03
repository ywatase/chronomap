import type { ReportEvidence, ReportModel } from "../domain/report-model";
import { uiCopy } from "./copy";

export interface PrintReportActions {
  readonly onClose: () => void;
  readonly onPrint: () => void;
}

/** Renders the semantic, citation-only document used by the browser print dialog. */
export function renderPrintReport(container: HTMLElement, model: ReportModel, actions: PrintReportActions): void {
  const copy = uiCopy(model.language);
  container.replaceChildren();
  container.className = "report-dialog";
  container.dataset.reportDialog = "";
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "true");
  container.setAttribute("aria-labelledby", "report-heading");

  const sheet = document.createElement("article");
  sheet.className = "report-sheet";
  const header = document.createElement("header");
  header.className = "report-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Chronomap";
  const heading = document.createElement("h2");
  heading.id = "report-heading";
  heading.textContent = copy.reportTitle(model.datasetTitle, model.year);
  const lead = document.createElement("p");
  lead.className = "report-lead";
  lead.textContent = copy.reportLead;
  header.append(eyebrow, heading, lead);
  sheet.append(header);

  const summary = section(copy.reportSummary);
  summary.classList.add("report-summary");
  summary.append(detail(copy.reportVisibleFeatures(model.visibleFeatureCount)));
  summary.append(detail(`${model.datasetTitle} (${model.datasetId})`));
  sheet.append(summary);

  const mapSection = section(copy.reportMap);
  mapSection.classList.add("report-map");
  const mapDescription = detail(model.basemapError ? copy.reportMapUnavailable : copy.language === "ja" ? "画面左側の地図表示と共有URLから、同じ表示を再現できます。" : "The map shown beside this sheet and the shared URL reproduce this view.");
  mapDescription.className = "report-map-note";
  mapSection.append(mapDescription);
  sheet.append(mapSection);

  const featureSection = section(copy.reportFeature);
  featureSection.classList.add("report-feature");
  const featureHeading = document.createElement("h4");
  featureHeading.textContent = model.feature.label;
  featureSection.append(featureHeading);
  featureSection.append(detail(`${copy.reportEntity}: ${model.feature.entityLabel}`));
  if (model.feature.entityType) featureSection.append(detail(`${copy.reportEntityType}: ${model.feature.entityType}`));
  if (model.feature.hypothesis) featureSection.append(detail(`${copy.reportHypothesis}: ${model.feature.hypothesis}`));
  if (model.feature.entityDescription) featureSection.append(detail(model.feature.entityDescription));
  featureSection.append(detail(`${copy.reportDescription}: ${model.feature.description}`));
  featureSection.append(detail(`${copy.reportPeriod}: ${model.feature.period}`));
  featureSection.append(detail(`${copy.reportGeometry}: ${model.feature.geometry}`));
  featureSection.append(detail(`${copy.reportFeatureId}: ${model.feature.id}`));
  const uncertainty = document.createElement("div");
  uncertainty.className = "report-callout";
  const uncertaintyHeading = document.createElement("h4");
  uncertaintyHeading.textContent = copy.reportUncertainty;
  uncertainty.append(uncertaintyHeading);
  for (const value of model.feature.uncertainty) uncertainty.append(detail(value));
  featureSection.append(uncertainty, detail(`${copy.reportRights}: ${model.feature.rights}`));
  sheet.append(featureSection);

  if (model.comparison.length > 1) {
    const comparison = section(copy.reportComparison);
    comparison.classList.add("report-comparison");
    const list = document.createElement("div");
    list.className = "report-comparison-grid";
    for (const version of model.comparison) {
      const item = document.createElement("article");
      const year = document.createElement("h4");
      year.textContent = version.year;
      const label = detail(version.label);
      const description = detail(version.description);
      const uncertaintyText = detail(`${copy.reportUncertainty}: ${version.uncertainty}`);
      item.append(year, label, description, uncertaintyText);
      list.append(item);
    }
    comparison.append(list);
    sheet.append(comparison);
  }

  const evidence = section(copy.reportEvidence);
  evidence.classList.add("report-evidence");
  if (!model.feature.evidence.length) evidence.append(detail(copy.reportNoEvidence));
  for (const item of model.feature.evidence) evidence.append(renderEvidence(item, copy));
  sheet.append(evidence);

  const sources = section(copy.reportSources);
  sources.classList.add("report-sources");
  const sourceItems = [...new Map(model.feature.evidence.filter((item) => item.citation || item.title).map((item) => [item.url || item.citation, item])).values()];
  if (!sourceItems.length) sources.append(detail(copy.reportNoSources));
  for (const item of sourceItems) sources.append(renderSource(item, copy));
  sheet.append(sources);

  const rights = section(copy.reportRights);
  rights.classList.add("report-rights");
  rights.append(detail(model.datasetRights));
  if (model.feature.evidence.some((item) => item.citationOnly)) rights.append(detail(copy.reportCitationOnly));
  sheet.append(rights);

  const share = section(copy.reportShareUrl);
  share.classList.add("report-share");
  const link = document.createElement("a");
  link.href = model.shareUrl || "#";
  link.textContent = model.shareUrl || copy.reportShareUrl;
  link.className = "report-share-url";
  share.append(link);
  sheet.append(share);

  const actionsBar = document.createElement("div");
  actionsBar.className = "report-actions";
  const print = document.createElement("button");
  print.type = "button";
  print.dataset.reportPrint = "";
  print.textContent = copy.reportPrint;
  print.addEventListener("click", actions.onPrint);
  const close = document.createElement("button");
  close.type = "button";
  close.dataset.reportClose = "";
  close.textContent = copy.reportClose;
  close.addEventListener("click", actions.onClose);
  actionsBar.append(print, close);

  const hint = document.createElement("p");
  hint.className = "report-print-hint";
  hint.textContent = copy.reportLead;
  container.append(actionsBar, sheet, hint);
}

function section(title: string): HTMLElement {
  const element = document.createElement("section");
  element.className = "report-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  element.append(heading);
  return element;
}

function detail(value: string): HTMLParagraphElement {
  const paragraph = document.createElement("p");
  paragraph.textContent = value;
  return paragraph;
}

function renderEvidence(item: ReportEvidence, copy: ReturnType<typeof uiCopy>): HTMLElement {
  const element = document.createElement("article");
  element.className = "report-evidence-item";
  const heading = document.createElement("h4");
  heading.textContent = item.id;
  element.append(heading);
  element.append(detail(`${copy.reportSupports}: ${item.supports.join(copy.language === "ja" ? "・" : ", ")}`));
  element.append(detail(`${copy.reportLocator}: ${item.locator}`));
  element.append(detail(item.note));
  return element;
}

function renderSource(item: ReportEvidence, copy: ReturnType<typeof uiCopy>): HTMLElement {
  const element = document.createElement("article");
  element.className = "report-source-item";
  const heading = document.createElement("h4");
  heading.textContent = item.citation;
  element.append(heading);
  if (item.title) element.append(detail(item.title));
  if (item.url && isSafeHttpUrl(item.url)) {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = copy.reportSourceLink;
    link.setAttribute("aria-label", `${copy.reportSourceLink}: ${item.url}`);
    element.append(link);
    const url = detail(item.url);
    url.className = "report-source-url";
    element.append(url);
  }
  element.append(detail(item.rights));
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
