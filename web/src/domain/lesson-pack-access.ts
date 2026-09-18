import type { LessonPackModel } from "./lesson-pack-model";

export const DEFAULT_INVALID_ACCESS_URL_TEXT = "URLを利用できません";

export interface LessonPackAccessUrlModel {
  /** Original URL only when it is an absolute HTTP(S) URL. */
  readonly href: string | null;
  /** Exact href payload for the local QR encoder, or null when unsafe. */
  readonly qrPayload: string | null;
  /** Plain-text fallback shown when href/QR are unavailable. */
  readonly displayText: string;
  readonly isSafe: boolean;
}

export interface LessonPackAccessModel {
  readonly start: LessonPackAccessUrlModel;
  readonly steps: readonly LessonPackAccessUrlModel[];
}

/**
 * Validate one lesson-pack URL. Parsing is deliberately fail-closed and never
 * returns a caller-controlled string for an invalid URL.
 */
export function normalizeLessonPackAccessUrl(value: unknown, fallbackText = DEFAULT_INVALID_ACCESS_URL_TEXT): LessonPackAccessUrlModel {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) return invalidUrl(fallbackText);
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return invalidUrl(fallbackText);
    return Object.freeze({ href: value, qrPayload: value, displayText: value, isSafe: true });
  } catch {
    return invalidUrl(fallbackText);
  }
}

/** Build safe access models for the pack's single start URL and step links. */
export function buildLessonPackAccessModel(startUrl: unknown, stepUrls: readonly unknown[] = [], fallbackText = DEFAULT_INVALID_ACCESS_URL_TEXT): LessonPackAccessModel {
  const steps = Array.isArray(stepUrls) ? stepUrls.map((url) => normalizeLessonPackAccessUrl(url, fallbackText)) : [];
  return Object.freeze({ start: normalizeLessonPackAccessUrl(startUrl, fallbackText), steps: Object.freeze(steps) });
}

/** Convenience projection from an existing print model; it carries no extra metadata. */
export function projectLessonPackAccess(model: Pick<LessonPackModel, "startUrl" | "steps">): LessonPackAccessModel {
  return buildLessonPackAccessModel(model.startUrl, model.steps.map((step) => step.shareUrl));
}

function invalidUrl(fallbackText: string): LessonPackAccessUrlModel {
  const safeFallback = typeof fallbackText === "string" && fallbackText.length > 0 ? fallbackText : DEFAULT_INVALID_ACCESS_URL_TEXT;
  return Object.freeze({ href: null, qrPayload: null, displayText: safeFallback, isSafe: false });
}
