import type { FeatureVersion, GeometryType, LocalizedText } from "./types";

/** Hard limits keep an accidentally huge public geometry out of a print DOM. */
export const MAX_LESSON_PACK_FIGURE_VERTICES = 5_000;
export const LESSON_PACK_FIGURE_VIEWBOX_SIZE = 100;
export const LESSON_PACK_FIGURE_PADDING = 8;

export interface LessonPackFigurePoint {
  readonly x: number;
  readonly y: number;
}

export interface LessonPackFigurePolygon {
  readonly rings: readonly (readonly LessonPackFigurePoint[])[];
}

export type LessonPackFigureGeometry =
  | { readonly kind: "point"; readonly points: readonly LessonPackFigurePoint[] }
  | { readonly kind: "line"; readonly paths: readonly (readonly LessonPackFigurePoint[])[] }
  | { readonly kind: "polygon"; readonly polygons: readonly LessonPackFigurePolygon[] };

export interface LessonPackFigureFeature {
  readonly id: string;
  readonly geometryType: GeometryType;
  readonly labels: LocalizedText;
  readonly label?: string;
  readonly yearLabel?: string;
  readonly stepNumber?: number;
  readonly geometry: LessonPackFigureGeometry;
}

export interface LessonPackFigureStepReference {
  readonly featureId: string;
  readonly label?: string;
  readonly yearLabel?: string;
  readonly stepNumber?: number;
}

export interface LessonPackFigureProjectionInput {
  readonly features: readonly FeatureVersion[];
  /** Feature IDs in the already-customized lesson step order. */
  readonly selectedFeatureIds?: readonly string[];
  /** Optional lesson-step references; takes precedence over selectedFeatureIds. */
  readonly steps?: readonly LessonPackFigureStepReference[];
  /** Metadata can be supplied independently when the selected IDs come from a pack model. */
  readonly featureMetadata?: Readonly<Record<string, Omit<LessonPackFigureStepReference, "featureId">>>;
}

export interface LessonPackFigureModel {
  readonly viewBox: readonly [0, 0, 100, 100];
  readonly bbox: readonly [number, number, number, number];
  readonly aspectRatio: number;
  readonly sourceAspectRatio: number;
  readonly yAxis: "down";
  readonly vertexCount: number;
  readonly features: readonly LessonPackFigureFeature[];
}

interface RawPoint { readonly x: number; readonly y: number; }
type RawGeometry =
  | { readonly kind: "point"; readonly points: readonly RawPoint[] }
  | { readonly kind: "line"; readonly paths: readonly (readonly RawPoint[])[] }
  | { readonly kind: "polygon"; readonly polygons: readonly { readonly rings: readonly (readonly RawPoint[])[] }[] };

/**
 * Project selected public GeoJSON geometries to a fixed, print-safe figure.
 *
 * The projection owns coordinate validation and normalization so an SVG
 * renderer never needs to interpret arbitrary GeoJSON values. Missing or
 * malformed selected features fail closed by returning null.
 */
