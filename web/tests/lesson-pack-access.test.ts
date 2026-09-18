import { describe, expect, it } from "vitest";
import { buildLessonPackAccessModel, normalizeLessonPackAccessUrl } from "../src/domain/lesson-pack-access";

const datasets = [
  {
    slug: "ogurike",
    startUrl: "https://chronomap.example/?dataset=ogurike&lesson=ogurike-intro&step=first",
    stepUrls: ["https://chronomap.example/?dataset=ogurike&step=first", "https://chronomap.example/?dataset=ogurike&step=second"],
  },
  {
    slug: "tonegawa",
    startUrl: "https://chronomap.example/?dataset=tonegawa&lesson=tonegawa-eastward&step=first",
    stepUrls: ["https://chronomap.example/?dataset=tonegawa&step=first"],
  },
  {
    slug: "heijokyo",
    startUrl: "https://chronomap.example/?dataset=heijokyo&lesson=heijokyo-intro&step=first",
    stepUrls: ["https://chronomap.example/?dataset=heijokyo&step=first", "https://chronomap.example/?dataset=heijokyo&step=second"],
  },
] as const;

describe("lesson pack access URLs", () => {
  it.each(datasets)("keeps the exact $slug start URL and step URLs for QR/fallback output", ({ startUrl, stepUrls }) => {
    const model = buildLessonPackAccessModel(startUrl, stepUrls);
    expect(model.start.qrPayload).toBe(startUrl);
    expect(model.start.href).toBe(startUrl);
    expect(model.start.displayText).toBe(startUrl);
    expect(model.steps.map((step) => step.qrPayload)).toEqual(stepUrls);
    expect(model.steps.map((step) => step.href)).toEqual(stepUrls);
  });

  it("allows only absolute HTTP(S) URLs and fails closed without throwing", () => {
    const invalid = ["", "   ", "javascript:alert(1)", "data:text/html,<b>bad</b>", "/relative/path", "not a URL", "<img src=x onerror=alert(1)>"];
    for (const value of invalid) {
      expect(() => normalizeLessonPackAccessUrl(value)).not.toThrow();
      const result = normalizeLessonPackAccessUrl(value);
      expect(result.href).toBeNull();
      expect(result.qrPayload).toBeNull();
      expect(result.displayText).toBe("URLを利用できません");
      expect(result.displayText).not.toContain("<");
    }
  });

  it("ignores non-string and malformed step values while retaining safe fallback models", () => {
    const model = buildLessonPackAccessModel(null, ["https://example.test/ok", null, "ftp://example.test/no"]);
    expect(model.start.qrPayload).toBeNull();
    expect(model.start.href).toBeNull();
    expect(model.steps).toHaveLength(3);
    expect(model.steps[0]?.href).toBe("https://example.test/ok");
    expect(model.steps[1]?.href).toBeNull();
    expect(model.steps[2]?.href).toBeNull();
  });

  it("uses a caller-provided localized fallback without echoing unsafe URL text", () => {
    const model = buildLessonPackAccessModel("javascript:alert(1)", ["<img src=x>"], "URL unavailable.");
    expect(model.start.displayText).toBe("URL unavailable.");
    expect(model.steps[0]?.displayText).toBe("URL unavailable.");
    expect(model.start.displayText).not.toContain("alert");
  });
});
