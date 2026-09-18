import { describe, expect, it } from "vitest";
import { selectAllowedLesson } from "../src/domain/lesson-selection";
import type { Lesson } from "../src/domain/lesson";
import { DATASET_CATALOG } from "../src/domain/dataset-catalog";

const intro: Lesson = {
  id: "ogurike-intro",
  dataset: "ogurike",
  title: { en: "Intro" },
  description: { en: "Intro" },
  durationMinutes: 15,
  steps: [{ id: "first", year: 1590, featureId: "feature", prompt: { en: "Observe" } }],
};

describe("lesson selection", () => {
  it("resolves only a requested lesson registered for the selected dataset", () => {
    const entry = DATASET_CATALOG.find((candidate) => candidate.slug === "ogurike")!;
    const lessons = { "ogurike-intro": intro, "ogurike-river-compare": null };
    expect(selectAllowedLesson(entry, lessons, "ogurike-intro")).toBe(intro);
    expect(selectAllowedLesson(entry, lessons, "ogurike-river-compare")).toBeNull();
    expect(selectAllowedLesson(entry, lessons, "tonegawa-eastward")).toBeNull();
    expect(selectAllowedLesson(entry, lessons, undefined)).toBeNull();
  });
});