export function projectLessonPackFigureModel(input: LessonPackFigureProjectionInput): LessonPackFigureModel | null {
  if (!input || !Array.isArray(input.features)) return null;
  const metadata = new Map<string, Omit<LessonPackFigureStepReference, "featureId">>();
  for (const step of input.steps ?? []) if (step && typeof step.featureId === "string") metadata.set(step.featureId, normalizeMetadata(step));
  for (const [featureId, value] of Object.entries(input.featureMetadata ?? {})) metadata.set(featureId, normalizeMetadata({ featureId, ...value }));
  const selectedIds = input.steps
    ? dedupeIds(input.steps.map((step) => step?.featureId))
    : input.selectedFeatureIds === undefined
      ? null
      : dedupeIds(input.selectedFeatureIds);
  const byId = new Map<string, FeatureVersion>();
  for (const feature of input.features) {
    if (!isFeature(feature) || byId.has(feature.id)) continue;
    byId.set(feature.id, feature);
  }
  const selectedFeatures = selectedIds === null
    ? [...byId.values()].map((feature) => ({ feature, metadata: metadata.get(feature.id) }))
    : selectedIds.map((id) => byId.get(id)).filter((feature): feature is FeatureVersion => feature !== undefined).map((feature) => ({ feature, metadata: metadata.get(feature.id) }));
  if (!selectedFeatures.length) return null;

  const parsed: { feature: FeatureVersion; metadata?: Omit<LessonPackFigureStepReference, "featureId">; raw: RawGeometry; vertexCount: number }[] = [];
  let vertexCount = 0;
  for (const selected of selectedFeatures) {
    const feature = selected.feature;
    const parsedGeometry = parseGeometry(feature.geometry.type, feature.geometry.coordinates);
    if (!parsedGeometry) return null;
    vertexCount += countRawVertices(parsedGeometry.raw);
    if (vertexCount > MAX_LESSON_PACK_FIGURE_VERTICES) return null;
    parsed.push({ feature, metadata: selected.metadata, raw: parsedGeometry.raw, vertexCount: parsedGeometry.vertexCount });
  }

  const allPoints = parsed.flatMap(({ raw }) => rawPoints(raw));
  const bbox = bounds(allPoints);
  if (!bbox) return null;
  const [minX, minY, maxX, maxY] = bbox;
  const width = maxX - minX;
  const height = maxY - minY;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  const sourceAspectRatio = width > 0 && height > 0 && Number.isFinite(width / height) ? width / height : 1;
  const features = parsed.map(({ feature, metadata: featureMetadata, raw }) => Object.freeze({
    id: feature.id,
    geometryType: feature.geometry.type,
    labels: freezeLabels(feature.properties.labels),
    ...(featureMetadata?.label ? { label: featureMetadata.label } : {}),
    ...(featureMetadata?.yearLabel ? { yearLabel: featureMetadata.yearLabel } : {}),
    ...(featureMetadata?.stepNumber !== undefined ? { stepNumber: featureMetadata.stepNumber } : {}),
    geometry: normalizeGeometry(raw, minX, minY, width, height),
  }));
  return Object.freeze({
    viewBox: Object.freeze([0, 0, LESSON_PACK_FIGURE_VIEWBOX_SIZE, LESSON_PACK_FIGURE_VIEWBOX_SIZE]) as [0, 0, 100, 100],
    bbox: Object.freeze([minX, minY, maxX, maxY]) as [number, number, number, number],
    aspectRatio: sourceAspectRatio,
    sourceAspectRatio,
    yAxis: "down" as const,
    vertexCount,
    features: Object.freeze(features),
  });
}

function normalizeMetadata(step: LessonPackFigureStepReference): Omit<LessonPackFigureStepReference, "featureId"> {
  const label = typeof step.label === "string" ? step.label.slice(0, 240) : undefined;
  const yearLabel = typeof step.yearLabel === "string" ? step.yearLabel.slice(0, 80) : undefined;
  const stepNumber = typeof step.stepNumber === "number" && Number.isSafeInteger(step.stepNumber) && step.stepNumber > 0 ? step.stepNumber : undefined;
  return Object.freeze({
    ...(label ? { label } : {}),
    ...(yearLabel ? { yearLabel } : {}),
    ...(stepNumber !== undefined ? { stepNumber } : {}),
  });
}

function isFeature(value: unknown): value is FeatureVersion {
  if (!value || typeof value !== "object") return false;
  const feature = value as Partial<FeatureVersion>;
  return typeof feature.id === "string" && feature.id.trim().length > 0
    && feature.type === "Feature"
    && Boolean(feature.geometry && typeof feature.geometry === "object")
    && Boolean(feature.properties && typeof feature.properties === "object");
}

function dedupeIds(values: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of values) {
    if (typeof value !== "string" || value.trim().length === 0 || seen.has(value)) continue;
    seen.add(value);
    ids.push(value);
  }
  return ids;
}

function parseGeometry(type: GeometryType, coordinates: unknown): { raw: RawGeometry; vertexCount: number } | null {
  if (!Array.isArray(coordinates)) return null;
  switch (type) {
    case "Point": {
      const point = parsePoint(coordinates);
      return point ? { raw: { kind: "point", points: [point] }, vertexCount: 1 } : null;
    }
    case "MultiPoint": {
      const points = coordinates.map(parsePoint);
      if (!points.length || points.some((point): point is null => point === null)) return null;
      return { raw: { kind: "point", points: points as RawPoint[] }, vertexCount: points.length };
    }
    case "LineString": {
      const path = parsePath(coordinates);
      return path ? { raw: { kind: "line", paths: [path] }, vertexCount: path.length } : null;
    }
    case "MultiLineString": {
      const paths = coordinates.map(parsePath);
      if (!paths.length || paths.some((path): path is null => path === null)) return null;
      return { raw: { kind: "line", paths: paths as RawPoint[][] }, vertexCount: paths.reduce((sum, path) => sum + path!.length, 0) };
    }
    case "Polygon": {
      const polygon = parsePolygon(coordinates);
      return polygon ? { raw: { kind: "polygon", polygons: [polygon] }, vertexCount: polygon.rings.reduce((sum, ring) => sum + ring.length, 0) } : null;
    }
    case "MultiPolygon": {
      const polygons = coordinates.map(parsePolygon);
      if (!polygons.length || polygons.some((polygon): polygon is null => polygon === null)) return null;
      return { raw: { kind: "polygon", polygons: polygons as { rings: RawPoint[][] }[] }, vertexCount: polygons.reduce((sum, polygon) => sum + polygon!.rings.reduce((ringSum, ring) => ringSum + ring.length, 0), 0) };
    }
    default:
      return null;
  }
}

