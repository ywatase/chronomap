import { displayYearLocalized } from "../domain/labels";
import type { LessonPackAudience, LessonPackBudgetIntent, LessonPackDelivery, LessonPackDuration, LessonPackOfferPlan } from "../domain/lesson-pack-pilot";
import type { LessonPackNextFeature, LessonPackUtilization } from "../domain/lesson-pack-feedback";
import type { GeometryType, RightsStatus, UncertaintyAssessment } from "../domain/types";

export { entityTypeLabel } from "../domain/labels";

export interface UiCopy {
  readonly language: "ja" | "en";
  readonly previousYear: string;
  readonly nextYear: string;
  readonly yearLabel: string;
  readonly directYearLabel: string;
  readonly recordedLabel: string;
  readonly recordedHint: string;
  readonly viewerMode: string;
  readonly timelineLabel: string;
  readonly timelineHint: string;
  readonly timelineSnapshot: (year: number, count: number) => string;
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
  readonly territoryVisibilityLabel: string;
  readonly historicalMapAssetOpacityLabel: string;
  readonly historicalMapAssetVisibilityLabel: string;
  readonly historicalMapAssetUnavailable: string;
  readonly mapOpacityValue: (value: number) => string;
  readonly mapLegend: string;
  readonly legendPoint: string;
  readonly legendLine: string;
  readonly legendPolygon: string;
  readonly legendTerritory: string;
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
  readonly reportEntityType: string;
  readonly reportHypothesis: string;
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
  readonly lessonPackReadingExample: string;
  readonly lessonPackUncertainty: string;
  readonly lessonPackComparison: string;
  readonly lessonPackEvidence: string;
  readonly lessonPackLocator: string;
  readonly lessonPackRights: string;
  readonly lessonPackAccessed: string;
  readonly lessonPackApproximation: string;
  readonly lessonPackFigureTitle: string;
  readonly lessonPackFigureDescription: string;
  readonly lessonPackFigureFallback: string;
  readonly lessonPackFigureLegendPoint: string;
  readonly lessonPackFigureLegendLine: string;
  readonly lessonPackFigureLegendPolygon: string;
  readonly lessonPackFigureCaption: string;
  readonly lessonPackCitationOnly: string;
  readonly lessonPackNoSources: string;
  readonly lessonPackPrint: string;
  readonly lessonPackPrintStudent: string;
  readonly lessonPackPrintTeacher: string;
  readonly lessonPackPrintFull: string;
  readonly lessonPackStudentPrintWarning: string;
  readonly lessonPackConsult: string;
  readonly lessonPackClose: string;
  readonly lessonPackStartQrHint: string;
  readonly lessonPackStartQrLabel: string;
  readonly lessonPackQrUnavailable: string;
  readonly lessonPackUrlUnavailable: string;
  readonly lessonPackStepOnlineLink: string;
  readonly lessonWorkshopOpen: string;
  readonly lessonWorkshopBack: string;
  readonly lessonPackBuilderSummary: string;
  readonly lessonPackBuilderSummaryLead: string;
  readonly lessonPackBuilderSummarySteps: (selected: number, total: number) => string;
  readonly lessonPackBuilderSummaryDuration: (minutes: number) => string;
  readonly lessonPackBuilderSummaryStudent: string;
  readonly lessonPackBuilderSummaryTeacher: string;
  readonly lessonPackBuilderSummarySources: string;
  readonly lessonPackBuilderSummaryLinks: string;
  readonly lessonPackBuilderSummaryPrint: string;
  readonly lessonPackBuilderSummaryFigure: string;
  readonly lessonPackBuilderSummaryPreview: string;
  readonly lessonPackBuilderSummaryEdit: string;
  readonly lessonPackBuilderSummaryInvalid: string;
  readonly lessonPackBuilderOffer: (plan: string, price: string) => string;
  readonly lessonPackClassLabel: string;
  readonly lessonPackDraftSave: string;
  readonly lessonPackDraftFileLabel: string;
  readonly lessonPackDraftOpen: string;
  readonly lessonPackDraftNote: string;
  readonly lessonPackDraftSaved: string;
  readonly lessonPackDraftLoaded: string;
  readonly lessonPackDraftInvalid: string;
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
  readonly lessonPackCompletionSummary: string;
  readonly lessonPackCompletionFacts: (steps: number, scope: "student" | "teacher" | "full", includeTeacher: boolean, observationFigure: boolean) => string;
  readonly lessonPackPilotPrivacy: string;
  readonly lessonPackPilotNoContact: string;
  readonly lessonPackPilotFeedbackRoute: string;
  readonly lessonPackPilotConsultRoute: string;
  readonly lessonPackPilotPlan: string;
  readonly lessonPackPilotPlanOptions: Readonly<Record<LessonPackOfferPlan, string>>;
  readonly lessonPackPilotBudget: string;
  readonly lessonPackPilotBudgetOptions: Readonly<Record<LessonPackBudgetIntent, string>>;
  readonly lessonPackPilotAudience: string;
  readonly lessonPackPilotAudienceOptions: Readonly<Record<LessonPackAudience, string>>;
  readonly lessonPackPilotDuration: string;
  readonly lessonPackPilotDurationOptions: Readonly<Record<LessonPackDuration, string>>;
  readonly lessonPackPilotDelivery: string;
  readonly lessonPackPilotDeliveryOptions: Readonly<Record<LessonPackDelivery, string>>;
  readonly lessonPackPilotRegionTopic: string;
  readonly lessonPackPilotRegionHint: string;
  readonly lessonPackPilotReviewFeedback: string;
  readonly lessonPackPilotReviewConsult: string;
  readonly lessonPackPilotReview: string;
  readonly lessonPackPilotBackToEdit: string;
  readonly lessonPackPilotCopy: string;
  readonly lessonPackPilotShare: string;
  readonly lessonPackPilotDownload: string;
  readonly lessonPackPilotMail: string;
  readonly lessonPackPilotCopied: string;
  readonly lessonPackPilotCopyFailed: string;
  readonly lessonPackPilotShareFailed: string;
  readonly lessonPackPilotDownloaded: string;
  readonly lessonPackPilotDownloadFailed: string;
  readonly lessonPackPilotMailOpened: string;
  readonly lessonPackPilotSubject: string;
  readonly datasetCatalogOpen: string;
  readonly datasetCatalogDialogLabel: string;
  readonly datasetCatalogHeading: string;
  readonly datasetCatalogLead: string;
  readonly datasetCatalogWelcomeTitle: string;
  readonly datasetCatalogWelcomeLead: string;
  readonly datasetCatalogHeroTrust: string;
  readonly datasetCatalogHeroSecondary: string;
  readonly datasetCatalogHeroProof: readonly string[];
  readonly datasetCatalogRootQuickStartKicker: string;
  readonly datasetCatalogRootQuickStartTitle: string;
  readonly datasetCatalogRootQuickStartLead: string;
  readonly datasetCatalogRootQuickStartPrimary: string;
  readonly datasetCatalogRootQuickStartSecondary: string;
  readonly datasetCatalogRootQuickStartNote: string;
  readonly datasetCatalogPurposeHeading: string;
  readonly datasetCatalogPurposeExplore: string;
  readonly datasetCatalogPurposeExploreLead: string;
  readonly datasetCatalogPurposeBuild: string;
  readonly datasetCatalogPurposeBuildLead: string;
  readonly datasetCatalogPurposeResume: string;
  readonly datasetCatalogPurposeResumeLead: string;
  readonly datasetCatalogPurposeResumeFile: string;
  readonly datasetCatalogPurposeResumeOpen: string;
  readonly datasetCatalogPurposeResumeLoading: string;
  readonly datasetCatalogPurposeResumeInvalid: string;
  readonly datasetCatalogPurposeCoverage: (regions: number, lessons: number) => string;
  readonly datasetCatalogPurposeValue: string;
  readonly datasetCatalogOfferHeading: string;
  readonly datasetCatalogOfferLead: string;
  readonly datasetCatalogOfferTitles: Readonly<Record<LessonPackOfferPlan, string>>;
  readonly datasetCatalogOfferPrices: Readonly<Record<LessonPackOfferPlan, string>>;
  readonly datasetCatalogOfferLeads: Readonly<Record<LessonPackOfferPlan, string>>;
  readonly datasetCatalogOfferBenefits: Readonly<Record<LessonPackOfferPlan, string>>;
  readonly datasetCatalogOfferBadges: Readonly<Record<LessonPackOfferPlan, string>>;
  readonly datasetCatalogOfferNextSteps: Readonly<Record<LessonPackOfferPlan, string>>;
  readonly datasetCatalogOfferOutputsHeading: string;
  readonly datasetCatalogOfferOutputs: Readonly<Record<LessonPackOfferPlan, readonly string[]>>;
  readonly datasetCatalogOfferActions: Readonly<Record<LessonPackOfferPlan, string>>;
  readonly datasetCatalogOfferPreview: string;
  readonly datasetCatalogOfferPricing: string;
  readonly datasetCatalogProcessHeading: string;
  readonly datasetCatalogProcessLead: string;
  readonly datasetCatalogProcessSteps: readonly string[];
  readonly datasetCatalogStepObserve: string;
  readonly datasetCatalogStepWrite: string;
  readonly datasetCatalogStepShare: string;
  readonly datasetCatalogFeaturedHeading: string;
  readonly datasetCatalogFeaturedLead: (title: string, minutes: number) => string;
  readonly datasetCatalogFeaturedPack: string;
  readonly datasetCatalogCardPrefix: string;
  readonly datasetCatalogRegion: string;
  readonly datasetCatalogYears: string;
  readonly datasetCatalogFeatures: string;
  readonly datasetCatalogEntities: string;
  readonly datasetCatalogSources: string;
  readonly datasetCatalogAuditHeading: string;
  readonly datasetCatalogAuditStatus: (features: number, evidence: number, sources: number) => string;
  readonly datasetCatalogAuditDetail: (dimensions: number) => string;
  readonly datasetCatalogAuditAction: string;
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
  readonly datasetCatalogLessonMode: string;
  readonly datasetCatalogLessonModeLead: string;
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
  readonly featureSearchLabel: string;
  readonly featureSearchPlaceholder: string;
  readonly featureSearchNoMatch: (query: string) => string;
  readonly featureCount: (shown: number, total: number) => string;
  readonly noFeatures: (year: string) => string;
  readonly unknownEntity: string;
  readonly noPreferredHypothesis: string;
  readonly hypothesisGroup: string;
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
  viewerMode: "Map viewer · explore freely",
  timelineLabel: "Historical change timeline",
  timelineHint: "Only authored snapshots are shown. Select a year to compare the visible geography.",
  timelineSnapshot: (year, count) => `${formatYear(year, "en")} · ${count} feature${count === 1 ? "" : "s"}`,
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
  territoryVisibilityLabel: "Show territory and spheres of influence",
  historicalMapAssetOpacityLabel: "Historical map opacity",
  historicalMapAssetVisibilityLabel: "Show historical map",
  historicalMapAssetUnavailable: "Historical map context is unavailable; current map and historical features remain available.",
  mapOpacityValue: (value) => `${Math.round(value * 100)}%`,
  mapLegend: "Legend",
  legendPoint: "Historical point",
  legendLine: "Historical line",
  legendPolygon: "Historical area",
  legendTerritory: "Territory / sphere of influence (approximate)",
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
  reportEntityType: "Entity type",
  reportHypothesis: "Hypothesis",
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
  lessonPackReadingExample: "Reading example (not the only correct answer)",
  lessonPackUncertainty: "Uncertainty to discuss",
  lessonPackComparison: "Reference comparison",
  lessonPackEvidence: "Evidence locators",
  lessonPackLocator: "Locator",
  lessonPackRights: "Rights and attribution",
  lessonPackAccessed: "accessed",
  lessonPackApproximation: "Teaching note: reconstructed shapes may be approximate; do not treat them as precise boundaries.",
  lessonPackFigureTitle: "Observation figure",
  lessonPackFigureDescription: "A schematic comparison of the selected public historical geometries. This is not a current basemap or a precise boundary.",
  lessonPackFigureFallback: "The observation figure is unavailable. Use the worksheet text and online map instead.",
  lessonPackFigureLegendPoint: "Point feature",
  lessonPackFigureLegendLine: "Line feature",
  lessonPackFigureLegendPolygon: "Area feature",
  lessonPackFigureCaption: "Chronomap schematic reconstruction for classroom observation. Not a basemap or precise boundary; open the online map for context and evidence.",
  lessonPackCitationOnly: "Citation-only metadata; no source body, image, or inscription is reproduced.",
  lessonPackNoSources: "No source metadata is available.",
  lessonPackPrint: "Print / save classroom pack",
  lessonPackPrintStudent: "Print student worksheet",
  lessonPackPrintTeacher: "Print teacher reference + sources",
  lessonPackPrintFull: "Print full classroom pack",
  lessonPackStudentPrintWarning: "Student print excludes teacher reading examples.",
  lessonPackConsult: "Create a consultation brief",
  lessonPackClose: "Close classroom pack",
  lessonPackStartQrHint: "Scan with a smartphone/tablet to open the guided lesson.",
  lessonPackStartQrLabel: "QR code to open the guided lesson",
  lessonPackQrUnavailable: "QR code unavailable. Open the URL below.",
  lessonPackUrlUnavailable: "URL unavailable.",
  lessonPackStepOnlineLink: "Open this step online",
  lessonWorkshopOpen: "Customize for this class",
  lessonWorkshopBack: "Back to editor",
  lessonPackBuilderSummary: "What you can make",
  lessonPackBuilderSummaryLead: "A finished classroom pack is ready from this lesson.",
  lessonPackBuilderSummarySteps: (selected, total) => `${selected} of ${total} steps selected`,
  lessonPackBuilderSummaryDuration: (minutes) => `About ${minutes} minutes`,
  lessonPackBuilderSummaryStudent: "Student worksheet",
  lessonPackBuilderSummaryTeacher: "Teacher reference",
  lessonPackBuilderSummarySources: "Sources and rights",
  lessonPackBuilderSummaryLinks: "QR code and online links",
  lessonPackBuilderSummaryPrint: "A4 / PDF and recipient print views",
  lessonPackBuilderSummaryFigure: "Printable observation figure",
  lessonPackBuilderSummaryPreview: "See the finished example",
  lessonPackBuilderSummaryEdit: "Adjust the contents",
  lessonPackBuilderSummaryInvalid: "Select at least one step to see the finished example.",
  lessonPackBuilderOffer: (plan, price) => `Selected adoption path: ${plan} · ${price}. Scope and final quote are confirmed in consultation.`,
  lessonPackClassLabel: "Class / audience",
  lessonPackDraftSave: "Save draft to file",
  lessonPackDraftFileLabel: "Draft file",
  lessonPackDraftOpen: "Open draft file",
  lessonPackDraftNote: "Drafts are saved as a file on this device. They include class names and edited prompts; handle them with care. Nothing is sent to Chronomap.",
  lessonPackDraftSaved: "Draft saved to this device.",
  lessonPackDraftLoaded: "Draft loaded. Review the contents before opening the preview.",
  lessonPackDraftInvalid: "Could not load this draft. Check its dataset, lesson, steps, and file size.",
  lessonPackFeedbackSummary: "Thanks for trying the print dialog — one-minute feedback",
  lessonPackFeedbackLead: "Tell us how this classroom pack fits your next lesson.",
  lessonPackFeedbackNotice: "Your answers are not sent or saved automatically. Review the text, then copy or share it yourself. They disappear when you reload the page.",
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
  lessonPackCompletionSummary: "Classroom pack summary",
  lessonPackCompletionFacts: (steps, scope, includeTeacher, observationFigure) => `${steps} step${steps === 1 ? "" : "s"} · ${observationFigure ? "observation figure" : "figure unavailable"} · student material${includeTeacher ? " · teacher material" : ""} · QR · sources/rights · ${scope} print`,
  lessonPackPilotPrivacy: "Chronomap does not send or save this text. Do not enter a school name, student name, contact details, or other personal information. Review it before copying or sharing; sending is always your action.",
  lessonPackPilotNoContact: "No consultation mailbox is configured for this demo. Save or copy the handoff and send it to the operator yourself.",
  lessonPackPilotFeedbackRoute: "Feedback only",
  lessonPackPilotConsultRoute: "Create a regional lesson-pack consultation message",
  lessonPackPilotPlan: "Offer path (required for consultation)",
  lessonPackPilotPlanOptions: {
    "free-explore": "Free exploration",
    "classroom-pilot": "Classroom pilot",
    "custom-region": "Custom regional lesson production",
  },
  lessonPackPilotBudget: "Consultation intention (required for consultation)",
  lessonPackPilotBudgetOptions: {
    "校費・組織予算で相談したい": "I want to discuss an institutional budget",
    "地域・内容・条件が合えば検討したい": "I would consider it if the region, content, and conditions fit",
    "まず無料試用を続けたい": "I want to continue the free trial first",
    "今回は検討しない": "I will not consider it this time",
  },
  lessonPackPilotAudience: "Learner / audience (optional)",
  lessonPackPilotAudienceOptions: {
    "小学校": "Elementary school",
    "中学校": "Middle school",
    "高校": "High school",
    "大学・社会人": "University / adult learning",
    "未定": "Not decided",
  },
  lessonPackPilotDuration: "Lesson duration (optional)",
  lessonPackPilotDurationOptions: {
    "15分以内": "Up to 15 minutes",
    "45〜50分": "45–50 minutes",
    "複数時限": "Multiple class periods",
    "未定": "Not decided",
  },
  lessonPackPilotDelivery: "Preferred delivery (optional)",
  lessonPackPilotDeliveryOptions: {
    "印刷用PDF": "Print-ready PDF",
    "PDF＋QR・オンライン開始リンク": "PDF plus QR / online start link",
    "相談で決めたい": "Decide in consultation",
  },
  lessonPackPilotRegionTopic: "Preferred region or topic (optional, up to 200 characters)",
  lessonPackPilotRegionHint: "Do not include a school, student, or contact name.",
  lessonPackPilotReviewFeedback: "Review feedback text",
  lessonPackPilotReviewConsult: "Review consultation text",
  lessonPackPilotReview: "Review consultation text",
  lessonPackPilotBackToEdit: "Back to editing",
  lessonPackPilotCopy: "Copy handoff text",
  lessonPackPilotShare: "Share handoff text",
  lessonPackPilotDownload: "Save text file",
  lessonPackPilotMail: "Open email draft",
  lessonPackPilotCopied: "Handoff text copied.",
  lessonPackPilotCopyFailed: "Could not copy. Select the review text and copy it manually.",
  lessonPackPilotShareFailed: "Sharing was canceled or unavailable. The review text is still here.",
  lessonPackPilotDownloaded: "Handoff text downloaded.",
  lessonPackPilotDownloadFailed: "Could not save the file. Select the review text and save it manually.",
  lessonPackPilotMailOpened: "Email app opened. The message has not been sent.",
  lessonPackPilotSubject: "Chronomap regional lesson-pack consultation",
  datasetCatalogOpen: "Choose a region or lesson · plans",
  datasetCatalogDialogLabel: "Region and lesson catalog",
  datasetCatalogHeading: "Choose a region or lesson",
  datasetCatalogLead: "Start with a free historical map pilot, or open a guided lesson with evidence and classroom links.",
  datasetCatalogWelcomeTitle: "Turn historical maps into classroom-ready materials",
  datasetCatalogWelcomeLead: "Start with a cited historical map, see an evidence-backed worksheet in three minutes, then shape a student PDF, teacher reference, QR code, and source list for your class.",
  datasetCatalogHeroTrust: "Free demo: no account or payment required. Classroom pilots and regional production begin with a consultation.",
  datasetCatalogHeroSecondary: "Explore the map first",
  datasetCatalogHeroProof: ["Evidence and uncertainty stay visible", "Student PDF + teacher reference", "Regional materials via consultation"],
  datasetCatalogRootQuickStartKicker: "Free historical map pilot",
  datasetCatalogRootQuickStartTitle: "See change around Ogurike",
  datasetCatalogRootQuickStartLead: "Start with the 1590 and 1596 Ujigawa snapshots. Compare the map first; make a classroom pack when you are ready.",
  datasetCatalogRootQuickStartPrimary: "See Ogurike change",
  datasetCatalogRootQuickStartSecondary: "Choose a region",
  datasetCatalogRootQuickStartNote: "Free to explore: evidence, uncertainty, sharing, and reports stay visible.",
  datasetCatalogPurposeHeading: "Choose what you want to do",
  datasetCatalogPurposeExplore: "Explore the map",
  datasetCatalogPurposeExploreLead: "Open a region card to inspect historical geography and evidence.",
  datasetCatalogPurposeBuild: "Make a classroom pack",
  datasetCatalogPurposeBuildLead: "Start from the featured lesson and shape prompts for your class.",
  datasetCatalogPurposeResume: "Resume a draft",
  datasetCatalogPurposeResumeLead: "Open a draft file from this device and continue editing locally.",
  datasetCatalogPurposeResumeFile: "Draft file",
  datasetCatalogPurposeResumeOpen: "Choose a draft file",
  datasetCatalogPurposeResumeLoading: "Checking the draft…",
  datasetCatalogPurposeResumeInvalid: "Could not load this draft. Check its dataset, lesson, steps, and file size.",
  datasetCatalogPurposeCoverage: (regions, lessons) => `Coverage: ${regions} regions / ${lessons} guided lessons (pilot)`,
  datasetCatalogPurposeValue: "Teacher value validation in progress",
  datasetCatalogOfferHeading: "Choose an adoption path and price",
  datasetCatalogOfferLead: "Try the public map first. If a class needs a supported pilot or a region-specific lesson, choose the path, scope, and beta price proposal before starting a consultation.",
  datasetCatalogOfferTitles: { "free-explore": "Free exploration", "classroom-pilot": "Classroom pilot", "custom-region": "Custom regional production" },
  datasetCatalogOfferPrices: { "free-explore": "¥0 · self-serve", "classroom-pilot": "From ¥49,800 · one class", "custom-region": "From ¥198,000 · one region" },
  datasetCatalogOfferLeads: { "free-explore": "Inspect maps, evidence, sharing, and one classroom pack locally.", "classroom-pilot": "Shape a lesson for one class and discuss the teacher workflow.", "custom-region": "Discuss source curation and lesson design for your own region or topic." },
  datasetCatalogOfferBenefits: { "free-explore": "No account or contact required", "classroom-pilot": "Teacher guide + feedback handoff", "custom-region": "Region/topic scope + source discussion" },
  datasetCatalogOfferBadges: { "free-explore": "", "classroom-pilot": "Recommended first paid pilot", "custom-region": "" },
  datasetCatalogOfferNextSteps: { "free-explore": "Next: open the finished example", "classroom-pilot": "Next: choose class conditions, then review a consultation brief", "custom-region": "Next: choose region conditions, then review a consultation brief" },
  datasetCatalogOfferOutputsHeading: "What this path covers",
  datasetCatalogOfferOutputs: {
    "free-explore": ["Map, evidence, and uncertainty review", "Shareable report and links", "One finished classroom-pack example"],
    "classroom-pilot": ["One-class lesson-pack draft", "Student worksheet + teacher reference", "Source, rights, and start-QR checklist"],
    "custom-region": ["Region/topic source curation", "Lesson design matched to your scope", "Student and teacher PDF delivery scope"],
  },
  datasetCatalogOfferActions: { "free-explore": "Try the free example", "classroom-pilot": "Preview the finished example, then create a pilot consultation message", "custom-region": "Preview the finished example, then create a custom-production consultation message" },
  datasetCatalogOfferPreview: "Preview the finished example",
  datasetCatalogOfferPricing: "Beta price proposal: tax, scope, delivery date, and final quote are confirmed in consultation. Checkout is not enabled; the handoff only records intent.",
  datasetCatalogProcessHeading: "How adoption works",
  datasetCatalogProcessLead: "No payment is taken here. Try the free example first, then carry a reviewed scope into a consultation.",
  datasetCatalogProcessSteps: ["Try the cited map and free example", "Preview a class-ready pack and choose a path", "Confirm scope, price, and delivery in consultation"],
  datasetCatalogStepObserve: "1. Choose a topic and evidence",
  datasetCatalogStepWrite: "2. Shape the observation prompt",
  datasetCatalogStepShare: "3. Print and share the PDF",
  datasetCatalogFeaturedHeading: "Recommended finished example",
  datasetCatalogFeaturedLead: (title, minutes) => `${title} · about ${minutes} minutes`,
  datasetCatalogFeaturedPack: "See the finished example",
  datasetCatalogCardPrefix: "Dataset card",
  datasetCatalogRegion: "Region",
  datasetCatalogYears: "Recorded years",
  datasetCatalogFeatures: "Public features",
  datasetCatalogEntities: "Historical entities",
  datasetCatalogSources: "Sources",
  datasetCatalogAuditHeading: "Evidence and uncertainty audit",
  datasetCatalogAuditStatus: (features, evidence, sources) => `Public audit ready · ${features} features · ${evidence} evidence records · ${sources} sources`,
  datasetCatalogAuditDetail: (dimensions) => `All ${dimensions} uncertainty dimensions are linked. Open the map to inspect each locator, source, and rights condition.`,
  datasetCatalogAuditAction: "Inspect on the map",
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
  datasetCatalogLessonMode: "Optional guided lesson",
  datasetCatalogLessonModeLead: "Lessons are an optional layer after exploring the map. Open one only when you want prompts and classroom materials; this viewer has no pricing or checkout flow.",
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
  featureSearchLabel: "Search visible features",
  featureSearchPlaceholder: "Name, description, or ID",
  featureSearchNoMatch: (query) => `No visible features match “${query}”.`,
  featureCount: (shown, total) => shown === total ? `${total} feature${total === 1 ? "" : "s"} shown` : `${shown} of ${total} features shown`,
  noFeatures: (year) => `No features match ${year}.`,
  unknownEntity: "Unknown entity",
  noPreferredHypothesis: "No preferred hypothesis",
  hypothesisGroup: "Hypothesis group",
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
  viewerMode: "地図ビューアー・自由に調べる",
  timelineLabel: "地形の変遷タイムライン",
  timelineHint: "実際に作成したスナップショットだけを表示しています。年を選ぶと、その時点の地物を比較できます。",
  timelineSnapshot: (year, count) => `${formatYear(year, "ja")}・${count}件`,
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
  territoryVisibilityLabel: "領域・勢力圏を表示",
  historicalMapAssetOpacityLabel: "古地図の濃さ",
  historicalMapAssetVisibilityLabel: "古地図を表示",
  historicalMapAssetUnavailable: "古地図コンテキストを利用できません。現在地図と歴史地物は引き続き利用できます。",
  mapOpacityValue: (value) => `${Math.round(value * 100)}%`,
  mapLegend: "凡例",
  legendPoint: "歴史地物（点）",
  legendLine: "歴史地物（線）",
  legendPolygon: "歴史地物（面）",
  legendTerritory: "領域・勢力圏（概略）",
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
  reportEntityType: "種別",
  reportHypothesis: "仮説",
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
  lessonPackReadingExample: "読み取り例（唯一の正答ではありません）",
  lessonPackUncertainty: "授業で確認する不確実性",
  lessonPackComparison: "参照する比較",
  lessonPackEvidence: "根拠の参照位置",
  lessonPackLocator: "参照位置",
  lessonPackRights: "権利・表示",
  lessonPackAccessed: "参照日",
  lessonPackApproximation: "授業上の注意: 復元形状には概略が含まれます。精密な境界として扱わないでください。",
  lessonPackFigureTitle: "観察用概略図",
  lessonPackFigureDescription: "選択した公開地物を同じ縮尺で重ねた比較図です。現在の背景地図や精密な境界ではありません。",
  lessonPackFigureFallback: "概略図を表示できません。教材の文章とオンライン地図を参照してください。",
  lessonPackFigureLegendPoint: "点の地物",
  lessonPackFigureLegendLine: "線の地物",
  lessonPackFigureLegendPolygon: "面の地物",
  lessonPackFigureCaption: "Chronomap収録の概略復元を教材用に図示しています。背景地図・精密な境界ではありません。詳細と根拠はオンライン地図で確認してください。",
  lessonPackCitationOnly: "引用メタデータのみを収録しています。原資料の本文・画像・碑文は転載していません。",
  lessonPackNoSources: "出典メタデータはありません。",
  lessonPackPrint: "授業用教材パックを印刷 / PDF保存",
  lessonPackPrintStudent: "生徒用ワークシートを印刷",
  lessonPackPrintTeacher: "教員用資料・出典を印刷",
  lessonPackPrintFull: "教材パック全体を印刷",
  lessonPackStudentPrintWarning: "生徒用印刷では教員の読み取り例を含めません。",
  lessonPackConsult: "相談文を作る",
  lessonPackClose: "教材パックを閉じる",
  lessonPackStartQrHint: "スマートフォン/タブレットで読み取って教材を開く",
  lessonPackStartQrLabel: "ガイド教材を開くQRコード",
  lessonPackQrUnavailable: "QRコードを生成できません。下のURLを開いてください。",
  lessonPackUrlUnavailable: "URLを利用できません",
  lessonPackStepOnlineLink: "このステップをオンラインで開く",
  lessonWorkshopOpen: "この教材を授業用に整える",
  lessonWorkshopBack: "編集に戻る",
  lessonPackBuilderSummary: "作成できる教材",
  lessonPackBuilderSummaryLead: "この教材から、完成した授業用パックをすぐに確認できます。",
  lessonPackBuilderSummarySteps: (selected, total) => `${selected}/${total}ステップを選択中`,
  lessonPackBuilderSummaryDuration: (minutes) => `所要時間 約${minutes}分`,
  lessonPackBuilderSummaryStudent: "生徒用ワークシート",
  lessonPackBuilderSummaryTeacher: "教員用参照資料",
  lessonPackBuilderSummarySources: "出典・権利一覧",
  lessonPackBuilderSummaryLinks: "QRコード・オンラインリンク",
  lessonPackBuilderSummaryPrint: "A4 / PDF・受け手別の印刷",
  lessonPackBuilderSummaryFigure: "印刷用の観察図",
  lessonPackBuilderSummaryPreview: "この内容で完成見本を見る",
  lessonPackBuilderSummaryEdit: "内容を調整する",
  lessonPackBuilderSummaryInvalid: "完成見本を見るには、少なくとも1つのステップを選択してください。",
  lessonPackBuilderOffer: (plan, price) => `選択中の導入プラン: ${plan}・${price}。範囲・最終見積は相談で確定します。`,
  lessonPackClassLabel: "対象・クラス",
  lessonPackDraftSave: "下書きをファイル保存",
  lessonPackDraftFileLabel: "下書きファイル",
  lessonPackDraftOpen: "下書きファイルを開く",
  lessonPackDraftNote: "下書きはこの端末にファイルとして保存されます。クラス名や編集した問いを含むため、取り扱いにご注意ください。Chronomapには送信されません。",
  lessonPackDraftSaved: "下書きを保存しました。",
  lessonPackDraftLoaded: "下書きを読み込みました。内容を確認してプレビューしてください。",
  lessonPackDraftInvalid: "下書きを読み込めませんでした。データセット・教材・ステップ・ファイルサイズを確認してください。",
  lessonPackFeedbackSummary: "印刷画面を試していただきありがとうございます（1分フィードバック）",
  lessonPackFeedbackLead: "この授業用教材を次の授業でどう使えそうか教えてください。",
  lessonPackFeedbackNotice: "回答は自動送信・保存されません。文章を確認してから、ご自身でコピーまたは共有してください。再読み込みすると消えます。",
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
  lessonPackCompletionSummary: "教材パックの概要",
  lessonPackCompletionFacts: (steps, scope, includeTeacher, observationFigure) => `${steps}ステップ · ${observationFigure ? "観察用概略図" : "概略図なし"} · 生徒用資料${includeTeacher ? " · 教員用資料" : ""} · QR・出典／権利 · ${scope === "student" ? "生徒用" : scope === "teacher" ? "教員用" : "全体"}を印刷`,
  lessonPackPilotPrivacy: "この文章はChronomapから自動送信・保存されません。学校名、児童生徒名、連絡先などの個人情報は入力しないでください。コピー・共有前に全文を確認し、送信はご自身で行ってください。",
  lessonPackPilotNoContact: "このデモには相談窓口が設定されていません。相談文を保存またはコピーし、運営者へご自身で送ってください。",
  lessonPackPilotFeedbackRoute: "フィードバックのみ送る",
  lessonPackPilotConsultRoute: "地域教材パックの相談文を作る",
  lessonPackPilotPlan: "導入プラン（相談する場合は必須）",
  lessonPackPilotPlanOptions: {
    "free-explore": "無料で試す",
    "classroom-pilot": "授業パイロット",
    "custom-region": "地域教材の個別制作",
  },
  lessonPackPilotBudget: "相談意向（相談する場合は必須）",
  lessonPackPilotBudgetOptions: {
    "校費・組織予算で相談したい": "校費・組織予算で相談したい",
    "地域・内容・条件が合えば検討したい": "地域・内容・条件が合えば検討したい",
    "まず無料試用を続けたい": "まず無料試用を続けたい",
    "今回は検討しない": "今回は検討しない",
  },
  lessonPackPilotAudience: "対象（任意）",
  lessonPackPilotAudienceOptions: {
    "小学校": "小学校",
    "中学校": "中学校",
    "高校": "高校",
    "大学・社会人": "大学・社会人",
    "未定": "未定",
  },
  lessonPackPilotDuration: "授業時間（任意）",
  lessonPackPilotDurationOptions: {
    "15分以内": "15分以内",
    "45〜50分": "45〜50分",
    "複数時限": "複数時限",
    "未定": "未定",
  },
  lessonPackPilotDelivery: "希望納品（任意）",
  lessonPackPilotDeliveryOptions: {
    "印刷用PDF": "印刷用PDF",
    "PDF＋QR・オンライン開始リンク": "PDF＋QR・オンライン開始リンク",
    "相談で決めたい": "相談で決めたい",
  },
  lessonPackPilotRegionTopic: "希望地域・題材（任意、200字まで）",
  lessonPackPilotRegionHint: "学校名、児童生徒名、連絡先は書かないでください。",
  lessonPackPilotReviewFeedback: "フィードバック文を確認する",
  lessonPackPilotReviewConsult: "相談文を確認する",
  lessonPackPilotReview: "相談文を確認する",
  lessonPackPilotBackToEdit: "編集に戻る",
  lessonPackPilotCopy: "相談文をコピー",
  lessonPackPilotShare: "相談文を共有",
  lessonPackPilotDownload: "相談文を保存",
  lessonPackPilotMail: "メール下書きを開く",
  lessonPackPilotCopied: "相談文をコピーしました。",
  lessonPackPilotCopyFailed: "コピーできませんでした。表示された相談文を選択して手動でコピーしてください。",
  lessonPackPilotShareFailed: "共有をキャンセルしたか利用できません。相談文はこの画面に残っています。",
  lessonPackPilotDownloaded: "相談文をテキストファイルに保存しました。",
  lessonPackPilotDownloadFailed: "保存できませんでした。表示された相談文を選択して手動で保存してください。",
  lessonPackPilotMailOpened: "メールアプリを開きました（送信は完了していません）。",
  lessonPackPilotSubject: "Chronomap 地域教材パックの相談",
  datasetCatalogOpen: "地域・教材を選ぶ（料金も見る）",
  datasetCatalogDialogLabel: "地域・教材カタログ",
  datasetCatalogHeading: "地域・教材を選ぶ",
  datasetCatalogLead: "無料の歴史地図パイロットから始め、根拠と授業用リンク付きのガイド教材を開けます。",
  datasetCatalogWelcomeTitle: "歴史地図を、授業で使える教材に",
  datasetCatalogWelcomeLead: "出典をたどれる歴史地図から、根拠付きワークシートを3分で。完成見本では生徒用ワークシート、教員用資料、QRコード、出典一覧をPDFにできます。",
  datasetCatalogHeroTrust: "無料デモは登録・決済不要。授業パイロットと地域別制作は相談から始められます。",
  datasetCatalogHeroSecondary: "まず地図を調べる",
  datasetCatalogHeroProof: ["出典と不確実性が見える", "生徒用PDF＋教員用資料", "地域教材は相談から"],
  datasetCatalogRootQuickStartKicker: "無料の歴史地図パイロット",
  datasetCatalogRootQuickStartTitle: "巨椋池の変化を、まず地図で見る",
  datasetCatalogRootQuickStartLead: "1590年と1596年の宇治川スナップショットから始めます。先に地図で比べ、必要になったら授業用教材に整えられます。",
  datasetCatalogRootQuickStartPrimary: "巨椋池の変化を見る",
  datasetCatalogRootQuickStartSecondary: "地域を選ぶ",
  datasetCatalogRootQuickStartNote: "無料で比較・出典確認・共有・レポートまで試せます。",
  datasetCatalogPurposeHeading: "目的から選ぶ",
  datasetCatalogPurposeExplore: "調べる",
  datasetCatalogPurposeExploreLead: "地域カードから歴史地図を開き、地物と出典を確認します。",
  datasetCatalogPurposeBuild: "教材を作る",
  datasetCatalogPurposeBuildLead: "完成見本を見て、授業用の問いとステップを整えます。",
  datasetCatalogPurposeResume: "下書きを再開",
  datasetCatalogPurposeResumeLead: "この端末の下書きファイルを読み込み、編集を続けます。",
  datasetCatalogPurposeResumeFile: "下書きファイル",
  datasetCatalogPurposeResumeOpen: "下書きファイルを選ぶ",
  datasetCatalogPurposeResumeLoading: "下書きを確認しています…",
  datasetCatalogPurposeResumeInvalid: "下書きを読み込めませんでした。データセット・教材・ステップ・ファイルサイズを確認してください。",
  datasetCatalogPurposeCoverage: (regions, lessons) => `現在の収録範囲: ${regions}地域／${lessons}教材（試験公開）`,
  datasetCatalogPurposeValue: "教員向け価値検証中",
  datasetCatalogOfferHeading: "導入プランと価格案",
  datasetCatalogOfferLead: "まず公開地図を無料で試せます。授業で伴走が必要な場合や、地域別の教材を作りたい場合は、範囲とβ版の価格案を確認してから相談文に引き継げます。",
  datasetCatalogOfferTitles: { "free-explore": "無料で試す", "classroom-pilot": "授業パイロット", "custom-region": "地域教材の個別制作" },
  datasetCatalogOfferPrices: { "free-explore": "¥0・登録不要", "classroom-pilot": "¥49,800〜・1クラス", "custom-region": "¥198,000〜・1地域" },
  datasetCatalogOfferLeads: { "free-explore": "地図・根拠・共有・1つの教材パックを端末上で確認します。", "classroom-pilot": "1クラス分の教材を整え、教員の使い方を相談します。", "custom-region": "希望地域・題材の出典整理と教材設計を相談します。" },
  datasetCatalogOfferBenefits: { "free-explore": "登録・連絡先なしで開始", "classroom-pilot": "教員用資料＋相談文", "custom-region": "地域・題材の範囲＋出典相談" },
  datasetCatalogOfferBadges: { "free-explore": "", "classroom-pilot": "最初の有料パイロットにおすすめ", "custom-region": "" },
  datasetCatalogOfferNextSteps: { "free-explore": "次の一歩: 完成見本を確認", "classroom-pilot": "次の一歩: 授業条件を選び、相談文を確認", "custom-region": "次の一歩: 地域条件を選び、相談文を確認" },
  datasetCatalogOfferOutputsHeading: "この選択肢で扱う内容",
  datasetCatalogOfferOutputs: {
    "free-explore": ["地図・根拠・不確実性の確認", "共有リンクとレポート", "1つの教材パックの完成見本"],
    "classroom-pilot": ["1クラス向けの授業パック案", "生徒用ワークシート＋教員用参照資料", "出典・権利・開始QRの整理"],
    "custom-region": ["希望地域・題材の出典整理", "範囲に合わせた授業設計", "生徒用・教員用PDFの納品範囲"],
  },
  datasetCatalogOfferActions: { "free-explore": "無料の完成見本を見る", "classroom-pilot": "完成見本を確認して授業パイロットの相談文を作る", "custom-region": "完成見本を確認して個別制作の相談文を作る" },
  datasetCatalogOfferPreview: "完成見本で内容を見る",
  datasetCatalogOfferPricing: "β版の価格案です。税・範囲・納期・最終見積は相談で確定し、このサイトでは決済しません。相談文には検討意向だけが記録されます。",
  datasetCatalogProcessHeading: "導入までの流れ",
  datasetCatalogProcessLead: "このサイトで決済は行いません。まず無料の完成見本を試し、確認した範囲を相談文へ引き継ぎます。",
  datasetCatalogProcessSteps: ["出典付きの地図と無料見本を試す", "授業用パックを確認し、プランを選ぶ", "範囲・価格・納期を相談で確定する"],
  datasetCatalogStepObserve: "1. 題材と根拠を選ぶ",
  datasetCatalogStepWrite: "2. 観察する問いを整える",
  datasetCatalogStepShare: "3. PDFで配る",
  datasetCatalogFeaturedHeading: "おすすめの完成見本",
  datasetCatalogFeaturedLead: (title, minutes) => `${title} · 約${minutes}分`,
  datasetCatalogFeaturedPack: "完成見本を見る",
  datasetCatalogCardPrefix: "教材カード",
  datasetCatalogRegion: "地域",
  datasetCatalogYears: "収録年",
  datasetCatalogFeatures: "公開地物",
  datasetCatalogEntities: "歴史対象",
  datasetCatalogSources: "出典",
  datasetCatalogAuditHeading: "出典・不確実性",
  datasetCatalogAuditStatus: (features, evidence, sources) => `公開監査済み：地物${features}件・根拠${evidence}件・出典${sources}件`,
  datasetCatalogAuditDetail: (dimensions) => `不確実性${dimensions}次元（年代・位置・形状・同一性）を、各地物の詳細パネルで確認できます。`,
  datasetCatalogAuditAction: "地図で根拠を確認",
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
  datasetCatalogLessonMode: "教材モード（任意）",
  datasetCatalogLessonModeLead: "地図を調べた後、問いや授業用資料が必要なときだけ教材を開けます。このビューアーには価格表示・決済導線はありません。",
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
  featureSearchLabel: "表示中の地物を検索",
  featureSearchPlaceholder: "名称・説明・IDで検索",
  featureSearchNoMatch: (query) => `「${query}」に一致する地物はありません。`,
  featureCount: (shown, total) => shown === total ? `${total}件を表示` : `${total}件中${shown}件を表示`,
  noFeatures: (year) => `${year}に一致する公開地物はありません。`,
  unknownEntity: "地物の同一性情報なし",
  noPreferredHypothesis: "優先順位を付けていない復元案",
  hypothesisGroup: "仮説グループ",
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
