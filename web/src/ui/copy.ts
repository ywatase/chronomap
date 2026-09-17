import { displayYearLocalized } from "../domain/labels";
import type { GeometryType, RightsStatus, UncertaintyAssessment } from "../domain/types";

export interface UiCopy {
  readonly language: "ja" | "en";
  readonly previousYear: string;
  readonly nextYear: string;
  readonly yearLabel: string;
  readonly directYearLabel: string;
  readonly recordedLabel: string;
  readonly recordedHint: string;
  readonly showingYear: (year: number) => string;
  readonly mapLabel: string;
  readonly mapFallback: string;
  readonly featureInformation: string;
  readonly featureList: string;
  readonly details: string;
  readonly retryBasemap: string;
  readonly retryDataset: string;
  readonly basemapFailure: (message: string) => string;
  readonly footerBasemap: string;
  readonly mapCandidates: string;
  readonly featureHeading: string;
  readonly noFeatures: (year: string) => string;
  readonly unknownEntity: string;
  readonly noPreferredHypothesis: string;
  readonly possible: (value: string) => string;
  readonly uncertainty: string;
  readonly entity: string;
  readonly version: string;
  readonly time: string;
  readonly uncertaintyHeading: string;
  readonly evidence: string;
  readonly source: string;
  readonly rights: string;
  readonly featureDetails: string;
  readonly closeDetails: string;
  readonly selectDetails: string;
  readonly geometry: string;
  readonly noEvidence: string;
  readonly noSource: string;
  readonly citationOnly: string;
  readonly rightsText: (subject: string, rights: { status: RightsStatus; attribution?: string; terms?: string }) => string;
  readonly assessment: (value: UncertaintyAssessment["assessment"]) => string;
  readonly dimension: (value: string) => string;
  readonly geometryType: (value: GeometryType) => string;
  readonly period: (value: string) => string;
  readonly accessed: string;
  readonly sourceLink: string;
}

export function uiCopy(defaultLanguage: string): UiCopy {
  return defaultLanguage.toLowerCase().startsWith("ja") ? JA_COPY : EN_COPY;
}

export function formatYear(year: number, defaultLanguage: string): string {
  return displayYearLocalized(year, defaultLanguage);
}

const EN_COPY: UiCopy = {
  language: "en",
  previousYear: "Previous recorded year",
  nextYear: "Next recorded year",
  yearLabel: "Year",
  directYearLabel: "Enter a year",
  recordedLabel: "Recorded snapshots",
  recordedHint: "Choose a recorded snapshot to skip years without authored data.",
  showingYear: (year) => `Showing possible activity overlapping ${formatYear(year, "en")}.`,
  mapLabel: "Map area",
  mapFallback: "Map is loading. The feature list remains available while the basemap starts.",
  featureInformation: "Feature information",
  featureList: "Feature list",
  details: "Details",
  retryBasemap: "Retry basemap",
  retryDataset: "Retry loading dataset",
  basemapFailure: (message) => `Basemap or map rendering is unavailable; GSI context may be affected. The historical list and details remain available. ${message}`,
  footerBasemap: "Basemap: GSI Maps attribution and terms",
  mapCandidates: "Map candidates at this location",
  featureHeading: "Features",
  noFeatures: (year) => `No features match ${year}.`,
  unknownEntity: "Unknown entity",
  noPreferredHypothesis: "No preferred hypothesis",
  possible: (value) => `possible ${value}`,
  uncertainty: "uncertainty",
  entity: "Entity",
  version: "Version",
  time: "Time",
  uncertaintyHeading: "Uncertainty",
  evidence: "Evidence",
  source: "Source",
  rights: "Rights",
  featureDetails: "Feature details",
  closeDetails: "Close details",
  selectDetails: "Select a feature to view its details.",
  geometry: "Geometry",
  noEvidence: "No evidence references.",
  noSource: "No source metadata.",
  citationOnly: "Citation-only metadata; no authored source content is reproduced.",
  rightsText: (subject, rights) => `${subject} rights: ${rights.status}${rights.attribution ? `; attribution ${rights.attribution}` : ""}${rights.terms ? `; terms ${rights.terms}` : ""}`,
  assessment: (value) => value,
  dimension: (value) => value,
  geometryType: (value) => value,
  period: (value) => value,
  accessed: "accessed",
  sourceLink: "View source",
};

const JA_COPY: UiCopy = {
  language: "ja",
  previousYear: "前の収録年",
  nextYear: "次の収録年",
  yearLabel: "表示年",
  directYearLabel: "年を直接指定",
  recordedLabel: "収録時点",
  recordedHint: "収録時点を選ぶと、データのない年を飛ばして移動できます。",
  showingYear: (year) => `${formatYear(year, "ja")}の可能な活動を表示しています。`,
  mapLabel: "地図",
  mapFallback: "地図を読み込んでいます。背景地図の準備中も地物一覧を利用できます。",
  featureInformation: "地物情報",
  featureList: "地物一覧",
  details: "詳細",
  retryBasemap: "背景地図を再試行",
  retryDataset: "データを再読み込み",
  basemapFailure: () => "背景地図を表示できません。GSIの地図情報が利用できない場合も、歴史地物の一覧と詳細は確認できます。再試行できます。",
  footerBasemap: "背景地図: 国土地理院（出典・利用条件）",
  mapCandidates: "この位置の候補",
  featureHeading: "表示中の地物",
  noFeatures: (year) => `${year}に一致する公開地物はありません。`,
  unknownEntity: "地物の同一性情報なし",
  noPreferredHypothesis: "優先順位を付けていない復元案",
  possible: (value) => `可能期間: ${value}`,
  uncertainty: "不確実性",
  entity: "歴史対象",
  version: "時点・復元",
  time: "年代",
  uncertaintyHeading: "不確実性",
  evidence: "根拠",
  source: "出典",
  rights: "権利・利用条件",
  featureDetails: "地物の詳細",
  closeDetails: "詳細を閉じる",
  selectDetails: "地物を選ぶと、名称・年代・根拠を確認できます。",
  geometry: "形状",
  noEvidence: "根拠への参照はありません。",
  noSource: "出典メタデータはありません。",
  citationOnly: "引用メタデータのみを収録しています。原資料の本文・画像は転載していません。",
  rightsText: (subject, rights) => `${subject}の権利: ${rightsStatusJa(rights.status)}${rights.attribution ? `。表示: ${rights.attribution}` : ""}${rights.terms ? `。条件: ${rights.terms}` : ""}`,
  assessment: (value) => ({ "well-supported": "根拠が強い", approximate: "概略・近似", disputed: "見解が分かれる", unknown: "不明", "not-applicable": "該当なし" }[value]),
  dimension: (value) => ({ temporal: "年代", location: "位置", geometry: "形状", identity: "同一性" }[value] ?? value),
  geometryType: (value) => ({ Point: "点", MultiPoint: "複数点", LineString: "線", MultiLineString: "複数線", Polygon: "面", MultiPolygon: "複数面" }[value]),
  period: (value) => value,
  accessed: "参照日",
  sourceLink: "出典を見る",
};

function rightsStatusJa(status: RightsStatus): string {
  return { "public-domain": "パブリックドメイン", "open-license": "オープンライセンス", permission: "許諾あり", restricted: "引用メタデータのみ", unknown: "不明" }[status];
}
