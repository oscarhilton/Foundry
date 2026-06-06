import { describe, it, expect } from "vitest";
import { ALL_WORD_CUBES, STARTER_CUBES } from "./vocabulary.js";

const TEMPORAL_FACE_TEXT = new Set([
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "NIGHT",
]);
const PHENOMENON_FACE_TEXT = new Set(["WIND", "RAIN", "SUN", "SNOW"]);
const RESPONSE_FACE_TEXT = new Set([
  "JACKET",
  "UMBRELLA",
  "SUNGLASSES",
  "GLOVES",
]);

describe("TRAY-115 — Global Ecosystem Audit (ALL_WORD_CUBES)", () => {
  it("keeps temporal faces exclusively on moment blocks", () => {
    const offenders = ALL_WORD_CUBES.flatMap((def) =>
      def.modes
        .filter((mode) => TEMPORAL_FACE_TEXT.has(mode.faceText))
        .filter(() => def.role !== "moment")
        .map((mode) => `${def.id}:${mode.faceText}`),
    );
    expect(offenders).toEqual([]);
  });

  it("keeps phenomenon faces exclusively on phenomenon blocks", () => {
    const offenders = ALL_WORD_CUBES.flatMap((def) =>
      def.modes
        .filter((mode) => PHENOMENON_FACE_TEXT.has(mode.faceText))
        .filter(() => def.role !== "phenomenon")
        .map((mode) => `${def.id}:${mode.faceText}`),
    );
    expect(offenders).toEqual([]);
  });

  it("keeps response faces exclusively on response blocks", () => {
    const offenders = ALL_WORD_CUBES.flatMap((def) =>
      def.modes
        .filter((mode) => RESPONSE_FACE_TEXT.has(mode.faceText))
        .filter(() => def.role !== "response")
        .map((mode) => `${def.id}:${mode.faceText}`),
    );
    expect(offenders).toEqual([]);
  });

  it("does not reuse faceText across different axis roles", () => {
    const faceToRoles = new Map<string, Set<string>>();

    for (const def of ALL_WORD_CUBES) {
      for (const mode of def.modes) {
        const roles = faceToRoles.get(mode.faceText) ?? new Set<string>();
        roles.add(def.role);
        faceToRoles.set(mode.faceText, roles);
      }
    }

    const collisions = [...faceToRoles.entries()].filter(
      ([, roles]) => roles.size > 1,
    );
    expect(collisions).toEqual([]);
  });

  it("never treats place cubes as weather phenomena", () => {
    const placeTokens = ALL_WORD_CUBES.filter((def) => def.role === "place")
      .flatMap((def) => def.modes.map((m) => m.runtimeToken).filter(Boolean));

    for (const token of placeTokens) {
      expect(token).toMatch(/^place\//);
    }
  });
});

describe("TRAY-115 — Starter Set Isolation Audit (STARTER_CUBES)", () => {
  it("four rotating axes each have four distinct faceText values", () => {
    for (const id of ["home", "moment", "phenomenon", "response"] as const) {
      const cube = STARTER_CUBES.find((c) => c.id === id)!;
      expect(cube.modes).toHaveLength(4);
      expect(new Set(cube.modes.map((m) => m.faceText)).size).toBe(4);
    }
  });

  it("button is static and timer has duration faces", () => {
    const button = STARTER_CUBES.find((c) => c.id === "button")!;
    const timer = STARTER_CUBES.find((c) => c.id === "timer")!;
    expect(button.modes).toHaveLength(1);
    expect(button.modes[0]!.faceText).toBe("BUTTON");
    expect(timer.modes.map((m) => m.faceText)).toEqual([
      "TIMER",
      "5 MIN",
      "15 MIN",
      "30 MIN",
    ]);
  });

  it("canonical demo faces exist on phenomenon and response cubes", () => {
    const phenomenon = STARTER_CUBES.find((c) => c.id === "phenomenon")!;
    const response = STARTER_CUBES.find((c) => c.id === "response")!;
    expect(phenomenon.modes.some((m) => m.id === "rain")).toBe(true);
    expect(response.modes.some((m) => m.id === "umbrella")).toBe(true);
  });
});
