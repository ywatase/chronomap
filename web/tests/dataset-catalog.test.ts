import { describe, expect, it } from "vitest";
import { DATASET_CATALOG, datasetFromSearch } from "../src/domain/dataset-catalog";

describe("dataset catalog", () => {
  it("allow-lists all public bundles and lesson entries", () => {
    expect(DATASET_CATALOG.map((entry) => entry.slug)).toEqual(["ogurike", "tonegawa", "heijokyo"]);
    expect(DATASET_CATALOG.find((entry) => entry.slug === "ogurike")?.lessons).toEqual([
      { id: "ogurike-intro", path: "/lessons/ogurike-intro.json", featured: true },
      { id: "ogurike-river-compare", path: "/lessons/ogurike-river-compare.json", featured: false },
    ]);
    expect(datasetFromSearch("?dataset=tonegawa").bundlePath).toBe("/data/tonegawa/");
    expect(datasetFromSearch("?dataset=tonegawa").lessons.map((lesson) => lesson.id)).toEqual(["tonegawa-eastward"]);
    expect(datasetFromSearch("?dataset=heijokyo").bundlePath).toBe("/data/heijokyo/");
    expect(datasetFromSearch("?dataset=heijokyo").lessons[0]?.path).toContain("heijokyo-intro");
    expect(datasetFromSearch("?dataset=heijokyo").region.ja).toBe("奈良盆地北部");
  });

  it("falls back to the default bundle for unknown or absent values", () => {
    expect(datasetFromSearch("").slug).toBe("ogurike");
    expect(datasetFromSearch("?dataset=https%3A%2F%2Fevil.example%2Fdata").slug).toBe("ogurike");
    expect(datasetFromSearch("?dataset=unknown").slug).toBe("ogurike");
  });
});
