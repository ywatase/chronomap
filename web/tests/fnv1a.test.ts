import { describe, expect, it } from "vitest";
import { fnv1a32 } from "../src/domain/fnv1a";

describe("fnv1a32", () => {
  it("matches the Python reference vectors", () => {
    expect(fnv1a32("")).toBe(0x811c9dc5);
    expect(fnv1a32("a")).toBe(0xe40c292c);
    expect(fnv1a32("foobar")).toBe(0xbf9cf968);
  });

  it("hashes UTF-8 bytes, not UTF-16 code units", () => {
    const bytes = new TextEncoder().encode("国");
    let value = 0x811c9dc5;
    for (const byte of bytes) value = Math.imul(value ^ byte, 0x01000193) >>> 0;
    expect(fnv1a32("国")).toBe(value);
  });
});
