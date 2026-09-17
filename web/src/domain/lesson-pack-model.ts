import { comparisonCandidates } from "./comparison-candidates";
import { displayYearLocalized, localizedText } from "./labels";
import type { Lesson } from "./lesson";
import { sharedQuery } from "./share-state";
import type { FeatureVersion, PublicBundle, Rights, TemporalExtent } from "./types";

export interface LessonPackEvidence {
  readonly id: string;
  readonly sourceId: string;
  readonly supports: readonly string[];
  readonly locator: string;
  readonly note: string;
  readonly citation: string;
  readonly title: string;
  readonly url: string;
  readonly rights: string;
  readonly citationOnly: boolean;
}

export interface LessonPackComparison {
  readonly year: string;
  readonly label: string;
  readonly description: string;
  readonly uncertainty: string;
}

export interface LessonPackStep {
  readonly id: string;
  readonly year: number;
  readonly yearLabel: string;
  readonly featureId: string;
  readonly label: string;
  readonly entityLabel: string;
  readonly entityDescription: string;
  readonly description: string;
  readonly period: string;
  readonly geometry: string;
  readonly prompt: string;
  readonly uncertainty: readonly string[];
  readonly evidence: readonly LessonPackEvidence[];
  readonly comparison: readonly LessonPackComparison[];
  readonly shareUrl: string;
}

export interface LessonPackSource {
  readonly id: string;
  readonly citation: string;
  readonly title: string;
  readonly creators: readonly string[];
  readonly publishedYear: number;
  readonly url: string;
  readonly accessedDate: string;
  readonly rights: string;
  readonly citationOnly: boolean;
  readonly evidence: readonly LessonPackEvidence[];
}

export interface LessonPackModel {
  readonly language: "ja" | "en";
  readonly title: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly datasetId: string;
  readonly datasetTitle: string;
  readonly datasetDescription: string;
  readonly datasetRights: string;
  readonly steps: readonly LessonPackStep[];
  readonly sources: readonly LessonPackSource[];
  readonly startUrl: string;
}

/**
 * Projects a validated static lesson into a citation-only printable pack.
 * No source body, image, or private record is copied into this model.
 */
export function buildLessonPackModel(lesson: Lesson, bundle: PublicBundle, origin: string): LessonPackModel | null {
  if (lesson.dataset !== (bundle.dataset.id.split(":", 1)[0] ?? bundle.dataset.id)) return null;
  const language = bundle.dataset.defaultLanguage.toLowerCase().startsWith("ja") ? "ja" : "en";
  const candidates = comparisonCandidates(bundle.features);
  const steps: LessonPackStep[] = [];
  const sourceEvidence = new Map<string, LessonPackEvidence[]>();

  for (const lessonStep of lesson.steps) {
    const feature = bundle.features.find((candidate) => candidate.id === lessonStep.featureId);
    if (!feature || feature.properties.publicationStatus !== "public") return null;
    const evidence = feature.properties.evidenceIds.map((id) => projectEvidence(id, bundle, language)).filter((item): item is LessonPackEvidence => item !== null);
    if (evidence.length !== feature.properties.evidenceIds.length) return null;
    for (const item of evidence) {
      const current = sourceEvidence.get(item.sourceId) ?? [];
      sourceEvidence.set(item.sourceId, [...current, item]);
    }
    const entity = bundle.entitiesById[feature.properties.entityId];
    const candidate = candidates.find((item) => item.entityId === (lessonStep.comparisonEntityId ?? feature.properties.entityId));
    steps.push({
      id: lessonStep.id,
      year: lessonStep.year,
      yearLabel: displayYearLocalized(lessonStep.year, bundle.dataset.defaultLanguage),
      featureId: feature.id,
      label: localizedText(feature.properties.labels, bundle.dataset.defaultLanguage),
      entityLabel: entity ? localizedText(entity.labels, bundle.dataset.defaultLanguage) : language === "ja" ? "同一性情報なし" : "Unknown entity",
      entityDescription: entity ? localizedText(entity.description, bundle.dataset.defaultLanguage) : "",
      description: localizedText(feature.properties.description, bundle.dataset.defaultLanguage),
      period: formatTemporal(feature.properties.temporal, language),
      geometry: formatGeometry(feature.geometry.type, language),
      prompt: localizedText(lessonStep.prompt, language),
      uncertainty: Object.entries(feature.properties.uncertainty).map(([dimension, assessment]) => `${dimensionLabel(dimension, language)}: ${assessmentLabel(assessment.assessment, language)}${assessment.note ? ` — ${assessment.note}` : ""}`),
      evidence,
      comparison: candidate?.versions.map(({ feature: version, year }) => projectComparison(version, year, bundle, language)) ?? [],
      shareUrl: stepUrl(origin, lesson, lessonStep),
    });
  }

  const sources = [...sourceEvidence.entries()]
    .map(([sourceId, evidence]) => projectSource(sourceId, evidence, bundle, language))
    .filter((source): source is LessonPackSource => source !== null);
  if (sources.length !== new Set(steps.flatMap((step) => step.evidence.map((item) => item.sourceId))).size) return null;
  const startUrl = steps[0]?.shareUrl;
  if (!startUrl) return null;
  return Object.freeze({
    language,
    title: localizedText(lesson.title, language),
    description: localizedText(lesson.description, language),
    durationMinutes: lesson.durationMinutes,
    datasetId: bundle.dataset.id,
    datasetTitle: localizedText(bundle.dataset.title, bundle.dataset.defaultLanguage),
    datasetDescription: localizedText(bundle.dataset.description, bundle.dataset.defaultLanguage),
    datasetRights: formatRights(bundle.dataset.rights, language),
    steps: Object.freeze(steps),
    sources: Object.freeze(sources),
    startUrl,
  });
}

