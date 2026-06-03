import { describe, it, expect } from "vitest";
import { perlin1D, perlin2D } from "./perlin.js";

describe("perlin", () => {
  it("is deterministic for the same input", () => {
    expect(perlin1D(1.5)).toBe(perlin1D(1.5));
    expect(perlin2D(2, 3)).toBe(perlin2D(2, 3));
  });

  it("returns values in roughly -1..1 range", () => {
    for (let i = 0; i < 20; i++) {
      const v = perlin1D(i * 0.37);
      expect(v).toBeGreaterThanOrEqual(-1.1);
      expect(v).toBeLessThanOrEqual(1.1);
    }
  });

  it("changes smoothly for small input steps", () => {
    const delta = Math.abs(perlin1D(5.0) - perlin1D(5.02));
    expect(delta).toBeLessThan(0.12);
  });
});
