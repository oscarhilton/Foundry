import { describe, it, expect } from "vitest";
import { weatherToLightMood } from "./weather-light.js";

describe("weatherToLightMood", () => {
  it("maps heavy rain to rain", () => {
    expect(weatherToLightMood(12, 0.6)).toBe("rain");
  });

  it("maps clear skies to sun", () => {
    expect(weatherToLightMood(18, 0.2)).toBe("sun");
  });

  it("maps middling conditions to overcast", () => {
    expect(weatherToLightMood(14, 0.4)).toBe("overcast");
  });
});
