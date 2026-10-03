import { displayYearLocalized, entityTypeLabel, localizedText } from "./labels";
import type { ComparisonCandidate } from "./comparison-candidates";
import type { AppState } from "../app/state";
import type { FeatureVersion, PublicBundle, Rights, TemporalExtent } from "./types";

export interface ReportEvidence {
  readonly id: string;
  readonly supports: readonly string[];
  readonly locator: string;
  readonly note: string;
  readonly citation: string;
  readonly title: string;
  readonly url: string;
  readonly rights: string;
  readonly citationOnly: boolean;
}

export interface ReportVersion {
  readonly id: string;
  readonly year: string;
  readonly label: string;
  readonly description: string;
  readonly uncertainty: string;
}

export interface ReportFeature {
  readonly id: string;
  readonly entityLabel: string;
  readonly entityType?: string;
  readonly entityDescription: string;
  readonly label: string;
  readonly description: string;
  readonly period: string;
  readonly geometry: string;
  readonly uncertainty: readonly string[];
  readonly rights: string;
  readonly evidence: readonly ReportEvidence[];
}

export interface ReportModel {
  readonly language: "ja" | "en";
  readonly datasetId: string;
  readonly datasetTitle: string;
  readonly datasetDescription: string;
  readonly datasetRights: string;
  readonly year: string;
  readonly visibleFeatureCount: number;
  readonly feature: ReportFeature;
  readonly comparison: readonly ReportVersion[];
  readonly shareUrl: string;
  readonly basemapError: string | null;
}

/**
 * Projects the current public state into the small, citation-only payload used
 * by the print/PDF view. It deliberately returns null until a public feature
 * is selected, so a failed or empty dataset never exposes a report action.
 */
export function buildReportModel(bundle: PublicBundle, state: AppState, shareUrl: string, candidate: ComparisonCandidate | null): ReportModel | null {
  const selected = state.selectedFeatureId === null ? null : state.visibleFeatures.find((feature) => feature.id === state.selectedFeatureId) ?? null;
  if (!selected || selected.properties.publicationStatus !== "public") return null;
  const language = bundle.dataset.defaultLanguage.toLowerCase().startsWith("ja") ? "ja" : "en";
  return {
    language,
    datasetId: bundle.dataset.id,
    datasetTitle: localizedText(bundle.dataset.title, bundle.dataset.defaultLanguage),
    datasetDescription: localizedText(bundle.dataset.description, bundle.dataset.defaultLanguage),
    datasetRights: formatRights(bundle.dataset.rights, language),
    year: displayYearLocalized(state.selectedYear, bundle.dataset.defaultLanguage),
    visibleFeatureCount: state.visibleFeatures.length,
    feature: projectFeature(selected, bundle, language),
    comparison: candidate && candidate.entityId === selected.properties.entityId ? candidate.versions.map(({ feature, year }) => projectVersion(feature, year, bundle, language)) : [],
    shareUrl,
    basemapError: state.basemapError ?? null,
  };
}

function projectFeature(feature: FeatureVersion, bundle: PublicBundle, language: "ja" | "en"): ReportFeature {
  const entity = bundle.entitiesById[feature.properties.entityId];
  return {
    id: feature.id,
    entityLabel: entity ? localizedText(entity.labels, bundle.dataset.defaultLanguage) : language === "ja" ? "同一性情報なし" : "Unknown entity",
    ...(entity ? { entityType: entityTypeLabel(entity.type, language) } : {}),
    entityDescription: entity ? localizedText(entity.description, bundle.dataset.defaultLanguage) : "",
    label: localizedText(feature.properties.labels, bundle.dataset.defaultLanguage),
    description: localizedText(feature.properties.description, bundle.dataset.defaultLanguage),
    period: formatTemporal(feature.properties.temporal, language),
    geometry: formatGeometry(feature.geometry.type, language),
    uncertainty: Object.entries(feature.properties.uncertainty).map(([dimension, assessment]) => `${dimensionLabel(dimension, language)}: ${assessmentLabel(assessment.assessment, language)}${assessment.note ? ` — ${assessment.note}` : ""}`),
    rights: formatRights(feature.properties.rights, language),
    evidence: feature.properties.evidenceIds.map((id) => projectEvidence(id, bundle, language)).filter((evidence): evidence is ReportEvidence => evidence !== null),
  };
}

