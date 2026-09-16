import type { AppState } from "../app/state";
import { displayYear, localizedText } from "../domain/labels";
import type { FeatureVersion, PublicBundle, TemporalExtent } from "../domain/types";

export function renderFeatureList(container: HTMLElement, state: AppState, bundle: PublicBundle, onSelect: (featureId: string, trigger: HTMLButtonElement) => void): void {
  container.replaceChildren();
  const heading = document.createElement("h2"); heading.id = "feature-list-heading"; heading.textContent = "Features"; container.append(heading);
  if (state.visibleFeatures.length === 0) {
    const notice = document.createElement("p"); notice.setAttribute("role", "status"); notice.textContent = `No features match ${displayYear(state.selectedYear)}.`; container.append(notice); return;
  }
  const list = document.createElement("ul"); list.className = "feature-list";
  for (const group of groupedFeatures(state.visibleFeatures)) {
    const item = document.createElement("li");
    if (group.label) { const title = document.createElement("p"); title.className = "hypothesis-group"; title.textContent = `${group.label} — No preferred hypothesis`; item.append(title); }
    const members = document.createElement("ul");
    for (const feature of group.features) {
      const member = document.createElement("li"); const button = document.createElement("button"); button.type = "button";
      button.className = "feature-choice"; button.setAttribute("aria-pressed", String(state.selectedFeatureId === feature.id));
      button.dataset.featureId = feature.id;
      const hypothesis = feature.properties.hypothesisLabel ? `, ${localizedText(feature.properties.hypothesisLabel, bundle.dataset.defaultLanguage)}` : "";
      const entity = bundle.entitiesById[feature.properties.entityId];
      const entityLabel = entity ? localizedText(entity.labels, bundle.dataset.defaultLanguage) : "Unknown entity";
      button.textContent = `${localizedText(feature.properties.labels, bundle.dataset.defaultLanguage)} (${entityLabel})${hypothesis}. ${feature.geometry.type}; ${periodText(feature.properties.temporal)}; uncertainty: ${uncertaintySummary(feature)}.`;
      button.addEventListener("click", () => onSelect(feature.id, button)); member.append(button); members.append(member);
    }
    item.append(members); list.append(item);
  }
  container.append(list);
}

function groupedFeatures(features: readonly FeatureVersion[]): readonly { label: string | null; features: readonly FeatureVersion[] }[] {
  const groups = new Map<string, FeatureVersion[]>();
  for (const feature of [...features].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = feature.properties.hypothesisGroupId ?? `feature:${feature.id}`;
    groups.set(key, [...(groups.get(key) ?? []), feature]);
  }
  return [...groups.values()].map((members) => ({ label: members[0].properties.hypothesisGroupId ?? null, features: members }));
}

function periodText(temporal: TemporalExtent): string {
  const start = temporal.start?.earliestYear ?? undefined; const end = temporal.end?.latestYear ?? undefined;
  if (start === undefined && end === undefined) return "possible period is open";
  if (start === undefined) return `possible through ${displayYear(end!)}`;
  if (end === undefined) return `possible from ${displayYear(start)}`;
  return `possible ${displayYear(start)} to ${displayYear(end)}`;
}

function uncertaintySummary(feature: FeatureVersion): string {
  return Object.entries(feature.properties.uncertainty).map(([name, value]) => `${name} ${value.assessment}`).join(", ");
}
