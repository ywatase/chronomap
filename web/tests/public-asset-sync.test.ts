import { access, readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const files = ["dataset.json", "entities.json", "sources.json", "evidence.json", "feature-versions.geojson"];

async function chronomapDataCommand(): Promise<string> {
  const repositoryCommand = resolve("..", ".venv", "bin", "chronomap-data");
  try {
    await access(repositoryCommand);
    return repositoryCommand;
  } catch {
    return "chronomap-data";
  }
}

async function expectPublicAssetsMatch(source: string, target: string): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "chronomap-ui-"));
  try {
    await execFileAsync(await chronomapDataCommand(), ["build-public", source, "--output", directory], { cwd: ".." });
    for (const name of files) {
      const checkedIn = await readFile(join(target, name));
      expect(checkedIn).toEqual(await readFile(join(directory, name)));
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe("public demo assets", () => {
  it("checked-in demo assets equal the public builder output", async () => {
    await expectPublicAssetsMatch("tests/fixtures/valid/synthetic-package", "public/data/synthetic");
  });

  it("checked-in Ogurike assets equal the public builder output", async () => {
    await expectPublicAssetsMatch("data/ogurike", "public/data/ogurike");
  });

  it("checked-in Tone River assets equal the public builder output", async () => {
    await expectPublicAssetsMatch("data/tonegawa", "public/data/tonegawa");
  });

  it("checked-in Heijokyo assets equal the public builder output", async () => {
    await expectPublicAssetsMatch("data/heijokyo", "public/data/heijokyo");
  });

  it("checked-in Azuchi assets equal the public builder output", async () => {
    await expectPublicAssetsMatch("data/azuchijo", "public/data/azuchijo");
  });

  it("checked-in Kinugawa assets equal the public builder output", async () => {
    await expectPublicAssetsMatch("data/kinugawa", "public/data/kinugawa");
  });

  it("checked-in Osaka assets equal the public builder output", async () => {
    await expectPublicAssetsMatch("data/osaka", "public/data/osaka");
  });

  it("checked-in Sekigahara assets equal the public builder output", async () => {
    await expectPublicAssetsMatch("data/sekigahara", "public/data/sekigahara");
  });
});
