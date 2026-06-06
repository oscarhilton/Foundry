import type { TrayState } from "@foundry/cube-defs";
import { getTrayWordCube, TRAY_SLOT_COUNT } from "@foundry/cube-defs";
import type { WeatherLens } from "./weather-lens.js";
import { weatherLensFromFaceToken } from "./weather-lens.js";

export type ResolvedSlot = {
  slotIndex: number;
  cubeId: string | null;
  modeId: string | null;
  modeLabel: string | null;
  role: "place" | "moment" | "source" | "lens" | "control" | "output" | null;
  token: string | null;
  weatherMode: string | null;
  lensId: WeatherLens | null;
  displayLabel: string | null;
};

export type LensItem = {
  lensId: string;
  slotIndex: number;
  domain: "weather" | "time" | "airQuality" | "generic";
  label: string;
};

export type ControlItem = {
  controlId: string;
  slotIndex: number;
  label: string;
};

export type TimerIntentCandidate =
  | { state: "incomplete"; boundSlots: number[]; boundSignature: string }
  | {
      state: "ready";
      durationMinutes: number;
      boundSlots: number[];
      boundSignature: string;
    }
  | {
      state: "armed";
      durationMinutes: number;
      triggerSlotIndex: number;
      boundSlots: number[];
      boundSignature: string;
    };

export type RunningTimerState = {
  state: "running";
  startedAtMs: number;
  durationMs: number;
  triggerSlotIndex: number;
  boundSlots: number[];
  boundSignature: string;
};

export type TrayCompileContext = {
  slots: ResolvedSlot[];
  placeSlotIndex: number | null;
  momentSlotIndex: number | null;
  sourceSlotIndex: number | null;
  lenses: LensItem[];
  controls: ControlItem[];
  primaryLensSlotIndex: number | null;
  secondaryLensSlotIndex: number | null;
  activeLens: WeatherLens | null;
  activeMomentId: string | null;
  timerIntent: TimerIntentCandidate | null;
  chainToSlot: number[];
  trayCoreInstanceId: string;
  defaultPlaceToken: string;
  /** @deprecated Use momentSlotIndex */
  contextSlotIndex: number | null;
};

const TRAY_CORE_INSTANCE = "__tray_core__";

export function getSlotSignature(tray: TrayState, slotIndex: number): string {
  const placed = tray.slots[slotIndex];
  if (!placed) return "empty";
  return `${placed.cubeId}:${placed.activeModeId}`;
}

export function getBoundSignature(
  tray: TrayState,
  boundSlots: number[],
): string {
  return boundSlots
    .map((i) => `${i}:${getSlotSignature(tray, i)}`)
    .join("|");
}

export function shouldCancelRunningTimer(
  timer: RunningTimerState,
  after: TrayState,
): boolean {
  return getBoundSignature(after, timer.boundSlots) !== timer.boundSignature;
}

function lensDomainForCube(cubeId: string): LensItem["domain"] {
  if (cubeId === "umbrella" || cubeId === "wear") return "weather";
  return "generic";
}

function resolveTimerIntent(
  tray: TrayState,
  controls: ControlItem[],
): TimerIntentCandidate | null {
  const button = controls.find((c) => c.controlId === "button");
  const timer = controls.find((c) => c.controlId === "timer");
  if (!timer) return null;

  const boundSlots = [button, timer]
    .filter((c): c is ControlItem => c !== undefined)
    .map((c) => c.slotIndex)
    .sort((a, b) => a - b);

  const boundSignature = getBoundSignature(tray, boundSlots);
  const timerSlot = tray.slots[timer.slotIndex];
  const durationMinutes = timerSlot
    ? Number.parseInt(timerSlot.activeModeId, 10)
    : NaN;

  if (!Number.isFinite(durationMinutes)) {
    return { state: "incomplete", boundSlots, boundSignature };
  }

  if (!button) {
    return {
      state: "ready",
      durationMinutes,
      boundSlots,
      boundSignature,
    };
  }

  const buttonSlot = tray.slots[button.slotIndex];
  const isPressMode = buttonSlot?.activeModeId === "press";

  if (isPressMode) {
    return {
      state: "armed",
      durationMinutes,
      triggerSlotIndex: button.slotIndex,
      boundSlots,
      boundSignature,
    };
  }

  return {
    state: "ready",
    durationMinutes,
    boundSlots,
    boundSignature,
  };
}

