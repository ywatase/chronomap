import { describe, expect, it } from "vitest";
import { formatYear, yearFilter } from "../src/domain/year-filter";

describe("yearFilter", () => {
  it("keeps features whose possible period contains the year", () => {
    expect(yearFilter(1600)).toEqual(["all", ["<=", ["get", "from_year"], 1600], [">=", ["get", "to_year"], 1600]]);
  });
});

describe("formatYear", () => {
  it("writes BC years in Japanese", () => {
    expect(formatYear(1600)).toBe("1600年");
    expect(formatYear(-500)).toBe("紀元前500年");
    expect(formatYear(0)).toBe("紀元前1年");
  });
});
