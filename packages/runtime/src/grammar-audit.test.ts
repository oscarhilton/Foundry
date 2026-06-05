import { describe, it, expect } from "vitest";
import { FoundryEngine, parseChain } from "./index.js";
import type { ChainCubeInput } from "../chain-parser.js";
import {
  AUDIT_CUBES,
  buildChain,
  collectAuditErrors,
  collectRebindStaleErrors,
  compactSnapshot,
  DEFAULT_AUDIT_WEATHER,
  DUPLICATE_CUBE_CHAINS,
  formatAuditFailure,
  GOLDEN_CHAINS,
  normalizeWeatherFace,
  permutations,
  permutationCount,
  REBIND_PAIRS,
  runChainAudit,
  UNPOWERED_CHAINS,
} from "./grammar-audit/index.js";
import type { GoldenChainCase } from "./grammar-audit/index.js";

/** Matrix size: 9 + 72 + 504 + 3024 + 15120 = 18729 */
const MATRIX_TOTAL = [1, 2, 3, 4, 5].reduce(
  (sum, len) => sum + permutationCount(AUDIT_CUBES.length, len),
  0,
);

function seedEngine(
  engine: FoundryEngine,
  chainInput: ChainCubeInput[],
  dialPosition = 1,
): void {
  engine.setChain(chainInput);
  engine.start();
  engine.mockAdapters.setWeather(DEFAULT_AUDIT_WEATHER);
  engine.setDialPosition(dialPosition);
  engine.mockAdapters.triggerMotion(false);
}

function lcdBlob(state: ReturnType<FoundryEngine["getOutputState"]>): string {
  const texts = Object.values(state.lcdTexts);
  if (texts.length > 0) return texts.join("\n");
  return state.lcdText ?? "";
}

function runGoldenCase(testCase: GoldenChainCase) {
  const dial = testCase.dialPosition ?? 1;
  const engine = new FoundryEngine({ dialDefault: dial });

  const chainInput =
    testCase.chainInput ??
    buildChain(testCase.chainIds, { withCore: true });

  seedEngine(engine, chainInput, dial);

  const state = engine.getOutputState();
  const parsed = parseChain(engine.getChain());
  const debug = engine.getCoreDebugSnapshot();
  const weather = normalizeWeatherFace(state, dial, parsed);
  const errors = collectAuditErrors(parsed, state, weather, debug);

  engine.destroy();

  return { state, errors, parsed, weather };
}

describe("Grammar audit — golden chains", () => {
  for (const testCase of GOLDEN_CHAINS) {
    it(testCase.name, () => {
      const { state, errors } = runGoldenCase(testCase);
      expect(errors).toEqual([]);

      if (testCase.expectRecipe !== undefined) {
        expect(state.activeRecipeId).toBe(testCase.expectRecipe);
      }

      if (testCase.expectPowered !== undefined) {
        expect(state.powered).toBe(testCase.expectPowered);
      }

      const lcd = lcdBlob(state);
      for (const fragment of testCase.lcdIncludes ?? []) {
        expect(lcd).toContain(fragment);
      }
      for (const fragment of testCase.lcdExcludes ?? []) {
        expect(lcd).not.toContain(fragment);
      }

      testCase.assert?.(state);
    });
  }
});

describe("Grammar audit — duplicate-cube chains", () => {
  for (const testCase of DUPLICATE_CUBE_CHAINS) {
    it(testCase.name, () => {
      const { state, errors } = runGoldenCase(testCase);
      expect(errors).toEqual([]);

      const lcd = lcdBlob(state);
      for (const fragment of testCase.lcdIncludes ?? []) {
        expect(lcd).toContain(fragment);
      }

      if (testCase.name === "London → Weather → LCD → LCD") {
        expect(state.lcdTexts.lcd1).toContain("London");
        expect(state.lcdTexts.lcd2).toBe("--");
      }

      if (testCase.name === "Tokyo → Time → LCD → London → Time → LCD") {
        expect(state.lcdTexts.lcd1).toMatch(/^Tokyo \d{2}:\d{2}$/);
        expect(state.lcdTexts.lcd2).toMatch(/^London \d{2}:\d{2}$/);
      }
    });
  }
});