export function resolveTraySlots(tray: TrayState): ResolvedSlot[] {
  const slots: ResolvedSlot[] = [];

  for (let i = 0; i < TRAY_SLOT_COUNT; i++) {
    const placed = tray.slots[i] ?? null;
    if (!placed) {
      slots.push({
        slotIndex: i,
        cubeId: null,
        modeId: null,
        modeLabel: null,
        role: null,
        token: null,
        weatherMode: null,
        lensId: null,
        displayLabel: null,
      });
      continue;
    }

    const cubeDef = getTrayWordCube(placed.cubeId);
    const modeDef = cubeDef?.modes.find((m) => m.id === placed.activeModeId);

    if (!cubeDef || !modeDef) {
      slots.push({
        slotIndex: i,
        cubeId: placed.cubeId,
        modeId: placed.activeModeId,
        modeLabel: null,
        role: null,
        token: null,
        weatherMode: null,
        lensId: null,
        displayLabel: null,
      });
      continue;
    }

    const lensId =
      cubeDef.role === "lens"
        ? weatherLensFromFaceToken(cubeDef.runtimeToken)
        : null;

    slots.push({
      slotIndex: i,
      cubeId: cubeDef.id,
      modeId: modeDef.id,
      modeLabel: modeDef.label,
      role: cubeDef.role,
      token: cubeDef.runtimeToken,
      weatherMode: cubeDef.id === "weather" ? modeDef.id : null,
      lensId,
      displayLabel: modeDef.faceText,
    });
  }

  return slots;
}

export function buildTrayCompileContext(tray: TrayState): TrayCompileContext {
  const resolved = resolveTraySlots(tray);
  const lensSlots = resolved.filter((s) => s.role === "lens");
  const primaryLens = lensSlots[0] ?? null;
  const secondaryLens = lensSlots[1] ?? null;

  const lenses: LensItem[] = lensSlots.map((slot) => ({
    lensId: slot.cubeId ?? "unknown",
    slotIndex: slot.slotIndex,
    domain: lensDomainForCube(slot.cubeId ?? ""),
    label: slot.displayLabel ?? slot.cubeId ?? "Lens",
  }));

  const controls: ControlItem[] = resolved
    .filter((s) => s.role === "control")
    .map((slot) => ({
      controlId: slot.cubeId ?? "unknown",
      slotIndex: slot.slotIndex,
      label: slot.displayLabel ?? slot.cubeId ?? "Control",
    }));

  const momentSlot = resolved.find((s) => s.role === "moment") ?? null;

  return {
    slots: resolved,
    placeSlotIndex: resolved.find((s) => s.role === "place")?.slotIndex ?? null,
    momentSlotIndex: momentSlot?.slotIndex ?? null,
    sourceSlotIndex:
      resolved.find((s) => s.role === "source")?.slotIndex ?? null,
    lenses,
    controls,
    primaryLensSlotIndex: primaryLens?.slotIndex ?? null,
    secondaryLensSlotIndex: secondaryLens?.slotIndex ?? null,
    activeLens: primaryLens?.lensId ?? null,
    activeMomentId: momentSlot?.modeId ?? null,
    timerIntent: resolveTimerIntent(tray, controls),
    chainToSlot: [],
    trayCoreInstanceId: TRAY_CORE_INSTANCE,
    defaultPlaceToken: "identity/hallway",
    contextSlotIndex: momentSlot?.slotIndex ?? null,
  };
}

export { TRAY_CORE_INSTANCE };
