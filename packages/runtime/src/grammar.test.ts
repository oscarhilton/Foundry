import { describe, it, expect, beforeEach } from "vitest";
import { FoundryEngine, parseChain, matchRecipe, compileChainToGraph } from "./index.js";
import { getRemainderEdges, hasRemainderEdge } from "./capability-graph.js";

const CORE = "core/core";

function withCore(...definitionIds: string[]) {
  return definitionIds.map((definitionId, i) => ({
    instanceId: `cube-${i}`,
    definitionId,
  })).concat([{ instanceId: "core", definitionId: CORE }]);
}

describe("Grammar — predictable chain outcomes", () => {
  let engine: FoundryEngine;

  beforeEach(() => {
    engine = new FoundryEngine({ dialDefault: 0.5 });
  });

  const cases: Array<{
    name: string;
    chain: ReturnType<typeof withCore>;
    setup?: (e: FoundryEngine) => void;
    assert: (state: ReturnType<FoundryEngine["getOutputState"]>) => void;
    graph?: (parsed: ReturnType<typeof parseChain>) => void;
  }> = [
    {
      name: "London → Weather → LCD",
      chain: withCore("identity/london", "identity/weather", "output/lcd"),
      setup: (e) => e.mockAdapters.setWeather({ temp: 18, rain: 0.4 }),
      assert: (s) => expect(s.lcdText).toBe("London\n12°C · 45% rain"),
    },
    {
      name: "London → Weather → LCD → LCD (load share)",
      chain: [
        { instanceId: "london", definitionId: "identity/london" },
        { instanceId: "weather", definitionId: "identity/weather" },
        { instanceId: "lcd1", definitionId: "output/lcd" },
        { instanceId: "lcd2", definitionId: "output/lcd" },
        { instanceId: "core", definitionId: CORE },
      ],
      setup: (e) => e.mockAdapters.setWeather({ temp: 18, rain: 0.4 }),
      assert: (s) => {
        expect(s.lcdTexts.lcd1).toBe("London\n12°C · 45% rain");
        expect(s.lcdTexts.lcd2).toBe("--");
      },
      graph: (parsed) => {
        const g = compileChainToGraph(parsed);
        expect(getRemainderEdges(g)).toHaveLength(1);
        expect(hasRemainderEdge(g, "lcd1", "lcd2")).toBe(true);
      },
    },
    {
      name: "Temp → LCD → Weather → LCD (positional windows)",
      chain: [
        { instanceId: "temp", definitionId: "sensor/temperature" },
        { instanceId: "lcd1", definitionId: "output/lcd" },
        { instanceId: "weather", definitionId: "identity/weather" },
        { instanceId: "lcd2", definitionId: "output/lcd" },
        { instanceId: "core", definitionId: CORE },
      ],
      setup: (e) => e.mockAdapters.setWeather({ temp: 18, rain: 0.4 }),
      assert: (s) => {
        expect(s.lcdTexts.lcd1).toMatch(/^\d+°C$/);
        expect(s.lcdTexts.lcd2).toBe("18°C · 40% rain");
      },
    },
    {
      name: "London → Weather → Light → LCD",
      chain: withCore(
        "identity/london",
        "identity/weather",
        "output/light",
        "output/lcd",
      ),
      setup: (e) => e.mockAdapters.setWeather({ temp: 18, rain: 0.4 }),
      assert: (s) => {
        expect(s.activeRecipeId).toBe("london-weather-light");
        expect(s.lcdText).toMatch(/London\n12°C · 45% rain/);
        expect(s.lightBrightness).toBeGreaterThan(0.1);
      },
    },
    {
      name: "London → Time → LCD",
      chain: withCore("identity/london", "source/time", "output/lcd"),
      assert: (s) => expect(s.lcdText).toMatch(/^London \d{2}:\d{2}$/),
    },
  ];

  for (const { name, chain, setup, assert, graph } of cases) {
    it(name, () => {
      const parsed = parseChain(chain);
      graph?.(parsed);

      engine.setChain(chain);
      engine.start();
      setup?.(engine);

      assert(engine.getOutputState());
      engine.destroy();
    });
  }
});

