import { describe, it, expect } from "vitest";
import {
  buildSplitWeatherSegments,
  formatTunedWeatherLcd,
  formatWeather,
  renderSplitWeatherChunk,
} from "./output-formatters.js";

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

describe("formatTunedWeatherLcd", () => {
  it("formats threshold gate without place", () => {
    expect(formatTunedWeatherLcd(1, 0.21)).toBe("RAIN > 85%\n21% · closed");
  });

  it("formats threshold gate with place", () => {
    expect(formatTunedWeatherLcd(1, 0.21, "London")).toBe(
      "London\nRAIN > 85%\n21% · closed",
    );
  });

  it("reports open gate when rain exceeds threshold", () => {
    expect(formatTunedWeatherLcd(1, 0.9)).toBe("RAIN > 85%\n90% · open");
  });
});

describe("split weather segments", () => {
  it("builds place, temp, and rain clauses", () => {
    expect(buildSplitWeatherSegments(12, 0.45, "London")).toEqual([
      "London",
      "12°C",
      "45% rain",
    ]);
  });

  it("renders packed chunks for two and three viewports", () => {
    expect(renderSplitWeatherChunk(["London", "12°C"])).toBe("London\n12°C");
    expect(renderSplitWeatherChunk(["London", "12°C", "45% rain"])).toBe(
      "London\n12°C · 45% rain",
    );
    expect(renderSplitWeatherChunk(["18°C", "40% rain"])).toBe(
      "18°C · 40% rain",
    );
  });
});
