import type { ParsedChain, ParsedChainSlot } from "./chain-parser.js";
import type { PlaceProfile } from "./place-profile.js";
import { resolvePlaceProfilesFromSlots } from "./place-profile.js";
import {
  concatLcdSegments,
  formatControlPercent,
  formatGithub,
  formatModifierNoise,
  formatPlaceTime,
  formatTemp,
  formatTime,
  formatWeather,
  type OutputFormatState,
} from "./output-formatters.js";

/** Formatted token shown on a viewport, e.g. "12°C 45%". */
export type Segment = string;

export type ConsumablePayload = Segment[];

export type ConsumerResult = {
  consumed: Segment[];
  remainder: Segment[];
};

export interface SegmentBuildContext {
  fmt: OutputFormatState;
  hasTemperatureSensor: boolean;
  hasWeatherSource: boolean;
  hasGithub: boolean;
  hasTimeSource: boolean;
  hasDial: boolean;
  hasSlider: boolean;
  places: PlaceProfile[];
  hasCalm: boolean;
  hasRandom: boolean;
  hasButton: boolean;
  hasLight: boolean;
}

export interface SegmentConsumer {
  instanceId: string;
  consume(payload: ConsumablePayload): ConsumerResult;
}

export function buildSegmentContext(
  cubes: ParsedChainSlot[],
  fmt: OutputFormatState,
): SegmentBuildContext {
  const places = resolvePlaceProfilesFromSlots(cubes);
  const hasWeatherSource = cubes.some(
    (c) => c.definition.id === "identity/weather",
  );
  const hasTimeSource = cubes.some((c) => c.definition.id === "source/time");

  let windowFmt = fmt;
  if (hasWeatherSource && places.length === 1) {
    const place = places[0]!;
    windowFmt = {
      ...fmt,
      weatherTemp: place.mockBaseTemp,
      weatherRain: place.mockRainBias,
    };
  }

  return {
    fmt: windowFmt,
    hasTemperatureSensor: cubes.some(
      (c) => c.definition.id === "sensor/temperature",
    ),
    hasWeatherSource,
    hasGithub: cubes.some((c) => c.definition.id === "source/github"),
    hasTimeSource,
    hasDial: cubes.some((c) => c.definition.id === "control/dial"),
    hasSlider: cubes.some((c) => c.definition.id === "control/slider"),
    places,
    hasCalm: cubes.some((c) => c.definition.id === "modifier/calm"),
    hasRandom: cubes.some((c) => c.definition.id === "modifier/random"),
    hasButton: cubes.some((c) => c.definition.id === "control/button"),
    hasLight: cubes.some((c) => c.definition.id === "output/light"),
  };
}

export function buildSegments(ctx: SegmentBuildContext): ConsumablePayload {
  const { fmt } = ctx;
  const segments: Segment[] = [];

  if (ctx.hasTemperatureSensor) segments.push(formatTemp(fmt.sensorTemp));
  if (ctx.hasWeatherSource) {
    segments.push(formatWeather(fmt.weatherTemp, fmt.weatherRain));
  }
  if (ctx.hasGithub) segments.push(formatGithub(fmt.githubActivity));
  if (ctx.hasTimeSource) {
    if (ctx.places.length > 0) {
      for (const place of ctx.places) {
        segments.push(formatPlaceTime(place.label, place.timezone));
      }
    } else {
      segments.push(formatTime(fmt.timeHour));
    }
  }
  if (ctx.hasDial) segments.push(formatControlPercent(fmt.dialPosition));
  if (ctx.hasSlider) segments.push(formatControlPercent(fmt.sliderPosition));
  if (!ctx.hasTimeSource) {
    const skipPlaceLabels =
      ctx.hasWeatherSource && ctx.places.length === 1;
    if (!skipPlaceLabels) {
      for (const place of ctx.places) {
        segments.push(place.label);
      }
    }
  }
  if (ctx.hasCalm) {
    segments.push(formatModifierNoise("CALM", fmt.modifierCalmNoise));
  }
  if (ctx.hasRandom) {
    segments.push(formatModifierNoise("RND", fmt.modifierRandom));
  }
  if (ctx.hasButton) segments.push("BTN");
  if (ctx.hasLight) segments.push(formatControlPercent(fmt.lightBrightness));

  return segments;
}

export function renderSegments(segments: ConsumablePayload): string {
  return segments.length > 0 ? concatLcdSegments(segments) : "--";
}

