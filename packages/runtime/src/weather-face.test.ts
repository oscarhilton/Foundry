import { describe, it, expect } from "vitest";
import {
  buildConditionFaceState,
  buildThresholdFaceState,
  dialToRainThreshold,
  rainToFaceSymbol,
  truncatePlaceLabel,
  weatherFaceContentKey,
} from "./weather-face.js";

describe("weather-face", () => {
  it("maps live rain to condition headlines with bound weather text", () => {
    const rainy = buildConditionFaceState(12, 0.8, "London");
    expect(rainy.headline).toBe("RAIN");
    expect(rainy.text).toBe("London\n12°C · 80% rain");
    expect(rainy.detail).toBeNull();
    expect(rainy.placeLabel).toBe("London");

    expect(buildConditionFaceState(18, 0.1).headline).toBe("SUN");
    expect(buildConditionFaceState(14, 0.35).headline).toBe("OVERCAST");
  });

  it("builds weather text without place when unbound", () => {
    const face = buildConditionFaceState(14, 0.45);
    expect(face.text).toBe("14°C · 45% rain");
    expect(face.placeLabel).toBeNull();
  });

  it("threshold face shows gate not live condition", () => {
    const face = buildThresholdFaceState(0.65);
    expect(face.mode).toBe("threshold");
    expect(face.headline).toBe("RAIN");
    expect(face.detail).toBe(
      `> ${Math.round(dialToRainThreshold(0.65) * 100)}%`,
    );
    expect(face.text).toBe(`RAIN\n> ${Math.round(dialToRainThreshold(0.65) * 100)}%`);
    expect(face.rainThreshold).toBe(dialToRainThreshold(0.65));
    expect(face.placeLabel).toBeNull();
  });

  it("rainToFaceSymbol matches condition bands", () => {
    expect(rainToFaceSymbol(0.9)).toBe("rain");
    expect(rainToFaceSymbol(0.1)).toBe("sun");
    expect(rainToFaceSymbol(0.35)).toBe("cloud");
  });

  it("weatherFaceContentKey changes when text changes", () => {
    const a = buildConditionFaceState(12, 0.4, "London");
    const b = buildConditionFaceState(13, 0.4, "London");
    expect(weatherFaceContentKey(a)).not.toBe(weatherFaceContentKey(b));
  });

  it("truncatePlaceLabel shortens long names", () => {
    expect(truncatePlaceLabel("San Francisco")).toBe("San Francis…");
    expect(truncatePlaceLabel("London")).toBe("London");
  });
});
