import { describe, it, expect, beforeEach } from "vitest";
import {
  FoundryEngine,
  parseChain,
  weatherToBrightness,
  smoothValue,
  matchRecipe,
  isChainPowered,
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
    expect(state.lcdText).toMatch(/^18°C 40% London \d{2}:\d{2}$/);

    engine.destroy();
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
    expect(state.lcdText).toMatch(
      /^18°C 40% London \d{2}:\d{2} 50% \d+%$/,
    );

    engine.destroy();
  });

  it("concatenates temp and time on single LCD", () => {
    engine.setChain(
      withCore("sensor/temperature", "source/time", "output/lcd"),
    );
    engine.start();

    const state = engine.getOutputState();
    expect(state.lcdText).toMatch(/^\d+°C \d{2}:\d{2}$/);

    engine.destroy();
  });

  it("concatenates all segments on single LCD when multiple sources present", () => {
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
    expect(state.lcdText).toMatch(/^\d+°C 18°C 40% \d{2}:\d{2}$/);

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
    expect(state.lcdText).toMatch(/^\d+°C \d+\/hr \d+%$/);

    engine.destroy();
  });

  it("splits temp and weather across two LCDs", () => {
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
    expect(lcdTexts.lcd2).toBe("18°C 40%");

    engine.destroy();
  });

  it("splits temp, weather, and time across three LCDs", () => {
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
    expect(lcdTexts.lcd2).toBe("18°C 40%");
    expect(lcdTexts.lcd3).toMatch(/^\d{2}:\d{2}$/);

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

  it("groups segments across two LCDs when more segments than modules", () => {
    engine.setChain([
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "github", definitionId: "source/github" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "dial", definitionId: "control/dial" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/°C/);
    expect(lcdTexts.lcd1).toMatch(/\/hr/);
    expect(lcdTexts.lcd2).toMatch(/\d{2}:\d{2}/);
    expect(lcdTexts.lcd2).toMatch(/%/);
    expect(`${lcdTexts.lcd1} ${lcdTexts.lcd2}`).toMatch(/18°C 40%/);

    engine.destroy();
  });

  it("broadcasts MOTION to all LCDs then restores split", () => {
    engine.setChain([
      { instanceId: "motion", definitionId: "sensor/motion" },
      { instanceId: "temp", definitionId: "sensor/temperature" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 18, rain: 0.4 });

    engine.mockAdapters.triggerMotion(true);
    let { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toBe("MOTION");
    expect(lcdTexts.lcd2).toBe("MOTION");

    engine.mockAdapters.triggerMotion(false);
    lcdTexts = engine.getOutputState().lcdTexts;
    expect(lcdTexts.lcd1).toMatch(/^\d+°C$/);
    expect(lcdTexts.lcd2).toBe("18°C 40%");

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

  it("splits London and Tokyo times across two LCDs", () => {
    engine.setChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    engine.start();

    const { lcdTexts } = engine.getOutputState();
    expect(lcdTexts.lcd1).toMatch(/^London \d{2}:\d{2}$/);
    expect(lcdTexts.lcd2).toMatch(/^Tokyo \d{2}:\d{2}$/);

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
});
