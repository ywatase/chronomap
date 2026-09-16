import { afterEach, describe, expect, it, vi } from "vitest";
import { BundleLoadError, loadPublicBundle } from "../src/domain/data-loader";

const dataset = {
  id: "synthetic:dataset:sample",
  temporalExtent: { start: { earliestYear: -2, latestYear: -2 }, end: null },
};
const entities = [{ id: "synthetic:entity:one" }];
const sources = [{ id: "synthetic:source:one" }];
const evidence = [{ id: "synthetic:evidence:one" }];
const publicFeature = {
  type: "Feature",
  id: "synthetic:version:public",
  geometry: { type: "Point", coordinates: [0, 0] },
  properties: { publicationStatus: "public", temporal: { start: null, end: null } },
};
const privateFeature = {
  ...publicFeature,
  id: "synthetic:version:private",
  properties: { ...publicFeature.properties, publicationStatus: "private" },
};

afterEach(() => vi.unstubAllGlobals());

describe("loadPublicBundle", () => {
  it("loads the five public resources, indexes records, and ignores a private feature", async () => {
    const payloads: Record<string, unknown> = {
      "dataset.json": dataset,
      "entities.json": entities,
      "sources.json": sources,
      "evidence.json": evidence,
      "feature-versions.geojson": { type: "FeatureCollection", features: [publicFeature, privateFeature] },
    };
    const fetch = vi.fn(async (input: string) => {
      const resource = input.split("/").at(-1)!;
      return new Response(JSON.stringify(payloads[resource]), { status: 200 });
    });
    vi.stubGlobal("fetch", fetch);

    const bundle = await loadPublicBundle("/data/synthetic/");

    expect(fetch).toHaveBeenCalledTimes(5);
    expect(bundle.entitiesById["synthetic:entity:one"]).toEqual(entities[0]);
    expect(bundle.sourcesById["synthetic:source:one"]).toEqual(sources[0]);
    expect(bundle.evidenceById["synthetic:evidence:one"]).toEqual(evidence[0]);
    expect(bundle.features.map((feature) => feature.id)).toEqual(["synthetic:version:public"]);
    expect(Object.isFrozen(bundle.features)).toBe(true);
    expect(Object.isFrozen(bundle.entitiesById)).toBe(true);
  });

  it("surfaces an HTTP failure as a user-safe resource error", async () => {
    vi.stubGlobal("fetch", async () => new Response("not found", { status: 404 }));

    await expect(loadPublicBundle("/data/synthetic")).rejects.toMatchObject({
      resource: "dataset.json",
      message: "Unable to load dataset.json.",
    } satisfies Partial<BundleLoadError>);
  });

  it("rejects a malformed GeoJSON collection", async () => {
    const payloads = [dataset, entities, sources, evidence, { type: "Feature", features: [] }];
    vi.stubGlobal("fetch", async (input: string) => {
      const index = ["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"].indexOf(input.split("/").at(-1)!);
      return new Response(JSON.stringify(payloads[index]), { status: 200 });
    });

    await expect(loadPublicBundle("/data/synthetic")).rejects.toMatchObject({
      resource: "feature-versions.geojson",
      message: "Unable to load feature-versions.geojson.",
    } satisfies Partial<BundleLoadError>);
  });
});
