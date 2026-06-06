import type { TrayCompileContext, RunningTimerState } from "./intent-resolver.js";
import type { TraySlotText } from "./tray-compile.js";
import type { WeatherFact } from "./weather-lens.js";
import { composeLensFinal } from "./tray-translate.js";

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

function momentPhrase(ctx: TrayCompileContext): string | null {
  if (ctx.momentSlotIndex === null) return null;
  const slot = ctx.slots[ctx.momentSlotIndex];
  if (!slot?.modeId) return null;
  switch (slot.modeId) {
    case "now":
      return "right now";
    case "later":
      return "later";
    case "evening":
      return "this evening";
    case "morning":
    default:
      return "this morning";
  }
}

function ambientPhrase(ctx: TrayCompileContext): string | null {
  if (ctx.placeSlotIndex !== null) {
    const placeMode = ctx.slots[ctx.placeSlotIndex]?.modeId;
    if (placeMode === "work") return "for work";
  }
  return momentPhrase(ctx);
}

function primaryLensLocal(
  slots: TraySlotText[],
  ctx: TrayCompileContext,
): string | null {
  if (ctx.primaryLensSlotIndex === null) return null;
  const slot = slots[ctx.primaryLensSlotIndex];
  if (!slot || slot.kind !== "text") return null;
  return slot.value;
}

function formatTimerRemaining(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")} remaining`;
}

export function resolveDominantHint(
  ctx: TrayCompileContext,
  hintSlot: Extract<TraySlotText, { kind: "hint" }>,
): string {
  const lensIds = ctx.lenses.map((l) => l.lensId);
  const hasRain = lensIds.includes("rain");
  const hasUmbrella = lensIds.includes("umbrella");
  const hasWear = lensIds.includes("wear");
  const weatherLensCount = [hasRain, hasUmbrella, hasWear].filter(Boolean).length;

  if (weatherLensCount >= 3) {
    return "Choose rain, umbrella, or clothing.";
  }
  if (hasUmbrella && hasWear) {
    return "Choose umbrella or clothing.";
  }
  if (hasRain && hasUmbrella) {
    return "Choose rain or umbrella.";
  }
  if (hasRain && hasWear) {
    return "Choose rain or clothing.";
  }
  return hintSlot.value;
}

export function composeFinalOutput(
  ctx: TrayCompileContext,
  fact: WeatherFact | null,
  slots: TraySlotText[],
  options?: {
    runningTimer?: RunningTimerState | null;
    nowMs?: number;
  },
): Pick<TrayTranslation, "finalOutput" | "finalOutputTone" | "warnings"> {
  const runningTimer = options?.runningTimer ?? null;
  const nowMs = options?.nowMs ?? Date.now();

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

  const lensLocal = primaryLensLocal(slots, ctx);
  const primarySlot =
    ctx.primaryLensSlotIndex !== null
      ? ctx.slots[ctx.primaryLensSlotIndex]
      : null;
  const primaryCubeId = primarySlot?.cubeId ?? null;
  const primaryModeId = primarySlot?.modeId ?? "any";

  if (lensLocal && primaryCubeId && fact) {
    const isWeatherLens = ["rain", "umbrella", "wear"].includes(primaryCubeId);
    if (isWeatherLens) {
      return {
        finalOutput: composeLensFinal(
          primaryCubeId,
          primaryModeId,
          fact,
          ambientPhrase(ctx),
        ),
        finalOutputTone: "answer",
      };
    }
  }

  if (lensLocal) {
    const moment = ambientPhrase(ctx);
    return {
      finalOutput: moment
        ? `${lensLocal.replace(/\.$/, "")} ${moment}.`
        : `${lensLocal.replace(/\.$/, "")}.`,
      finalOutputTone: "answer",
    };
  }

  if (
    ctx.sourceSlotIndex !== null &&
    slots[ctx.sourceSlotIndex]?.kind === "text"
  ) {
    return { finalOutput: null, finalOutputTone: "invalid" };
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
