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
  translateLensLocal,
  translateMomentSlot,
  translatePlaceSlot,
  translateSourceSlot,
} from "./tray-translate.js";
import {
  buildTrayCompileContext,
  resolveLensSourceBinding,
  TRAY_CORE_INSTANCE,
  type ResolvedSlot,
  type TrayCompileContext,
} from "./intent-resolver.js";
import {
  buildTrayTranslation,
  type TrayTranslation,
} from "./tray-compose.js";
import type { RunningTimerState } from "./intent-resolver.js";
import {
  isWeatherSourceToken,
  toLegacyParserToken,
} from "./tray-legacy-tokens.js";

export type { ResolvedSlot, TrayCompileContext } from "./intent-resolver.js";
export type { TrayTranslation, FinalOutputTone } from "./tray-compose.js";
export type { CompiledTrayToken } from "./tray-legacy-tokens.js";
export {
  toLegacyParserToken,
  compileTrayTokensForLegacyParser,
} from "./tray-legacy-tokens.js";

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
      definitionId: toLegacyParserToken(slot.token),
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

function findPlaceForSlot(
  ctx: TrayCompileContext,
  beforeIndex: number,
): ResolvedSlot | null {
  for (let i = beforeIndex - 1; i >= 0; i--) {
    const slot = ctx.slots[i];
    if (slot?.role === "place") return slot;
  }
  return null;
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
  const weatherSource = ctx.slots.find(
    (s) => s.role === "source" && isWeatherSourceToken(s.token ?? ""),
  );
  const hasLens = ctx.primaryLensSlotIndex !== null;

  if (!weatherSource && !hasLens) {
    return null;
  }

  const anchorIndex =
    weatherSource?.slotIndex ??
    ctx.primaryLensSlotIndex ??
    ctx.sourceSlotIndex ??
    0;
  const placeSlot =
    findPlaceForSlot(ctx, anchorIndex) ??
    (ctx.placeSlotIndex !== null ? ctx.slots[ctx.placeSlotIndex] : null);

  const placeToken =
    placeSlot?.token ??
    (weatherSource || hasLens ? ctx.defaultPlaceToken : null);

  if (!placeToken) return null;

  const placeLabel = placeSlot ? resolvePlaceLabel(placeSlot) : "Home";

  const mock = mockWeatherForPlaceToken(placeToken);
  const temp = pipeline?.temp ?? mock.temp;
  const rain = pipeline?.rain ?? mock.rain;

  return buildWeatherFact(placeLabel, temp, rain);
}

export function resolveTraySlotTexts(
  tray: TrayState,
  weatherFact: WeatherFact | null,
  ctx: TrayCompileContext,
): TraySlotText[] {
  const result: TraySlotText[] = Array.from({ length: TRAY_SLOT_COUNT }, () => ({
    kind: "empty",
  }));

  const hasWeatherSourceInTray = ctx.slots.some(
    (s) => s.role === "source" && isWeatherSourceToken(s.token ?? ""),
  );
  const hasLens = ctx.primaryLensSlotIndex !== null;
  const placeMissingButNeeded =
    ctx.placeSlotIndex === null &&
    (hasWeatherSourceInTray || hasLens) &&
    !(hasWeatherSourceInTray && hasLens);

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
        value: translateMomentSlot(slot.modeId ?? "morning"),
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
      if (isWeatherSourceToken(slot.token ?? "")) {
        const placeUpstream = findPlaceForSlot(ctx, slot.slotIndex);
        if (!placeUpstream && ctx.placeSlotIndex === null && !weatherFact) {
          result[slot.slotIndex] = { kind: "hint", value: "Add place" };
        } else if (!weatherFact) {
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
      const lensItem = ctx.lenses.find((l) => l.slotIndex === slot.slotIndex);
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

      const binding = lensItem
        ? resolveLensSourceBinding(lensItem, tray)
        : {
            sourceAttached: false,
            sourceSlotIndex: null,
            sourceId: null,
            hint: "Needs weather",
          };

      if (!binding.sourceAttached) {
        result[slot.slotIndex] = {
          kind: "hint",
          value: binding.hint ?? "Needs weather",
        };
        continue;
      }

      if (!weatherFact || !slot.cubeId) {
        result[slot.slotIndex] = { kind: "hint", value: "Needs weather" };
        continue;
      }

      result[slot.slotIndex] = {
        kind: "text",
        value: translateLensLocal(
          slot.cubeId,
          slot.modeId ?? "any",
          weatherFact,
        ),
      };
      continue;
    }
  }

  if (placeMissingButNeeded) {
    result[0] = { kind: "hint", value: "Add place" };
  }

  if (
    ctx.placeSlotIndex !== null &&
    ctx.primaryLensSlotIndex !== null &&
    ctx.sourceSlotIndex === null
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
