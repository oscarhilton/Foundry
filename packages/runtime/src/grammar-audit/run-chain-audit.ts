import { FoundryEngine, parseChain } from "../index.js";
import type { SignalMessage } from "../signal-router.js";
import { buildChain } from "./build-chain.js";
import { collectAuditErrors } from "./collect-audit-errors.js";
import { mergeVerboseResult } from "./compact-snapshot.js";
import {
  DEFAULT_AUDIT_WEATHER,
  type AuditResult,
  type RunChainAuditOptions,
  type VerboseAuditResult,
} from "./types.js";
import { normalizeWeatherFace } from "./weather-assertions.js";

import type { ChainCubeInput } from "../chain-parser.js";

function seedEngine(
  engine: FoundryEngine,
  chainInput: ChainCubeInput[],
  dialPosition: number,
): void {
  engine.setChain(chainInput);
  engine.start();
  engine.setDialPosition(dialPosition);
  engine.mockAdapters.triggerMotion(false);
}

function chainHasWeather(chainInput: ChainCubeInput[]): boolean {
  return chainInput.some((c) => c.definitionId === "identity/weather");
}

export function runChainAudit(
  chainIds: readonly string[],
  options: RunChainAuditOptions = {},
): AuditResult | VerboseAuditResult {
  const dialPosition = options.dialPosition ?? 1;
  const weather = options.weather ?? DEFAULT_AUDIT_WEATHER;
  const chainInput = buildChain(chainIds, {
    withCore: options.withCore ?? true,
  });

  const topics: SignalMessage[] = [];
  const engine = new FoundryEngine({
    dialDefault: dialPosition,
    auditMode: true,
    initialWeather: weather,
    onSignal: options.verbose
      ? (msg) => {
          topics.push(msg);
        }
      : undefined,
  });

  let errors: string[] = [];

  try {
    seedEngine(engine, chainInput, dialPosition);

    const state = engine.getOutputState();
    const parsed = parseChain(engine.getChain());
    const needsDebug = options.verbose || chainHasWeather(chainInput);
    const debug = needsDebug ? engine.getCoreDebugSnapshot() : null;
    const weatherNorm = normalizeWeatherFace(state, dialPosition, parsed);

    errors = collectAuditErrors(parsed, state, weatherNorm, debug);

    const base: AuditResult = { chainIds, chainInput, errors };

    if (options.verbose && debug) {
      return mergeVerboseResult(base, state, debug, topics);
    }

    return base;
  } catch (err) {
    errors.push(
      err instanceof Error ? err.message : `Engine threw: ${String(err)}`,
    );
    return { chainIds, chainInput, errors };
  } finally {
    engine.destroy();
  }
}

export function runChainAuditOnEngine(
  engine: FoundryEngine,
  chainIds: readonly string[],
  options: Omit<RunChainAuditOptions, "verbose"> = {},
): AuditResult {
  const dialPosition = options.dialPosition ?? 1;
  const weather = options.weather ?? DEFAULT_AUDIT_WEATHER;
  const chainInput = buildChain(chainIds, {
    withCore: options.withCore ?? true,
  });

  engine.mockAdapters.setWeather(weather);
  seedEngine(engine, chainInput, dialPosition);

  const state = engine.getOutputState();
  const parsed = parseChain(engine.getChain());
  const needsDebug = chainHasWeather(chainInput);
  const debug = needsDebug ? engine.getCoreDebugSnapshot() : null;
  const weatherNorm = normalizeWeatherFace(state, dialPosition, parsed);
  const errors = collectAuditErrors(parsed, state, weatherNorm, debug);

  return { chainIds, chainInput, errors };
}
