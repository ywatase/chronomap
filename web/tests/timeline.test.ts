import { describe, expect, it } from "vitest";
import { createTimeline, nextRecordedYear, previousRecordedYear } from "../src/domain/timeline";

describe("createTimeline", () => {
  const timeline = createTimeline({ min: -1000, max: 2020 });

  it("maps the ends of the range to the ends of the slider", () => {
    expect(timeline.toYear(0)).toBe(-1000);
    expect(timeline.toYear(1)).toBe(2020);
    expect(timeline.toPosition(-1000)).toBe(0);
    expect(timeline.toPosition(2020)).toBe(1);
  });

  it("round-trips integer years", () => {
    for (const year of [-1000, -1, 500, 1467, 1600, 1867, 1945, 2020]) {
      expect(timeline.toYear(timeline.toPosition(year))).toBe(year);
    }
  });

  it("gives the early-modern era more room than antiquity", () => {
    const span = (from: number, to: number) => timeline.toPosition(to) - timeline.toPosition(from);
    expect(span(1450, 1650) / 200).toBeGreaterThan(span(-1000, -800) / 200);
  });

  it("clamps out-of-range input", () => {
    expect(timeline.toYear(-0.5)).toBe(-1000);
    expect(timeline.toPosition(9999)).toBe(1);
  });

  it("handles a single-year range", () => {
    const single = createTimeline({ min: 1867, max: 1867 });
    expect(single.toYear(0.3)).toBe(1867);
    expect(single.toPosition(1867)).toBe(0);
  });
});

describe("recorded year navigation", () => {
  const years = [710, 1590, 1600, 1867];
  it("moves to the neighbouring recorded year", () => {
    expect(nextRecordedYear(years, 1595)).toBe(1600);
    expect(nextRecordedYear(years, 1600)).toBe(1867);
    expect(nextRecordedYear(years, 1867)).toBeNull();
    expect(previousRecordedYear(years, 1600)).toBe(1590);
    expect(previousRecordedYear(years, 710)).toBeNull();
  });
});
