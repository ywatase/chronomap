// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { buildLessonPackModel } from "../src/domain/lesson-pack-model";
import { renderLessonPack } from "../src/ui/lesson-pack";
import { uiCopy } from "../src/ui/copy";
import type { Lesson } from "../src/domain/lesson";
import type { PublicBundle } from "../src/domain/types";

const feature = (id: string, year: number) => ({
  type: "Feature" as const, id, geometry: { type: "Point" as const, coordinates: [0, 0] },
  properties: {
    entityId: "entity", labels: { ja: `地物${year}` }, description: { ja: `説明${year}` }, publicationStatus: "public" as const,
    temporal: { start: { earliestYear: year, latestYear: year, precision: "year" as const, qualifier: "exact" as const }, end: { earliestYear: year, latestYear: year, precision: "year" as const, qualifier: "exact" as const } },
    uncertainty: { temporal: { assessment: "unknown" as const, note: "", evidenceIds: ["evidence"] }, location: { assessment: "unknown" as const, note: "", evidenceIds: ["evidence"] }, geometry: { assessment: "unknown" as const, note: "", evidenceIds: ["evidence"] }, identity: { assessment: "unknown" as const, note: "", evidenceIds: ["evidence"] } },
    evidenceIds: ["evidence"], rights: { status: "public-domain" as const },
  },
});

const bundle = {
  dataset: { id: "dataset", schemaVersion: "1.0.0", title: { ja: "データ" }, description: { ja: "説明" }, defaultLanguage: "ja", bbox: [0, 0, 1, 1], temporalExtent: { start: { earliestYear: 1590, latestYear: 1590, precision: "year", qualifier: "exact" }, end: { earliestYear: 1596, latestYear: 1596, precision: "year", qualifier: "exact" } }, rights: { status: "public-domain" }, files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" } },
  entitiesById: { entity: { id: "entity", type: "place", labels: { ja: "対象" }, description: { ja: "対象の説明" } } },
  sourcesById: { source: { id: "source", type: "reference", citation: "出典", title: { ja: "資料" }, creators: ["作者"], publishedYear: 2020, url: "https://example.test/source", accessedDate: "2026-09-18", rights: { status: "public-domain" } } },
  evidenceById: { evidence: { id: "evidence", sourceId: "source", locator: "p.1", usage: "citation", supports: ["location"], note: "注記" } },
  features: [feature("first", 1590), feature("second", 1596)],
} as unknown as PublicBundle;
const lesson: Lesson = { id: "intro", dataset: "dataset", title: { ja: "教材" }, description: { ja: "教材の説明" }, durationMinutes: 10, steps: [{ id: "first", year: 1590, featureId: "first", prompt: { ja: "問い" } }, { id: "second", year: 1596, featureId: "second", prompt: { ja: "問い2" } }] };

describe("lesson pack preview", () => {
  it("renders student, teacher, and sources pages without source body text", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, model, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelector("[data-lesson-pack-student]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-teacher]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-sources]")).toBeTruthy();
    expect(root.textContent).toContain("β版では無料");
    expect(root.textContent).toContain("p.1");
    expect(root.textContent).not.toContain("source body");
  });

  it("calls print and close actions from the toolbar", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    const onClose = vi.fn(); const onPrint = vi.fn();
    renderLessonPack(root, model, uiCopy("ja"), { onClose, onPrint });
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-print]")!.click();
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-close]")!.click();
    expect(onPrint).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the edited class label and can omit teacher references", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, { ...model, title: "地域の水辺を読む", classLabel: "中学2年A組", includeTeacher: false }, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelector("[data-lesson-pack-class-label]")?.textContent).toContain("中学2年A組");
    expect(root.textContent).toContain("地域の水辺を読む");
    expect(root.querySelector("[data-lesson-pack-teacher]")).toBeNull();
  });

  it("does not invent a class label when the optional field is blank", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, { ...model, classLabel: "" }, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelector("[data-lesson-pack-class-label]")).toBeNull();
  });
});
