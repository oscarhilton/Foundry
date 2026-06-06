import type { TrayCompileContext, RunningTimerState } from "./intent-resolver.js";
import type { TraySlotText } from "./tray-compile.js";
import type { WeatherFact } from "./weather-lens.js";
import type { RenderResult } from "./domain-registry.js";

export type FinalOutputTone =
  | "answer"
  | "warning"
  | "timer"
  | "reminder"
  | "hint"
  | "invalid";

export type TrayTranslation = {
  slots: TraySlotText[];
  localTranslations: (string | null)[];
  finalOutput: string | null;
  finalOutputTone: FinalOutputTone;
  warnings?: string[];
};

function slotLocalText(slot: TraySlotText | undefined): string | null {
  if (!slot || slot.kind === "empty") return null;
  return slot.value;
}

function formatTimerRemaining(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")} remaining`;
}

export function resolveDominantHint(
  _ctx: TrayCompileContext,
  hintSlot: Extract<TraySlotText, { kind: "hint" }>,
): string {
  return hintSlot.value;
}

export function composeFinalOutput(
  ctx: TrayCompileContext,
  _fact: WeatherFact | null,
  slots: TraySlotText[],
  options?: {
    runningTimer?: RunningTimerState | null;
    nowMs?: number;
    matrixResult?: RenderResult | null;
  },
): Pick<TrayTranslation, "finalOutput" | "finalOutputTone" | "warnings"> {
  const runningTimer = options?.runningTimer ?? null;
  const nowMs = options?.nowMs ?? Date.now();
  const matrixResult = options?.matrixResult ?? null;

  if (runningTimer?.state === "running") {
    const remaining = runningTimer.durationMs - (nowMs - runningTimer.startedAtMs);
    return {
      finalOutput: formatTimerRemaining(remaining),
      finalOutputTone: "timer",
    };
  }

  const primaryHintSlot = slots.find(
    (s): s is Extract<TraySlotText, { kind: "hint" }> => s.kind === "hint",
  );
  if (primaryHintSlot) {
    return {
      finalOutput: resolveDominantHint(ctx, primaryHintSlot),
      finalOutputTone: "hint",
    };
  }

  const hasContentOnlyEmpty = slots.every((s) => s.kind === "empty");
  if (hasContentOnlyEmpty) {
    return { finalOutput: null, finalOutputTone: "invalid" };
  }

  if (matrixResult) {
    return {
      finalOutput: matrixResult.finalOutput,
      finalOutputTone: matrixResult.finalOutputTone,
      warnings: matrixResult.warnings,
    };
  }

  return { finalOutput: null, finalOutputTone: "invalid" };
}

export function buildTrayTranslation(
  ctx: TrayCompileContext,
  slots: TraySlotText[],
  fact: WeatherFact | null,
  options?: {
    runningTimer?: RunningTimerState | null;
    nowMs?: number;
    matrixResult?: RenderResult | null;
  },
): TrayTranslation {
  const localTranslations = slots.map((slot) => slotLocalText(slot));
  const composed = composeFinalOutput(ctx, fact, slots, options);

  return {
    slots,
    localTranslations,
    finalOutput: composed.finalOutput,
    finalOutputTone: composed.finalOutputTone,
    warnings: composed.warnings,
  };
}