describe("Viewport consumption", () => {
  let engine: FoundryEngine;

  beforeEach(() => {
    engine = new FoundryEngine({ dialDefault: 0.5 });
  });

  it("Tokyo → Time → LCD → LCD → London → Weather → LCD", () => {
    engine.setChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd3", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^Tokyo \d{2}:\d{2}$/);
    expect(lcdTexts.lcd2).toBe("--");
    expect(lcdTexts.lcd3).toBe("London\n12°C · 45% rain");

    const snap = engine.getCoreDebugSnapshot();
    expect(snap.viewportTrace).toHaveLength(3);
    expect(snap.viewportTrace[1]?.rendered).toBe("--");

    engine.destroy();
  });

  it("publishes LCD text with distinct targetId per viewport", () => {
    const messages: Array<{ targetId?: string; source: string; value: string }> =
      [];
    const eng = new FoundryEngine({
      onSignal: (msg) => {
        if (msg.topic === "output/lcd/text") {
          messages.push({
            targetId: msg.targetId,
            source: msg.source,
            value: String(msg.value),
          });
        }
      },
    });
    eng.setChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd3", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    eng.start();
    eng.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const lcd1 = messages.filter((m) => m.targetId === "lcd1").pop();
    const lcd2 = messages.filter((m) => m.targetId === "lcd2").pop();
    const lcd3 = messages.filter((m) => m.targetId === "lcd3").pop();
    expect(lcd1?.value).toMatch(/^Tokyo /);
    expect(lcd2?.value).toBe("--");
    expect(lcd3?.value).toBe("London\n12°C · 45% rain");
    expect(lcd1?.source).toBe("core");
    expect(lcd2?.source).toBe("core");
    expect(lcd3?.source).toBe("core");

    eng.destroy();
  });
});

describe("Time transform", () => {
  let engine: FoundryEngine;

  beforeEach(() => {
    engine = new FoundryEngine({ dialDefault: 0.5 });
  });

  it("Tokyo → London → LCD → Time → LCD leaves second LCD empty", () => {
    engine.setChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/Tokyo/);
    expect(lcdTexts.lcd1).toMatch(/London/);
    expect(lcdTexts.lcd2).toBe("--");

    engine.destroy();
  });

  it("Tokyo → Time → LCD → London → Time → LCD shows city-specific times", () => {
    engine.setChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time1", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "time2", definitionId: "source/time" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^Tokyo \d{2}:\d{2}$/);
    expect(lcdTexts.lcd2).toMatch(/^London \d{2}:\d{2}$/);

    engine.destroy();
  });

  it("Time → LCD alone shows wall-clock time", () => {
    engine.setChain(withCore("source/time", "output/lcd"));
    engine.start();

    expect(engine.getOutputState().lcdText).toMatch(/^\d{2}:\d{2}$/);

    engine.destroy();
  });

  it("adds grammar hint for ambiguous place → LCD → Time pattern", () => {
    const chain = parseChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    expect(
      chain.warnings.some((w) => w.includes("put Time after each city")),
    ).toBe(true);
  });

  it("omits grammar hint when Time follows each city", () => {
    const chain = parseChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time1", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "time2", definitionId: "source/time" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    expect(
      chain.warnings.some((w) => w.includes("put Time after each city")),
    ).toBe(false);
  });
});

describe("Weather place binding", () => {
  let engine: FoundryEngine;

  beforeEach(() => {
    engine = new FoundryEngine({ dialDefault: 0.5 });
  });

  it("London → Tokyo → Weather → LCD binds weather to first place", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    expect(engine.getOutputState().lcdText).toBe("London\n12°C · 45% rain");

    engine.destroy();
  });

  it("adds grammar hint for multi-place weather window", () => {
    const chain = parseChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    expect(
      chain.warnings.some((w) =>
        w.includes("place Weather after each city"),
      ),
    ).toBe(true);
  });
});

describe("Grammar — MVP recipes", () => {
  it.each([
    ["london-weather-light", withCore("identity/london", "identity/weather", "output/light")],
    ["weather-dial-light", withCore("identity/london", "identity/weather", "control/dial", "output/light")],
    ["room-motion-chime", withCore("sensor/motion", "output/chime")],
    ["button-chime", withCore("control/button", "output/chime")],
    ["temperature-light", withCore("sensor/temperature", "output/light")],
    ["github-lcd", withCore("source/github", "output/lcd")],
    ["time-calm-light", withCore("source/time", "modifier/calm", "output/light")],
    ["tokyo-weather-music", withCore("identity/tokyo", "identity/weather", "output/music")],
  ] as const)("matches recipe %s", (expectedId, chain) => {
    const recipe = matchRecipe(parseChain(chain));
    expect(recipe?.id).toBe(expectedId);
  });
});
