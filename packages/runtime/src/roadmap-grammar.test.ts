import { describe, it, expect, beforeEach } from "vitest";
import { FoundryEngine, parseChain } from "./index.js";

const CORE = "core/core";

function withCore(...ids: string[]) {
  return ids.map((definitionId, i) => ({
    instanceId: `cube-${i}`,
    definitionId,
  })).concat([{ instanceId: "core", definitionId: CORE }]);
}

describe("roadmap grammar", () => {
  let engine: FoundryEngine;

  beforeEach(() => {
    engine = new FoundryEngine({ dialDefault: 0.5 });
  });

  it("sets light mood for London weather light", () => {
    engine.setChain(
      withCore("identity/london", "identity/weather", "output/light"),
    );
    engine.start();
    expect(engine.getOutputState().lightMood).toBeTruthy();
    expect(engine.getOutputState().lightBrightness).toBeGreaterThan(0.1);
    engine.destroy();
  });

  it("Split weather across two LCDs", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "split", definitionId: "transform/split" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toBe("London\n12°C");
    expect(lcdTexts.lcd2).toBe("45% rain");
    const trace = engine.getCoreDebugSnapshot().viewportTrace;
    expect(trace[0]?.payloadBefore).toEqual(["London", "12°C", "45% rain"]);
    engine.destroy();
  });

  it("gates weather LCD when motion inactive", () => {
    engine.setChain([
      { instanceId: "motion", definitionId: "sensor/motion" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    expect(engine.getOutputState().lcdText).toBe("--");
    const trace = engine.getCoreDebugSnapshot().viewportTrace;
    expect(trace[0]?.motionGate).toBe("inactive");
    engine.mockAdapters.triggerMotion(true);
    expect(engine.getOutputState().lcdText).toMatch(/London/);
    expect(engine.getCoreDebugSnapshot().viewportTrace[0]?.motionGate).toBe(
      "active",
    );
    engine.destroy();
  });

  it("Foundry GitHub LCD uses multiline label", () => {
    engine.setChain(
      withCore("identity/foundry", "source/github", "output/lcd"),
    );
    engine.start();
    expect(engine.getOutputState().lcdText).toMatch(/^Foundry\n\d+ commits$/);
    engine.destroy();
  });

  it("World Desk drives GitHub light and both LCDs", () => {
    engine.setChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "github", definitionId: "source/github" },
      { instanceId: "light", definitionId: "output/light" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    const s = engine.getOutputState();
    expect(s.lcdTexts.lcd1).toMatch(/^Tokyo \d{2}:\d{2}$/);
    expect(s.lcdTexts.lcd2).toMatch(/London/);
    expect(s.lightBrightness).toBeGreaterThan(0.05);
    engine.destroy();
  });

  it("adds split grammar hint for weather and clustered LCDs", () => {
    const chain = parseChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    expect(
      chain.warnings.some((w) => w.includes("add Split before multiple LCDs")),
    ).toBe(true);
  });
});
