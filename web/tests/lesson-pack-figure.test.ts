// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { FeatureVersion, GeometryType } from "../src/domain/types";
import { MAX_LESSON_PACK_FIGURE_VERTICES, projectLessonPackFigureModel } from "../src/domain/lesson-pack-figure";
import { renderLessonPackFigure, type LessonPackFigureLabels } from "../src/ui/lesson-pack-figure";

const labels: LessonPackFigureLabels = {
  language: "ja",
  title: "観察用概略図",
  description: "選択した地物の位置関係を示す概略図です。",
  fallback: "概略図を表示できません。教材の文章と地図を参照してください。",
  legendPoint: "点",
  legendLine: "線",
  legendPolygon: "面",
};

function feature(id: string, type: GeometryType, coordinates: unknown): FeatureVersion {
  return {
    type: "Feature",
    id,
    geometry: { type, coordinates: coordinates as readonly unknown[] },
    properties: {
      entityId: `entity:${id}`,
      labels: { ja: id, en: id },
      description: { ja: `${id}の説明`, en: `${id} description` },
      temporal: { start: null, end: null },
      uncertainty: {
        temporal: { assessment: "unknown", note: "", evidenceIds: [] },
        location: { assessment: "unknown", note: "", evidenceIds: [] },
        geometry: { assessment: "unknown", note: "", evidenceIds: [] },
        identity: { assessment: "unknown", note: "", evidenceIds: [] },
      },
      evidenceIds: [],
      publicationStatus: "public",
      rights: { status: "public-domain" },
    },
  };
}

describe("lesson-pack figure projection", () => {
  it("projects every supported geometry, preserves polygon holes, and inverts y", () => {
    const model = projectLessonPackFigureModel({
      features: [
        feature("point", "Point", [10, 20]),
        feature("multipoint", "MultiPoint", [[0, 0], [20, 20]]),
        feature("line", "LineString", [[0, 20], [20, 0]]),
        feature("multiline", "MultiLineString", [[[0, 0], [20, 20]], [[0, 20], [20, 0]]]),
        feature("polygon", "Polygon", [[[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]], [[5, 5], [5, 10], [10, 10], [5, 5]]]),
        feature("multipolygon", "MultiPolygon", [
          [[[0, 0], [4, 0], [4, 4], [0, 0]]],
          [[[10, 10], [20, 10], [20, 20], [10, 10]]],
        ]),
      ],
    });

    expect(model).not.toBeNull();
    expect(model?.bbox).toEqual([0, 0, 20, 20]);
    expect(model?.viewBox).toEqual([0, 0, 100, 100]);
    expect(model?.yAxis).toBe("down");
    expect(model?.features.map((item) => item.id)).toEqual(["point", "multipoint", "line", "multiline", "polygon", "multipolygon"]);
    expect(model?.features.find((item) => item.id === "polygon")?.geometry).toMatchObject({ kind: "polygon", polygons: [{ rings: [{}, {}] }] });
    expect(model?.features.find((item) => item.id === "multipolygon")?.geometry).toMatchObject({ kind: "polygon", polygons: [{}, {}] });
    const line = model?.features.find((item) => item.id === "line");
    expect(line?.geometry.kind).toBe("line");
    if (line?.geometry.kind === "line") expect(line.geometry.paths[0]?.[0]?.y).toBe(8);
    const multipoint = model?.features.find((item) => item.id === "multipoint");
    if (multipoint?.geometry.kind === "point") expect(multipoint.geometry.points[0]?.y).toBe(92);
  });

  it("filters selected lesson feature ids in selected order", () => {
    const model = projectLessonPackFigureModel({
      features: [feature("first", "Point", [0, 0]), feature("second", "Point", [1, 1]), feature("third", "Point", [2, 2])],
      selectedFeatureIds: ["third", "first", "third", "missing"],
    });
    expect(model?.features.map((item) => item.id)).toEqual(["third", "first"]);
  });

  it("preserves optional lesson metadata for a step-aware legend", () => {
    const model = projectLessonPackFigureModel({
      features: [feature("second", "Point", [1, 1])],
      steps: [{ featureId: "second", stepNumber: 2, yearLabel: "710年", label: "平城宮" }],
    });
    expect(model?.features[0]).toMatchObject({ stepNumber: 2, yearLabel: "710年", label: "平城宮" });
  });

  it("fails closed for non-finite coordinates, malformed geometry, and vertex bounds", () => {
    expect(projectLessonPackFigureModel({ features: [feature("nan", "Point", [Number.NaN, 1])] })).toBeNull();
    expect(projectLessonPackFigureModel({ features: [feature("infinite", "LineString", [[0, 0], [Number.POSITIVE_INFINITY, 1]])] })).toBeNull();
    expect(projectLessonPackFigureModel({ features: [feature("short", "LineString", [[0, 0]])] })).toBeNull();
    expect(projectLessonPackFigureModel({
      features: [feature("unselected-invalid", "Point", [Number.NaN, 1]), feature("valid", "Point", [0, 0])],
      selectedFeatureIds: ["valid"],
    })).not.toBeNull();
    const tooMany = Array.from({ length: MAX_LESSON_PACK_FIGURE_VERTICES + 1 }, (_, index) => [index, index]);
    expect(projectLessonPackFigureModel({ features: [feature("too-many", "LineString", tooMany)] })).toBeNull();
  });
});

describe("lesson-pack figure SVG renderer", () => {
  it("renders an accessible inline SVG with safe geometry and a localized legend", () => {
    const model = projectLessonPackFigureModel({
      features: [
        feature("point", "Point", [0, 0]),
        feature("line", "LineString", [[0, 0], [2, 2]]),
        feature("polygon", "Polygon", [[[0, 0], [2, 0], [2, 2], [0, 0]], [[.5, .5], [1, .5], [1, 1], [.5, .5]]]),
      ],
    });
    const figure = renderLessonPackFigure(model, labels);
    const svg = figure.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-labelledby")).toBeTruthy();
    expect(svg?.getAttribute("aria-describedby")).toBeTruthy();
    expect(svg?.querySelector("title")?.textContent).toBe(labels.title);
    expect(svg?.querySelector("desc")?.textContent).toBe(labels.description);
    expect(figure.querySelectorAll("[data-lesson-pack-figure-legend-item]")).toHaveLength(3);
    expect(figure.textContent).toContain("点");
    expect(figure.textContent).toContain("線");
    expect(figure.textContent).toContain("面");
    expect(svg?.querySelector('[data-geometry-kind="polygon"] path')?.getAttribute("fill-rule")).toBe("evenodd");
    const markup = figure.outerHTML;
    expect(markup).not.toMatch(/<script|foreignObject|javascript:|https?:\/\//i);
    expect(markup).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it("renders a localized fallback instead of unsafe or invalid SVG", () => {
    const figure = renderLessonPackFigure(null, labels);
    expect(figure.querySelector("svg")).toBeNull();
    expect(figure.querySelector("[data-lesson-pack-figure-fallback]")?.textContent).toBe(labels.fallback);
    expect(figure.getAttribute("role")).toBe("figure");
  });
});
