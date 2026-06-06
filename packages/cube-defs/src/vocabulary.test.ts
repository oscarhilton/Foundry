import { describe, it, expect } from "vitest";
import {
  STARTER_CUBES,
  ALL_WORD_CUBES,
  getTrayWordCube,
} from "./vocabulary.js";

const PLACE_NOUNS = ["HOME", "LONDON", "PARIS", "WORK", "TOKYO"];
const UNRELATED_MOMENTS = ["LEAVING", "BEDTIME", "COOKING", "EVENING"];

describe("vocabulary v2", () => {
  it("starter kit has seven separate word cubes", () => {
    expect(STARTER_CUBES).toHaveLength(7);
    const ids = STARTER_CUBES.map((c) => c.id);
    expect(ids).toEqual([
      "home",
      "morning",
      "weather",
      "umbrella",
      "wear",
      "button",
      "timer",
    ]);
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

  it("no cube bundles alternate place nouns on one die", () => {
    for (const cube of ALL_WORD_CUBES) {
      const faceTexts = cube.modes.map((m) => m.faceText.toUpperCase());
      const distinctPlaceNouns = [
        ...new Set(faceTexts.filter((t) => PLACE_NOUNS.includes(t))),
      ];
      expect(distinctPlaceNouns.length).toBeLessThanOrEqual(1);
    }
  });

  it("morning modes are nuance of morning, not unrelated moments", () => {
    const morning = getTrayWordCube("morning")!;
    for (const m of morning.modes) {
      expect(UNRELATED_MOMENTS).not.toContain(m.label.toUpperCase());
      expect(m.faceText).toBe("MORNING");
    }
  });

  it("weather modes are nuance modes, not alternate source nouns", () => {
    const weather = getTrayWordCube("weather")!;
    const labels = weather.modes.map((m) => m.label);
    expect(labels).toEqual(["Full", "Temp", "Rain", "Wind"]);
    expect(labels).not.toContain("CALENDAR");
    expect(labels).not.toContain("TIME");
  });

  it("umbrella and wear are separate lens cubes", () => {
    expect(getTrayWordCube("umbrella")?.role).toBe("lens");
    expect(getTrayWordCube("wear")?.role).toBe("lens");
    expect(getTrayWordCube("umbrella")?.id).not.toBe(getTrayWordCube("wear")?.id);
  });
});