function parsePoint(value: unknown): RawPoint | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const x = value[0];
  const y = value[1];
  return typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function parsePath(value: unknown): RawPoint[] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const points = value.map(parsePoint);
  return points.some((point): point is null => point === null) ? null : points as RawPoint[];
}

function parsePolygon(value: unknown): { rings: RawPoint[][] } | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const rings = value.map((ring) => {
    if (!Array.isArray(ring) || ring.length < 3) return null;
    const points = ring.map(parsePoint);
    return points.some((point): point is null => point === null) ? null : points as RawPoint[];
  });
  return rings.some((ring): ring is null => ring === null) ? null : { rings: rings as RawPoint[][] };
}

function countRawVertices(raw: RawGeometry): number {
  if (raw.kind === "point") return raw.points.length;
  if (raw.kind === "line") return raw.paths.reduce((sum, path) => sum + path.length, 0);
  return raw.polygons.reduce((sum, polygon) => sum + polygon.rings.reduce((ringSum, ring) => ringSum + ring.length, 0), 0);
}

function rawPoints(raw: RawGeometry): readonly RawPoint[] {
  if (raw.kind === "point") return raw.points;
  if (raw.kind === "line") return raw.paths.flat();
  return raw.polygons.flatMap((polygon) => polygon.rings.flat());
}

function bounds(points: readonly RawPoint[]): [number, number, number, number] | null {
  if (!points.length) return null;
  let minX = points[0]!.x; let minY = points[0]!.y; let maxX = points[0]!.x; let maxY = points[0]!.y;
  for (const point of points) {
    if (![point.x, point.y].every(Number.isFinite)) return null;
    minX = Math.min(minX, point.x); minY = Math.min(minY, point.y); maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y);
  }
  return [minX, minY, maxX, maxY];
}

function normalizeGeometry(raw: RawGeometry, minX: number, minY: number, width: number, height: number): LessonPackFigureGeometry {
  if (raw.kind === "point") return Object.freeze({ kind: "point" as const, points: freezePoints(raw.points.map((point) => normalizePoint(point, minX, minY, width, height))) });
  if (raw.kind === "line") return Object.freeze({ kind: "line" as const, paths: Object.freeze(raw.paths.map((path) => freezePoints(path.map((point) => normalizePoint(point, minX, minY, width, height))))) });
  return Object.freeze({
    kind: "polygon" as const,
    polygons: Object.freeze(raw.polygons.map((polygon) => Object.freeze({ rings: Object.freeze(polygon.rings.map((ring) => freezePoints(ring.map((point) => normalizePoint(point, minX, minY, width, height))))) }))),
  });
}

function normalizePoint(point: RawPoint, minX: number, minY: number, width: number, height: number): LessonPackFigurePoint {
  const x = width === 0 ? LESSON_PACK_FIGURE_VIEWBOX_SIZE / 2 : LESSON_PACK_FIGURE_PADDING + ((point.x - minX) / width) * (LESSON_PACK_FIGURE_VIEWBOX_SIZE - LESSON_PACK_FIGURE_PADDING * 2);
  const yFromBottom = height === 0 ? LESSON_PACK_FIGURE_VIEWBOX_SIZE / 2 : LESSON_PACK_FIGURE_PADDING + ((point.y - minY) / height) * (LESSON_PACK_FIGURE_VIEWBOX_SIZE - LESSON_PACK_FIGURE_PADDING * 2);
  return Object.freeze({ x, y: LESSON_PACK_FIGURE_VIEWBOX_SIZE - yFromBottom });
}

function freezePoints(points: readonly LessonPackFigurePoint[]): readonly LessonPackFigurePoint[] {
  return Object.freeze(points);
}

function freezeLabels(value: LocalizedText): LocalizedText {
  const labels = Object.fromEntries(Object.entries(value ?? {}).filter(([, text]) => typeof text === "string"));
  return Object.freeze(labels);
}
