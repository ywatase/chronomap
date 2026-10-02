import { displayYear, displayYearLocalized } from "../domain/labels";
import type { AppState } from "../app/state";
import type { FeatureVersion, PublicBundle, TemporalExtent } from "../domain/types";
import { uiCopy } from "./copy";
import { localizedText } from "../domain/labels";

export interface FeatureListOptions {
  readonly query?: string;
}

export function renderFeatureList(container: HTMLElement, state: AppState, bundle: PublicBundle, onSelect: (featureId: string, trigger: HTMLButtonElement) => void, options: FeatureListOptions = {}): void {
  const copy = uiCopy(bundle.dataset.defaultLanguage);
  container.replaceChildren();
  const heading = document.createElement("h2"); heading.id = "feature-list-heading"; heading.textContent = copy.featureHeading; container.append(heading);
  if (state.visibleFeatures.length === 0) {
    const notice = document.createElement("p"); notice.setAttribute("role", "status"); notice.textContent = copy.noFeatures(formatYear(state.selectedYear, bundle.dataset.defaultLanguage)); container.append(notice); return;
  }
  const query = (options.query ?? container.dataset.featureListQuery ?? "").trim();
  container.dataset.featureListQuery = query;
  const searchLabel = document.createElement("label"); searchLabel.className = "feature-list-search";
  const searchText = document.createElement("span"); searchText.textContent = copy.featureSearchLabel;
  const search = document.createElement("input"); search.type = "search"; search.id = "feature-list-search"; search.dataset.featureListSearch = ""; search.placeholder = copy.featureSearchPlaceholder; search.value = query; search.autocomplete = "off"; search.spellcheck = false; search.setAttribute("aria-controls", "feature-list-items");
  searchLabel.append(searchText, search); container.append(searchLabel);
  const filteredFeatures = query === "" ? state.visibleFeatures : state.visibleFeatures.filter((feature) => featureMatches(feature, bundle, query));
  const count = document.createElement("p"); count.className = "feature-count"; count.textContent = copy.featureCount(filteredFeatures.length, state.visibleFeatures.length); container.append(count);
  search.addEventListener("input", () => {
    const nextQuery = search.value;
    renderFeatureList(container, state, bundle, onSelect, { query: nextQuery });
    const nextSearch = container.querySelector<HTMLInputElement>("[data-feature-list-search]");
    nextSearch?.focus();
    nextSearch?.setSelectionRange(nextSearch.value.length, nextSearch.value.length);
  });
  if (filteredFeatures.length === 0) {
    const notice = document.createElement("p"); notice.setAttribute("role", "status"); notice.textContent = copy.featureSearchNoMatch(query); container.append(notice); return;
  }
  const list = document.createElement("ul"); list.className = "feature-list"; list.id = "feature-list-items";
  for (const group of groupedFeatures(filteredFeatures)) {
    const item = document.createElement("li");
    if (group.label) { const title = document.createElement("p"); title.className = "hypothesis-group"; title.textContent = `${group.label} — ${copy.noPreferredHypothesis}`; item.append(title); }
    const members = document.createElement("ul");
    for (const feature of group.features) {
      const member = document.createElement("li"); const button = document.createElement("button"); button.type = "button";
      button.className = "feature-choice"; button.setAttribute("aria-pressed", String(state.selectedFeatureId === feature.id));
      button.dataset.featureId = feature.id;
      const entity = bundle.entitiesById[feature.properties.entityId];
      const featureLabel = localizedText(feature.properties.labels, bundle.dataset.defaultLanguage);
      const entityLabel = entity ? localizedText(entity.labels, bundle.dataset.defaultLanguage) : copy.unknownEntity;
      const description = localizedText(feature.properties.description, bundle.dataset.defaultLanguage);
      const hypothesis = feature.properties.hypothesisLabel ? ` — ${localizedText(feature.properties.hypothesisLabel, bundle.dataset.defaultLanguage)}` : "";
      const period = periodText(feature.properties.temporal, bundle.dataset.defaultLanguage);
      const uncertainty = uncertaintySummary(feature, bundle.dataset.defaultLanguage);
      button.textContent = copy.language === "ja"
        ? `${featureLabel}${hypothesis}。${description} ${period}。${copy.geometry}: ${copy.geometryType(feature.geometry.type)}。${copy.uncertainty}: ${uncertainty}`
        : `${featureLabel} (${entityLabel})${feature.properties.hypothesisLabel ? `, ${localizedText(feature.properties.hypothesisLabel, bundle.dataset.defaultLanguage)}` : ""}. ${feature.geometry.type}; ${period}; uncertainty: ${uncertainty}.`;
      button.addEventListener("click", () => onSelect(feature.id, button)); member.append(button); members.append(member);
    }
    item.append(members); list.append(item);
  }
  container.append(list);
}

function featureMatches(feature: FeatureVersion, bundle: PublicBundle, query: string): boolean {
  const entity = bundle.entitiesById[feature.properties.entityId];
  const values = [
    feature.id,
    feature.properties.entityId,
    ...Object.values(feature.properties.labels),
    ...Object.values(feature.properties.description),
    ...(feature.properties.hypothesisLabel ? Object.values(feature.properties.hypothesisLabel) : []),
    ...(entity ? Object.values(entity.labels) : []),
    ...(entity ? Object.values(entity.description) : []),
  ];
  const normalizedQuery = normalizeSearch(query);
  return values.some((value) => normalizeSearch(value).includes(normalizedQuery));
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function groupedFeatures(features: readonly FeatureVersion[]): readonly { label: string | null; features: readonly FeatureVersion[] }[] {
  const groups = new Map<string, FeatureVersion[]>();
  for (const feature of [...features].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = feature.properties.hypothesisGroupId ?? `feature:${feature.id}`;
    groups.set(key, [...(groups.get(key) ?? []), feature]);
  }
  return [...groups.values()].map((members) => ({ label: members[0].properties.hypothesisGroupId ?? null, features: members }));
}

function periodText(temporal: TemporalExtent, language: string): string {
  const start = temporal.start?.earliestYear ?? undefined; const end = temporal.end?.latestYear ?? undefined;
  if (language.toLowerCase().startsWith("ja")) {
    if (start === undefined && end === undefined) return "年代不明・期間は開いています";
    if (start === undefined) return `${displayYearLocalized(end!, language)}まで`;
    if (end === undefined) return `${displayYearLocalized(start, language)}以降`;
    if (start === end) return `${displayYearLocalized(start, language)}時点`;
    return `${displayYearLocalized(start, language)}〜${displayYearLocalized(end, language)}`;
  }
  if (start === undefined && end === undefined) return "possible period is open";
  if (start === undefined) return `possible through ${displayYear(end!)}`;
  if (end === undefined) return `possible from ${displayYear(start)}`;
  return `possible ${displayYear(start)} to ${displayYear(end)}`;
}

function uncertaintySummary(feature: FeatureVersion, language: string): string {
  const copy = uiCopy(language);
  return Object.entries(feature.properties.uncertainty).map(([name, value]) => `${copy.dimension(name)} ${copy.assessment(value.assessment)}`).join(language.toLowerCase().startsWith("ja") ? "、" : ", ");
}

function formatYear(year: number, language: string): string {
  return displayYearLocalized(year, language);
}
