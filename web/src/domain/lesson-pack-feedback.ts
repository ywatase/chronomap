/** The only values that may be included for the two required feedback questions. */
export const UTILIZATION_OPTIONS = [
  "近いうちに使いたい",
  "内容を直せば使いたい",
  "今回は使わない",
] as const;

export type LessonPackUtilization = (typeof UTILIZATION_OPTIONS)[number];

export const NEXT_FEATURE_OPTIONS = [
  "教材を保存して後から再編集",
  "複数クラス・複数教材をまとめて出力",
  "自分の地域・題材を追加",
  "校内で共有",
] as const;

export type LessonPackNextFeature = (typeof NEXT_FEATURE_OPTIONS)[number];

/** Raw form values. The index signature deliberately permits ignored UI fields. */
export interface LessonPackFeedbackInput {
  readonly utilization?: unknown;
  readonly nextFeature?: unknown;
  readonly comment?: unknown;
  readonly [key: string]: unknown;
}

export interface LessonPackFeedback {
  readonly utilization: LessonPackUtilization;
  readonly nextFeature: LessonPackNextFeature;
  readonly comment: string;
}

/** The complete set of metadata that may be copied with a feedback answer. */
export interface LessonPackFeedbackContext {
  readonly datasetSlug: string;
  readonly lessonId: string;
  readonly selectedStepCount: number;
  readonly includeTeacher: boolean;
  /** Whether the rendered preview contains a valid printable observation figure. */
  readonly observationFigure?: boolean;
  readonly language?: "ja" | "en";
  readonly [key: string]: unknown;
}

const EN_UTILIZATION: Record<LessonPackUtilization, string> = {
  "近いうちに使いたい": "I want to use it soon",
  "内容を直せば使いたい": "I would use it after revisions",
  "今回は使わない": "I will not use it this time",
};

const EN_NEXT_FEATURE: Record<LessonPackNextFeature, string> = {
  "教材を保存して後から再編集": "Save materials and edit them later",
  "複数クラス・複数教材をまとめて出力": "Bulk export for multiple classes and materials",
  "自分の地域・題材を追加": "Add my own region or topic",
  "校内で共有": "Share within my school",
};

function isUtilization(value: unknown): value is LessonPackUtilization {
  return typeof value === "string" && (UTILIZATION_OPTIONS as readonly string[]).includes(value);
}

function isNextFeature(value: unknown): value is LessonPackNextFeature {
  return typeof value === "string" && (NEXT_FEATURE_OPTIONS as readonly string[]).includes(value);
}

/** Validate the required answers and normalize the optional comment. */
export function normalizeLessonPackFeedback(input: LessonPackFeedbackInput): LessonPackFeedback | null {
  if (!isUtilization(input.utilization) || !isNextFeature(input.nextFeature)) return null;
  const comment = typeof input.comment === "string" ? input.comment.trim().slice(0, 500) : "";
  return Object.freeze({ utilization: input.utilization, nextFeature: input.nextFeature, comment });
}

function metadataText(value: string): string {
  return value.trim().replace(/[\r\n]+/g, " ");
}

function stepCountText(value: number): string {
  return Number.isFinite(value) && value >= 0 ? String(Math.floor(value)) : "0";
}

/** Generate the copy-and-send text. No title, class label, prompt, map, or other fields are read. */
export function generateLessonPackFeedbackText(feedback: LessonPackFeedback, context: LessonPackFeedbackContext): string {
  const english = context.language === "en";
  const datasetSlug = metadataText(context.datasetSlug);
  const lessonId = metadataText(context.lessonId);
  const stepCount = stepCountText(context.selectedStepCount);
  const teacher = context.includeTeacher ? (english ? "yes" : "あり") : (english ? "no" : "なし");
  const lines = english
    ? [
        "Chronomap 1-minute feedback",
        `Utilization intention: ${EN_UTILIZATION[feedback.utilization]}`,
        `Next feature: ${EN_NEXT_FEATURE[feedback.nextFeature]}`,
        ...(feedback.comment ? [`Comment: ${feedback.comment}`] : []),
        `Dataset slug: ${datasetSlug}`,
        `Lesson ID: ${lessonId}`,
        `Selected step count: ${stepCount}`,
        `Teacher material: ${teacher}`,
      ]
    : [
        "Chronomap 1分フィードバック",
        `利用意向: ${feedback.utilization}`,
        `次にほしい機能: ${feedback.nextFeature}`,
        ...(feedback.comment ? [`コメント: ${feedback.comment}`] : []),
        `データセット: ${datasetSlug}`,
        `教材ID: ${lessonId}`,
        `選択ステップ数: ${stepCount}`,
        `教員用資料: ${teacher}`,
      ];
  return lines.join("\n");
}

/** Normalize raw form values and generate an answer, or return null while required fields are unanswered. */
export function buildLessonPackFeedbackAnswer(input: LessonPackFeedbackInput, context: LessonPackFeedbackContext): string | null {
  const feedback = normalizeLessonPackFeedback(input);
  return feedback ? generateLessonPackFeedbackText(feedback, context) : null;
}
