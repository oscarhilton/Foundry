import type { FoundryOutputState, CoreDebugSnapshot } from "../index.js";
import type { SignalMessage } from "../signal-router.js";
import type { AuditResult, VerboseAuditResult } from "./types.js";

export function compactSnapshot(
  chainIds: readonly string[],
  state: FoundryOutputState,
  debug: CoreDebugSnapshot | null,
): Record<string, unknown> {
  return {
    chain: chainIds,
    recipe: state.activeRecipeName ?? state.activeRecipeId,
    powered: state.powered,
    lcdTexts: state.lcdTexts,
    weatherFace: state.weatherFace
      ? {
          mode: state.weatherFace.mode,
          headline: state.weatherFace.headline,
          detail: state.weatherFace.detail,
          placeLabel: state.weatherFace.placeLabel,
          latched: state.weatherFace.latched,
        }
      : null,
    lightBrightness: state.lightBrightness,
    chimeCount: state.chimeCount,
    viewportRendered: debug?.viewportTrace?.map((s) => s.rendered) ?? [],
  };
}

export function mergeVerboseResult(
  base: AuditResult,
  state: FoundryOutputState,
  debug: CoreDebugSnapshot,
  topics: SignalMessage[],
): VerboseAuditResult {
  return {
    ...base,
    state,
    debug,
    topics,
  };
}
