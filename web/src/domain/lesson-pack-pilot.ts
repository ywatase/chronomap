import { NEXT_FEATURE_OPTIONS, UTILIZATION_OPTIONS, type LessonPackNextFeature, type LessonPackUtilization } from "./lesson-pack-feedback";

export const LESSON_PACK_PILOT_ROUTES = ["feedback", "consult"] as const;
/** Allow-listed product paths; these are intent labels, not prices or payment SKUs. */
export const LESSON_PACK_OFFER_PLANS = ["free-explore", "classroom-pilot", "custom-region"] as const;
export type LessonPackOfferPlan = (typeof LESSON_PACK_OFFER_PLANS)[number];
export const DEFAULT_LESSON_PACK_OFFER_PLAN: LessonPackOfferPlan = "classroom-pilot";
export const LESSON_PACK_BUDGET_INTENTS = [
  "校費・組織予算で相談したい",
  "地域・内容・条件が合えば検討したい",
  "まず無料試用を続けたい",
  "今回は検討しない",
] as const;
/** Optional scoping choices that make a consultation handoff easier to quote. */
export const LESSON_PACK_AUDIENCE_OPTIONS = ["小学校", "中学校", "高校", "大学・社会人", "未定"] as const;
export const LESSON_PACK_DURATION_OPTIONS = ["15分以内", "45〜50分", "複数時限", "未定"] as const;
export const LESSON_PACK_DELIVERY_OPTIONS = ["印刷用PDF", "PDF＋QR・オンライン開始リンク", "相談で決めたい"] as const;
/**
 * A public build-time contact is optional. Vite embeds `VITE_*` values in the
 * browser bundle, so this must only ever be a deliberately public mailbox;
 * secrets and visitor-entered addresses are never accepted here.
 */
export const LESSON_PACK_PILOT_CONTACT: string | null = normalizeLessonPackPilotContact(import.meta.env.VITE_CHRONOMAP_PILOT_CONTACT);
export type LessonPackPilotRoute = (typeof LESSON_PACK_PILOT_ROUTES)[number];
export type LessonPackBudgetIntent = (typeof LESSON_PACK_BUDGET_INTENTS)[number];
export type LessonPackAudience = (typeof LESSON_PACK_AUDIENCE_OPTIONS)[number];
export type LessonPackDuration = (typeof LESSON_PACK_DURATION_OPTIONS)[number];
export type LessonPackDelivery = (typeof LESSON_PACK_DELIVERY_OPTIONS)[number];
export interface LessonPackPilotInput { readonly route?: unknown; readonly plan?: unknown; readonly utilization?: unknown; readonly nextFeature?: unknown; readonly budgetIntent?: unknown; readonly audience?: unknown; readonly lessonDuration?: unknown; readonly deliveryFormat?: unknown; readonly regionTopic?: unknown; readonly comment?: unknown; readonly [key: string]: unknown; }
export interface LessonPackPilot { readonly route: LessonPackPilotRoute; readonly plan?: LessonPackOfferPlan; readonly utilization: LessonPackUtilization; readonly nextFeature: LessonPackNextFeature; readonly budgetIntent?: LessonPackBudgetIntent; readonly audience?: LessonPackAudience; readonly lessonDuration?: LessonPackDuration; readonly deliveryFormat?: LessonPackDelivery; readonly regionTopic: string; readonly comment: string; }
export interface LessonPackPilotContext { readonly datasetSlug: string; readonly lessonId: string; readonly selectedStepCount: number; readonly includeTeacher: boolean; readonly observationFigure: boolean; readonly lastPrintScope: "student" | "teacher" | "full"; readonly language?: "ja" | "en"; }

const clean = (value: unknown, max: number): string => typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "";
const isOneOf = <T extends readonly string[]>(value: unknown, values: T): value is T[number] => typeof value === "string" && (values as readonly string[]).includes(value);

