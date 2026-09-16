import { filterFeaturesByYear } from "../domain/temporal-filter";
import type { FeatureVersion } from "../domain/types";

export type AppStatus = "loading" | "ready" | "no-match" | "selection-cleared" | "failed" | "retrying" | "basemap-failure";
export type MobileTab = "list" | "detail";

export interface AppState {
  readonly status: AppStatus;
  readonly selectedYear: number;
  readonly visibleFeatures: readonly FeatureVersion[];
  readonly selectedFeatureId: string | null;
  readonly activeMobileTab: MobileTab;
  readonly error: string | null;
  /** Immutable public features retained so a year change can recompute visibility. */
  readonly allFeatures: readonly FeatureVersion[];
  /** Candidate IDs from the most recent map click, retained in authored order. */
  readonly mapCandidateIds?: readonly string[];
}

export type AppEvent =
  | { readonly type: "bundleLoading" }
  | { readonly type: "bundleReady"; readonly features: readonly FeatureVersion[]; readonly year: number }
  | { readonly type: "bundleFailed"; readonly error: string }
  | { readonly type: "yearChanged"; readonly year: number }
  | { readonly type: "featureSelected"; readonly featureId: string }
  | { readonly type: "mapCandidatesReported"; readonly featureIds: readonly string[] }
  | { readonly type: "basemapFailed"; readonly error: string }
  | { readonly type: "selectionCleared" }
  | { readonly type: "detailClosed" }
  | { readonly type: "mobileTabChanged"; readonly tab: MobileTab }
  | { readonly type: "retryStarted" }
  | { readonly type: "retryFinished" };

export function reduce(state: AppState, event: AppEvent): AppState {
  switch (event.type) {
    case "bundleLoading": return { ...state, status: "loading", error: null, visibleFeatures: [], selectedFeatureId: null };
    case "bundleReady": return readyState(state, event.features, event.year);
    case "bundleFailed": return { ...state, status: "failed", error: event.error, visibleFeatures: [], selectedFeatureId: null };
    case "retryStarted": return { ...state, status: "retrying", error: null };
    case "retryFinished": return { ...state, status: "loading" };
    case "mobileTabChanged": return { ...state, activeMobileTab: event.tab };
    case "featureSelected":
      return state.visibleFeatures.some((feature) => feature.id === event.featureId)
        ? { ...state, status: state.status === "basemap-failure" ? "basemap-failure" : "ready", selectedFeatureId: event.featureId, activeMobileTab: "detail", mapCandidateIds: [] }
        : state;
    case "mapCandidatesReported":
      return event.featureIds.length === 1
        ? reduce(state, { type: "featureSelected", featureId: event.featureIds[0]! })
        : { ...state, mapCandidateIds: event.featureIds.filter((id) => state.visibleFeatures.some((feature) => feature.id === id)) };
    case "basemapFailed": return { ...state, status: "basemap-failure", error: event.error };
    case "selectionCleared": return { ...state, status: "selection-cleared", selectedFeatureId: null, activeMobileTab: "list" };
    case "detailClosed": return { ...state, status: state.visibleFeatures.length ? "ready" : "no-match", selectedFeatureId: null, activeMobileTab: "list" };
    case "yearChanged": {
      if (!Number.isInteger(event.year)) return state;
      const visibleFeatures = filterFeaturesByYear(state.allFeatures, event.year);
      const selectedIsVisible = state.selectedFeatureId !== null && visibleFeatures.some((feature) => feature.id === state.selectedFeatureId);
      return {
        ...state, selectedYear: event.year, visibleFeatures,
        selectedFeatureId: selectedIsVisible ? state.selectedFeatureId : null,
        activeMobileTab: selectedIsVisible ? state.activeMobileTab : "list",
        status: state.status === "basemap-failure" ? "basemap-failure" : (selectedIsVisible || state.selectedFeatureId === null ? (visibleFeatures.length ? "ready" : "no-match") : "selection-cleared"),
        mapCandidateIds: [],
      };
    }
  }
}

function readyState(state: AppState, features: readonly FeatureVersion[], year: number): AppState {
  const visibleFeatures = filterFeaturesByYear(features, year);
  return { ...state, status: visibleFeatures.length ? "ready" : "no-match", selectedYear: year, visibleFeatures, selectedFeatureId: null, error: null, allFeatures: features };
}
