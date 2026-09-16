import { afterEach, describe, expect, it, vi } from "vitest";
import { BundleLoadError, loadPublicBundle } from "../src/domain/data-loader";

const dataset = {
  id: "synthetic:dataset:sample",
  schemaVersion: "1.0.0",
  title: { en: "Sample" },
  description: { en: "Sample" },
  defaultLanguage: "en",
  bbox: [-1, -1, 1, 1],
  temporalExtent: {
    start: { earliestYear: -2, latestYear: -2, precision: "year", qualifier: "exact" },
    end: null,
  },
  rights: { status: "public-domain" },
  files: { entities: "entities.json", sources: "sources.json", evidence: "evidence.json", featureVersions: "feature-versions.geojson" },
};
const entities = [{ id: "synthetic:entity:one", type: "settlement", labels: { en: "One" }, description: { en: "One" } }];
const sources = [{ id: "synthetic:source:one", type: "reference", citation: "One", title: { en: "One" }, creators: ["Author"], publishedYear: 1, url: "https://example.invalid/one", accessedDate: "2026-09-16", rights: { status: "public-domain" } }];
const evidence = [{ id: "synthetic:evidence:one", sourceId: "synthetic:source:one", locator: "One", usage: "citation", supports: ["temporal"], note: "" }];
const publicFeature = {
  type: "Feature",
  id: "synthetic:version:public",
  geometry: { type: "Point", coordinates: [0, 0] },
  properties: {
    entityId: "synthetic:entity:one",
    labels: { en: "Public" },
    description: { en: "Public" },
    publicationStatus: "public",
    temporal: { start: { earliestYear: 0, latestYear: 0, precision: "year", qualifier: "exact" }, end: null },
    uncertainty: {
      temporal: { assessment: "well-supported", note: "", evidenceIds: ["synthetic:evidence:one"] },
      location: { assessment: "well-supported", note: "", evidenceIds: ["synthetic:evidence:one"] },
      geometry: { assessment: "well-supported", note: "", evidenceIds: ["synthetic:evidence:one"] },
      identity: { assessment: "well-supported", note: "", evidenceIds: ["synthetic:evidence:one"] },
    },
    evidenceIds: ["synthetic:evidence:one"],
    rights: { status: "public-domain" },
  },
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

  it("rejects a malformed feature that declares itself public", async () => {
    const malformedPublicFeature = { ...publicFeature, geometry: null };
    const payloads = [dataset, entities, sources, evidence, { type: "FeatureCollection", features: [malformedPublicFeature] }];
    vi.stubGlobal("fetch", async (input: string) => {
      const index = ["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"].indexOf(input.split("/").at(-1)!);
      return new Response(JSON.stringify(payloads[index]), { status: 200 });
    });

    await expect(loadPublicBundle("/data/synthetic")).rejects.toMatchObject({
      resource: "feature-versions.geojson",
      message: "Unable to load feature-versions.geojson.",
    } satisfies Partial<BundleLoadError>);
  });

  it("rejects a public feature missing a required property", async () => {
    const { entityId: _entityId, ...properties } = publicFeature.properties;
    const malformedPublicFeature = { ...publicFeature, properties };
    const payloads = [dataset, entities, sources, evidence, { type: "FeatureCollection", features: [malformedPublicFeature] }];
    vi.stubGlobal("fetch", async (input: string) => new Response(JSON.stringify(payloads[["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"].indexOf(input.split("/").at(-1)!)]), { status: 200 }));
    await expect(loadPublicBundle("/data/synthetic")).rejects.toMatchObject({ resource: "feature-versions.geojson" } satisfies Partial<BundleLoadError>);
  });

  it("rejects a malformed entity payload", async () => {
    const payloads = [dataset, [{ id: "synthetic:entity:one" }], sources, evidence, { type: "FeatureCollection", features: [publicFeature] }];
    vi.stubGlobal("fetch", async (input: string) => new Response(JSON.stringify(payloads[["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"].indexOf(input.split("/").at(-1)!)]), { status: 200 }));
    await expect(loadPublicBundle("/data/synthetic")).rejects.toMatchObject({ resource: "entities.json" } satisfies Partial<BundleLoadError>);
  });
});
