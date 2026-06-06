import { describe, it, expect } from "vitest";
import {
  STARTER_CUBES,
  emptyTrayState,
  getWordDie,
  getActiveFace,
  rotateFaceId,
  TRAY_SLOT_COUNT,
} from "./dice.js";

describe("word cubes (TRAY-115)", () => {
  it("starter pool has six cubes", () => {
    expect(STARTER_CUBES).toHaveLength(6);
  });

  it("phenomenon cube has four weather faces", () => {
    const phenomenon = getWordDie("phenomenon")!;
    expect(phenomenon.modes.map((m) => m.id)).toEqual([
      "wind",
      "rain",
      "sun",
      "snow",
    ]);
  });

  it("response cube has four utility faces", () => {
    const response = getWordDie("response")!;
    expect(response.modes.map((m) => m.id)).toEqual([
      "jacket",
      "umbrella",
      "sunglasses",
      "gloves",
    ]);
  });

  it("rotates through response faces", () => {
    const next = rotateFaceId("response", "jacket");
    expect(next).toBe("umbrella");
    const again = rotateFaceId("response", "gloves");
    expect(again).toBe("jacket");
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
    expect(face?.token).toBe("place/london");
  });
});
