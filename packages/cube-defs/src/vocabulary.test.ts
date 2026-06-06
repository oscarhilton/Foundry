import { describe, it, expect } from "vitest";
import {
  STARTER_CUBES,
  ALL_WORD_CUBES,
  STARTER_POOL_ORDER,
  getTrayWordCube,
  orderedStarterPool,
} from "./vocabulary.js";

const LEGACY_IDENTITY_TOKENS = ["identity/hallway", "identity/london"];

describe("vocabulary v2", () => {
  it("starter kit has eight separate word cubes", () => {
    expect(STARTER_CUBES).toHaveLength(8);
    const ids = STARTER_CUBES.map((c) => c.id);
    expect(ids).toContain("rain");
    expect(ids).toContain("umbrella");
    expect(ids).toContain("wear");
  });

  it("starter pool order is grammar-biased", () => {
    expect(STARTER_POOL_ORDER).toEqual([
      "home",
      "morning",
      "weather",
      "rain",
      "umbrella",
      "wear",
      "button",
      "timer",
    ]);
    expect(orderedStarterPool()).toHaveLength(8);
    expect(orderedStarterPool()[3]!.id).toBe("rain");
  });

  it("wear die has clothing modes only, not rain", () => {
    const wear = getTrayWordCube("wear")!;
    expect(wear.modes.map((m) => m.id)).toEqual([
      "light",
      "warm",
      "coat",
      "smart",
    ]);
  });

  it("rain lens is a separate starter cube", () => {
    const rain = getTrayWordCube("rain")!;
    expect(rain.role).toBe("lens");
    expect(rain.word).toBe("RAIN");
    expect(rain.runtimeToken).toBe("lens/rain");
  });

  it("each starter cube has four modes", () => {
    for (const cube of STARTER_CUBES) {
      expect(cube.modes).toHaveLength(4);
    }
  });

  it("morning is moment role, not control", () => {
    const morning = getTrayWordCube("morning")!;
    expect(morning.role).toBe("moment");
  });

  it("place die carries distinct place faces with face-level tokens", () => {
    const home = getTrayWordCube("home")!;
    expect(home.role).toBe("place");
    expect(home.modes.map((m) => m.faceText)).toEqual([
      "HOME",
      "WORK",
      "OUTSIDE",
      "COMMUTE",
    ]);
    expect(home.modes.map((m) => m.runtimeToken)).toEqual([
      "place/home",
      "place/work",
      "place/outside",
      "place/commute",
    ]);
  });

  it("moment die carries distinct temporal faces, not place context", () => {
    const morning = getTrayWordCube("morning")!;
    expect(morning.role).toBe("moment");
    expect(morning.modes.map((m) => m.faceText)).toEqual([
      "MORNING",
      "NOW",
      "LATER",
      "EVENING",
    ]);
    expect(morning.modes.map((m) => m.runtimeToken)).toEqual([
      "moment/morning",
      "moment/now",
      "moment/later",
      "moment/evening",
    ]);
  });

  it("mode tokens never expose legacy identity tokens", () => {
    const allModeTokens = ALL_WORD_CUBES.flatMap((cube) =>
      cube.modes.map((m) => m.runtimeToken).filter(Boolean),
    );
    for (const token of LEGACY_IDENTITY_TOKENS) {
      expect(allModeTokens).not.toContain(token);
    }
    expect(allModeTokens).toContain("place/home");
    expect(allModeTokens).toContain("source/weather");
  });

  it("weather modes are nuance modes, not alternate source nouns", () => {
    const weather = getTrayWordCube("weather")!;
    const labels = weather.modes.map((m) => m.label);
    expect(labels).toEqual(["Full", "Temp", "Rain", "Wind"]);
    expect(labels).not.toContain("CALENDAR");
    expect(labels).not.toContain("TIME");
  });

  it("timer default orientation shows TIMER identity in pool", () => {
    const timer = getTrayWordCube("timer")!;
    expect(timer.modes[0]!.id).toBe("timer");
    expect(timer.modes[0]!.faceText).toBe("TIMER");
    expect(timer.word).toBe("TIMER");
  });
});
