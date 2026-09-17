import { localizedText } from "../domain/labels";
import type { ComparisonCandidate } from "../domain/comparison-candidates";
import type { PublicBundle } from "../domain/types";
import { uiCopy } from "./copy";

export function renderComparisonCard(container: HTMLElement, candidate: ComparisonCandidate | null, bundle: PublicBundle, open: boolean, selectedId: string | null, onToggle: () => void, onSelect: (featureId: string) => void, panelId = "comparison-panel"): void {
  const copy = uiCopy(bundle.dataset.defaultLanguage);
  container.replaceChildren(); container.hidden = !candidate;
  if (!candidate) return;
  const firstFeature = candidate.versions[0]!.feature;
  const entity = bundle.entitiesById[candidate.entityId];
  const name = entity ? localizedText(entity.labels, bundle.dataset.defaultLanguage) : localizedText(firstFeature.properties.labels, bundle.dataset.defaultLanguage);
  const toggle = document.createElement("button"); toggle.type = "button"; toggle.dataset.comparisonCta = ""; toggle.textContent = copy.comparisonCta(name); toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-controls", panelId); toggle.addEventListener("click", onToggle); container.append(toggle);
  if (!open) return;
  const card = document.createElement("section"); card.id = panelId; card.className = "comparison-card"; card.dataset.comparisonCard = "";
  const heading = document.createElement("h2"); heading.textContent = copy.comparisonTitle(name); card.append(heading);
  const versions = document.createElement("div"); versions.className = "comparison-versions";
  for (const { feature, year } of candidate.versions) {
    const column = document.createElement("article");
    const choose = document.createElement("button"); choose.type = "button"; choose.dataset.comparisonFeatureId = feature.id; choose.setAttribute("aria-pressed", String(selectedId === feature.id)); choose.textContent = copy.comparisonYear(year); choose.addEventListener("click", () => onSelect(feature.id));
    const label = document.createElement("p"); label.textContent = localizedText(feature.properties.labels, bundle.dataset.defaultLanguage);
    const description = document.createElement("p"); description.textContent = localizedText(feature.properties.description, bundle.dataset.defaultLanguage);
    const uncertainty = document.createElement("p"); uncertainty.textContent = `${copy.comparisonUncertainty}: ${Object.values(feature.properties.uncertainty).map((value) => copy.assessment(value.assessment)).join(copy.language === "ja" ? "、" : ", ")}`;
    column.append(choose, label, description, uncertainty); versions.append(column);
  }
  card.append(versions); container.append(card);
}

export function renderComparisonCards(container: HTMLElement, candidates: readonly ComparisonCandidate[], bundle: PublicBundle, openEntityId: string | null, selectedId: string | null, onToggle: (entityId: string) => void, onSelect: (featureId: string) => void): void {
  container.replaceChildren(); container.hidden = candidates.length === 0;
  for (const candidate of candidates) {
    const item = document.createElement("div"); item.className = "comparison-item";
    renderComparisonCard(item, candidate, bundle, openEntityId === candidate.entityId, selectedId, () => onToggle(candidate.entityId), onSelect, comparisonPanelId(candidate.entityId));
    container.append(item);
  }
}

function comparisonPanelId(entityId: string): string {
  return `comparison-panel-${encodeURIComponent(entityId)}`;
}
