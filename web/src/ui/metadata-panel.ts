import { displayYear, localizedText } from "../domain/labels";
import type { FeatureVersion, PublicBundle, Rights, TemporalExtent } from "../domain/types";

const citationOnlyNotice = "Citation-only metadata; no authored source content is reproduced.";

export function renderMetadataPanel(container: HTMLElement, selectedFeature: FeatureVersion | null, bundle: PublicBundle, onClose: () => void): void {
  container.replaceChildren();
  if (!selectedFeature) { const text = document.createElement("p"); text.textContent = "Select a feature to view its details."; container.append(text); return; }
  const entity = bundle.entitiesById[selectedFeature.properties.entityId];
  const heading = document.createElement("h2"); heading.textContent = "Feature details"; container.append(heading);
  const close = document.createElement("button"); close.type = "button"; close.textContent = "Close details"; close.addEventListener("click", onClose); container.append(close);
  section(container, "Entity", entity
    ? [`${localizedText(entity.labels, bundle.dataset.defaultLanguage)} (${entity.type})`, localizedText(entity.description, bundle.dataset.defaultLanguage)]
    : ["Entity metadata is unavailable."]);
  section(container, "Version", [localizedText(selectedFeature.properties.labels, bundle.dataset.defaultLanguage), localizedText(selectedFeature.properties.description, bundle.dataset.defaultLanguage), `Geometry: ${selectedFeature.geometry.type}`]);
  section(container, "Time", [periodText(selectedFeature.properties.temporal)]);
  const uncertainty = document.createElement("section"); const uncertaintyHeading = document.createElement("h3"); uncertaintyHeading.textContent = "Uncertainty"; uncertainty.append(uncertaintyHeading);
  for (const [dimension, assessment] of Object.entries(selectedFeature.properties.uncertainty)) uncertainty.append(line(`${dimension}: ${assessment.assessment}${assessment.note ? ` — ${assessment.note}` : ""}; evidence: ${assessment.evidenceIds.join(", ") || "none"}`));
  container.append(uncertainty);
  evidenceSection(container, selectedFeature, bundle);
  const sourceIds = [...new Set(selectedFeature.properties.evidenceIds.map((id) => bundle.evidenceById[id]?.sourceId).filter((id): id is string => Boolean(id)))];
  sourceSection(container, sourceIds, bundle);
  section(container, "Rights", [rightsText("FeatureVersion", selectedFeature.properties.rights), rightsText("Dataset", bundle.dataset.rights)]);
}

function section(container: HTMLElement, title: string, lines: readonly string[]): void { const sectionElement = document.createElement("section"); const heading = document.createElement("h3"); heading.textContent = title; sectionElement.append(heading); lines.forEach((value) => sectionElement.append(line(value))); container.append(sectionElement); }
function line(value: string): HTMLParagraphElement { const paragraph = document.createElement("p"); paragraph.textContent = value; return paragraph; }
function rightsText(subject: string, rights: Rights): string { return `${subject} rights: ${rights.status}${rights.attribution ? `; attribution ${rights.attribution}` : ""}${rights.terms ? `; terms ${rights.terms}` : ""}`; }
function periodText(temporal: TemporalExtent): string { const start = temporal.start; const end = temporal.end; const boundary = (value: NonNullable<TemporalExtent["start"]>) => `${displayYear(value.earliestYear ?? value.latestYear!)} (${value.precision}, ${value.qualifier})`; if (!start && !end) return "Possible period is open."; if (!start) return `Possible through ${boundary(end!)}.`; if (!end) return `Possible from ${boundary(start)} onward.`; return `Possible from ${boundary(start)} through ${boundary(end)}.`; }
function sourceAnchor(id: string): string { return `source-${encodeURIComponent(id)}`; }
function evidenceSection(container: HTMLElement, feature: FeatureVersion, bundle: PublicBundle): void { const element = document.createElement("section"); const heading = document.createElement("h3"); heading.textContent = "Evidence"; element.append(heading); for (const id of feature.properties.evidenceIds) { const evidence = bundle.evidenceById[id]; if (!evidence) continue; const p = line(`${evidence.id}: supports ${evidence.supports.join(", ")}; locator ${evidence.locator}; ${evidence.note} `); const link = document.createElement("a"); link.href = `#${sourceAnchor(evidence.sourceId)}`; link.textContent = bundle.sourcesById[evidence.sourceId]?.citation ?? "View source"; p.append(link); element.append(p); } if (!element.querySelector("p")) element.append(line("No evidence references.")); container.append(element); }
function sourceSection(container: HTMLElement, sourceIds: readonly string[], bundle: PublicBundle): void { const element = document.createElement("section"); const heading = document.createElement("h3"); heading.textContent = "Source"; element.append(heading); for (const id of sourceIds) { const source = bundle.sourcesById[id]; if (!source) continue; const item = document.createElement("article"); item.id = sourceAnchor(id); item.append(line(`${source.citation}; ${localizedText(source.title, bundle.dataset.defaultLanguage)}; ${source.creators.join(", ")}; ${displayYear(source.publishedYear)}; accessed ${source.accessedDate}`)); const url = document.createElement("a"); url.href = source.url; url.target = "_blank"; url.rel = "noopener noreferrer"; url.textContent = source.url; item.append(url); if (source.rights.status === "restricted" || source.rights.status === "unknown") item.append(line(citationOnlyNotice)); item.append(line(rightsText("Source", source.rights))); element.append(item); } if (!element.querySelector("article")) element.append(line("No source metadata.")); container.append(element); }