export function normalizeLessonPackPilot(input: LessonPackPilotInput): LessonPackPilot | null {
  if (!isOneOf(input.route, LESSON_PACK_PILOT_ROUTES) || !isOneOf(input.utilization, UTILIZATION_OPTIONS) || !isOneOf(input.nextFeature, NEXT_FEATURE_OPTIONS)) return null;
  const plan = input.route === "consult" ? (isOneOf(input.plan, LESSON_PACK_OFFER_PLANS) ? input.plan : DEFAULT_LESSON_PACK_OFFER_PLAN) : undefined;
  const budgetIntent = input.route === "consult" && isOneOf(input.budgetIntent, LESSON_PACK_BUDGET_INTENTS) ? input.budgetIntent : undefined;
  if (input.route === "consult" && !budgetIntent) return null;
  const audience = input.route === "consult" ? (isOneOf(input.audience, LESSON_PACK_AUDIENCE_OPTIONS) ? input.audience : "未定") : undefined;
  const lessonDuration = input.route === "consult" ? (isOneOf(input.lessonDuration, LESSON_PACK_DURATION_OPTIONS) ? input.lessonDuration : "未定") : undefined;
  const deliveryFormat = input.route === "consult" ? (isOneOf(input.deliveryFormat, LESSON_PACK_DELIVERY_OPTIONS) ? input.deliveryFormat : "相談で決めたい") : undefined;
  return Object.freeze({ route: input.route, ...(plan ? { plan } : {}), utilization: input.utilization, nextFeature: input.nextFeature, ...(budgetIntent ? { budgetIntent } : {}), ...(audience ? { audience } : {}), ...(lessonDuration ? { lessonDuration } : {}), ...(deliveryFormat ? { deliveryFormat } : {}), regionTopic: input.route === "consult" ? clean(input.regionTopic, 200) : "", comment: clean(input.comment, 500) });
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
const EN_BUDGET: Record<LessonPackBudgetIntent, string> = {
  "校費・組織予算で相談したい": "I want to discuss an institutional budget",
  "地域・内容・条件が合えば検討したい": "I would consider it if the region, content, and conditions fit",
  "まず無料試用を続けたい": "I want to continue the free trial first",
  "今回は検討しない": "I will not consider it this time",
};
const EN_PLAN: Record<LessonPackOfferPlan, string> = {
  "free-explore": "Free exploration",
  "classroom-pilot": "Classroom pilot",
  "custom-region": "Custom regional lesson production",
};
const EN_AUDIENCE: Record<LessonPackAudience, string> = {
  "小学校": "Elementary school",
  "中学校": "Middle school",
  "高校": "High school",
  "大学・社会人": "University / adult learning",
  "未定": "Not decided",
};
const EN_DURATION: Record<LessonPackDuration, string> = {
  "15分以内": "Up to 15 minutes",
  "45〜50分": "45–50 minutes",
  "複数時限": "Multiple class periods",
  "未定": "Not decided",
};
const EN_DELIVERY: Record<LessonPackDelivery, string> = {
  "印刷用PDF": "Print-ready PDF",
  "PDF＋QR・オンライン開始リンク": "PDF plus QR / online start link",
  "相談で決めたい": "Decide in consultation",
};

export function buildLessonPackPilotText(input: LessonPackPilotInput, context: LessonPackPilotContext): string | null {
  const value = normalizeLessonPackPilot(input);
  if (!value) return null;
  const en = context.language === "en";
  const scope = context.lastPrintScope === "student" ? (en ? "Student" : "生徒用") : context.lastPrintScope === "teacher" ? (en ? "Teacher" : "教員用") : (en ? "Full" : "全体");
  const deliverables = en
    ? ["student worksheet", "QR/start links", "sources/rights", ...(context.observationFigure ? ["observation figure"] : []), ...(context.includeTeacher ? ["teacher reference"] : [])].join(", ")
    : ["生徒用資料", "QR・開始リンク", "出典・権利", ...(context.observationFigure ? ["観察用概略図"] : []), ...(context.includeTeacher ? ["教員用資料"] : [])].join("、");
  const lines = en ? [
    value.route === "consult" ? "Chronomap regional lesson-pack consultation" : "Chronomap lesson-pack feedback",
    ...(value.plan ? [`Offer path: ${EN_PLAN[value.plan]}`] : []),
    `Utilization intention: ${EN_UTILIZATION[value.utilization]}`, `Next feature: ${EN_NEXT_FEATURE[value.nextFeature]}`,
    ...(value.budgetIntent ? [`Budget intention: ${EN_BUDGET[value.budgetIntent]}`] : []), ...(value.audience ? [`Audience: ${EN_AUDIENCE[value.audience]}`] : []), ...(value.lessonDuration ? [`Lesson duration: ${EN_DURATION[value.lessonDuration]}`] : []), ...(value.deliveryFormat ? [`Requested delivery: ${EN_DELIVERY[value.deliveryFormat]}`] : []), ...(value.regionTopic ? [`Preferred region or topic: ${value.regionTopic}`] : []), ...(value.comment ? [`Comment: ${value.comment}`] : []),
    ...(value.route === "consult" ? [`Requested deliverables: ${deliverables} (print scope: ${scope})`, "Consultation checklist: confirm regional scope, source curation, delivery format, schedule, and final quote."] : []),
    `Dataset slug: ${clean(context.datasetSlug, 120)}`, `Lesson ID: ${clean(context.lessonId, 120)}`, `Selected step count: ${safeCount(context.selectedStepCount)}`, `Observation figure: ${context.observationFigure ? "yes" : "no"}`, `Student material: yes`, `Teacher material: ${context.includeTeacher ? "yes" : "no"}`, "QR and sources/rights: included", `Last print scope: ${scope}`, "Language: en",
  ] : [
    value.route === "consult" ? "Chronomap 地域教材パックの相談" : "Chronomap 教材パックのフィードバック",
    ...(value.plan ? [`導入プラン: ${planLabelJa(value.plan)}`] : []),
    `利用意向: ${value.utilization}`, `次にほしい機能: ${value.nextFeature}`,
    ...(value.budgetIntent ? [`相談意向: ${value.budgetIntent}`] : []), ...(value.audience ? [`対象: ${value.audience}`] : []), ...(value.lessonDuration ? [`授業時間: ${value.lessonDuration}`] : []), ...(value.deliveryFormat ? [`希望納品: ${value.deliveryFormat}`] : []), ...(value.regionTopic ? [`希望地域・題材: ${value.regionTopic}`] : []), ...(value.comment ? [`コメント: ${value.comment}`] : []),
    ...(value.route === "consult" ? [`希望成果物: ${deliverables}（印刷範囲: ${scope}）`, "相談で確認する項目: 対象範囲、出典整理、納品形式、納期、最終見積。"] : []),
    `データセット: ${clean(context.datasetSlug, 120)}`, `教材ID: ${clean(context.lessonId, 120)}`, `選択ステップ数: ${safeCount(context.selectedStepCount)}`, `観察図: ${context.observationFigure ? "あり" : "なし"}`, "生徒用資料: あり", `教員用資料: ${context.includeTeacher ? "あり" : "なし"}`, "QR・出典権利: あり", `印刷範囲: ${scope}`, "言語: ja",
  ];
  return lines.join("\n");
}

function planLabelJa(plan: LessonPackOfferPlan): string {
  return { "free-explore": "無料で試す", "classroom-pilot": "授業パイロット", "custom-region": "地域教材の個別制作" }[plan];
}

export function buildSafeLessonPackPilotMailto(contact: string | null | undefined, subject: string, body: string): string | null {
  const safeContact = normalizeLessonPackPilotContact(contact);
  if (!safeContact) return null;
  return `${safeContact}?subject=${encodeURIComponent(clean(subject, 160))}&body=${encodeURIComponent(clean(body, 8000))}`;
}

/** Build a path-safe filename for the user-initiated local handoff download. */
export function buildLessonPackPilotDownloadFilename(datasetSlug: unknown, lessonId: unknown): string {
  return `chronomap-${safeFilenamePart(datasetSlug, "dataset")}-${safeFilenamePart(lessonId, "lesson")}-consultation.txt`;
}

export function normalizeLessonPackPilotContact(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const contact = value.trim();
  return /[%\r\n]/.test(contact) || !/^mailto:[^@\s?&#]+@[^@\s?&#]+$/i.test(contact) ? null : contact;
}

function safeCount(value: number): string { return Number.isFinite(value) && value >= 0 ? String(Math.floor(value)) : "0"; }

function safeFilenamePart(value: unknown, fallback: string): string {
  const normalized = clean(value, 80).normalize("NFKC").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(0, 60) || fallback;
}
