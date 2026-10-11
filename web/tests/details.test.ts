import { describe, expect, it, vi } from "vitest";
import { createDetailStore, detailShardPath } from "../src/domain/details";
import { fnv1a32 } from "../src/domain/fnv1a";

describe("detailShardPath", () => {
  it("uses the same shard rule as the tile builder", () => {
    const id = "ogurike:version:ujigawa-1590";
    expect(detailShardPath("ogurike", id, 1)).toBe("details/ogurike/0.json");
    expect(detailShardPath("bakumatsu-villages", id, 7)).toBe(`details/bakumatsu-villages/${fnv1a32(id) % 7}.json`);
  });
});

describe("createDetailStore", () => {
  const shard = {
    dataset: "ogurike",
    features: { "ogurike:version:a": { entityId: "ogurike:entity:a", labels: { ja: "A" }, evidenceIds: ["ogurike:evidence:e"] } },
    entities: { "ogurike:entity:a": { id: "ogurike:entity:a", type: "waterbody", labels: { ja: "A" }, description: { ja: "" } } },
    evidence: { "ogurike:evidence:e": { id: "ogurike:evidence:e", sourceId: "ogurike:source:s" } },
    sources: { "ogurike:source:s": { id: "ogurike:source:s", citation: "S" } },
  };

  it("loads a shard once and resolves the feature with its records", async () => {
    const fetchJson = vi.fn().mockResolvedValue(shard);
    const store = createDetailStore("/chronomap/", { ogurike: 1 }, fetchJson);

    const first = await store.load("ogurike", "ogurike:version:a");
    await store.load("ogurike", "ogurike:version:a");

    expect(fetchJson).toHaveBeenCalledTimes(1);
    expect(fetchJson).toHaveBeenCalledWith("/chronomap/details/ogurike/0.json");
    expect(first?.entity?.type).toBe("waterbody");
    expect(first?.evidence[0]?.source?.citation).toBe("S");
  });

  it("returns null for unknown datasets or features", async () => {
    const store = createDetailStore("/chronomap/", { ogurike: 1 }, vi.fn().mockResolvedValue(shard));
    expect(await store.load("missing", "x")).toBeNull();
    expect(await store.load("ogurike", "ogurike:version:zzz")).toBeNull();
  });
});
