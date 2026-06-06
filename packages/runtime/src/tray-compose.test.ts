import { describe, it, expect } from "vitest";
import { composeFinalOutput } from "./tray-compose.js";
import { buildTrayCompileContext } from "./intent-resolver.js";
import { createTrayFromPlacements, resolveTraySlotTexts } from "./tray-compile.js";
import { buildWeatherFact } from "./weather-lens.js";

describe("tray-compose", () => {
  it("canonical finalOutput is concise, not slot concatenation", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "morning", activeModeId: "full" },
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
      { slotIndex: 1, cubeId: "morning", activeModeId: "full" },
      { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
      { slotIndex: 3, cubeId: "wear", activeModeId: "light" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildWeatherFact("Home", 12, 0.22);
    const slots = resolveTraySlotTexts(tray, fact, ctx);
    const composed = composeFinalOutput(ctx, fact, slots);

    expect(composed.finalOutput).toBe("Light jacket this morning.");
  });

  it("hints only yields null finalOutput", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 2, cubeId: "umbrella", activeModeId: "any" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const slots = resolveTraySlotTexts(tray, null, ctx);
    const composed = composeFinalOutput(ctx, null, slots);

    expect(composed.finalOutput).toBeNull();
    expect(composed.finalOutputTone).toBe("invalid");
  });
});
