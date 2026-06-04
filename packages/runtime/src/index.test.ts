import { describe, it, expect, beforeEach } from "vitest";
import {
  FoundryEngine,
  parseChain,
  weatherToBrightness,
  smoothValue,
  matchRecipe,
  isChainPowered,
  resolveLightBehaviour,
  type SignalMessage,
} from "./index.js";
import { formatPowerBattery } from "./output-formatters.js";

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

  it("does not warn when light and music are both present", () => {
    const chain = parseChain(
      withCore("output/light", "output/music"),
    );
    expect(chain.visualOutputs).toHaveLength(1);
    expect(chain.audioOutputs).toHaveLength(1);
    expect(
      chain.warnings.some((w) => w.includes("Multiple visual outputs")),
    ).toBe(false);
  });

  it("does not warn when light and LCD are both present", () => {
    const chain = parseChain(withCore("output/light", "output/lcd"));
    expect(
      chain.warnings.some((w) => w.includes("only the last visual")),
    ).toBe(false);
    expect(
      chain.warnings.some((w) => w.includes("Multiple displays share")),
    ).toBe(false);
  });

  it("hints when multiple LCD viewports share upstream segments", () => {
    const chain = parseChain(
      withCore("output/lcd", "output/lcd", "output/lcd"),
    );
    expect(
      chain.warnings.some((w) => w.includes("Multiple displays share")),
    ).toBe(true);
  });

  it("warns when multiple Light cubes are present", () => {
    const chain = parseChain(
      withCore("output/light", "output/light"),
    );
    expect(
      chain.warnings.some((w) => w.includes("Multiple Light cubes")),
    ).toBe(true);
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

  it("does not match London Weather Light without place cube", () => {
    const chain = parseChain(
      withCore("identity/weather", "output/light"),
    );
    expect(matchRecipe(chain)?.id).not.toBe("london-weather-light");
    expect(matchRecipe(chain)).toBeUndefined();
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

  it("matches Rain Motion Chime in Place → Weather → Motion → Chime order", () => {
    const chain = parseChain(
      withCore(
        "identity/london",
        "identity/weather",
        "sensor/motion",
        "output/chime",
      ),
    );
    expect(matchRecipe(chain)?.id).toBe("rain-motion-chime");
  });

  it("does not match rain-motion-chime when Chime is before Motion", () => {
    const chain = parseChain(
      withCore(
        "identity/london",
        "identity/weather",
        "output/chime",
        "sensor/motion",
      ),
    );
    expect(matchRecipe(chain)?.id).not.toBe("rain-motion-chime");
  });

  it("does not match rain-motion-chime when Motion is before Weather", () => {
    const chain = parseChain(
      withCore(
        "sensor/motion",
        "identity/london",
        "identity/weather",
        "output/chime",
      ),
    );
    expect(matchRecipe(chain)?.id).not.toBe("rain-motion-chime");
  });

  it("matches Button Chime", () => {
    const chain = parseChain(withCore("control/button", "output/chime"));
    expect(matchRecipe(chain)?.id).toBe("button-chime");
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

  it("uses Perlin noise for random modifier and publishes modifier/random", () => {
    const signals: SignalMessage[] = [];
    const randomEngine = new FoundryEngine({
      onSignal: (msg) => signals.push({ ...msg }),
    });
    randomEngine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "modifier/random",
        "output/light",
      ),
    );
    randomEngine.start();
    randomEngine.mockAdapters.setWeather({ temp: 20, rain: 0.1 });

    const state1 = randomEngine.getOutputState();
    expect(state1.modifierRandom).not.toBeNull();
    expect(signals.some((s) => s.topic === "modifier/random")).toBe(true);

    const b1 = state1.lightBrightness;
    randomEngine.mockAdapters.setWeather({ temp: 20, rain: 0.11 });
    const b2 = randomEngine.getOutputState().lightBrightness;
    expect(Math.abs(b1 - b2)).toBeLessThan(0.2);

    randomEngine.destroy();
  });

  it("exposes calm Perlin noise while keeping smoothed rain path", () => {
    engine.setChain(
      withCore("identity/london", "identity/weather", "modifier/calm", "output/light"),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.8 });

    const state = engine.getOutputState();
    expect(state.modifierCalmNoise).not.toBeNull();
    expect(state.lightBrightness).toBeGreaterThan(0.05);

    engine.destroy();
  });

  it("shows calm Perlin level on LCD", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "modifier/calm",
        "output/lcd",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.8 });

    const { lcdText, modifierCalmNoise } = engine.getOutputState();
    expect(modifierCalmNoise).not.toBeNull();
    expect(lcdText).toMatch(/^London\n12°C · 45% rain CALM \d+%$/);

    engine.destroy();
  });

  it("shows random Perlin level on LCD", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "modifier/random",
        "output/lcd",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 20, rain: 0.1 });

    const { lcdText, modifierRandom } = engine.getOutputState();
    expect(modifierRandom).not.toBeNull();
    expect(lcdText).toMatch(/^London\n12°C · 45% rain RND \d+%$/);

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

  it("fires chime on motion when rainy for rain-motion-chime", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "sensor/motion",
        "output/chime",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 12, rain: 0.8 });

    engine.mockAdapters.triggerMotion(true);
    expect(engine.getOutputState().chimeCount).toBe(1);

    engine.destroy();
  });

  it("does not fire chime on motion when dry for rain-motion-chime", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "sensor/motion",
        "output/chime",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 20, rain: 0.1 });

    engine.mockAdapters.triggerMotion(true);
    expect(engine.getOutputState().chimeCount).toBe(0);

    engine.destroy();
  });

  it("does not fire chime when Chime is upstream of Motion", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "output/chime",
        "sensor/motion",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 12, rain: 0.8 });

    engine.mockAdapters.triggerMotion(true);
    expect(engine.getOutputState().chimeCount).toBe(0);

    engine.destroy();
  });

  it("does not fire chime when Motion is upstream of Weather", () => {
    engine.setChain(
      withCore(
        "sensor/motion",
        "identity/london",
        "identity/weather",
        "output/chime",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 12, rain: 0.8 });

    engine.mockAdapters.triggerMotion(true);
    expect(engine.getOutputState().chimeCount).toBe(0);

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

  it("fires chime only when circuit closes, not when opening", () => {
    engine.setChain(withCore("control/button", "output/chime"));
    engine.start();

    engine.triggerButton();
    expect(engine.getOutputState().chimeCount).toBe(1);

    engine.triggerButton();
    expect(engine.getOutputState().chimeCount).toBe(1);

    engine.triggerButton();
    expect(engine.getOutputState().chimeCount).toBe(2);

    engine.destroy();
  });

  it("button-light toggles brightness and LCD telemetry", () => {
    const chain = withCore("control/button", "output/light", "output/lcd");
    engine.setChain(chain);
    engine.start();

    const parsed = parseChain(chain);
    expect(resolveLightBehaviour(parsed)).toBe("button-light");

    let state = engine.getOutputState();
    expect(state.activeRecipeName).toBe("Button Light");
    expect(state.lightBrightness).toBeCloseTo(0.02, 2);
    const lcdId = "cube-2";
    expect(state.lcdTexts[lcdId]).toBe("Light\n2%");

    engine.triggerButton();
    state = engine.getOutputState();
    expect(state.buttonCircuitClosed).toBe(true);
    expect(state.lightBrightness).toBeCloseTo(1, 2);
    expect(state.lcdTexts[lcdId]).toBe("Light\n100%");

    engine.triggerButton();
    state = engine.getOutputState();
    expect(state.buttonCircuitClosed).toBe(false);
    expect(state.lightBrightness).toBeCloseTo(0.02, 2);
    expect(state.lcdTexts[lcdId]).toBe("Light\n2%");

    const snap = engine.getCoreDebugSnapshot();
    const lcdStep = snap.viewportTrace.find((s) => s.targetId === lcdId);
    expect(lcdStep?.rendered).toBe("Light\n2%");

    engine.destroy();
  });

  it("shows OPEN on LCD for button without light", () => {
    engine.setChain(withCore("control/button", "output/lcd"));
    engine.start();

    const lcdId = "cube-1";
    expect(engine.getOutputState().lcdTexts[lcdId]).toBe("OPEN");

    engine.triggerButton();
    expect(engine.getOutputState().lcdTexts[lcdId]).toBe("CLOSED");

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
    expect(snap.lightOutput?.mode).toBe("Weather Mood");

    engine.destroy();
  });

  it("does not publish github/activity when github is not in chain", () => {
    const signals: SignalMessage[] = [];
    engine.destroy();
    engine = new FoundryEngine({
      onSignal: (msg) => signals.push(msg),
    });
    engine.setChain(withCore("sensor/temperature", "output/light"));
    engine.start();

    expect(signals.some((m) => m.topic === "github/activity")).toBe(false);

    engine.destroy();
  });

  it("publishes light brightness with source core and light targetId", () => {
    const signals: SignalMessage[] = [];
    engine.destroy();
    engine = new FoundryEngine({
      onSignal: (msg) => signals.push(msg),
    });
    engine.setChain([
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "light", definitionId: "output/light" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const lightMsg = signals.find((m) => m.topic === "output/light/brightness");
    expect(lightMsg?.source).toBe("core");
    expect(lightMsg?.targetId).toBe("light");

    engine.destroy();
  });

  it("includes github light output in core debug snapshot", () => {
    engine.setChain(
      withCore("source/github", "output/light"),
    );
    engine.start();
    const snap = engine.getCoreDebugSnapshot();
    expect(snap.lightOutput?.mode).toBe("GitHub Activity");
    expect(snap.lightOutput?.driverSummary).toContain("github/activity");

    engine.destroy();
  });

  it("shows power status on LCD for Core + LCD only chain", () => {
    engine.setChain(withCore("output/lcd"));
    engine.start();

    const state = engine.getOutputState();
    expect(state.lcdText).toBe("PWR USB 100%");

    engine.destroy();
  });

  it("shows time on LCD for time preset chain", () => {
    engine.setChain(withCore("source/time", "output/lcd"));
    engine.start();

    const state = engine.getOutputState();
    expect(state.lcdText).toMatch(/^\d{2}:\d{2}$/);

    engine.destroy();
  });

  it("shows temperature on LCD for temperature preset chain", () => {
    engine.setChain(withCore("sensor/temperature", "output/lcd"));
    engine.start();

    const state = engine.getOutputState();
    expect(state.lcdText).toMatch(/^\d+°C$/);

    engine.destroy();
  });

  it("shows weather on LCD for weather preset chain", () => {
    engine.setChain(
      withCore("identity/london", "identity/weather", "output/lcd"),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const state = engine.getOutputState();
    expect(state.lcdText).toBe("London\n12°C · 45% rain");

    engine.destroy();
  });

  it("does not republish unchanged output/lcd/text for a viewport", () => {
    const lcdSignals: SignalMessage[] = [];
    const eng = new FoundryEngine({
      dialDefault: 0.65,
      onSignal: (msg) => {
        if (msg.topic === "output/lcd/text") lcdSignals.push(msg);
      },
    });
    eng.setChain(withCore("source/time", "output/lcd"));
    eng.start();
    const countAfterStart = lcdSignals.length;
    expect(countAfterStart).toBeGreaterThan(0);

    eng.setDialPosition(0.65);
    expect(lcdSignals.length).toBe(countAfterStart);

    eng.destroy();
  });

  it("shows weather on LCD in composite weather-dial-light chain", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "control/dial",
        "output/light",
        "output/lcd",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("weather-dial-light");
    expect(state.lcdText).toBe("London\n12°C · 45% rain 50% 40%");

    engine.destroy();
  });

  it("omits time on LCD when time shares a window with other signals (no places)", () => {
    engine.setChain(
      withCore("sensor/temperature", "source/time", "output/lcd"),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.lcdText).toMatch(/^\d+°C$/);

    engine.destroy();
  });

  it("omits time when mixed with weather on one LCD", () => {
    engine.setChain(
      withCore(
        "sensor/temperature",
        "identity/weather",
        "source/time",
        "output/lcd",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const state = engine.getOutputState();
    expect(state.lcdText).toMatch(/^\d+°C 18°C · 40% rain$/);

    engine.destroy();
  });

  it("shows MOTION on LCD while motion is active", () => {
    engine.setChain(withCore("sensor/motion", "sensor/temperature", "output/lcd"));
    engine.start();

    engine.mockAdapters.triggerMotion(true);
    expect(engine.getOutputState().lcdText).toBe("MOTION");

    engine.mockAdapters.triggerMotion(false);
    expect(engine.getOutputState().lcdText).toMatch(/^\d+°C$/);

    engine.destroy();
  });

  it("does not MOTION-broadcast when weather is in chain", () => {
    engine.setChain([
      { instanceId: "motion", definitionId: "sensor/motion" },
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    engine.mockAdapters.triggerMotion(true);
    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^\d+°C$/);
    expect(lcdTexts.lcd2).toMatch(/18°C · 40% rain/);

    engine.destroy();
  });

  it("concatenates temp and github on single LCD when both are in chain", () => {
    engine.setChain(
      withCore(
        "source/github",
        "sensor/temperature",
        "output/lcd",
        "output/light",
      ),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("temperature-light");
    expect(state.lcdText).toMatch(/^\d+°C Foundry\n\d+ commits$/);

    engine.destroy();
  });

  it("splits temp and weather across consecutive LCDs", () => {
    engine.setChain([
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^\d+°C$/);
    expect(lcdTexts.lcd2).toBe("18°C · 40% rain");

    engine.destroy();
  });

  it("splits London weather across three LCDs when Split is present", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "split", definitionId: "transform/split" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "lcd3", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toBe("London");
    expect(lcdTexts.lcd2).toBe("12°C");
    expect(lcdTexts.lcd3).toBe("45% rain");

    engine.destroy();
  });

  it("combines split weather on a single LCD", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "split", definitionId: "transform/split" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    expect(engine.getOutputState().lcdText).toBe("London\n12°C · 45% rain");

    engine.destroy();
  });

  it("splits weather without place across two LCDs", () => {
    engine.setChain([
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "split", definitionId: "transform/split" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toBe("18°C");
    expect(lcdTexts.lcd2).toBe("40% rain");

    engine.destroy();
  });

  it("splits upstream segments one per LCD when modules precede an LCD cluster", () => {
    engine.setChain([
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "lcd3", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^\d+°C$/);
    expect(lcdTexts.lcd2).toBe("18°C · 40% rain");
    expect(lcdTexts.lcd3).toBe("--");

    engine.destroy();
  });

  it("shows placeholder on extra LCDs when segments run out", () => {
    engine.setChain([
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^\d+°C$/);
    expect(lcdTexts.lcd2).toBe("--");

    engine.destroy();
  });

  it("splits segments across LCDs when modules are interleaved", () => {
    engine.setChain([
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "github", definitionId: "source/github" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "dial", definitionId: "control/dial" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/°C/);
    expect(lcdTexts.lcd1).toMatch(/commits/);
    expect(lcdTexts.lcd1).toMatch(/18°C · 40% rain/);
    expect(lcdTexts.lcd2).toMatch(/%/);

    engine.destroy();
  });

  it("shares weather dial and light across LCD cluster with random backfill", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "dial", definitionId: "control/dial" },
      { instanceId: "light", definitionId: "output/light" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "lcd3", definitionId: "output/lcd" },
      { instanceId: "lcd4", definitionId: "output/lcd" },
      { instanceId: "random", definitionId: "modifier/random" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 21, rain: 0.68 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toBe("London\n12°C · 45% rain");
    expect(lcdTexts.lcd2).toBe("50%");
    expect(lcdTexts.lcd3).toMatch(/^\d+%$/);
    expect(lcdTexts.lcd4).toMatch(/^RND \d+%$/);

    engine.destroy();
  });

  it("backfills empty LCD slots from downstream modules", () => {
    engine.setChain([
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "random", definitionId: "modifier/random" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^RND \d+%$/);
    expect(lcdTexts.lcd2).toBe("--");

    engine.destroy();
  });

  it("drops extra suffix segments when fewer empty LCD slots remain", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "random", definitionId: "modifier/random" },
      { instanceId: "calm", definitionId: "modifier/calm" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toBe("London\n12°C · 45% rain");
    expect(lcdTexts.lcd2).toMatch(/^CALM \d+%$/);

    engine.destroy();
  });

  it("restores positional LCD windows after motion clears", () => {
    engine.setChain([
      { instanceId: "motion", definitionId: "sensor/motion" },
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    engine.mockAdapters.triggerMotion(true);
    let { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^\d+°C$/);
    expect(lcdTexts.lcd2).toMatch(/18°C · 40% rain/);

    engine.mockAdapters.triggerMotion(false);
    lcdTexts = engine.getOutputState().lcdTexts;
    expect(lcdTexts.lcd1).toMatch(/^\d+°C$/);
    expect(lcdTexts.lcd2).toBe("18°C · 40% rain");

    engine.destroy();
  });

  it("shows weather on LCD when LCD is in weather-dial-light chain", () => {
    engine.setChain(
      withCore(
        "identity/london",
        "identity/weather",
        "control/dial",
        "output/light",
        "output/lcd",
      ),
    );
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("weather-dial-light");
    expect(state.lcdText).toBe("London\n12°C · 45% rain 50% 40%");
    expect(state.lightBrightness).toBeGreaterThan(0.1);

    engine.destroy();
  });

  it("shows temperature on LCD when LCD is in temperature chain", () => {
    engine.setChain(withCore("sensor/temperature", "output/lcd"));
    engine.start();

    const state = engine.getOutputState();
    expect(state.lcdText).toMatch(/^\d+°C$/);

    engine.destroy();
  });

  it("shows temperature on LCD for temperature-light chain", () => {
    engine.setChain(
      withCore("sensor/temperature", "output/lcd", "output/light"),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("temperature-light");
    expect(state.lcdText).toMatch(/^\d+°C$/);

    engine.destroy();
  });

  it("concatenates temperature and github on LCD when both are in chain", () => {
    engine.setChain(
      withCore(
        "source/github",
        "sensor/temperature",
        "output/lcd",
        "output/light",
      ),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.activeRecipeId).toBe("temperature-light");
    expect(state.lcdText).toMatch(/^\d+°C Foundry\n\d+ commits$/);

    engine.destroy();
  });

  it("formats battery power label", () => {
    expect(formatPowerBattery("usb", 100)).toBe("PWR USB 100%");
    expect(formatPowerBattery("battery", 87)).toBe("BAT 87%");
  });

  it("shows battery on LCD when power source is battery", () => {
    engine.setChain(withCore("output/lcd"));
    engine.start();
    engine.setPowerSource("battery");
    engine.setBatteryPercent(87);

    expect(engine.getOutputState().lcdText).toBe("BAT 87%");

    engine.destroy();
  });

  it("publishes core/power on chain bind", () => {
    const messages: SignalMessage[] = [];
    const powerEngine = new FoundryEngine({
      onSignal: (msg) => messages.push(msg),
    });
    powerEngine.setChain(withCore("output/lcd"));
    powerEngine.start();

    const powerMsg = messages.find((m) => m.topic === "core/power");
    expect(powerMsg?.value).toBe("PWR USB 100%");
    expect(powerMsg?.source).toBe("core");

    powerEngine.setPowerSource("battery");
    powerEngine.setBatteryPercent(72);
    const batteryMsg = messages.filter((m) => m.topic === "core/power").pop();
    expect(batteryMsg?.value).toBe("BAT 72%");

    powerEngine.destroy();
  });

  it("uses London mock weather baseline when London is in chain", () => {
    engine.setChain(
      withCore("identity/london", "identity/weather", "output/light"),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.placeId).toBe("identity/london");
    expect(state.placeTimezone).toBe("Europe/London");
    expect(state.weatherTemp).not.toBeNull();
    expect(state.weatherTemp!).toBeLessThan(20);

    engine.destroy();
  });

  it("uses Tokyo mock weather baseline when Tokyo is in chain", () => {
    engine.setChain(
      withCore("identity/tokyo", "identity/weather", "output/light"),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.placeId).toBe("identity/tokyo");
    expect(state.weatherTemp).not.toBeNull();
    expect(state.weatherTemp!).toBeGreaterThan(16);

    engine.destroy();
  });

  it("updates weather when place cube is swapped", () => {
    engine.setChain(
      withCore("identity/london", "identity/weather", "output/light"),
    );
    engine.start();
    const londonTemp = engine.getOutputState().weatherTemp;

    engine.setChain(
      withCore("identity/tokyo", "identity/weather", "output/light"),
    );
    const tokyoTemp = engine.getOutputState().weatherTemp;

    expect(londonTemp).not.toBeNull();
    expect(tokyoTemp).not.toBeNull();
    expect(tokyoTemp!).toBeGreaterThan(londonTemp!);

    engine.destroy();
  });

  it("publishes time in place timezone without Time cube", () => {
    engine.setChain(withCore("identity/london", "output/light"));
    engine.start();

    const state = engine.getOutputState();
    expect(state.placeTimezone).toBe("Europe/London");
    expect(state.timeHour).not.toBeNull();

    engine.destroy();
  });

  it("shows London and Tokyo local times on single LCD", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const { lcdText } = engine.getOutputState();
    expect(lcdText).toMatch(/^London \d{2}:\d{2} Tokyo \d{2}:\d{2}$/);

    engine.destroy();
  });

  it("splits London and Tokyo times across two LCDs when interleaved", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "time1", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time2", definitionId: "source/time" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^London \d{2}:\d{2}$/);
    expect(lcdTexts.lcd2).toMatch(/^Tokyo \d{2}:\d{2}$/);

    engine.destroy();
  });

  it("shows Tokyo time and London weather on positional LCD windows", () => {
    engine.setChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 24, rain: 0.08 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^Tokyo \d{2}:\d{2}$/);
    expect(lcdTexts.lcd2).toBe("London\n12°C · 45% rain");
    expect(lcdTexts.lcd2).not.toMatch(/\d{2}:\d{2}/);

    engine.destroy();
  });

  it("shows single London time on LCD without duplicate label", () => {
    engine.setChain(
      withCore("identity/london", "source/time", "output/lcd"),
    );
    engine.start();

    const { lcdText } = engine.getOutputState();
    expect(lcdText).toMatch(/^London \d{2}:\d{2}$/);

    engine.destroy();
  });

  it("allows light and music in the same chain without light conflict warning", () => {
    engine.setChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "light", definitionId: "output/light" },
      { instanceId: "music", definitionId: "output/music" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 22, rain: 0.2 });

    const state = engine.getOutputState();
    expect(
      state.warnings.some((w) => w.includes("Multiple Light cubes")),
    ).toBe(false);
    expect(state.musicNote).not.toBeNull();
    expect(state.activeRecipeId).toBe("tokyo-weather-music");
    expect(state.lightMood).toBeTruthy();
    expect(state.lightBrightness).toBeGreaterThan(0.05);

    engine.destroy();
  });

  it("publishes music signals with the music cube instance id", () => {
    const signals: SignalMessage[] = [];
    engine.destroy();
    engine = new FoundryEngine({
      onSignal: (msg) => signals.push(msg),
    });
    engine.setChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "music", definitionId: "output/music" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 22, rain: 0.2 });

    const noteMsg = signals.find((m) => m.topic === "output/music/note");
    expect(noteMsg?.source).toBe("music");

    engine.destroy();
  });
});
