import { describe, it, expect } from "vitest";
import {
  STARTER_CUBES,
  ALL_WORD_CUBES,
  STARTER_POOL_ORDER,
  getTrayWordCube,
  orderedStarterPool,
} from "./vocabulary.js";

const LEGACY_IDENTITY_TOKENS = ["identity/hallway", "identity/london"];

describe("vocabulary v2 — TRAY-115 matrix", () => {
  it("starter kit has six cubes", () => {
    expect(STARTER_CUBES).toHaveLength(6);
    const ids = STARTER_CUBES.map((c) => c.id);
    expect(ids).toEqual([
      "home",
      "moment",
      "phenomenon",
      "response",
      "button",
      "timer",
    ]);
  });

  it("starter pool order is grammar-biased", () => {
    expect(STARTER_POOL_ORDER).toEqual([
      "home",
      "moment",
      "phenomenon",
      "response",
      "button",
      "timer",
    ]);
    expect(orderedStarterPool()).toHaveLength(6);
    expect(orderedStarterPool()[2]!.id).toBe("phenomenon");
  });

  it("moment die uses four time windows", () => {
    const moment = getTrayWordCube("moment")!;
    expect(moment.modes.map((m) => m.faceText)).toEqual([
      "MORNING",
      "AFTERNOON",
      "EVENING",
      "NIGHT",
    ]);
  });

  it("phenomenon die uses wind rain sun snow", () => {
    const phenomenon = getTrayWordCube("phenomenon")!;
    expect(phenomenon.role).toBe("phenomenon");
    expect(phenomenon.modes.map((m) => m.faceText)).toEqual([
      "WIND",
      "RAIN",
      "SUN",
      "SNOW",
    ]);
  });

  it("response die uses jacket umbrella sunglasses gloves", () => {
    const response = getTrayWordCube("response")!;
    expect(response.role).toBe("response");
    expect(response.modes.map((m) => m.faceText)).toEqual([
      "JACKET",
      "UMBRELLA",
      "SUNGLASSES",
      "GLOVES",
    ]);
  });

  it("place die carries distinct place faces with face-level tokens", () => {
    const home = getTrayWordCube("home")!;
    expect(home.modes.map((m) => m.faceText)).toEqual([
      "HOME",
      "WORK",
      "OUTSIDE",
      "COMMUTE",
    ]);
  });

  it("mode tokens never expose legacy identity tokens", () => {
    const allModeTokens = ALL_WORD_CUBES.flatMap((cube) =>
      cube.modes.map((m) => m.runtimeToken).filter(Boolean),
    );
    for (const token of LEGACY_IDENTITY_TOKENS) {
      expect(allModeTokens).not.toContain(token);
    }
    expect(allModeTokens).toContain("phenomenon/rain");
    expect(allModeTokens).toContain("response/umbrella");
  });

  it("timer default orientation shows TIMER identity in pool", () => {
    const timer = getTrayWordCube("timer")!;
    expect(timer.modes[0]!.faceText).toBe("TIMER");
  });
});
