import { describe, it, expect, beforeEach } from "vitest";
import {
  FoundryEngine,
  parseChain,
  weatherToBrightness,
  smoothValue,
  matchRecipe,
  isChainPowered,
} from "./index.js";

const CORE = "core/core";

function makeChain(...definitionIds: string[]) {
  return definitionIds.map((definitionId, i) => ({
    instanceId: `cube-${i}`,
    definitionId,
  }));
}

function withCore(...definitionIds: string[]) {
  return makeChain(...definitionIds, CORE);
}

describe("ChainParser", () => {
  it("assigns roles from cube definitions", () => {
    const chain = parseChain(
      withCore("identity/london", "identity/weather", "output/light"),
    );
    expect(chain.place?.definition.label).toBe("London");
    expect(chain.sources).toHaveLength(1);
    expect(chain.outputs).toHaveLength(1);
    expect(chain.powered).toBe(true);
  });

  it("warns on unknown cubes", () => {
    const chain = parseChain([
      { instanceId: "x", definitionId: "unknown/foo" },
    ]);
    expect(chain.warnings.length).toBeGreaterThan(0);
  });

  it("is unpowered without Core", () => {
    const chain = parseChain(
      makeChain("identity/london", "identity/weather", "output/light"),
    );
    expect(isChainPowered(chain)).toBe(false);
    expect(chain.warnings.some((w) => w.includes("unpowered"))).toBe(true);
  });

  it("is unpowered with multiple Core cubes", () => {
    const chain = parseChain(
      makeChain("output/light", CORE, CORE),
    );
    expect(isChainPowered(chain)).toBe(false);
  });
});

describe("Recipes", () => {
  it("matches London Weather Light when powered", () => {
    const chain = parseChain(
      withCore("identity/london", "identity/weather", "output/light"),
    );
    const recipe = matchRecipe(chain);
    expect(recipe?.id).toBe("london-weather-light");
  });

  it("does not match without Core", () => {
    const chain = parseChain(
      makeChain("identity/london", "identity/weather", "output/light"),
    );
    expect(matchRecipe(chain)).toBeUndefined();
  });

  it("matches Weather Dial Light", () => {
    const chain = parseChain(
      withCore(
        "identity/london",
        "identity/weather",
        "control/dial",
        "output/light",
      ),
    );
    const recipe = matchRecipe(chain);
    expect(recipe?.id).toBe("weather-dial-light");
  });

  it("matches Room Motion Chime", () => {
    const chain = parseChain(withCore("sensor/motion", "output/chime"));
    const recipe = matchRecipe(chain);
    expect(recipe?.id).toBe("room-motion-chime");
  });

  it("matches Button Chime", () => {
    const chain = parseChain(withCore("control/button", "output/chime"));
    expect(matchRecipe(chain)?.id).toBe("button-chime");
  });

  it("matches Time LCD", () => {
    const chain = parseChain(withCore("source/time", "output/lcd"));
    expect(matchRecipe(chain)?.id).toBe("time-lcd");
  });

  it("matches Temperature LCD", () => {
    const chain = parseChain(withCore("sensor/temperature", "output/lcd"));
    expect(matchRecipe(chain)?.id).toBe("temperature-lcd");
  });

  it("matches Weather LCD", () => {
    const chain = parseChain(
      withCore("identity/london", "identity/weather", "output/lcd"),
    );
    expect(matchRecipe(chain)?.id).toBe("weather-lcd");
  });
});

describe("Signal utilities", () => {
  it("maps weather to brightness", () => {
    const sunny = weatherToBrightness(22, 0);
    const rainy = weatherToBrightness(8, 0.9);
    expect(sunny).toBeGreaterThan(rainy);
  });

  it("smooths values for calm modifier", () => {
    const first = smoothValue(1, 0, 0.5);
    expect(first).toBe(0.5);
    const second = smoothValue(1, first, 0.5);
    expect(second).toBeGreaterThan(first);
  });
});

