import { displayYear, displayYearLocalized, localizedText } from "../domain/labels";
import type { FeatureVersion, PublicBundle, TemporalExtent } from "../domain/types";
import { entityTypeLabel, uiCopy } from "./copy";

export function renderMetadataPanel(container: HTMLElement, selectedFeature: FeatureVersion | null, bundle: PublicBundle, onClose: () => void): void {
  const copy = uiCopy(bundle.dataset.defaultLanguage);
  container.replaceChildren();
  if (!selectedFeature) { const text = document.createElement("p"); text.textContent = copy.selectDetails; container.append(text); return; }
  const entity = bundle.entitiesById[selectedFeature.properties.entityId];
  const heading = document.createElement("h2"); heading.textContent = copy.featureDetails; container.append(heading);
  const close = document.createElement("button"); close.type = "button"; close.textContent = copy.closeDetails; close.addEventListener("click", onClose); container.append(close);
  section(container, copy.entity, entity
    ? [`${localizedText(entity.labels, bundle.dataset.defaultLanguage)}${copy.language === "ja" ? `（${entityTypeLabel(entity.type, copy.language)}）` : ` (${entityTypeLabel(entity.type, copy.language)})`}`, localizedText(entity.description, bundle.dataset.defaultLanguage)]
    : [copy.unknownEntity]);
  const hypothesis = selectedFeature.properties.hypothesisLabel
    ? [`${copy.hypothesisGroup}: ${localizedText(selectedFeature.properties.hypothesisLabel, bundle.dataset.defaultLanguage)}${selectedFeature.properties.hypothesisGroupId ? ` (${selectedFeature.properties.hypothesisGroupId})` : ""}`]
    : [];
  section(container, copy.version, [localizedText(selectedFeature.properties.labels, bundle.dataset.defaultLanguage), ...hypothesis, localizedText(selectedFeature.properties.description, bundle.dataset.defaultLanguage), `${copy.geometry}: ${copy.geometryType(selectedFeature.geometry.type)}`]);
  section(container, copy.time, [periodText(selectedFeature.properties.temporal, bundle.dataset.defaultLanguage)]);
  const uncertainty = document.createElement("section"); const uncertaintyHeading = document.createElement("h3"); uncertaintyHeading.textContent = copy.uncertaintyHeading; uncertainty.append(uncertaintyHeading);
  for (const [dimension, assessment] of Object.entries(selectedFeature.properties.uncertainty)) uncertainty.append(line(copy.language === "ja"
    ? `${copy.dimension(dimension)}: ${copy.assessment(assessment.assessment)}${assessment.note ? ` — ${assessment.note}` : ""}。根拠: ${assessment.evidenceIds.join(", ") || "なし"}`
    : `${dimension}: ${assessment.assessment}${assessment.note ? ` — ${assessment.note}` : ""}; evidence: ${assessment.evidenceIds.join(", ") || "none"}`));
  container.append(uncertainty);
  evidenceSection(container, selectedFeature, bundle);
  const sourceIds = [...new Set(selectedFeature.properties.evidenceIds.map((id) => bundle.evidenceById[id]?.sourceId).filter((id): id is string => Boolean(id)))];
  sourceSection(container, sourceIds, bundle);
  section(container, copy.rights, [copy.rightsText(copy.language === "ja" ? "地物" : "FeatureVersion", selectedFeature.properties.rights), copy.rightsText(copy.language === "ja" ? "データセット" : "Dataset", bundle.dataset.rights)]);
}