function projectEvidence(id: string, bundle: PublicBundle, language: "ja" | "en"): LessonPackEvidence | null {
  const evidence = bundle.evidenceById[id];
  if (!evidence) return null;
  const source = bundle.sourcesById[evidence.sourceId];
  if (!source) return null;
  return {
    id: evidence.id,
    sourceId: evidence.sourceId,
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

function projectSource(sourceId: string, evidence: readonly LessonPackEvidence[], bundle: PublicBundle, language: "ja" | "en"): LessonPackSource | null {
  const source = bundle.sourcesById[sourceId];
  if (!source) return null;
  return {
    id: source.id,
    citation: source.citation,
    title: localizedText(source.title, bundle.dataset.defaultLanguage),
    creators: source.creators,
    publishedYear: source.publishedYear,
    url: source.url,
    accessedDate: source.accessedDate,
    rights: formatRights(source.rights, language),
    citationOnly: source.rights.status === "restricted" || source.rights.status === "unknown",
    evidence: [...new Map(evidence.map((item) => [item.id, item])).values()],
  };
}

function projectComparison(feature: FeatureVersion, year: number, bundle: PublicBundle, language: "ja" | "en"): LessonPackComparison {
  return {
    year: displayYearLocalized(year, bundle.dataset.defaultLanguage),
    label: localizedText(feature.properties.labels, bundle.dataset.defaultLanguage),
    description: localizedText(feature.properties.description, bundle.dataset.defaultLanguage),
    uncertainty: Object.values(feature.properties.uncertainty).map((assessment) => assessmentLabel(assessment.assessment, language)).join(language === "ja" ? "、" : ", "),
  };
}

function stepUrl(origin: string, lesson: Lesson, step: Lesson["steps"][number]): string {
  try {
    const url = new URL(origin);
    const query = sharedQuery({ dataset: lesson.dataset, lessonId: lesson.id, lessonStepId: step.id, year: step.year, featureId: step.featureId });
    return `${url.origin}${url.pathname}${query}`;
  } catch {
    return sharedQuery({ dataset: lesson.dataset, lessonId: lesson.id, lessonStepId: step.id, year: step.year, featureId: step.featureId });
  }
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