describe("FoundryEngine", () => {
  let engine: FoundryEngine;

  beforeEach(() => {
    engine = new FoundryEngine({ dialDefault: 0.5 });
  });

  it("runs London Weather Light recipe when powered", () => {
    engine.setChain(
      withCore("identity/london", "identity/weather", "output/light"),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 20, rain: 0.1 });

    const state = engine.getOutputState();
    expect(state.powered).toBe(true);
    expect(state.activeRecipeId).toBe("london-weather-light");
    expect(state.lightBrightness).toBeGreaterThan(0.1);
    expect(state.placeLabel).toBe("London");

    engine.destroy();
  });

  it("stays unpowered without Core", () => {
    engine.setChain(
      makeChain("identity/london", "identity/weather", "output/light"),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 20, rain: 0.1 });

    const state = engine.getOutputState();
    expect(state.powered).toBe(false);
    expect(state.activeRecipeId).toBeNull();
    expect(state.lightBrightness).toBeLessThan(0.05);

    engine.destroy();
  });

  it("scales light with dial in Weather Dial Light", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "control/dial",
        "output/light",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.2 });

    engine.setDialPosition(0);
    const dim = engine.getOutputState().lightBrightness;

    engine.setDialPosition(1);
    const bright = engine.getOutputState().lightBrightness;

    expect(bright).toBeGreaterThan(dim);
    engine.destroy();
  });

  it("fires chime on motion rising edge when powered", () => {
    engine.setChain(withCore("sensor/motion", "output/chime"));
    engine.start();

    engine.mockAdapters.triggerMotion(true);
    expect(engine.getOutputState().chimeCount).toBe(1);

    engine.destroy();
  });

  it("fires chime on button when powered", () => {
    engine.setChain(withCore("control/button", "output/chime"));
    engine.start();

    engine.triggerButton();
    expect(engine.getOutputState().chimeCount).toBe(1);

    engine.destroy();
  });

  it("does not fire chime when unpowered", () => {
    engine.setChain(makeChain("control/button", "output/chime"));
    engine.start();

    engine.triggerButton();
    expect(engine.getOutputState().chimeCount).toBe(0);

    engine.destroy();
  });

  it("provides core debug snapshot", () => {
    engine.setChain(
      withCore("identity/london", "identity/weather", "output/light"),
    );
    engine.start();
    const snap = engine.getCoreDebugSnapshot();
    expect(snap.powered).toBe(true);
    expect(snap.discovered.length).toBe(4);
    expect(snap.discovered[0].address).toMatch(/^0x/);

    engine.destroy();
  });

  it("shows time on LCD for Time LCD recipe", () => {
    engine.setChain(withCore("source/time", "output/lcd"));
    engine.start();

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("time-lcd");
    expect(state.lcdText).toMatch(/^\d{2}:\d{2}$/);

    engine.destroy();
  });

  it("shows temperature on LCD for Temperature LCD recipe", () => {
    engine.setChain(withCore("sensor/temperature", "output/lcd"));
    engine.start();

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("temperature-lcd");
    expect(state.lcdText).toMatch(/^\d+°C$/);

    engine.destroy();
  });

  it("shows weather on LCD for Weather LCD recipe", () => {
    engine.setChain(
      withCore("identity/london", "identity/weather", "output/lcd"),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("weather-lcd");
    expect(state.lcdText).toBe("18°C 40%");

    engine.destroy();
  });

  it("shows weather on display when display is in weather-dial-light chain", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "control/dial",
        "output/light",
        "output/display",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("weather-dial-light");
    expect(state.displayText).toBe("18°C 40%");
    expect(state.lightBrightness).toBeGreaterThan(0.1);

    engine.destroy();
  });

  it("shows temperature on display when display is in temperature chain", () => {
    engine.setChain(
      withCore("identity/tokyo", "sensor/temperature", "output/display"),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.displayText).toMatch(/^\d+°C$/);

    engine.destroy();
  });

  it("shows temperature on display for temperature-light chain", () => {
    engine.setChain(
      withCore("sensor/temperature", "output/display", "output/light"),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("temperature-light");
    expect(state.displayText).toMatch(/^\d+°C$/);

    engine.destroy();
  });

  it("prefers temperature over github on display when both are in chain", () => {
    engine.setChain(
      withCore(
        "source/github",
        "sensor/temperature",
        "output/display",
        "output/light",
      ),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("temperature-light");
    expect(state.displayText).toMatch(/^\d+°C$/);

    engine.destroy();
  });
});
