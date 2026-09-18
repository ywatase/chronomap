// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderLessonPackQr } from "../src/ui/lesson-pack-qr";

describe("lesson pack QR", () => {
  it("renders a fixed black-and-white SVG with an included quiet zone", () => {
    const host = document.createElement("div");
    const payload = "https://chronomap.example/?dataset=heijokyo&lesson=heijokyo-intro&step=first";
    expect(renderLessonPackQr(host, payload, { ariaLabel: "ガイド教材を開くQRコード" })).toBe(true);
    const svg = host.querySelector<SVGSVGElement>("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("ガイド教材を開くQRコード");
    expect(svg?.getAttribute("width")).toBe("192");
    expect(svg?.getAttribute("height")).toBe("192");
    expect(svg?.getAttribute("data-quiet-zone")).toBe("4");
    expect(svg?.querySelector("rect")?.getAttribute("fill")).toBe("#fff");
    expect(svg?.querySelector("path")?.getAttribute("fill")).toBe("#000");
    expect(svg?.querySelector("path")?.getAttribute("d")).toMatch(/M[4-9]/);
  });

  it("fails closed for an unsafe or oversized payload without throwing", () => {
    for (const payload of ["javascript:alert(1)", "", "x".repeat(5000)]) {
      const host = document.createElement("div");
      expect(() => renderLessonPackQr(host, payload)).not.toThrow();
      expect(renderLessonPackQr(host, payload)).toBe(false);
      expect(host.querySelector("svg")).toBeNull();
    }
  });
});
