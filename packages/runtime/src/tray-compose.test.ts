import { describe, it, expect } from "vitest";
import {
  composeFinalOutput,
} from "./tray-compose.js";
import { buildTrayCompileContext } from "./intent-resolver.js";
import {
  createTrayFromPlacements,
  resolveTraySlotTexts,
  resolveTrayTranslation,
} from "./tray-compile.js";
import { buildWeatherFact } from "./weather-lens.js";
import type { RunningTimerState } from "./intent-resolver.js";

const NOW = 1_717_632_000_000;

describe("tray-compose — TRAY-115 matrix", () => {
  it("canonical finalOutput is concise, not slot concatenation", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "moment", activeModeId: "morning" },
      { slotIndex: 2, cubeId: "phenomenon", activeModeId: "rain" },
      { slotIndex: 3, cubeId: "response", activeModeId: "umbrella" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildWeatherFact("Home", 12, 0.22);
    const translation = resolveTrayTranslation(tray, fact, ctx);

    expect(translation.finalOutput).toBe("No umbrella needed this morning.");
    expect(translation.finalOutputTone).toBe("answer");
    expect(translation.finalOutput!.length).toBeLessThan(80);
  });

  it("wind + jacket finalOutput uses moment context", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "moment", activeModeId: "morning" },
      { slotIndex: 2, cubeId: "phenomenon", activeModeId: "wind" },
      { slotIndex: 3, cubeId: "response", activeModeId: "jacket" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildWeatherFact("Home", 12, 0.45);
    const translation = resolveTrayTranslation(tray, fact, ctx);

    expect(translation.finalOutput).toBe("Light jacket this morning.");
  });

  it("structural hint yields hint tone", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 2, cubeId: "response", activeModeId: "umbrella" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const translation = resolveTrayTranslation(tray, null, ctx);

    expect(translation.finalOutputTone).toBe("hint");
    expect(translation.finalOutput).toBe("Add weather condition");
  });

  describe("TRAY-108 — hint dominance", () => {
    it("keeps a running timer visible even if an unrelated local hint exists", () => {
      const runningTimer: RunningTimerState = {
        state: "running",
        startedAtMs: NOW - 1000,
        durationMs: 15 * 60 * 1000,
        triggerSlotIndex: 0,
        boundSlots: [0, 1],
        boundSignature: "0:button:button|1:timer:15_min",
      };

      const slots = [
        { kind: "text" as const, value: "Press to ask" },
        { kind: "text" as const, value: "15 MIN" },
        { kind: "text" as const, value: "Take umbrella" },
        { kind: "hint" as const, value: "Add weather condition" },
        { kind: "empty" as const },
      ];

      const ctx = buildTrayCompileContext(
        createTrayFromPlacements([
          { slotIndex: 0, cubeId: "button", activeModeId: "button" },
          { slotIndex: 1, cubeId: "timer", activeModeId: "15_min" },
        ]),
      );
      const composed = composeFinalOutput(ctx, null, slots, {
        runningTimer,
        nowMs: NOW,
      });

      expect(composed.finalOutputTone).toBe("timer");
      expect(composed.finalOutput).toContain("remaining");
    });
  });
});
