export interface YearRange {
  readonly min: number;
  readonly max: number;
}

export interface Timeline {
  toYear(position: number): number;
  toPosition(year: number): number;
}

/** Slider segments: [start year, end year, relative width]. Dense eras get more room. */
export const TIMELINE_SEGMENTS: readonly (readonly [number, number, number])[] = [
  [-123000, -3000, 0.5],
  [-3000, 500, 1.5],
  [500, 1450, 1.5],
  [1450, 1650, 2.5],
  [1650, 1870, 2],
  [1870, 2025, 1.5],
];

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Piecewise-linear mapping between slider position (0..1) and integer years within `range`. */
export function createTimeline(range: YearRange): Timeline {
  if (range.max <= range.min) {
    return { toYear: () => range.min, toPosition: () => 0 };
  }
  const pieces = TIMELINE_SEGMENTS.map(([from, to, weight]) => {
    const start = Math.max(from, range.min);
    const end = Math.min(to, range.max);
    return { start, end, weight: end > start ? (weight * (end - start)) / (to - from) : 0 };
  }).filter((piece) => piece.weight > 0);
  if (range.min < TIMELINE_SEGMENTS[0][0]) pieces.unshift({ start: range.min, end: TIMELINE_SEGMENTS[0][0], weight: 0.5 });
  const last = TIMELINE_SEGMENTS[TIMELINE_SEGMENTS.length - 1][1];
  if (range.max > last) pieces.push({ start: last, end: range.max, weight: 0.5 });
  const total = pieces.reduce((sum, piece) => sum + piece.weight, 0);
  let offset = 0;
  const scaled = pieces.map((piece) => {
    const from = offset / total;
    offset += piece.weight;
    return { ...piece, from, to: offset / total };
  });

  return {
    toYear(position) {
      const p = clamp(position, 0, 1);
      const piece = scaled.find((item) => p <= item.to) ?? scaled[scaled.length - 1];
      const ratio = piece.to === piece.from ? 0 : (p - piece.from) / (piece.to - piece.from);
      return clamp(Math.round(piece.start + ratio * (piece.end - piece.start)), range.min, range.max);
    },
    toPosition(year) {
      const y = clamp(year, range.min, range.max);
      const piece = scaled.find((item) => y <= item.end) ?? scaled[scaled.length - 1];
      const ratio = (y - piece.start) / (piece.end - piece.start);
      return clamp(piece.from + ratio * (piece.to - piece.from), 0, 1);
    },
  };
}

export function nextRecordedYear(years: readonly number[], year: number): number | null {
  return years.find((candidate) => candidate > year) ?? null;
}

export function previousRecordedYear(years: readonly number[], year: number): number | null {
  for (let index = years.length - 1; index >= 0; index -= 1) {
    if (years[index] < year) return years[index];
  }
  return null;
}
