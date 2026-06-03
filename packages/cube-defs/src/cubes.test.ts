import { describe, it, expect } from "vitest";
import {
  CUBE_DEFINITIONS,
  validateCubeDefinition,
  PRESET_CHAINS,
  isAudioOutput,
  isVisualOutput,
} from "@foundry/cube-defs";

describe("Cube definitions", () => {
  it("defines 17 cubes including Core", () => {
    expect(CUBE_DEFINITIONS.length).toBe(17);
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

  it("has 15 presets", () => {
    expect(PRESET_CHAINS.length).toBe(15);
  });

  it("classifies audio and visual output modalities", () => {
    expect(isAudioOutput("output/music")).toBe(true);
    expect(isAudioOutput("output/chime")).toBe(true);
    expect(isVisualOutput("output/light")).toBe(true);
    expect(isVisualOutput("output/lcd")).toBe(true);
    expect(isAudioOutput("output/light")).toBe(false);
  });
});
