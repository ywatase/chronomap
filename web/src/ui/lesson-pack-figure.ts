import type { LessonPackFigureFeature, LessonPackFigureGeometry, LessonPackFigureModel, LessonPackFigurePoint, LessonPackFigurePolygon } from "../domain/lesson-pack-figure";

const SVG_NS = "http://www.w3.org/2000/svg";
let figureSequence = 0;

export interface LessonPackFigureLabels {
  readonly language: "ja" | "en";
  readonly title: string;
  readonly caption?: string;
  readonly description: string;
  readonly fallback: string;
  readonly legendPoint: string;
  readonly legendLine: string;
  readonly legendPolygon: string;
}

/** Render a validated figure as local DOM/SVG, or a text fallback when invalid. */
export function renderLessonPackFigure(model: LessonPackFigureModel | null, labels: LessonPackFigureLabels): HTMLElement {
  const figure = document.createElement("figure");
  figure.className = "lesson-pack-figure";
  figure.dataset.lessonPackFigure = "";
  figure.setAttribute("role", "figure");
  if (!isRenderableFigureModel(model)) {
    const fallback = document.createElement("p");
    fallback.className = "lesson-pack-figure-fallback";
    fallback.dataset.lessonPackFigureFallback = "";
    fallback.setAttribute("role", "status");
    fallback.textContent = labels.fallback;
    figure.append(fallback);
    return figure;
  }

  const sequence = ++figureSequence;
  const titleId = `lesson-pack-figure-title-${sequence}`;
  const descriptionId = `lesson-pack-figure-description-${sequence}`;
  const caption = document.createElement("figcaption");
  caption.dataset.lessonPackFigureCaption = "";
  caption.textContent = labels.caption ?? labels.title;
  const svg = svgElement("svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("viewBox", model.viewBox.join(" "));
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-labelledby", titleId);
  svg.setAttribute("aria-describedby", descriptionId);
  const title = svgElement("title");
  title.id = titleId;
  title.textContent = labels.title;
  const description = svgElement("desc");
  description.id = descriptionId;
  description.textContent = labels.description;
  svg.append(title, description);
  for (const feature of model.features) svg.append(renderFeature(feature, labels));
  figure.append(caption, svg, renderLegend(model.features, labels));
  return figure;
}

function renderFeature(feature: LessonPackFigureFeature, labels: LessonPackFigureLabels): SVGElement {
  const group = svgElement("g");
  group.dataset.featureId = feature.id;
  group.dataset.geometryKind = feature.geometry.kind;
  const featureLabel = featureLabelText(feature, labels.language);
  if (featureLabel) group.setAttribute("aria-label", featureLabel);
  if (feature.geometry.kind === "point") {
    for (const point of feature.geometry.points) {
      const circle = svgElement("circle");
      circle.setAttribute("cx", String(point.x));
      circle.setAttribute("cy", String(point.y));
      circle.setAttribute("r", "2.25");
      circle.setAttribute("fill", "#155e8a");
      circle.setAttribute("stroke", "#fff");
      circle.setAttribute("stroke-width", "0.8");
      group.append(circle);
    }
  } else if (feature.geometry.kind === "line") {
    for (const path of feature.geometry.paths) {
      const line = svgElement("path");
      line.setAttribute("d", linePath(path));
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "#155e8a");
      line.setAttribute("stroke-width", "1.25");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-linejoin", "round");
      line.setAttribute("stroke-dasharray", "5 2");
      group.append(line);
    }
  } else {
    for (const polygon of feature.geometry.polygons) {
      const area = svgElement("path");
      area.setAttribute("d", polygonPath(polygon.rings));
      area.setAttribute("fill", "#9bb3c2");
      area.setAttribute("fill-opacity", "0.65");
      area.setAttribute("fill-rule", "evenodd");
      area.setAttribute("stroke", "#155e8a");
      area.setAttribute("stroke-width", "0.85");
      area.setAttribute("stroke-linejoin", "round");
      group.append(area);
    }
  }
  return group;
}

function renderLegend(features: readonly LessonPackFigureFeature[], labels: LessonPackFigureLabels): HTMLElement {
  const list = document.createElement("ul");
  list.className = "lesson-pack-figure-legend";
  list.dataset.lessonPackFigureLegend = "";
  const kinds = new Set(features.map((feature) => feature.geometry.kind));
  const items: readonly [string, string][] = [
    ["point", labels.legendPoint],
    ["line", labels.legendLine],
    ["polygon", labels.legendPolygon],
  ];
  for (const [kind, text] of items) {
    if (!kinds.has(kind as LessonPackFigureGeometry["kind"])) continue;
    const item = document.createElement("li");
    item.dataset.lessonPackFigureLegendItem = "";
    item.dataset.geometryKind = kind;
    const symbol = document.createElement("span");
    symbol.className = `lesson-pack-figure-legend-symbol lesson-pack-figure-legend-${kind}`;
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = kind === "point" ? "●" : kind === "line" ? "—" : "▱";
    item.append(symbol, document.createTextNode(text));
    list.append(item);
  }
  for (const [index, feature] of features.entries()) {
    const item = document.createElement("li");
    item.dataset.lessonPackFigureLegendStep = "";
    item.dataset.featureId = feature.id;
    const label = featureLabelText(feature, labels.language) || feature.id;
    item.textContent = stepLegendText(feature, label, index + 1);
    list.append(item);
  }
  return list;
}

function featureLabelText(feature: LessonPackFigureFeature, language: "ja" | "en"): string {
  if (feature.label) return feature.label;
  return feature.labels[language] ?? Object.values(feature.labels)[0] ?? "";
}

function stepLegendText(feature: LessonPackFigureFeature, label: string, fallbackNumber: number): string {
  const number = feature.stepNumber ?? fallbackNumber;
  return `${number}. ${feature.yearLabel ? `${feature.yearLabel} — ` : ""}${label}`;
}

function linePath(points: readonly LessonPackFigurePoint[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function polygonPath(rings: readonly (readonly LessonPackFigurePoint[])[]): string {
  return rings.map((ring) => `${linePath(ring)} Z`).join(" ");
}

function svgElement<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

function isRenderableFigureModel(model: LessonPackFigureModel | null): model is LessonPackFigureModel {
  if (!model || !Array.isArray(model.viewBox) || model.viewBox.length !== 4 || !Array.isArray(model.features) || model.features.length === 0) return false;
  if (model.viewBox.some((value) => typeof value !== "number" || !Number.isFinite(value))) return false;
  if (model.yAxis !== "down" || !Number.isFinite(model.aspectRatio) || !Number.isFinite(model.sourceAspectRatio)) return false;
  return model.features.every((feature) => {
    if (!feature || typeof feature.id !== "string" || !feature.geometry || typeof feature.geometry !== "object") return false;
    if (feature.geometry.kind === "point") return feature.geometry.points.length > 0 && feature.geometry.points.every(isFinitePoint);
    if (feature.geometry.kind === "line") return feature.geometry.paths.length > 0 && feature.geometry.paths.every((path: readonly LessonPackFigurePoint[]) => path.length >= 2 && path.every(isFinitePoint));
    if (feature.geometry.kind === "polygon") return feature.geometry.polygons.length > 0 && feature.geometry.polygons.every((polygon: LessonPackFigurePolygon) => polygon.rings.length > 0 && polygon.rings.every((ring: readonly LessonPackFigurePoint[]) => ring.length >= 3 && ring.every(isFinitePoint)));
    return false;
  });
}

function isFinitePoint(point: LessonPackFigurePoint): boolean {
  return Boolean(point) && Number.isFinite(point.x) && Number.isFinite(point.y);
}
