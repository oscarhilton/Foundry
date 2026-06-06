import {
  emptyTrayState,
  defaultModeId,
  type PlacedCube,
  type TrayState,
  TRAY_SLOT_COUNT,
} from "@foundry/cube-defs";
import type { ChainCubeInput } from "./chain-parser.js";
import {
  buildWeatherFact,
  weatherLensFromFaceToken,
  type WeatherFact,
} from "./weather-lens.js";
import { PLACE_DEFAULTS } from "./tray-place-defaults.js";
import {
  translateControlSlot,
  translateLensSlot,
  translateMomentSlot,
  translatePlaceSlot,
  translateSourceSlot,
  translateWearLens,
} from "./tray-translate.js";
import {
  buildTrayCompileContext,
  TRAY_CORE_INSTANCE,
  type ResolvedSlot,
  type TrayCompileContext,
} from "./intent-resolver.js";
import {
  buildTrayTranslation,
  type TrayTranslation,
} from "./tray-compose.js";
import type { RunningTimerState } from "./intent-resolver.js";

export type { ResolvedSlot, TrayCompileContext } from "./intent-resolver.js";
export type { TrayTranslation, FinalOutputTone } from "./tray-compose.js";

export type TraySlotText =
  | { kind: "text"; value: string }
  | { kind: "hint"; value: string }
  | { kind: "empty" };

export function compileTrayState(tray: TrayState): {
  chainCubes: ChainCubeInput[];
  trayContext: TrayCompileContext;
} {
  const trayContext = buildTrayCompileContext(tray);
  const chainCubes: ChainCubeInput[] = [];
  const chainToSlot: number[] = [];
  let instanceCounter = 0;

  for (const slot of trayContext.slots) {
    if (!slot.token || slot.role === "lens" || slot.role === "moment") continue;
    chainToSlot.push(slot.slotIndex);
    chainCubes.push({
      instanceId: `tray-${instanceCounter++}`,
      definitionId: slot.token,
    });
  }

  chainCubes.push({
    instanceId: TRAY_CORE_INSTANCE,
    definitionId: "core/core",
  });

  return {
    chainCubes,
    trayContext: { ...trayContext, chainToSlot },
  };
}

function resolvePlaceLabel(slot: ResolvedSlot): string {
  if (slot.modeLabel) return translatePlaceSlot(slot.modeLabel);
  return "Home";
}

function mockWeatherForPlaceToken(placeToken: string): {
  temp: number;
  rain: number;
} {
  const defaults = PLACE_DEFAULTS[placeToken] ?? {
    mockBaseTemp: 12,
    mockRainBias: 0.45,
  };
  return { temp: defaults.mockBaseTemp, rain: defaults.mockRainBias };
}

export function buildTrayWeatherFact(
  _tray: TrayState,
  ctx: TrayCompileContext,
  pipeline?: { temp: number; rain: number } | null,
): WeatherFact | null {
  const placeSlot =
    ctx.placeSlotIndex !== null ? ctx.slots[ctx.placeSlotIndex] : null;
  const sourceSlot =
    ctx.sourceSlotIndex !== null ? ctx.slots[ctx.sourceSlotIndex] : null;

  const hasWeatherSource = sourceSlot?.token === "identity/weather";
  const hasLens = ctx.primaryLensSlotIndex !== null;

  if (!hasWeatherSource && !hasLens) {
    return null;
  }

  const placeToken =
    placeSlot?.token ??
    (ctx.slots.some((s) => s.role === "source" || s.role === "lens")
      ? ctx.defaultPlaceToken
      : null);

  if (!placeToken) return null;

  const placeLabel = placeSlot ? resolvePlaceLabel(placeSlot) : "Home";

  const mock = mockWeatherForPlaceToken(placeToken);
  const temp = pipeline?.temp ?? mock.temp;
  const rain = pipeline?.rain ?? mock.rain;

  return buildWeatherFact(placeLabel, temp, rain);
}

