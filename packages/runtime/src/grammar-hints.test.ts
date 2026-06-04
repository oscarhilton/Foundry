import { describe, it, expect } from "vitest";
import { parseChain } from "./chain-parser.js";
import {
  needsCityTimeGrammarHint,
  needsCityWeatherGrammarHint,
} from "./grammar-hints.js";

const CORE = "core/core";

describe("grammar hints", () => {
  it("detects ambiguous Tokyo → London → LCD → Time → LCD", () => {
    const chain = parseChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    expect(needsCityTimeGrammarHint(chain)).toBe(true);
  });

  it("does not hint for Tokyo → Time → LCD → London → Time → LCD", () => {
    const chain = parseChain([
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time1", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "time2", definitionId: "source/time" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    expect(needsCityTimeGrammarHint(chain)).toBe(false);
  });

  it("detects London → Tokyo → Weather → LCD", () => {
    const chain = parseChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    expect(needsCityWeatherGrammarHint(chain)).toBe(true);
  });

  it("does not hint for London → Weather → LCD → Tokyo → Weather → LCD", () => {
    const chain = parseChain([
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather1", definitionId: "identity/weather" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "weather2", definitionId: "identity/weather" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: CORE },
    ]);
    expect(needsCityWeatherGrammarHint(chain)).toBe(false);
  });
});
