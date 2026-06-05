import { describe, it, expect } from "vitest";
import { parseChain } from "./chain-parser.js";
import {
  resolveWeatherForChain,
  resolveWeatherForUpstreamWindow,
} from "./resolved-weather.js";

function slots(...definitionIds: string[]) {
  return parseChain(
    definitionIds.map((definitionId, i) => ({
      instanceId: `cube-${i}`,
      definitionId,
    })),
  ).cubes;
}

function powered(...definitionIds: string[]) {
  return parseChain(
    [...definitionIds, "core/core"].map((definitionId, i) => ({
      instanceId: `cube-${i}`,
      definitionId,
    })),
  );
}

describe("resolveWeatherForChain", () => {
  it("uses place profile when London is bound", () => {
    const resolved = resolveWeatherForChain(
      powered("identity/london", "identity/weather"),
      { temp: 17.04, rain: 0.206 },
    );
    expect(resolved?.source).toBe("place-profile");
    expect(resolved?.temp).toBe(12);
    expect(resolved?.rain).toBe(0.45);
    expect(resolved?.mood).toBe("overcast");
    expect(resolved?.pipelineRain).toBe(0.206);
  });

  it("uses place profile for Tokyo", () => {
    const resolved = resolveWeatherForChain(
      powered("identity/tokyo", "identity/weather"),
      { temp: 17.04, rain: 0.206 },
    );
    expect(resolved?.temp).toBe(22);
    expect(resolved?.rain).toBe(0.3);
    expect(resolved?.mood).toBe("overcast");
  });

  it("uses live pipeline when no place cube", () => {
    const resolved = resolveWeatherForChain(
      powered("identity/weather"),
      { temp: 17.04, rain: 0.206 },
    );
    expect(resolved?.source).toBe("live");
    expect(resolved?.temp).toBe(17.04);
    expect(resolved?.rain).toBe(0.206);
    expect(resolved?.mood).toBe("sun");
  });

  it("uses place profile in tuned mode for gate comparisons", () => {
    const resolved = resolveWeatherForChain(
      powered("identity/london", "control/dial", "identity/weather"),
      { temp: 12, rain: 0.167 },
    );
    expect(resolved?.isThresholdMode).toBe(true);
    expect(resolved?.source).toBe("place-profile");
    expect(resolved?.rain).toBe(0.45);
  });

  it("returns null without weather cube", () => {
    expect(
      resolveWeatherForChain(powered("identity/london"), { temp: 12, rain: 0.3 }),
    ).toBeNull();
  });
});

describe("resolveWeatherForUpstreamWindow", () => {
  const pipeline = { temp: 17.04, rain: 0.206 };

  it("uses live pipeline when no place is bound", () => {
    const resolved = resolveWeatherForUpstreamWindow(
      slots("control/dial", "identity/weather"),
      pipeline,
      true,
    );
    expect(resolved).toEqual({ temp: 17.04, rain: 0.206 });
  });

  it("uses London profile for London → Weather window", () => {
    const resolved = resolveWeatherForUpstreamWindow(
      slots("identity/london", "identity/weather"),
      pipeline,
      false,
    );
    expect(resolved).toEqual({ temp: 12, rain: 0.45 });
  });

  it("uses Tokyo profile for the second weather segment", () => {
    const resolved = resolveWeatherForUpstreamWindow(
      slots(
        "identity/london",
        "identity/weather",
        "output/lcd",
        "identity/tokyo",
        "identity/weather",
      ),
      pipeline,
      false,
    );
    expect(resolved).toEqual({ temp: 22, rain: 0.3 });
  });

  it("uses first place when multiple places precede one weather cube", () => {
    const resolved = resolveWeatherForUpstreamWindow(
      slots("identity/london", "identity/tokyo", "identity/weather"),
      pipeline,
      false,
    );
    expect(resolved).toEqual({ temp: 12, rain: 0.45 });
  });
});
