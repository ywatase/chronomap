import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const files = ["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"];

describe("public demo assets", () => {
  it("checked-in demo assets equal the public builder output", async () => {
    const directory = await mkdtemp(join(tmpdir(), "chronomap-ui-"));
    try {
      await execFileAsync(
        "chronomap-data",
        ["build-public", "tests/fixtures/valid/synthetic-package", "--output", directory],
        { cwd: ".." },
      );
      for (const name of files) {
        const checkedIn = await readFile(join("public/data/synthetic", name));
        expect(checkedIn).toEqual(await readFile(join(directory, name)));
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
