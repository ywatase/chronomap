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
const lesson: Lesson = { id: "intro", dataset: "dataset", title: { ja: "教材" }, description: { ja: "教材の説明" }, durationMinutes: 10, steps: [{ id: "first", year: 1590, featureId: "first", prompt: { ja: "問い" }, teacherNote: { ja: "形状の向きを確認します。" } }, { id: "second", year: 1596, featureId: "second", prompt: { ja: "問い2" } }] };

describe("lesson pack preview", () => {
  it("renders student, teacher, and sources pages without source body text", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, model, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelector("[data-lesson-pack-student]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-teacher]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-sources]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-figure-page]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-figure] svg")).toBeTruthy();
    expect(root.querySelectorAll("[data-lesson-pack-figure-legend-step]")).toHaveLength(2);
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

  it("offers a consultation shortcut only when a paid path is active", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const freeRoot = document.createElement("div");
    renderLessonPack(freeRoot, model, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(freeRoot.querySelector("[data-lesson-pack-consult]")).toBeNull();

    const paidRoot = document.createElement("div");
    const onConsult = vi.fn();
    renderLessonPack(paidRoot, model, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn(), onConsult, initialPilotPlan: "classroom-pilot" });
    const consult = paidRoot.querySelector<HTMLButtonElement>("[data-lesson-pack-consult]")!;
    expect(consult.textContent).toContain("相談文を作る");
    consult.click();
    expect(onConsult).toHaveBeenCalledOnce();
  });

  it("offers strict student, teacher, and full print scopes while keeping teacher scope conditional", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    const onPrint = vi.fn();
    renderLessonPack(root, model, uiCopy("ja"), { onClose: vi.fn(), onPrint });
    expect(root.querySelector("[data-lesson-pack-print-student]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-print-teacher]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-print-full]")).toBeTruthy();
    expect(root.querySelector("[data-lesson-pack-print-warning]")?.textContent).toContain("教員の読み取り例を含めません");
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-print-student]")!.click();
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-print-teacher]")!.click();
    root.querySelector<HTMLButtonElement>("[data-lesson-pack-print-full]")!.click();
    expect(onPrint.mock.calls.map(([scope]) => scope)).toEqual(["student", "teacher", "full"]);

    const withoutTeacher = document.createElement("div");
    renderLessonPack(withoutTeacher, { ...model, includeTeacher: false }, uiCopy("en"), { onClose: vi.fn(), onPrint });
    expect(withoutTeacher.querySelector("[data-lesson-pack-print-teacher]")).toBeNull();
    expect(withoutTeacher.querySelector("[data-lesson-pack-print-student]")).toBeTruthy();
    expect(withoutTeacher.querySelector("[data-lesson-pack-print-full]")).toBeTruthy();
    expect(withoutTeacher.querySelector("[data-lesson-pack-print-warning]")?.textContent).toContain("excludes teacher reading examples");
  });

  it("shows the edited class label and can omit teacher references", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, { ...model, title: "地域の水辺を読む", classLabel: "中学2年A組", includeTeacher: false }, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelector("[data-lesson-pack-class-label]")?.textContent).toContain("中学2年A組");
    expect(root.textContent).toContain("地域の水辺を読む");
    expect(root.querySelector("[data-lesson-pack-teacher]")).toBeNull();
    expect(root.textContent).not.toContain("形状の向きを確認します。");
  });

  it("keeps the teaching design memo on teacher/full output and out of student output", () => {
    const base = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const modelWithGuide = {
      ...base,
      teachingGuide: {
        recommendedFor: "地域史の導入に",
        learningGoal: "変化を説明する。",
        preparation: ["ワークシート", "筆記具"],
        assessment: "根拠を示せるか。",
        usageNote: "問いを調整する。",
      },
    };
    const root = document.createElement("div");
    renderLessonPack(root, modelWithGuide, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelectorAll("[data-lesson-pack-teaching-guide]")).toHaveLength(1);
    expect(root.querySelector("[data-lesson-pack-teacher] [data-lesson-pack-teaching-guide]")?.textContent).toContain("授業設計メモ");
    expect(root.querySelector("[data-lesson-pack-teacher]")?.textContent).toContain("見取りの例: 根拠を示せるか。");
    expect(root.querySelector("[data-lesson-pack-student]")?.textContent).not.toContain("授業設計メモ");

    const studentOnly = document.createElement("div");
    renderLessonPack(studentOnly, { ...modelWithGuide, includeTeacher: false }, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(studentOnly.querySelector("[data-lesson-pack-teaching-guide]")).toBeNull();
    expect(studentOnly.textContent).not.toContain("授業設計メモ");
  });

  it("keeps the observation figure synchronized with selected steps and fails closed without geometry", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, { ...model, steps: [model.steps[1]!], startUrl: model.steps[1]!.shareUrl }, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelectorAll("[data-lesson-pack-figure-legend-step]")).toHaveLength(1);
    expect(root.querySelector("[data-lesson-pack-figure-legend-step]")?.textContent).toContain("1596");
    expect(root.querySelector("[data-lesson-pack-figure-legend-step]")?.textContent).not.toContain("1590");

    const fallbackRoot = document.createElement("div");
    renderLessonPack(fallbackRoot, { ...model, steps: model.steps.map((step) => ({ ...step, featureGeometry: undefined })) }, uiCopy("en"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(fallbackRoot.querySelector("[data-lesson-pack-figure-fallback]")).toBeTruthy();
    expect(fallbackRoot.querySelector("[data-lesson-pack-figure] svg")).toBeNull();
    expect(fallbackRoot.querySelector("[data-lesson-pack-student]")).toBeTruthy();
  });

  it("renders each reading example after its prompt on the teacher page only", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, model, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    const teacher = root.querySelector<HTMLElement>("[data-lesson-pack-teacher]")!;
    const firstStep = teacher.querySelector<HTMLElement>(".lesson-pack-step")!;
    expect(firstStep.textContent).toContain("観察する問い: 問い");
    expect(firstStep.querySelector("[data-lesson-pack-reading-example]")?.textContent).toContain("読み取り例（唯一の正答ではありません）");
    expect(firstStep.querySelector("[data-lesson-pack-reading-example]")?.textContent).toContain("形状の向きを確認します。");
    expect(firstStep.querySelector(".lesson-pack-prompt")?.compareDocumentPosition(firstStep.querySelector("[data-lesson-pack-reading-example]")!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(root.querySelector("[data-lesson-pack-student]")?.textContent).not.toContain("形状の向きを確認します。");

    const englishRoot = document.createElement("div");
    renderLessonPack(englishRoot, model, uiCopy("en"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(englishRoot.querySelector("[data-lesson-pack-reading-example]")?.textContent).toContain("Reading example (not the only correct answer)");
  });

  it("does not invent a class label when the optional field is blank", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, { ...model, classLabel: "" }, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelector("[data-lesson-pack-class-label]")).toBeNull();
  });

  it("renders one start QR, keeps the exact URL fallback, and shortens step link labels", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, model, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    const student = root.querySelector<HTMLElement>("[data-lesson-pack-student]")!;
    expect(root.querySelectorAll("[data-lesson-pack-qr]")).toHaveLength(1);
    expect(root.querySelector<SVGSVGElement>("[data-lesson-pack-qr]")?.getAttribute("aria-label")).toBe("ガイド教材を開くQRコード");
    expect(student.querySelector<HTMLAnchorElement>("[data-lesson-pack-start-url]")?.href).toBe(model.startUrl);
    expect(student.querySelector<HTMLAnchorElement>("[data-lesson-pack-start-url]")?.textContent).toBe(model.startUrl);
    expect(student.querySelectorAll<HTMLAnchorElement>("[data-lesson-pack-step-link]")).toHaveLength(model.steps.length);
    for (const [index, link] of [...student.querySelectorAll<HTMLAnchorElement>("[data-lesson-pack-step-link]")].entries()) {
      expect(link.textContent).toBe("このステップをオンラインで開く");
      expect(link.href).toBe(model.steps[index]?.shareUrl);
    }
  });

  it("fails closed for an unsafe start URL with a localized plain-text fallback", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    renderLessonPack(root, { ...model, startUrl: "javascript:alert(1)" }, uiCopy("en"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.querySelectorAll("[data-lesson-pack-qr]")).toHaveLength(0);
    expect(root.textContent).toContain("QR code unavailable");
    expect(root.textContent).toContain("URL unavailable.");
    expect(root.textContent).not.toContain("javascript:alert(1)");
  });

  it("fails closed for an unsafe step URL without putting it in an href or text node", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    const steps = model.steps.map((step, index) => index === 0 ? { ...step, shareUrl: "javascript:alert(1)" } : step);
    renderLessonPack(root, { ...model, steps }, uiCopy("ja"), { onClose: vi.fn(), onPrint: vi.fn() });
    const links = root.querySelectorAll<HTMLAnchorElement>("[data-lesson-pack-step-link]");
    expect(links).toHaveLength(model.steps.length - 1);
    expect(root.textContent).not.toContain("javascript:alert(1)");
    expect(root.textContent).toContain("URLを利用できません");
  });

  it("uses the English fallback copy for an unsafe step URL", () => {
    const model = buildLessonPackModel(lesson, bundle, "https://example.test/")!;
    const root = document.createElement("div");
    const steps = model.steps.map((step, index) => index === 0 ? { ...step, shareUrl: "javascript:alert(1)" } : step);
    renderLessonPack(root, { ...model, steps }, uiCopy("en"), { onClose: vi.fn(), onPrint: vi.fn() });
    expect(root.textContent).toContain("Open this step online: URL unavailable.");
    expect(root.textContent).not.toContain("javascript:alert(1)");
    expect(root.textContent).not.toContain("URLを利用できません");
  });
});
