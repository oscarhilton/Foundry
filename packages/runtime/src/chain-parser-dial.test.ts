import { describe, it, expect } from "vitest";
import { parseChain } from "./chain-parser.js";
import {
  dialSelectsWeatherField,
  dialTunesWeather,
} from "./chain-parser.js";

const CORE = "core/core";

function withCore(...ids: string[]) {
  return ids.map((definitionId, i) => ({
    instanceId: `cube-${i}`,
    definitionId,
  })).concat([{ instanceId: "core", definitionId: CORE }]);
}

describe("dial position grammar", () => {
  it("dialTunesWeather when Dial is immediately before Weather", () => {
    const chain = parseChain(
      withCore("identity/london", "control/dial", "identity/weather"),
    );
    expect(dialTunesWeather(chain)).toBe(true);
    expect(dialSelectsWeatherField(chain)).toBe(false);
  });

  it("dialSelectsWeatherField when Dial is immediately after Weather", () => {
    const chain = parseChain(
      withCore("identity/london", "identity/weather", "control/dial", "output/lcd"),
    );
    expect(dialSelectsWeatherField(chain)).toBe(true);
    expect(dialTunesWeather(chain)).toBe(false);
  });

  it("neither when Dial and Weather are not adjacent", () => {
    const chain = parseChain(
      withCore("control/dial", "identity/london", "identity/weather"),
    );
    expect(dialTunesWeather(chain)).toBe(false);
    expect(dialSelectsWeatherField(chain)).toBe(false);
  });
});
