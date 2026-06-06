import { describe, it, expect } from "vitest";
import {
  composeFinalOutput,
  buildTrayTranslation,
  resolveDominantHint,
} from "./tray-compose.js";
import { buildTrayCompileContext } from "./intent-resolver.js";
import {
  createTrayFromPlacements,
  resolveTraySlotTexts,
} from "./tray-compile.js";
import { buildWeatherFact } from "./weather-lens.js";
import type { RunningTimerState } from "./intent-resolver.js";

const NOW = 1_717_632_000_000;

describe("tray-compose", () => {
  it("canonical finalOutput is concise, not slot concatenation", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "morning", activeModeId: "morning" },
      { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
      { slotIndex: 3, cubeId: "umbrella", activeModeId: "any" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildWeatherFact("Home", 12, 0.22);
    const slots = resolveTraySlotTexts(tray, fact, ctx);
    const composed = composeFinalOutput(ctx, fact, slots);

    expect(composed.finalOutput).toBe("No umbrella needed this morning.");
    expect(composed.finalOutputTone).toBe("answer");
    expect(composed.finalOutput!.length).toBeLessThan(80);
    expect(composed.finalOutput).not.toContain("22%");
  });

  it("wear lens finalOutput uses moment context", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "morning", activeModeId: "morning" },
      { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
      { slotIndex: 3, cubeId: "wear", activeModeId: "light" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildWeatherFact("Home", 12, 0.22);
    const slots = resolveTraySlotTexts(tray, fact, ctx);
    const composed = composeFinalOutput(ctx, fact, slots);

    expect(composed.finalOutput).toBe("Light jacket this morning.");
  });

  it("work place face adds for work to final output", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "work" },
      { slotIndex: 1, cubeId: "weather", activeModeId: "full" },
      { slotIndex: 2, cubeId: "umbrella", activeModeId: "any" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildWeatherFact("Work", 14, 0.18);
    const slots = resolveTraySlotTexts(tray, fact, ctx);
    const composed = composeFinalOutput(ctx, fact, slots);

    expect(composed.finalOutput).toBe("No umbrella needed for work.");
  });

  it("structural hint yields hint tone, not null invalid", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 2, cubeId: "umbrella", activeModeId: "any" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const slots = resolveTraySlotTexts(tray, null, ctx);
    const composed = composeFinalOutput(ctx, null, slots);

    expect(composed.finalOutputTone).toBe("hint");
    expect(composed.finalOutput).toBe("Add weather");
  });

  describe("TRAY-111 — lens face output alignment", () => {
    function nowWeatherLensTray(lensCubeId: string, lensModeId = "any") {
      return createTrayFromPlacements([
        { slotIndex: 0, cubeId: "home", activeModeId: "home" },
        { slotIndex: 1, cubeId: "morning", activeModeId: "now" },
        { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
        { slotIndex: 3, cubeId: lensCubeId, activeModeId: lensModeId },
      ]);
    }

    function translateTray(tray: ReturnType<typeof createTrayFromPlacements>) {
      const ctx = buildTrayCompileContext(tray);
      const fact = buildWeatherFact("Home", 12, 0.22);
      return buildTrayTranslation(ctx, resolveTraySlotTexts(tray, fact, ctx), fact);
    }

    it("rain lens does not produce clothing advice", () => {
      const result = translateTray(nowWeatherLensTray("rain"));

      expect(result.finalOutput).not.toContain("jacket");
      expect(result.finalOutput!.toLowerCase()).toContain("rain");
      expect(result.finalOutput).toBe("Rain unlikely right now.");
      expect(result.finalOutputTone).toBe("answer");
      expect(result.localTranslations[3]).toBe("Rain unlikely");
    });

    it("umbrella lens produces umbrella advice for same weather", () => {
      const result = translateTray(nowWeatherLensTray("umbrella"));

      expect(result.finalOutput).toBe("No umbrella needed right now.");
      expect(result.finalOutput).not.toContain("jacket");
    });

    it("wear lens produces clothing advice for same weather", () => {
      const result = translateTray(nowWeatherLensTray("wear", "light"));

      expect(result.finalOutput).toBe("Light jacket right now.");
      expect(result.finalOutput!.toLowerCase()).not.toMatch(/^rain/);
    });

    it("rain and umbrella lenses produce distinct final outputs from same fact", () => {
      const rainResult = translateTray(nowWeatherLensTray("rain"));
      const umbrellaResult = translateTray(nowWeatherLensTray("umbrella"));

      expect(rainResult.finalOutput).not.toEqual(umbrellaResult.finalOutput);
      expect(rainResult.finalOutput).not.toContain("umbrella");
      expect(umbrellaResult.finalOutput).not.toContain("jacket");
    });
  });

  describe("TRAY-108 — hint dominance", () => {
    it("does not synthesize an answer when a local ambiguity hint exists", () => {
      const tray = createTrayFromPlacements([
        { slotIndex: 0, cubeId: "morning", activeModeId: "now" },
        { slotIndex: 1, cubeId: "umbrella", activeModeId: "now" },
        { slotIndex: 2, cubeId: "weather", activeModeId: "wind" },
        { slotIndex: 3, cubeId: "wear", activeModeId: "warm" },
      ]);
      const ctx = buildTrayCompileContext(tray);
      const fact = buildWeatherFact("Home", 12, 0.45);
      const translation = buildTrayTranslation(
        ctx,
        resolveTraySlotTexts(tray, fact, ctx),
        fact,
      );

      expect(translation.finalOutputTone).toBe("hint");
      expect(translation.finalOutput).toBe("Choose umbrella or clothing.");
      expect(translation.finalOutput).not.toContain("right now");
      expect(translation.finalOutput).not.toContain("later");
    });

    it("keeps a running timer visible even if an unrelated local hint exists", () => {
      const runningTimer: RunningTimerState = {
        state: "running",
        startedAtMs: NOW - 1000,
        durationMs: 15 * 60 * 1000,
        triggerSlotIndex: 0,
        boundSlots: [0, 1],
        boundSignature: "0:button:press|1:timer:15_min",
      };

      const slots = [
        { kind: "text" as const, value: "Press to ask" },
        { kind: "text" as const, value: "15 MIN" },
        { kind: "text" as const, value: "Take umbrella later" },
        { kind: "hint" as const, value: "One concern at a time" },
        { kind: "empty" as const },
      ];

      const ctx = buildTrayCompileContext(emptyConflictTray());
      const composed = composeFinalOutput(ctx, null, slots, {
        runningTimer,
        nowMs: NOW,
      });

      expect(composed.finalOutputTone).toBe("timer");
      expect(composed.finalOutput).toContain("remaining");
    });

    it("resolveDominantHint passes through single-lens hints", () => {
      const ctx = buildTrayCompileContext(
        createTrayFromPlacements([
          { slotIndex: 0, cubeId: "umbrella", activeModeId: "any" },
        ]),
      );
      expect(
        resolveDominantHint(ctx, {
          kind: "hint",
          value: "Needs weather",
        }),
      ).toBe("Needs weather");
    });
  });
});

function emptyConflictTray() {
  return createTrayFromPlacements([
    { slotIndex: 0, cubeId: "button", activeModeId: "press" },
    { slotIndex: 1, cubeId: "timer", activeModeId: "15_min" },
    { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
    { slotIndex: 3, cubeId: "umbrella", activeModeId: "any" },
    { slotIndex: 4, cubeId: "wear", activeModeId: "light" },
  ]);
}
