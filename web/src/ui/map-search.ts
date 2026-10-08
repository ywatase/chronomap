import { displayYearLocalized, localizedText } from "../domain/labels";
import type { FeatureVersion, PublicBundle, TemporalExtent } from "../domain/types";
import { entityTypeLabel } from "./copy";
import type { UiCopy } from "./copy";
import { featureMatches } from "./feature-search";

export interface MapSearchController {
  readonly element: HTMLDetailsElement;
  setFeatures(features: readonly FeatureVersion[], selectedFeatureId?: string | null): void;
}

/**
 * A map-first search for all public snapshots in the loaded bundle.
 * Results are deliberately local and citation-free: choosing one hands the
 * feature id back to the shell, which owns year changes, details, and camera.
 */
export function createMapSearch(
  copy: UiCopy,
  bundle: PublicBundle,
  onSelect: (featureId: string, trigger: HTMLButtonElement) => void,
): MapSearchController {
  let visibleFeatures: readonly FeatureVersion[] = [];
  let selectedFeatureId: string | null = null;
  let query = "";

  const element = document.createElement("details");
  element.className = "map-search";
  element.dataset.mapSearch = "";
  const summary = document.createElement("summary");
  summary.textContent = copy.mapSearchLabel;
  element.append(summary);

  const body = document.createElement("div");
  body.className = "map-search-body";
  const label = document.createElement("label");
  label.className = "map-search-label";
  const labelText = document.createElement("span");
  labelText.textContent = copy.mapSearchPlaceholder;
  const input = document.createElement("input");
  input.type = "search";
  input.id = "map-feature-search";
  input.dataset.mapFeatureSearch = "";
  input.placeholder = copy.mapSearchPlaceholder;
  input.setAttribute("aria-label", copy.mapSearchLabel);
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-controls", "map-feature-search-results");
  label.append(labelText, input);
  body.append(label);
  const scope = document.createElement("p");
  scope.className = "map-search-scope";
  scope.textContent = copy.mapSearchScope;
  body.append(scope);
  const count = document.createElement("p");
  count.className = "map-search-count";
  count.setAttribute("aria-live", "polite");
  body.append(count);
  const results = document.createElement("ul");
  results.id = "map-feature-search-results";
  results.className = "map-search-results";
  body.append(results);
  element.append(body);

  const allFeatures = bundle.features.filter((feature) => feature.properties.publicationStatus === "public");
  const render = () => {
    const trimmedQuery = query.trim();
    const filtered = trimmedQuery === "" ? [] : allFeatures.filter((feature) => featureMatches(feature, bundle, query));
    count.textContent = trimmedQuery === "" ? "" : copy.featureCount(filtered.length, allFeatures.length);
    results.replaceChildren();
    results.hidden = trimmedQuery === "";
    if (trimmedQuery === "") return;
    if (filtered.length === 0) {
      const notice = document.createElement("li");
      notice.className = "map-search-empty";
      notice.textContent = copy.featureSearchNoMatch(query);
      results.append(notice);
      return;
    }
    for (const feature of filtered) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.mapFeatureResult = "";
      button.dataset.mapFeatureId = feature.id;
      button.setAttribute("aria-pressed", String(selectedFeatureId === feature.id && visibleFeatures.some((candidate) => candidate.id === feature.id)));
      const entity = bundle.entitiesById[feature.properties.entityId];
      const labelText = localizedText(feature.properties.labels, bundle.dataset.defaultLanguage);
      const typeText = entity ? entityTypeLabel(entity.type, copy.language) : feature.geometry.type;
      const periodText = possiblePeriod(feature.properties.temporal, bundle.dataset.defaultLanguage);
      button.textContent = copy.mapSearchResult(labelText, typeText, periodText);
      button.addEventListener("click", () => { onSelect(feature.id, button); element.open = false; });
      item.append(button);
      results.append(item);
    }
  };
  input.addEventListener("input", () => { query = input.value; render(); });
  render();

  return {
    element,
    setFeatures(features, nextSelectedFeatureId = null) {
      visibleFeatures = features;
      selectedFeatureId = nextSelectedFeatureId;
      render();
    },
  };
}

function possiblePeriod(temporal: TemporalExtent, language: string): string {
  const start = temporal.start?.earliestYear ?? temporal.start?.latestYear ?? null;
  const end = temporal.end?.latestYear ?? temporal.end?.earliestYear ?? null;
  if (start === null && end === null) return language.toLowerCase().startsWith("ja") ? "年代不明" : "date unknown";
  if (start !== null && end !== null && start === end) return displayYearLocalized(start, language);
  if (start === null) return language.toLowerCase().startsWith("ja") ? `${displayYearLocalized(end!, language)}まで` : `through ${displayYearLocalized(end!, language)}`;
  if (end === null) return language.toLowerCase().startsWith("ja") ? `${displayYearLocalized(start, language)}以降` : `from ${displayYearLocalized(start, language)}`;
  return language.toLowerCase().startsWith("ja")
    ? `${displayYearLocalized(start, language)}〜${displayYearLocalized(end, language)}`
    : `${displayYearLocalized(start, language)}–${displayYearLocalized(end, language)}`;
}