describe("Grammar audit — unpowered paths", () => {
  for (const testCase of UNPOWERED_CHAINS) {
    it(testCase.name, () => {
      const result = runChainAudit(testCase.chainIds, {
        withCore: testCase.withCore,
      });
      expect(result.errors).toEqual([]);

      const engine = new FoundryEngine({ dialDefault: 1 });
      seedEngine(
        engine,
        buildChain(testCase.chainIds, { withCore: testCase.withCore }),
      );
      const state = engine.getOutputState();
      engine.destroy();

      if (testCase.name.startsWith("Core only")) {
        expect(state.powered).toBe(false);
      }
      if (testCase.name === "Weather → LCD (no Core)") {
        expect(state.powered).toBe(false);
        expect(Object.keys(state.lcdTexts)).toHaveLength(0);
      }
      if (testCase.name === "LCD alone (no Core)") {
        expect(state.powered).toBe(false);
      }
      if (testCase.name === "London → Weather (no Core)") {
        expect(state.powered).toBe(false);
        expect(state.chimeCount).toBe(0);
        expect(Object.keys(state.lcdTexts)).toHaveLength(0);
      }
    });
  }
});

describe("Grammar audit — stale state", () => {
  it("clears lcdTexts when rebinding away from LCD chain", () => {
    const engine = new FoundryEngine({ dialDefault: 1 });
    seedEngine(
      engine,
      buildChain(["identity/london", "identity/weather", "output/lcd"]),
    );
    expect(Object.keys(engine.getOutputState().lcdTexts).length).toBeGreaterThan(0);

    engine.setChain(
      buildChain(["identity/london", "sensor/motion", "output/chime"]),
    );
    const state = engine.getOutputState();
    expect(state.lcdTexts).toEqual({});
    expect(state.lcdText).toBeNull();
    engine.destroy();
  });

  it("keeps latched weather face when unpowered after stop", () => {
    const engine = new FoundryEngine({ dialDefault: 1 });
    seedEngine(
      engine,
      buildChain(["identity/london", "identity/weather"]),
    );
    const face = engine.getOutputState().weatherFace;
    expect(face).not.toBeNull();

    engine.stop();
    expect(engine.getOutputState().weatherFace).toBe(face);

    engine.mockAdapters.setWeather({ temp: 99, rain: 0.99 });
    expect(engine.getOutputState().weatherFace).toBe(face);
    engine.destroy();
  });
});

describe("Grammar audit — same-engine rebind", () => {
  for (const pair of REBIND_PAIRS) {
    it(pair.name, () => {
      const engine = new FoundryEngine({ dialDefault: 1 });

      seedEngine(engine, buildChain(pair.from));
      const recipeBefore = engine.getOutputState().activeRecipeId;

      engine.setChain(buildChain(pair.to));
      engine.mockAdapters.setWeather(DEFAULT_AUDIT_WEATHER);
      engine.setDialPosition(1);
      const state = engine.getOutputState();
      const parsed = parseChain(engine.getChain());
      const debug = engine.getCoreDebugSnapshot();
      const weather = normalizeWeatherFace(state, 1, parsed);

      const auditErrors = collectAuditErrors(parsed, state, weather, debug);
      const staleErrors = collectRebindStaleErrors(
        parsed,
        state,
        recipeBefore,
      );

      expect([...auditErrors, ...staleErrors]).toEqual([]);
      engine.destroy();
    });
  }
});

describe("Grammar audit — generated matrix", () => {
  // Full matrix (18,729 chains) completes in ~2.7s on CI hardware — invariant-only, no verbose logs.
  expect(MATRIX_TOTAL).toBe(18_729);

  for (let length = 1; length <= 5; length++) {
    it(`passes grammar matrix length ${length}`, () => {
      const start = performance.now();
      let count = 0;

      for (const chain of permutations(AUDIT_CUBES, length)) {
        const result = runChainAudit(chain);
        if (result.errors.length > 0) {
          if (process.env.FOUNDRY_AUDIT_VERBOSE === "1") {
            const verbose = runChainAudit(chain, { verbose: true });
            if ("debug" in verbose) {
              console.error(JSON.stringify(verbose.debug, null, 2));
            }
          }
          throw new Error(formatAuditFailure(result));
        }
        count++;
      }

      const elapsed = performance.now() - start;
      expect(count).toBe(permutationCount(AUDIT_CUBES.length, length));
      // eslint-disable-next-line no-console
      console.log(
        `grammar matrix length ${length}: ${count} chains in ${elapsed.toFixed(0)}ms`,
      );
    });
  }
});

describe("Grammar audit — compact snapshots", () => {
  it("London → Wheel → Weather → LCD snapshot", () => {
    const engine = new FoundryEngine({ dialDefault: 1 });
    seedEngine(
      engine,
      buildChain([
        "identity/london",
        "control/dial",
        "identity/weather",
        "output/lcd",
      ]),
    );
    const state = engine.getOutputState();
    const debug = engine.getCoreDebugSnapshot();
    engine.destroy();

    expect(
      compactSnapshot(
        ["identity/london", "control/dial", "identity/weather", "output/lcd"],
        state,
        debug,
      ),
    ).toMatchSnapshot();
  });
});
