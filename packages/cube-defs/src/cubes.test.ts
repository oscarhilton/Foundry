import { describe, it, expect } from "vitest";
import {
  CUBE_DEFINITIONS,
  validateCubeDefinition,
  PRESET_CHAINS,
  isAudioOutput,
  isVisualOutput,
} from "@foundry/cube-defs";

describe("Cube definitions", () => {
  it("defines all catalog cubes including Core", () => {
    expect(CUBE_DEFINITIONS.length).toBeGreaterThanOrEqual(17);
  });

  it("validates all cube definitions", () => {
    for (const cube of CUBE_DEFINITIONS) {
      const errors = validateCubeDefinition(cube);
      expect(errors, `${cube.id}: ${errors.join(", ")}`).toEqual([]);
    }
  });

  it("includes new module types", () => {
    const ids = [
      "identity/tokyo",
      "source/time",
      "modifier/random",
      "control/button",
      "control/slider",
      "output/music",
      "output/lcd",
      "sensor/temperature",
    ];
    for (const id of ids) {
      expect(CUBE_DEFINITIONS.some((c) => c.id === id)).toBe(true);
    }
  });

  it("all presets include Core", () => {
    for (const preset of PRESET_CHAINS) {
      expect(preset.cubes[preset.cubes.length - 1]).toBe("core/core");
    }
  });

  it("has hero and workshop presets", () => {
    expect(PRESET_CHAINS.length).toBeGreaterThanOrEqual(15);
  });

  it("includes hero showcase presets", () => {
    const showcaseIds = [
      "morning-check",
      "doorway-signal",
      "kitchen-timer",
      "hallway-clothing-display",
      "dual-weather-clothing",
    ];
    for (const id of showcaseIds) {
      expect(PRESET_CHAINS.some((p) => p.id === id)).toBe(true);
    }
  });

  it("classifies audio and visual output modalities", () => {
    expect(isAudioOutput("output/music")).toBe(true);
    expect(isAudioOutput("output/chime")).toBe(true);
    expect(isVisualOutput("output/light")).toBe(true);
    expect(isVisualOutput("output/lcd")).toBe(true);
    expect(isAudioOutput("output/light")).toBe(false);
  });
});
