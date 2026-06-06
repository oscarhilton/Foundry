import type { TrayState, TrayWordCube, TrayWordMode } from "@foundry/cube-defs";
import {
  ALL_WORD_CUBES,
  getTrayWordCube,
  getTrayWordMode,
  TRAY_SLOT_COUNT,
} from "@foundry/cube-defs";
import type { WeatherLens } from "./weather-lens.js";
import { weatherLensFromFaceToken } from "./weather-lens.js";
import { isWeatherSourceToken } from "./tray-legacy-tokens.js";

export type ResolvedSlot = {
  slotIndex: number;
  cubeId: string | null;
  modeId: string | null;
  modeLabel: string | null;
  role:
    | "place"
    | "moment"
    | "phenomenon"
    | "response"
    | "source"
    | "lens"
    | "control"
    | "output"
    | null;
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

export type SourceBindingResult = {
  sourceAttached: boolean;
  sourceSlotIndex: number | null;
  sourceId: string | null;
  hint?: string;
};

export type UpstreamContext = {
  placeSlotIndex: number | null;
  momentSlotIndex: number | null;
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
  phenomenonSlotIndex: number | null;
  responseSlotIndex: number | null;
  /** @deprecated Legacy lens/source model */
  sourceSlotIndex: number | null;
  /** @deprecated Legacy lens model */
  lenses: LensItem[];
  controls: ControlItem[];
  /** @deprecated Legacy lens model */
  primaryLensSlotIndex: number | null;
  /** @deprecated Legacy lens model */
  secondaryLensSlotIndex: number | null;
  /** @deprecated Legacy lens model */
  activeLens: WeatherLens | null;
  activeMomentId: string | null;
  activePhenomenonId: string | null;
  activeResponseId: string | null;
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
  if (cubeId === "umbrella" || cubeId === "wear" || cubeId === "rain") {
    return "weather";
  }
  return "generic";
}

function formatDownstreamHint(sourceCubeId: string, lensCubeId: string): string {
  const sourceWord = getTrayWordCube(sourceCubeId)?.word ?? "SOURCE";
  const lensWord = getTrayWordCube(lensCubeId)?.word ?? "LENS";
  return `Put ${sourceWord} before ${lensWord}.`;
}

function formatNeedsHint(domain: LensItem["domain"]): string {
  switch (domain) {
    case "weather":
      return "Needs weather";
    case "time":
      return "Needs time";
    case "airQuality":
      return "Needs air quality";
    default:
      return "Needs source";
  }
}

export function isCompatibleSourceMode(
  mode: TrayWordMode,
  lens: LensItem,
): boolean {
  const token = mode.runtimeToken;
  if (!token) return false;
  if (lens.domain === "weather") {
    return isWeatherSourceToken(token);
  }
  return false;
}

export function resolveUpstreamContext(
  lensSlotIndex: number,
  tray: TrayState,
  catalog: TrayWordCube[] = ALL_WORD_CUBES,
): UpstreamContext {
  let placeSlotIndex: number | null = null;
  let momentSlotIndex: number | null = null;

  for (let i = lensSlotIndex - 1; i >= 0; i--) {
    const slot = tray.slots[i];
    if (!slot) continue;
    const def = catalog.find((c) => c.id === slot.cubeId);
    if (!def) continue;
    if (def.role === "place" && placeSlotIndex === null) {
      placeSlotIndex = i;
    }
    if (def.role === "moment" && momentSlotIndex === null) {
      momentSlotIndex = i;
    }
  }

  return { placeSlotIndex, momentSlotIndex };
}

export function resolveLensSourceBinding(
  lens: LensItem,
  tray: TrayState,
  catalog: TrayWordCube[] = ALL_WORD_CUBES,
): SourceBindingResult {
  for (let i = lens.slotIndex - 1; i >= 0; i--) {
    const slot = tray.slots[i];
    if (!slot) continue;

    const def = catalog.find((c) => c.id === slot.cubeId);
    if (!def || def.role !== "source") continue;

    const activeMode = def.modes.find((m) => m.id === slot.activeModeId);
    if (activeMode && isCompatibleSourceMode(activeMode, lens)) {
      const sourceId =
        activeMode.runtimeToken ?? def.runtimeToken ?? null;
      return {
        sourceAttached: true,
        sourceSlotIndex: i,
        sourceId,
      };
    }
  }

  let downstreamSourceCubeId: string | null = null;
  const hasDownstreamCompatibleSource = tray.slots
    .slice(lens.slotIndex + 1)
    .some((slot) => {
      if (!slot) return false;
      const def = catalog.find((c) => c.id === slot.cubeId);
      if (!def || def.role !== "source") return false;

      const activeMode = def.modes.find((m) => m.id === slot.activeModeId);
      if (activeMode && isCompatibleSourceMode(activeMode, lens)) {
        downstreamSourceCubeId = def.id;
        return true;
      }
      return false;
    });

  return {
    sourceAttached: false,
    sourceSlotIndex: null,
    sourceId: null,
    hint: hasDownstreamCompatibleSource
      ? formatDownstreamHint(downstreamSourceCubeId!, lens.lensId)
      : formatNeedsHint(lens.domain),
  };
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
  const timerMode = timerSlot
    ? getTrayWordMode("timer", timerSlot.activeModeId)
    : undefined;
  const durationMinutes = timerMode?.dataKey
    ? Number.parseInt(timerMode.dataKey, 10)
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
  const isPressMode = buttonSlot?.activeModeId === "button";

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

    const physicalToken = modeDef.runtimeToken ?? cubeDef.runtimeToken;
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
      token: physicalToken,
      weatherMode:
        cubeDef.id === "weather" || cubeDef.role === "phenomenon"
          ? modeDef.id
          : null,
      lensId,
      displayLabel: modeDef.faceText,
    });
  }

  return slots;
}