/** Viewport (LCD) consumes one or more segments and passes the rest downstream. */
export function createViewportConsumer(instanceId: string): SegmentConsumer {
  return {
    instanceId,
    consume(payload: ConsumablePayload): ConsumerResult {
      if (payload.length === 0) {
        return { consumed: [], remainder: [] };
      }
      if (payload.length === 1) {
        return { consumed: [payload[0]!], remainder: [] };
      }
      const perBucket = Math.ceil(payload.length / 1);
      const consumed = payload.slice(0, perBucket);
      const remainder = payload.slice(perBucket);
      return { consumed, remainder };
    },
  };
}

export function distributePayloadToViewports(
  payload: ConsumablePayload,
  viewportCount: number,
): string[] {
  if (viewportCount === 0) return [];
  if (viewportCount === 1) {
    return payload.length > 0 ? [renderSegments(payload)] : ["--"];
  }
  if (payload.length === 0) {
    return Array.from({ length: viewportCount }, () => "--");
  }
  if (payload.length <= viewportCount) {
    const result = [...payload];
    while (result.length < viewportCount) result.push("--");
    return result;
  }

  const perBucket = Math.ceil(payload.length / viewportCount);
  const result: string[] = [];
  for (let i = 0; i < viewportCount; i++) {
    const chunk = payload.slice(i * perBucket, (i + 1) * perBucket);
    result.push(chunk.length > 0 ? renderSegments(chunk) : "--");
  }
  return result;
}

function isSignalCube(cube: ParsedChainSlot): boolean {
  return cube.definition.role !== "core" && cube.definition.id !== "output/lcd";
}

function segmentsForWindowCubes(
  cubes: ParsedChainSlot[],
  fmt: OutputFormatState,
): ConsumablePayload {
  if (!cubes.some(isSignalCube)) return [];
  return buildSegments(buildSegmentContext(cubes, fmt));
}

interface ViewportWindow {
  instanceId: string;
  chainIndex: number;
  segments: ConsumablePayload;
}

function computeViewportWindows(
  chain: ParsedChain,
  fmt: OutputFormatState,
): ViewportWindow[] {
  const viewports = chain.cubes.filter((c) => c.definition.id === "output/lcd");
  let windowStart = 0;
  const windows: ViewportWindow[] = [];

  for (const viewport of viewports) {
    const chainIndex = chain.cubes.findIndex(
      (c) => c.instanceId === viewport.instanceId,
    );
    const windowCubes = chain.cubes.slice(windowStart, chainIndex);
    windows.push({
      instanceId: viewport.instanceId,
      chainIndex,
      segments: segmentsForWindowCubes(windowCubes, fmt),
    });
    windowStart = chainIndex + 1;
  }

  return windows;
}

function suffixSegmentsForCluster(
  chain: ParsedChain,
  lastChainIndex: number,
  fmt: OutputFormatState,
): ConsumablePayload {
  const suffixCubes = chain.cubes
    .slice(lastChainIndex + 1)
    .filter(isSignalCube);
  return segmentsForWindowCubes(suffixCubes, fmt);
}

/** Resolve rendered text per viewport instance from chain order and format state. */
export function resolveViewportTextsForChain(
  chain: ParsedChain,
  fmt: OutputFormatState,
): Record<string, string> {
  const windows = computeViewportWindows(chain, fmt);
  const texts: Record<string, string> = {};

  let i = 0;
  while (i < windows.length) {
    let j = i + 1;
    while (j < windows.length && windows[j]!.segments.length === 0) {
      j++;
    }

    const clusterSize = j - i;
    const upstreamPayload = windows[i]!.segments;
    const distributed = distributePayloadToViewports(
      upstreamPayload,
      clusterSize,
    );
    const backfill = suffixSegmentsForCluster(
      chain,
      windows[j - 1]!.chainIndex,
      fmt,
    );

    let backfillIdx = 0;
    for (let k = 0; k < clusterSize; k++) {
      let text = distributed[k] ?? "--";
      if (text === "--" && backfillIdx < backfill.length) {
        text = backfill[backfillIdx++]!;
      }
      texts[windows[i + k]!.instanceId] = text;
    }

    i = j;
  }

  return texts;
}

/** @deprecated Use resolveViewportTextsForChain — kept for compatibility. */
export const resolveLcdTextsForChain = resolveViewportTextsForChain;

export function resolveViewportTextForWindow(
  cubes: ParsedChainSlot[],
  fmt: OutputFormatState,
): string {
  const signalCubes = cubes.filter(
    (c) => c.definition.role !== "core" && c.definition.id !== "output/lcd",
  );
  if (signalCubes.length === 0) return "--";
  const segments = buildSegments(buildSegmentContext(cubes, fmt));
  return renderSegments(segments);
}
