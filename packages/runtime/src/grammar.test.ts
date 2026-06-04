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
      assert: (s) => expect(s.lcdText).toBe("12°C 45%"),
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
        expect(s.lcdTexts.lcd1).toBe("12°C 45%");
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
        expect(s.lcdTexts.lcd2).toBe("18°C 40%");
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
        expect(s.lcdText).toMatch(/12°C 45%/);
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
