import { describe, it, expect } from "vitest";
import {
  STARTER_CUBES,
  emptyTrayState,
  getWordDie,
  getActiveFace,
  rotateFaceId,
  isWeatherLensToken,
  TRAY_SLOT_COUNT,
} from "./dice.js";

describe("word cubes (v2)", () => {
  it("starter pool has seven per-word cubes with four modes each", () => {
    expect(STARTER_CUBES).toHaveLength(7);
    for (const cube of STARTER_CUBES) {
      expect(cube.modes).toHaveLength(4);
    }
  });

  it("weather cube modes are Full Temp Rain Wind", () => {
    const weather = getWordDie("weather")!;
    const labels = weather.modes.map((m) => m.label);
    expect(labels).toEqual(["Full", "Temp", "Rain", "Wind"]);
  });

  it("umbrella lens maps to lens token", () => {
    const umbrella = getWordDie("umbrella")!;
    expect(isWeatherLensToken(umbrella.runtimeToken)).toBe(true);
  });

  it("rotates through modes of same word", () => {
    const next = rotateFaceId("umbrella", "any");
    expect(next).toBe("heavy");
    const again = rotateFaceId("umbrella", "now");
    expect(again).toBe("any");
  });

  it("empty tray has five slots", () => {
    expect(emptyTrayState().slots).toHaveLength(TRAY_SLOT_COUNT);
  });

  it("resolves active mode on placed cube", () => {
    const face = getActiveFace({
      cubeId: "london",
      slotIndex: 0,
      activeModeId: "london",
    });
    expect(face?.label).toBe("LONDON");
    expect(face?.token).toBe("identity/london");
  });
});