function section(container: HTMLElement, title: string, lines: readonly string[]): void { const sectionElement = document.createElement("section"); const heading = document.createElement("h3"); heading.textContent = title; sectionElement.append(heading); lines.forEach((value) => sectionElement.append(line(value))); container.append(sectionElement); }
function line(value: string): HTMLParagraphElement { const paragraph = document.createElement("p"); paragraph.textContent = value; return paragraph; }
function periodText(temporal: TemporalExtent, language: string): string {
  const start = temporal.start; const end = temporal.end;
  if (language.toLowerCase().startsWith("ja")) {
    const startYear = start?.earliestYear ?? null; const endYear = end?.latestYear ?? null;
    const startText = startYear === null ? "開始時点不明" : displayYearLocalized(startYear, language);
    const endText = endYear === null ? "終了時点不明" : displayYearLocalized(endYear, language);
    if (!start && !end) return "可能期間は開いています。";
    if (!start) return `${endText}まで（${end?.precision}・${end?.qualifier}）。`;
    if (!end) return `${startText}以降（${start.precision}・${start.qualifier}）。`;
    return startYear === endYear ? `${startText}時点（${start.precision}・${start.qualifier}）。` : `${startText}から${endText}まで（${start.precision}・${start.qualifier}）。`;
  }
  const startBoundary = (value: NonNullable<TemporalExtent["start"]>) => value.earliestYear === null ? `open start (${value.precision}, ${value.qualifier})` : `${displayYear(value.earliestYear)} (${value.precision}, ${value.qualifier})`;
  const endBoundary = (value: NonNullable<TemporalExtent["end"]>) => value.latestYear === null ? `open end (${value.precision}, ${value.qualifier})` : `${displayYear(value.latestYear)} (${value.precision}, ${value.qualifier})`;
  if (!start && !end) return "Possible period is open.";
  if (!start) return `Possible through ${endBoundary(end!)}.`;
  if (!end) return `Possible from ${startBoundary(start)} onward.`;
  return `Possible from ${startBoundary(start)} through ${endBoundary(end)}.`;
}

function evidenceSection(container: HTMLElement, feature: FeatureVersion, bundle: PublicBundle): void {
  const copy = uiCopy(bundle.dataset.defaultLanguage); const element = document.createElement("section"); const heading = document.createElement("h3"); heading.textContent = copy.evidence; element.append(heading);
  for (const id of feature.properties.evidenceIds) {
    const evidence = bundle.evidenceById[id]; if (!evidence) continue;
    const p = line(copy.language === "ja" ? `${evidence.id}: ${evidence.supports.join("・")}を補強。参照位置: ${evidence.locator}。${evidence.note} ` : `${evidence.id}: supports ${evidence.supports.join(", ")}; locator ${evidence.locator}; ${evidence.note} `);
    const link = document.createElement("a"); link.href = `#${sourceAnchor(evidence.sourceId)}`; link.textContent = bundle.sourcesById[evidence.sourceId]?.citation ?? copy.source; p.append(link); element.append(p);
  }
  if (!element.querySelector("p")) element.append(line(copy.noEvidence)); container.append(element);
}

function sourceSection(container: HTMLElement, sourceIds: readonly string[], bundle: PublicBundle): void {
  const copy = uiCopy(bundle.dataset.defaultLanguage); const element = document.createElement("section"); const heading = document.createElement("h3"); heading.textContent = copy.source; element.append(heading);
  for (const id of sourceIds) {
    const source = bundle.sourcesById[id]; if (!source) continue;
    const item = document.createElement("article"); item.id = sourceAnchor(id);
    item.append(line(copy.language === "ja" ? `${source.citation}。${localizedText(source.title, bundle.dataset.defaultLanguage)}。作成者: ${source.creators.join(", ")}。${source.publishedYear}年。${copy.accessed}: ${source.accessedDate}` : `${source.citation}; ${localizedText(source.title, bundle.dataset.defaultLanguage)}; ${source.creators.join(", ")}; ${displayYear(source.publishedYear)}; accessed ${source.accessedDate}`));
    if (isSafeHttpUrl(source.url)) { const url = document.createElement("a"); url.href = source.url; url.target = "_blank"; url.rel = "noopener noreferrer"; url.textContent = source.url; item.append(url); } else item.append(line(source.url));
    if (source.rights.status === "restricted" || source.rights.status === "unknown") item.append(line(copy.citationOnly));
    item.append(line(copy.rightsText(copy.language === "ja" ? "出典" : "Source", source.rights))); element.append(item);
  }
  if (!element.querySelector("article")) element.append(line(copy.noSource)); container.append(element);
}

function sourceAnchor(id: string): string { return `source-${id}`; }
function isSafeHttpUrl(value: string): boolean { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