export function resolveTraySlotTexts(
  _tray: TrayState,
  weatherFact: WeatherFact | null,
  ctx: TrayCompileContext,
): TraySlotText[] {
  const result: TraySlotText[] = Array.from({ length: TRAY_SLOT_COUNT }, () => ({
    kind: "empty",
  }));

  const hasWeatherSource = ctx.sourceSlotIndex !== null;
  const hasLens = ctx.primaryLensSlotIndex !== null;
  const placeMissingButNeeded =
    ctx.placeSlotIndex === null &&
    (hasWeatherSource || hasLens) &&
    !(hasWeatherSource && hasLens);

  for (const slot of ctx.slots) {
    if (!slot.role) continue;

    if (slot.role === "place") {
      result[slot.slotIndex] = {
        kind: "text",
        value: resolvePlaceLabel(slot),
      };
      continue;
    }

    if (slot.role === "moment") {
      result[slot.slotIndex] = {
        kind: "text",
        value: translateMomentSlot(slot.modeId ?? "full"),
      };
      continue;
    }

    if (slot.role === "control") {
      result[slot.slotIndex] = {
        kind: "text",
        value: translateControlSlot(slot.cubeId ?? "", slot.modeId ?? ""),
      };
      continue;
    }

    if (slot.role === "source") {
      if (slot.token === "identity/weather") {
        if (!weatherFact) {
          result[slot.slotIndex] = { kind: "hint", value: "Add weather" };
        } else {
          result[slot.slotIndex] = {
            kind: "text",
            value: translateSourceSlot(
              weatherFact,
              ctx.activeLens,
              slot.weatherMode,
            ),
          };
        }
      } else {
        result[slot.slotIndex] = {
          kind: "text",
          value: slot.displayLabel ?? "—",
        };
      }
      continue;
    }

    if (slot.role === "lens") {
      const lens = slot.lensId;
      const isSecondary =
        ctx.secondaryLensSlotIndex !== null &&
        slot.slotIndex === ctx.secondaryLensSlotIndex;

      if (isSecondary) {
        result[slot.slotIndex] = {
          kind: "hint",
          value: "One concern at a time",
        };
        continue;
      }

      if (!hasWeatherSource) {
        result[slot.slotIndex] = {
          kind: "hint",
          value:
            slot.cubeId === "umbrella"
              ? "Umbrella needs weather"
              : "Needs weather",
        };
        continue;
      }

      if (!weatherFact || !lens) {
        result[slot.slotIndex] = { kind: "hint", value: "Needs weather" };
        continue;
      }

      const value =
        slot.cubeId === "wear"
          ? translateWearLens(weatherFact, slot.modeId ?? "light")
          : translateLensSlot(weatherFact, lens);

      result[slot.slotIndex] = { kind: "text", value };
      continue;
    }
  }

  if (placeMissingButNeeded) {
    result[0] = { kind: "hint", value: "Add place" };
  }

  if (
    ctx.placeSlotIndex !== null &&
    ctx.sourceSlotIndex === null &&
    ctx.primaryLensSlotIndex !== null
  ) {
    const start = ctx.placeSlotIndex + 1;
    const end = ctx.primaryLensSlotIndex;
    for (let i = start; i < end; i++) {
      if (!ctx.slots[i]?.role && result[i]?.kind === "empty") {
        result[i] = { kind: "hint", value: "Add weather" };
        break;
      }
    }
  }

  if (ctx.placeSlotIndex === null && ctx.sourceSlotIndex === null && hasLens) {
    for (const slot of ctx.slots) {
      if (slot.role === "lens") {
        result[slot.slotIndex] = {
          kind: "hint",
          value:
            slot.cubeId === "umbrella"
              ? "Umbrella needs weather"
              : "Needs weather",
        };
      }
    }
  }

  return result;
}

export function resolveTrayTranslation(
  tray: TrayState,
  weatherFact: WeatherFact | null,
  ctx: TrayCompileContext,
  options?: {
    runningTimer?: RunningTimerState | null;
    nowMs?: number;
  },
): TrayTranslation {
  const slots = resolveTraySlotTexts(tray, weatherFact, ctx);
  return buildTrayTranslation(ctx, slots, weatherFact, options);
}

export function createTrayFromPlacements(
  placements: Array<{
    slotIndex: number;
    cubeId: string;
    activeModeId: string;
  }>,
): TrayState {
  const tray = emptyTrayState();
  for (const p of placements) {
    tray.slots[p.slotIndex] = {
      cubeId: p.cubeId,
      slotIndex: p.slotIndex as PlacedCube["slotIndex"],
      activeModeId: p.activeModeId,
    };
  }
  return tray;
}

export function getDefaultModeId(cubeId: string): string {
  return defaultModeId(cubeId);
}

function slotTextValue(slot: TraySlotText | undefined): string | null {
  if (!slot || slot.kind === "empty") return null;
  return slot.value;
}

export function detectHeroMoment(
  prev: TraySlotText[],
  next: TraySlotText[],
  ctx: TrayCompileContext,
): boolean {
  if (ctx.primaryLensSlotIndex === null || ctx.sourceSlotIndex === null) {
    return false;
  }

  const src = ctx.sourceSlotIndex;
  const lens = ctx.primaryLensSlotIndex;

  const sourceStable =
    slotTextValue(prev[src]) !== null &&
    slotTextValue(prev[src]) === slotTextValue(next[src]);

  const lensChanged =
    slotTextValue(prev[lens]) !== slotTextValue(next[lens]) &&
    slotTextValue(next[lens]) !== null;

  const placeStable =
    ctx.placeSlotIndex === null ||
    slotTextValue(prev[ctx.placeSlotIndex]) ===
      slotTextValue(next[ctx.placeSlotIndex]);

  const momentStable =
    ctx.momentSlotIndex === null ||
    slotTextValue(prev[ctx.momentSlotIndex]) ===
      slotTextValue(next[ctx.momentSlotIndex]);

  return sourceStable && lensChanged && placeStable && momentStable;
}

/** @deprecated Use getDefaultModeId */
export function getDefaultFaceId(cubeId: string): string {
  return getDefaultModeId(cubeId);
}

export { weatherLensFromFaceToken };
