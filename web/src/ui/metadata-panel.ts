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
  const evidenceLines = selectedFeature.properties.evidenceIds.flatMap((id) => { const evidence = bundle.evidenceById[id]; return evidence ? [`${evidence.id}: supports ${evidence.supports.join(", ")}; locator ${evidence.locator}; ${evidence.note}`] : []; });
  section(container, "Evidence", evidenceLines.length ? evidenceLines : ["No evidence references."]);
  const sourceIds = [...new Set(selectedFeature.properties.evidenceIds.map((id) => bundle.evidenceById[id]?.sourceId).filter((id): id is string => Boolean(id)))];
  const sourceLines = sourceIds.flatMap((id) => { const source = bundle.sourcesById[id]; if (!source) return []; const base = `${source.citation}; ${localizedText(source.title, bundle.dataset.defaultLanguage)}; ${source.creators.join(", ")}; ${source.publishedYear}; ${source.url}; accessed ${source.accessedDate}`; return source.rights.status === "restricted" || source.rights.status === "unknown" ? [base, citationOnlyNotice, rightsText("Source", source.rights)] : [base, rightsText("Source", source.rights)]; });
  section(container, "Source", sourceLines.length ? sourceLines : ["No source metadata."]);
  section(container, "Rights", [rightsText("FeatureVersion", selectedFeature.properties.rights), rightsText("Dataset", bundle.dataset.rights)]);
}

function section(container: HTMLElement, title: string, lines: readonly string[]): void { const sectionElement = document.createElement("section"); const heading = document.createElement("h3"); heading.textContent = title; sectionElement.append(heading); lines.forEach((value) => sectionElement.append(line(value))); container.append(sectionElement); }
function line(value: string): HTMLParagraphElement { const paragraph = document.createElement("p"); paragraph.textContent = value; return paragraph; }
function rightsText(subject: string, rights: Rights): string { return `${subject} rights: ${rights.status}${rights.attribution ? `; attribution ${rights.attribution}` : ""}${rights.terms ? `; terms ${rights.terms}` : ""}`; }
function periodText(temporal: TemporalExtent): string { const start = temporal.start?.earliestYear ?? undefined; const end = temporal.end?.latestYear ?? undefined; if (start === undefined && end === undefined) return "Possible period is open."; if (start === undefined) return `Possible through ${displayYear(end!)}.`; if (end === undefined) return `Possible from ${displayYear(start)}.`; return `Possible from ${displayYear(start)} through ${displayYear(end)}.`; }
