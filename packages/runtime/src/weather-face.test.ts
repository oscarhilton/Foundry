import { describe, it, expect } from "vitest";
import {
  buildConditionFaceState,
  buildThresholdFaceState,
  dialToRainThreshold,
  rainToFaceSymbol,
} from "./weather-face.js";

describe("weather-face", () => {
  it("maps live rain to condition headlines", () => {
    expect(buildConditionFaceState(0.8).headline).toBe("RAIN");
    expect(buildConditionFaceState(0.1).headline).toBe("SUN");
    expect(buildConditionFaceState(0.35).headline).toBe("CLOUD");
  });

  it("threshold face shows gate not live condition", () => {
    const face = buildThresholdFaceState(0.65);
    expect(face.mode).toBe("threshold");
    expect(face.headline).toBe("RAIN");
    expect(face.detail).toBe(
      `> ${Math.round(dialToRainThreshold(0.65) * 100)}%`,
    );
    expect(face.rainThreshold).toBe(dialToRainThreshold(0.65));
  });

  it("rainToFaceSymbol matches condition bands", () => {
    expect(rainToFaceSymbol(0.9)).toBe("rain");
    expect(rainToFaceSymbol(0.1)).toBe("sun");
    expect(rainToFaceSymbol(0.35)).toBe("cloud");
  });
});
