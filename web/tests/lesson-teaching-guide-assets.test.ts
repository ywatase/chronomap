import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const lessonFiles = [
  "ogurike-intro.json",
  "ogurike-river-compare.json",
  "tonegawa-eastward.json",
  "heijokyo-intro.json",
] as const;

const guideKeys = ["recommendedFor", "learningGoal", "preparation", "assessment"] as const;

describe("public lesson teaching guides", () => {
  it("ships a bounded bilingual guide for every allow-listed lesson", async () => {
    for (const file of lessonFiles) {
      const lesson = JSON.parse(await readFile(join("public", "lessons", file), "utf8")) as Record<string, unknown>;
      const guide = lesson.teachingGuide as Record<string, unknown> | undefined;
      expect(guide, file).toBeTruthy();
      for (const key of guideKeys) expect(guide?.[key], `${file}:${key}`).toBeTruthy();
      const preparation = Array.isArray(guide?.preparation) ? guide.preparation : [];
      expect(Array.isArray(guide?.preparation)).toBe(true);
      expect(preparation.length).toBeGreaterThan(0);
      expect(preparation.length).toBeLessThanOrEqual(5);
      for (const field of ["recommendedFor", "learningGoal", "assessment", "usageNote"] as const) {
        const value = guide?.[field];
        if (value === undefined) continue;
        expect(value).toMatchObject({ ja: expect.any(String), en: expect.any(String) });
      }
      expect(JSON.stringify(guide)).not.toMatch(/学習指導要領|curriculum\s+compliance|official\s+curriculum/i);
    }
  });
});
