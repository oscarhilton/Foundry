import { describe, it, expect } from "vitest";
import {
  buildWeatherFact,
  renderWeatherLens,
  renderWeatherSourceSummary,
  renderWeatherSourceSummaryRainEmphasis,
} from "./weather-lens.js";

const HOME_FACT = buildWeatherFact("Home", 12, 0.22);
const LONDON_FACT = buildWeatherFact("London", 12, 0.45);

describe("weather-lens", () => {
  it("renders stable source summary", () => {
    expect(renderWeatherSourceSummary(HOME_FACT)).toBe("22% rain after 4pm");
    expect(renderWeatherSourceSummary(LONDON_FACT)).toBe("45% rain after 4pm");
  });

  it("renders rain-emphasis source summary", () => {
    expect(renderWeatherSourceSummaryRainEmphasis(HOME_FACT)).toBe(
      "Rain 22% after 4pm",
    );
  });

  it("projects each lens from the same fact", () => {
    expect(renderWeatherLens(HOME_FACT, "rain")).toBe("Light showers likely");
    expect(renderWeatherLens(HOME_FACT, "umbrella")).toBe("No umbrella needed");
    expect(renderWeatherLens(HOME_FACT, "coat")).toBe("Light jacket");
    expect(renderWeatherLens(HOME_FACT, "sun")).toBe("Sunglasses advised");
  });

  it("umbrella thresholds for london", () => {
    expect(renderWeatherLens(LONDON_FACT, "umbrella")).toBe("Take umbrella later");
    expect(renderWeatherLens(buildWeatherFact("London", 12, 0.6), "umbrella")).toBe(
      "Take umbrella",
    );
  });
});
