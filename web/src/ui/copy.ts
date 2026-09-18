import { displayYearLocalized } from "../domain/labels";
import type { LessonPackNextFeature, LessonPackUtilization } from "../domain/lesson-pack-feedback";
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
  readonly shareView: string;
  readonly shareUrlLabel: string;
  readonly shareCopied: string;
  readonly shareFallback: string;
  readonly shareCancelled: string;
  readonly shareUnavailable: string;
  readonly mapSettings: string;
  readonly basemapOpacityLabel: string;
  readonly historicalOpacityLabel: string;
  readonly historicalVisibilityLabel: string;
  readonly mapOpacityValue: (value: number) => string;
  readonly mapLegend: string;
  readonly legendPoint: string;
  readonly legendLine: string;
  readonly legendPolygon: string;
  readonly legendSelected: string;
  readonly reportView: string;
  readonly reportDialogLabel: string;
  readonly reportTitle: (dataset: string, year: string) => string;
  readonly reportLead: string;
  readonly reportSummary: string;
  readonly reportVisibleFeatures: (count: number) => string;
  readonly reportFeature: string;
  readonly reportFeatureId: string;
  readonly reportEntity: string;
  readonly reportDescription: string;
  readonly reportPeriod: string;
  readonly reportGeometry: string;
  readonly reportUncertainty: string;
  readonly reportComparison: string;
  readonly reportEvidence: string;
  readonly reportSupports: string;
  readonly reportLocator: string;
  readonly reportSources: string;
  readonly reportRights: string;
  readonly reportShareUrl: string;
  readonly reportMap: string;
  readonly reportMapUnavailable: string;
  readonly reportNoEvidence: string;
  readonly reportNoSources: string;
  readonly reportCitationOnly: string;
  readonly reportPrint: string;
  readonly reportClose: string;
  readonly reportSourceLink: string;
  readonly lessonStart: string;
  readonly lessonClose: string;
  readonly lessonPrevious: string;
  readonly lessonNext: string;
  readonly lessonDetails: string;
  readonly lessonShare: string;
  readonly lessonReport: string;
  readonly lessonDuration: (minutes: number) => string;
  readonly lessonStepCount: (count: number) => string;
  readonly lessonProgress: (current: number, total: number) => string;
  readonly lessonStepYear: (year: number) => string;
  readonly lessonCompletion: string;
  readonly lessonComparisonHint: string;
  readonly lessonPackOpen: string;
  readonly lessonPackTitle: (lessonTitle: string) => string;
  readonly lessonPackLead: (minutes: number) => string;
  readonly lessonPackBeta: string;
  readonly lessonPackStudent: string;
  readonly lessonPackTeacher: string;
  readonly lessonPackSources: string;
  readonly lessonPackDataset: string;
  readonly lessonPackObjective: string;
  readonly lessonPackObservation: string;
  readonly lessonPackAnswer: string;
  readonly lessonPackStepLink: string;
  readonly lessonPackStartLink: string;
  readonly lessonPackEntity: string;
  readonly lessonPackDescription: string;
  readonly lessonPackPeriod: string;
  readonly lessonPackGeometry: string;
  readonly lessonPackUncertainty: string;
  readonly lessonPackComparison: string;
  readonly lessonPackEvidence: string;
  readonly lessonPackLocator: string;
  readonly lessonPackRights: string;
  readonly lessonPackAccessed: string;
  readonly lessonPackApproximation: string;
  readonly lessonPackCitationOnly: string;
  readonly lessonPackNoSources: string;
  readonly lessonPackPrint: string;
  readonly lessonPackClose: string;
  readonly lessonWorkshopOpen: string;
  readonly lessonWorkshopBack: string;
  readonly lessonPackClassLabel: string;
  readonly lessonPackFeedbackSummary: string;
  readonly lessonPackFeedbackLead: string;
  readonly lessonPackFeedbackNotice: string;
  readonly lessonPackFeedbackUtilization: string;
  readonly lessonPackFeedbackUtilizationOptions: Readonly<Record<LessonPackUtilization, string>>;
  readonly lessonPackFeedbackNextFeature: string;
  readonly lessonPackFeedbackNextFeatureOptions: Readonly<Record<LessonPackNextFeature, string>>;
  readonly lessonPackFeedbackComment: string;
  readonly lessonPackFeedbackCommentHint: string;
  readonly lessonPackFeedbackGenerate: string;
  readonly lessonPackFeedbackAnswer: string;
  readonly lessonPackFeedbackCopy: string;
  readonly lessonPackFeedbackCopied: string;
  readonly lessonPackFeedbackCopyFailed: string;
  readonly lessonPackFeedbackRequired: string;
  readonly datasetCatalogOpen: string;
  readonly datasetCatalogDialogLabel: string;
  readonly datasetCatalogHeading: string;
  readonly datasetCatalogLead: string;
  readonly datasetCatalogRegion: string;
  readonly datasetCatalogYears: string;
  readonly datasetCatalogFeatures: string;
  readonly datasetCatalogEntities: string;
  readonly datasetCatalogSources: string;
  readonly datasetCatalogLesson: string;
  readonly datasetCatalogCapabilities: string;
  readonly datasetCatalogCompare: string;
  readonly datasetCatalogEvidence: string;
  readonly datasetCatalogShare: string;
  readonly datasetCatalogReport: string;
  readonly datasetCatalogPack: string;
  readonly datasetCatalogCustomize: string;
  readonly datasetCatalogFreeDemo: string;
  readonly datasetCatalogPackBeta: string;
  readonly datasetCatalogStartLesson: string;
  readonly datasetCatalogViewMap: string;
  readonly datasetCatalogUnavailable: string;
  readonly datasetCatalogLessonUnavailable: string;
  readonly datasetCatalogFreeHeading: string;
  readonly datasetCatalogFreeCopy: string;
  readonly datasetCatalogFutureHeading: string;
  readonly datasetCatalogFutureCopy: string;
  readonly datasetCatalogClose: string;
  readonly datasetCatalogLoading: string;
  readonly comparisonCta: (name: string) => string;
  readonly comparisonTitle: (name: string) => string;
  readonly comparisonYear: (year: number) => string;
  readonly comparisonUncertainty: string;
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
  shareView: "Share this view",
  shareUrlLabel: "Share URL",
  shareCopied: "View link copied.",
  shareFallback: "Copy this URL:",
  shareCancelled: "Sharing canceled.",
  shareUnavailable: "The share URL is ready below.",
  mapSettings: "Display",
  basemapOpacityLabel: "Basemap opacity",
  historicalOpacityLabel: "Historical features opacity",
  historicalVisibilityLabel: "Show historical features",
  mapOpacityValue: (value) => `${Math.round(value * 100)}%`,
  mapLegend: "Legend",
  legendPoint: "Historical point",
  legendLine: "Historical line",
  legendPolygon: "Historical area",
  legendSelected: "Selected feature",
  reportView: "Print / save report",
  reportDialogLabel: "Historical map report",
  reportTitle: (dataset, year) => `${dataset} — report for ${year}`,
  reportLead: "A citation-ready brief of the selected historical feature. Use the browser print dialog to save a PDF.",
  reportSummary: "View summary",
  reportVisibleFeatures: (count) => `${count} public feature${count === 1 ? "" : "s"} visible in this view.`,
  reportFeature: "Selected feature",
  reportFeatureId: "Feature ID",
  reportEntity: "Entity",
  reportDescription: "Description",
  reportPeriod: "Possible period",
  reportGeometry: "Geometry",
  reportUncertainty: "Uncertainty",
  reportComparison: "Other snapshots of this entity",
  reportEvidence: "Evidence",
  reportSupports: "Supports",
  reportLocator: "Locator",
  reportSources: "Sources",
  reportRights: "Rights and attribution",
  reportShareUrl: "Reopen this view",
  reportMap: "Current map view",
  reportMapUnavailable: "The basemap could not be retrieved. The text evidence and shared view remain available.",
  reportNoEvidence: "No evidence references are attached.",
  reportNoSources: "No source metadata is available.",
  reportCitationOnly: "Citation-only metadata; no source body or image is reproduced.",
  reportPrint: "Print / save as PDF",
  reportClose: "Close report",
  reportSourceLink: "Open source",
  lessonStart: "Start guided lesson",
  lessonClose: "Close lesson",
  lessonPrevious: "Previous step",
  lessonNext: "Next step",
  lessonDetails: "Open evidence and details",
  lessonShare: "Share this step",
  lessonReport: "Print / save report",
  lessonDuration: (minutes) => `About ${minutes} minutes`,
  lessonStepCount: (count) => `${count} steps`,
  lessonProgress: (current, total) => `${current} of ${total}`,
  lessonStepYear: (year) => formatYear(year, "en"),
  lessonCompletion: "You reached the end of this guided lesson. Share the view or save a citation-ready report.",
  lessonComparisonHint: "The comparison card is open for this step.",
  lessonPackOpen: "Create classroom pack (free beta)",
  lessonPackTitle: (lessonTitle) => `${lessonTitle} — classroom pack`,
  lessonPackLead: (minutes) => `A printable student worksheet and teacher reference pack for a ${minutes}-minute lesson.`,
  lessonPackBeta: "Free during beta. Viewing and sharing are intended to remain free; regional packs and bulk teacher exports are future candidates.",
  lessonPackStudent: "Student worksheet",
  lessonPackTeacher: "Teacher reference",
  lessonPackSources: "Sources and rights",
  lessonPackDataset: "Dataset",
  lessonPackObjective: "Observe each historical snapshot, compare the evidence, and write what the map supports.",
  lessonPackObservation: "Observation prompt",
  lessonPackAnswer: "Student notes",
  lessonPackStepLink: "Open step",
  lessonPackStartLink: "Lesson start URL",
  lessonPackEntity: "Historical entity",
  lessonPackDescription: "Description",
  lessonPackPeriod: "Possible period",
  lessonPackGeometry: "Geometry",
  lessonPackUncertainty: "Uncertainty to discuss",
  lessonPackComparison: "Reference comparison",
  lessonPackEvidence: "Evidence locators",
  lessonPackLocator: "Locator",
  lessonPackRights: "Rights and attribution",
  lessonPackAccessed: "accessed",
  lessonPackApproximation: "Teaching note: reconstructed shapes may be approximate; do not treat them as precise boundaries.",
  lessonPackCitationOnly: "Citation-only metadata; no source body, image, or inscription is reproduced.",
  lessonPackNoSources: "No source metadata is available.",
  lessonPackPrint: "Print / save classroom pack",
  lessonPackClose: "Close classroom pack",
  lessonWorkshopOpen: "Customize for this class",
  lessonWorkshopBack: "Back to editor",
  lessonPackClassLabel: "Class / audience",
  lessonPackFeedbackSummary: "Thanks for trying the print dialog — one-minute feedback",
  lessonPackFeedbackLead: "Tell us how this classroom pack fits your next lesson.",
  lessonPackFeedbackNotice: "Your answers are not sent or saved automatically. Copy them and send them to the contact provided. They disappear when you reload the page.",
  lessonPackFeedbackUtilization: "How would you use this pack?",
  lessonPackFeedbackUtilizationOptions: {
    "近いうちに使いたい": "I want to use it soon",
    "内容を直せば使いたい": "I would use it after revisions",
    "今回は使わない": "I will not use it this time",
  },
  lessonPackFeedbackNextFeature: "What feature would help next?",
  lessonPackFeedbackNextFeatureOptions: {
    "教材を保存して後から再編集": "Save materials and edit them later",
    "複数クラス・複数教材をまとめて出力": "Bulk export for multiple classes and materials",
    "自分の地域・題材を追加": "Add my own region or topic",
    "校内で共有": "Share within my school",
  },
  lessonPackFeedbackComment: "Optional comment",
  lessonPackFeedbackCommentHint: "Up to 500 characters",
  lessonPackFeedbackGenerate: "Generate answer text",
  lessonPackFeedbackAnswer: "Answer text to copy",
  lessonPackFeedbackCopy: "Copy answer text",
  lessonPackFeedbackCopied: "Feedback answer copied.",
  lessonPackFeedbackCopyFailed: "Could not copy. Select the answer text and copy it manually.",
  lessonPackFeedbackRequired: "Please answer both required questions.",
  datasetCatalogOpen: "Choose a region or lesson",
  datasetCatalogDialogLabel: "Region and lesson catalog",
  datasetCatalogHeading: "Choose a region or lesson",
  datasetCatalogLead: "Start with a free historical map pilot, or open a guided lesson with evidence and classroom links.",
  datasetCatalogRegion: "Region",
  datasetCatalogYears: "Recorded years",
  datasetCatalogFeatures: "Public features",
  datasetCatalogEntities: "Historical entities",
  datasetCatalogSources: "Sources",
  datasetCatalogLesson: "Guided lesson",
  datasetCatalogCapabilities: "Available in this pilot",
  datasetCatalogCompare: "Compare snapshots",
  datasetCatalogEvidence: "Inspect evidence",
  datasetCatalogShare: "Share a view",
  datasetCatalogReport: "Print a report",
  datasetCatalogPack: "Create a classroom pack",
  datasetCatalogCustomize: "Customize for class",
  datasetCatalogFreeDemo: "Free demo",
  datasetCatalogPackBeta: "Classroom pack: free beta",
  datasetCatalogStartLesson: "Start free lesson",
  datasetCatalogViewMap: "View map only",
  datasetCatalogUnavailable: "This public dataset is temporarily unavailable.",
  datasetCatalogLessonUnavailable: "The map is available; a guided lesson is not published yet.",
  datasetCatalogFreeHeading: "Free to explore now",
  datasetCatalogFreeCopy: "Map viewing, source checking, sharing, and citation-ready reports are available in this pilot.",
  datasetCatalogFutureHeading: "For teacher pilots later",
  datasetCatalogFutureCopy: "Regional packs, lesson templates, and bulk exports are future candidates for teacher workflows.",
  datasetCatalogClose: "Close catalog",
  datasetCatalogLoading: "Loading catalog…",
  comparisonCta: (name) => `Compare ${name} snapshots`,
  comparisonTitle: (name) => `${name} snapshots`,
  comparisonYear: (year) => formatYear(year, "en"),
  comparisonUncertainty: "Uncertainty",
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
  shareView: "この表示を共有",
  shareUrlLabel: "共有URL",
  shareCopied: "表示URLをコピーしました。",
  shareFallback: "このURLをコピーしてください:",
  shareCancelled: "共有をキャンセルしました。",
  shareUnavailable: "共有URLを下に表示しました。",
  mapSettings: "表示設定",
  basemapOpacityLabel: "背景地図の濃さ",
  historicalOpacityLabel: "歴史地物の濃さ",
  historicalVisibilityLabel: "歴史地物を表示",
  mapOpacityValue: (value) => `${Math.round(value * 100)}%`,
  mapLegend: "凡例",
  legendPoint: "歴史地物（点）",
  legendLine: "歴史地物（線）",
  legendPolygon: "歴史地物（面）",
  legendSelected: "選択中の地物",
  reportView: "レポートを出力",
  reportDialogLabel: "歴史地図レポート",
  reportTitle: (dataset, year) => `${dataset} — ${year}の表示レポート`,
  reportLead: "選択した歴史地物を、説明・不確実性・根拠・出典とともにまとめたレポートです。ブラウザの印刷画面からPDF保存できます。",
  reportSummary: "表示の概要",
  reportVisibleFeatures: (count) => `この表示には公開地物が${count}件あります。`,
  reportFeature: "選択した地物",
  reportFeatureId: "地物ID",
  reportEntity: "歴史対象",
  reportDescription: "説明",
  reportPeriod: "可能期間",
  reportGeometry: "形状",
  reportUncertainty: "不確実性",
  reportComparison: "同じ対象の別時点",
  reportEvidence: "根拠",
  reportSupports: "補強する項目",
  reportLocator: "参照位置",
  reportSources: "出典",
  reportRights: "権利・表示",
  reportShareUrl: "この表示を再び開く",
  reportMap: "現在の地図表示",
  reportMapUnavailable: "背景地図を取得できませんでした。文章・根拠・共有URLは出力できます。",
  reportNoEvidence: "根拠への参照はありません。",
  reportNoSources: "出典メタデータはありません。",
  reportCitationOnly: "引用メタデータのみを収録しています。原資料の本文・画像は転載していません。",
  reportPrint: "印刷 / PDF保存",
  reportClose: "レポートを閉じる",
  reportSourceLink: "出典を開く",
  lessonStart: "ガイド教材を始める",
  lessonClose: "教材を閉じる",
  lessonPrevious: "前のステップ",
  lessonNext: "次のステップ",
  lessonDetails: "根拠と詳細を見る",
  lessonShare: "このステップを共有",
  lessonReport: "レポートを出力",
  lessonDuration: (minutes) => `約${minutes}分`,
  lessonStepCount: (count) => `${count}ステップ`,
  lessonProgress: (current, total) => `${current}/${total}`,
  lessonStepYear: (year) => formatYear(year, "ja"),
  lessonCompletion: "ガイド教材は完了です。表示を共有するか、根拠付きレポートを保存できます。",
  lessonComparisonHint: "このステップでは比較カードを開いています。",
  lessonPackOpen: "授業用教材パックを作成（β版無料）",
  lessonPackTitle: (lessonTitle) => `${lessonTitle} — 授業用教材パック`,
  lessonPackLead: (minutes) => `${minutes}分の授業で使える、生徒用ワークシート・教員用参照資料・出典一覧です。`,
  lessonPackBeta: "β版では無料でお試しいただけます。閲覧・共有は無料機能として継続予定です。地域別教材・複数教材の一括出力は将来の教員向け機能候補です。",
  lessonPackStudent: "生徒用ワークシート",
  lessonPackTeacher: "教員用参照資料",
  lessonPackSources: "出典・権利",
  lessonPackDataset: "データセット",
  lessonPackObjective: "各時点の歴史地物を観察し、比較し、地図と根拠から読み取れることを書きます。",
  lessonPackObservation: "観察する問い",
  lessonPackAnswer: "生徒の記入欄",
  lessonPackStepLink: "ステップを開く",
  lessonPackStartLink: "教材開始URL",
  lessonPackEntity: "歴史対象",
  lessonPackDescription: "説明",
  lessonPackPeriod: "可能期間",
  lessonPackGeometry: "形状",
  lessonPackUncertainty: "授業で確認する不確実性",
  lessonPackComparison: "参照する比較",
  lessonPackEvidence: "根拠の参照位置",
  lessonPackLocator: "参照位置",
  lessonPackRights: "権利・表示",
  lessonPackAccessed: "参照日",
  lessonPackApproximation: "授業上の注意: 復元形状には概略が含まれます。精密な境界として扱わないでください。",
  lessonPackCitationOnly: "引用メタデータのみを収録しています。原資料の本文・画像・碑文は転載していません。",
  lessonPackNoSources: "出典メタデータはありません。",
  lessonPackPrint: "授業用教材パックを印刷 / PDF保存",
  lessonPackClose: "教材パックを閉じる",
  lessonWorkshopOpen: "この教材を授業用に整える",
  lessonWorkshopBack: "編集に戻る",
  lessonPackClassLabel: "対象・クラス",
  lessonPackFeedbackSummary: "印刷画面を試していただきありがとうございます（1分フィードバック）",
  lessonPackFeedbackLead: "この授業用教材を次の授業でどう使えそうか教えてください。",
  lessonPackFeedbackNotice: "回答は自動送信・保存されません。コピーして、案内された連絡先へお送りください。再読み込みすると消えます。",
  lessonPackFeedbackUtilization: "この教材をどう使えそうですか？",
  lessonPackFeedbackUtilizationOptions: {
    "近いうちに使いたい": "近いうちに使いたい",
    "内容を直せば使いたい": "内容を直せば使いたい",
    "今回は使わない": "今回は使わない",
  },
  lessonPackFeedbackNextFeature: "次にあると助かる機能は？",
  lessonPackFeedbackNextFeatureOptions: {
    "教材を保存して後から再編集": "教材を保存して後から再編集",
    "複数クラス・複数教材をまとめて出力": "複数クラス・複数教材をまとめて出力",
    "自分の地域・題材を追加": "自分の地域・題材を追加",
    "校内で共有": "校内で共有",
  },
  lessonPackFeedbackComment: "任意コメント",
  lessonPackFeedbackCommentHint: "500文字以内",
  lessonPackFeedbackGenerate: "回答文を作成",
  lessonPackFeedbackAnswer: "コピーする回答文",
  lessonPackFeedbackCopy: "回答文をコピー",
  lessonPackFeedbackCopied: "フィードバック回答文をコピーしました。",
  lessonPackFeedbackCopyFailed: "コピーできませんでした。回答文を選択して手動でコピーしてください。",
  lessonPackFeedbackRequired: "必須項目を選択してください。",
  datasetCatalogOpen: "地域・教材を選ぶ",
  datasetCatalogDialogLabel: "地域・教材カタログ",
  datasetCatalogHeading: "地域・教材を選ぶ",
  datasetCatalogLead: "無料の歴史地図パイロットから始め、根拠と授業用リンク付きのガイド教材を開けます。",
  datasetCatalogRegion: "地域",
  datasetCatalogYears: "収録年",
  datasetCatalogFeatures: "公開地物",
  datasetCatalogEntities: "歴史対象",
  datasetCatalogSources: "出典",
  datasetCatalogLesson: "ガイド教材",
  datasetCatalogCapabilities: "このパイロットでできること",
  datasetCatalogCompare: "時点を比較",
  datasetCatalogEvidence: "根拠を確認",
  datasetCatalogShare: "表示を共有",
  datasetCatalogReport: "レポートを保存",
  datasetCatalogPack: "授業用教材パックを作成",
  datasetCatalogCustomize: "授業用に編集",
  datasetCatalogFreeDemo: "無料デモ",
  datasetCatalogPackBeta: "教材パックはβ版無料",
  datasetCatalogStartLesson: "無料教材を始める",
  datasetCatalogViewMap: "地図だけ見る",
  datasetCatalogUnavailable: "この公開データセットは現在利用できません。",
  datasetCatalogLessonUnavailable: "地図は利用できますが、ガイド教材はまだ公開されていません。",
  datasetCatalogFreeHeading: "今すぐ無料で試せること",
  datasetCatalogFreeCopy: "地図を見る、出典を確認する、表示を共有する、根拠付きレポートを保存する機能を利用できます。",
  datasetCatalogFutureHeading: "教員向けに検討中のこと",
  datasetCatalogFutureCopy: "地域別パック、授業テンプレート、複数教材の一括出力は、教員向けワークフローの将来候補です。",
  datasetCatalogClose: "カタログを閉じる",
  datasetCatalogLoading: "カタログを読み込んでいます…",
  comparisonCta: (name) => `${name}の変化を比較`,
  comparisonTitle: (name) => `${name}の変化を比較`,
  comparisonYear: (year) => formatYear(year, "ja"),
  comparisonUncertainty: "不確実性",
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
