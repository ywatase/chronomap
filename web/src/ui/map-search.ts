import { displayYearLocalized, localizedText } from "../domain/labels";
import type { FeatureVersion, PublicBundle, TemporalExtent } from "../domain/types";
import { entityTypeLabel } from "./copy";
import type { UiCopy } from "./copy";
import { featureMatches } from "./feature-search";

export interface MapSearchController {
  readonly element: HTMLDetailsElement;
  setFeatures(features: readonly FeatureVersion[], selectedFeatureId?: string | null): void;
  setExternalEntries(entries: readonly MapSearchEntry[]): void;
  setSearchLoading(loading: boolean): void;
}

export interface MapSearchEntry {
  readonly datasetSlug: string;
  readonly region?: string;
  readonly bundle: PublicBundle;
  readonly feature: FeatureVersion;
}

/**
 * A map-first search for public snapshots in the loaded bundle and, once the
 * shell supplies them, other recorded regional bundles. Results are
 * deliberately citation-free: choosing one hands the entry back to the shell,
 * which owns year changes, navigation, details, and camera.
 */
export function createMapSearch(
  copy: UiCopy,
  bundle: PublicBundle,
  onSelect: (entry: MapSearchEntry, trigger: HTMLButtonElement) => void,
  onQueryChange?: (query: string) => void,
): MapSearchController {
  let visibleFeatures: readonly FeatureVersion[] = [];
  let selectedFeatureId: string | null = null;
  let query = "";
  let externalEntries: readonly MapSearchEntry[] = [];
  let searchLoading = false;

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

  const localDatasetSlug = typeof bundle.dataset.id === "string" ? bundle.dataset.id.split(":", 1)[0] ?? "" : "";
  const localEntries: readonly MapSearchEntry[] = bundle.features
    .filter((feature) => feature.properties.publicationStatus === "public")
    .map((feature) => ({ datasetSlug: localDatasetSlug, bundle, feature }));
  const render = () => {
    const trimmedQuery = query.trim();
    const allEntries = [...localEntries, ...externalEntries];
    const filtered = trimmedQuery === "" ? [] : allEntries.filter((entry) => featureMatches(entry.feature, entry.bundle, query));
    count.textContent = searchLoading
      ? copy.mapSearchLoading
      : trimmedQuery === ""
        ? ""
        : copy.featureCount(filtered.length, allEntries.length);
    results.replaceChildren();
    results.hidden = trimmedQuery === "";
    if (trimmedQuery === "") return;
    if (searchLoading && filtered.length === 0) return;
    if (filtered.length === 0) {
      const notice = document.createElement("li");
      notice.className = "map-search-empty";
      notice.textContent = copy.featureSearchNoMatch(query);
      results.append(notice);
      return;
    }
    for (const entry of filtered) {
      const feature = entry.feature;
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.mapFeatureResult = "";
      button.dataset.mapFeatureId = feature.id;
      button.dataset.mapDataset = entry.datasetSlug;
      button.setAttribute("aria-pressed", String(entry.datasetSlug === localDatasetSlug && selectedFeatureId === feature.id && visibleFeatures.some((candidate) => candidate.id === feature.id)));
      const entity = entry.bundle.entitiesById[feature.properties.entityId];
      const featureLabel = localizedText(feature.properties.labels, entry.bundle.dataset.defaultLanguage);
      const labelText = entry.region ? `${entry.region} · ${featureLabel}` : featureLabel;
      const typeText = entity ? entityTypeLabel(entity.type, copy.language) : feature.geometry.type;
      const periodText = possiblePeriod(feature.properties.temporal, entry.bundle.dataset.defaultLanguage);
      button.textContent = copy.mapSearchResult(labelText, typeText, periodText);
      button.addEventListener("click", () => { onSelect(entry, button); element.open = false; });
      item.append(button);
      results.append(item);
    }
  };
  input.addEventListener("input", () => { query = input.value; onQueryChange?.(query); render(); });
  render();

  return {
    element,
    setFeatures(features, nextSelectedFeatureId = null) {
      visibleFeatures = features;
      selectedFeatureId = nextSelectedFeatureId;
      render();
    },
    setExternalEntries(entries) {
      externalEntries = entries;
      render();
    },
    setSearchLoading(loading) {
      searchLoading = loading;
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
