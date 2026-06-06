import type { TrayCompileContext, RunningTimerState } from "./intent-resolver.js";
import type { TraySlotText } from "./tray-compile.js";
import type { WeatherFact } from "./weather-lens.js";

export type FinalOutputTone =
  | "answer"
  | "warning"
  | "timer"
  | "reminder"
  | "invalid";

export type TrayTranslation = {
  slots: TraySlotText[];
  localTranslations: (string | null)[];
  finalOutput: string | null;
  finalOutputTone: FinalOutputTone;
  warnings?: string[];
};

function slotLocalText(slot: TraySlotText | undefined): string | null {
  if (!slot || slot.kind !== "text") return null;
  return slot.value;
}

function momentPhrase(ctx: TrayCompileContext): string | null {
  if (ctx.momentSlotIndex === null) return null;
  const slot = ctx.slots[ctx.momentSlotIndex];
  if (!slot?.modeId) return null;
  if (slot.modeId === "weekend") return "this weekend";
  if (slot.modeId === "work") return "for work";
  if (slot.modeId === "quick") return "right now";
  return "this morning";
}

function primaryLensLocal(
  slots: TraySlotText[],
  ctx: TrayCompileContext,
): string | null {
  if (ctx.primaryLensSlotIndex === null) return null;
  return slotLocalText(slots[ctx.primaryLensSlotIndex]);
}

function formatTimerRemaining(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")} remaining`;
}

function composeUmbrellaFinal(
  lensLocal: string,
  moment: string | null,
): string {
  const base = lensLocal.replace(/\.$/, "");
  if (!moment) return `${base}.`;
  if (base.toLowerCase().includes("umbrella")) {
    return `${base} ${moment}.`;
  }
  return `${base} ${moment}.`;
}

function composeWearFinal(lensLocal: string, moment: string | null): string {
  const base = lensLocal.replace(/\.$/, "");
  if (!moment) return `${base}.`;
  return `${base} ${moment}.`;
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

  const hasHintOnly = slots.every(
    (s) => s.kind === "empty" || s.kind === "hint",
  );
  if (hasHintOnly) {
    return { finalOutput: null, finalOutputTone: "invalid" };
  }

  const lensLocal = primaryLensLocal(slots, ctx);
  const moment = momentPhrase(ctx);
  const primaryCubeId =
    ctx.primaryLensSlotIndex !== null
      ? ctx.slots[ctx.primaryLensSlotIndex]?.cubeId
      : null;

  if (lensLocal && primaryCubeId === "umbrella") {
    return {
      finalOutput: composeUmbrellaFinal(lensLocal, moment),
      finalOutputTone: "answer",
    };
  }

  if (lensLocal && primaryCubeId === "wear") {
    return {
      finalOutput: composeWearFinal(lensLocal, moment),
      finalOutputTone: "answer",
    };
  }

  if (lensLocal) {
    return {
      finalOutput: moment ? `${lensLocal.replace(/\.$/, "")} ${moment}.` : `${lensLocal.replace(/\.$/, "")}.`,
      finalOutputTone: "answer",
    };
  }

  if (ctx.sourceSlotIndex !== null && slotLocalText(slots[ctx.sourceSlotIndex])) {
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