function projectVersion(feature: FeatureVersion, year: number, bundle: PublicBundle, language: "ja" | "en"): ReportVersion {
  return {
    id: feature.id,
    year: displayYearLocalized(year, bundle.dataset.defaultLanguage),
    label: localizedText(feature.properties.labels, bundle.dataset.defaultLanguage),
    description: localizedText(feature.properties.description, bundle.dataset.defaultLanguage),
    uncertainty: Object.values(feature.properties.uncertainty).map((assessment) => assessmentLabel(assessment.assessment, language)).join(language === "ja" ? "、" : ", "),
  };
}

function projectEvidence(id: string, bundle: PublicBundle, language: "ja" | "en"): ReportEvidence | null {
  const evidence = bundle.evidenceById[id];
  if (!evidence) return null;
  const source = bundle.sourcesById[evidence.sourceId];
  if (!source) return {
    id: evidence.id,
    supports: evidence.supports,
    locator: evidence.locator,
    note: evidence.note,
    citation: language === "ja" ? "出典メタデータなし" : "Source metadata unavailable",
    title: "",
    url: "",
    rights: language === "ja" ? "権利情報なし" : "Rights unavailable",
    citationOnly: true,
  };
  return {
    id: evidence.id,
    supports: evidence.supports,
    locator: evidence.locator,
    note: evidence.note,
    citation: source.citation,
    title: localizedText(source.title, bundle.dataset.defaultLanguage),
    url: source.url,
    rights: formatRights(source.rights, language),
    citationOnly: source.rights.status === "restricted" || source.rights.status === "unknown",
  };
}

function formatTemporal(temporal: TemporalExtent, language: "ja" | "en"): string {
  const start = temporal.start;
  const end = temporal.end;
  const startYear = start?.earliestYear ?? null;
  const endYear = end?.latestYear ?? null;
  if (language === "ja") {
    const startText = startYear === null ? "開始時点不明" : displayYearLocalized(startYear, "ja");
    const endText = endYear === null ? "終了時点不明" : displayYearLocalized(endYear, "ja");
    if (!start && !end) return "可能期間は開いています。";
    if (!start) return `${endText}まで（${end?.precision}・${end?.qualifier}）。`;
    if (!end) return `${startText}以降（${start.precision}・${start.qualifier}）。`;
    return startYear === endYear ? `${startText}時点（${start.precision}・${start.qualifier}）。` : `${startText}から${endText}まで（${start.precision}・${start.qualifier}）。`;
  }
  const startText = startYear === null ? "open start" : displayYearLocalized(startYear, "en");
  const endText = endYear === null ? "open end" : displayYearLocalized(endYear, "en");
  if (!start && !end) return "Possible period is open.";
  if (!start) return `Possible through ${endText} (${end?.precision}, ${end?.qualifier}).`;
  if (!end) return `Possible from ${startText} onward (${start.precision}, ${start.qualifier}).`;
  return startYear === endYear ? `Possible at ${startText} (${start.precision}, ${start.qualifier}).` : `Possible from ${startText} through ${endText} (${start.precision}, ${start.qualifier}).`;
}

function formatGeometry(value: string, language: "ja" | "en"): string {
  if (language === "en") return value;
  return ({ Point: "点", MultiPoint: "複数点", LineString: "線", MultiLineString: "複数線", Polygon: "面", MultiPolygon: "複数面" } as Record<string, string>)[value] ?? value;
}

function dimensionLabel(value: string, language: "ja" | "en"): string {
  if (language === "en") return value;
  return ({ temporal: "年代", location: "位置", geometry: "形状", identity: "同一性" } as Record<string, string>)[value] ?? value;
}

function assessmentLabel(value: string, language: "ja" | "en"): string {
  if (language === "en") return value;
  return ({ "well-supported": "根拠が強い", approximate: "概略・近似", disputed: "見解が分かれる", unknown: "不明", "not-applicable": "該当なし" } as Record<string, string>)[value] ?? value;
}

function formatRights(rights: Rights, language: "ja" | "en"): string {
  const status = language === "ja"
    ? ({ "public-domain": "パブリックドメイン", "open-license": "オープンライセンス", permission: "許諾あり", restricted: "引用メタデータのみ", unknown: "不明" } as Record<string, string>)[rights.status] ?? rights.status
    : rights.status;
  return `${status}${rights.attribution ? language === "ja" ? `。表示: ${rights.attribution}` : `; attribution ${rights.attribution}` : ""}${rights.terms ? language === "ja" ? `。条件: ${rights.terms}` : `; terms ${rights.terms}` : ""}`;
}
