import { describe, it, expect } from "vitest";
import { formatWeather } from "./output-formatters.js";

describe("formatWeather", () => {
  it("formats bare weather without a place", () => {
    expect(formatWeather(12, 0.45)).toBe("12°C · 45% rain");
  });

  it("embeds the first place on a second line", () => {
    expect(formatWeather(12, 0.45, "London")).toBe(
      "London\n12°C · 45% rain",
    );
  });
});
