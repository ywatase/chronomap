import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPublicBundle } from "../src/domain/data-loader";

const resources = ["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"] as const;

afterEach(() => vi.unstubAllGlobals());

describe("ogurike public bundle", () => {
  it("loads the checked-in Japanese bundle through the public URL", async () => {
    const fetch = vi.fn(async (input: string) => {
      const resource = input.split("/").at(-1)!;
      const body = await readFile(join("public", "data", "ogurike", resource));
      return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetch);

    const bundle = await loadPublicBundle("/data/ogurike/");

    expect(fetch).toHaveBeenCalledTimes(resources.length);
    expect(bundle.dataset.defaultLanguage).toBe("ja");
    expect(bundle.dataset.title.ja).toBe("巨椋池パイロットデータ");
    expect(bundle.features).toHaveLength(8);
    expect(Object.keys(bundle.entitiesById)).toHaveLength(3);
  });
});
