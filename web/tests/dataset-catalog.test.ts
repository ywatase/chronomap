import { describe, expect, it } from "vitest";
import { DATASET_CATALOG, datasetFromSearch } from "../src/domain/dataset-catalog";

describe("dataset catalog", () => {
  it("allow-lists both public bundles", () => {
    expect(DATASET_CATALOG.map((entry) => entry.slug)).toEqual(["ogurike", "tonegawa"]);
    expect(datasetFromSearch("?dataset=tonegawa").bundlePath).toBe("/data/tonegawa/");
    expect(datasetFromSearch("?dataset=tonegawa").lessonPath).toContain("tonegawa");
  });

  it("falls back to the default bundle for unknown or absent values", () => {
    expect(datasetFromSearch("").slug).toBe("ogurike");
    expect(datasetFromSearch("?dataset=https%3A%2F%2Fevil.example%2Fdata").slug).toBe("ogurike");
    expect(datasetFromSearch("?dataset=unknown").slug).toBe("ogurike");
  });
});