function upstreamSourceForPrimaryLens(
  tray: TrayState,
  lenses: LensItem[],
  primaryLensSlotIndex: number | null,
): number | null {
  if (primaryLensSlotIndex === null) return null;
  const lensItem = lenses.find((l) => l.slotIndex === primaryLensSlotIndex);
  if (!lensItem) return null;
  return resolveLensSourceBinding(lensItem, tray).sourceSlotIndex;
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
  const phenomenonSlot = resolved.find((s) => s.role === "phenomenon") ?? null;
  const responseSlot = resolved.find((s) => s.role === "response") ?? null;
  const primaryLensSlotIndex = primaryLens?.slotIndex ?? null;
  const boundSourceIndex = upstreamSourceForPrimaryLens(
    tray,
    lenses,
    primaryLensSlotIndex,
  );
  const fallbackSourceIndex =
    resolved.find(
      (s) =>
        (s.role === "source" || s.role === "phenomenon") &&
        (isWeatherSourceToken(s.token ?? "") ||
          (s.token?.startsWith("phenomenon/") ?? false)),
    )?.slotIndex ?? null;

  return {
    slots: resolved,
    placeSlotIndex: resolved.find((s) => s.role === "place")?.slotIndex ?? null,
    momentSlotIndex: momentSlot?.slotIndex ?? null,
    phenomenonSlotIndex: phenomenonSlot?.slotIndex ?? null,
    responseSlotIndex: responseSlot?.slotIndex ?? null,
    sourceSlotIndex:
      primaryLensSlotIndex !== null ? boundSourceIndex : fallbackSourceIndex,
    lenses,
    controls,
    primaryLensSlotIndex,
    secondaryLensSlotIndex: secondaryLens?.slotIndex ?? null,
    activeLens: primaryLens?.lensId ?? null,
    activeMomentId: momentSlot?.modeId ?? null,
    activePhenomenonId: phenomenonSlot?.modeId ?? null,
    activeResponseId: responseSlot?.modeId ?? null,
    timerIntent: resolveTimerIntent(tray, controls),
    chainToSlot: [],
    trayCoreInstanceId: TRAY_CORE_INSTANCE,
    defaultPlaceToken: "place/home",
    contextSlotIndex: momentSlot?.slotIndex ?? null,
  };
}

export { TRAY_CORE_INSTANCE };
