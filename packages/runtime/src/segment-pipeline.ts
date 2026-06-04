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

/** Formatted token shown on a viewport, e.g. "London\\n12°C · 45% rain". */
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
  hasTimeTransform: boolean;
  timeOnlyWindow: boolean;
  hasDial: boolean;
  hasSlider: boolean;
  places: PlaceProfile[];
  hasCalm: boolean;
  hasRandom: boolean;
  hasButton: boolean;
  hasLight: boolean;
}

/** Wall-clock mode: only the Time cube in window, before the first LCD in the chain. */
function isWallClockWindow(
  cubes: ParsedChainSlot[],
  chain: ParsedChain,
  lcdChainIndex: number,
): boolean {
  const signalCubes = cubes.filter(isSignalCube);
  if (signalCubes.length !== 1) return false;
  if (signalCubes[0]!.definition.id !== "source/time") return false;
  const hasLcdBefore = chain.cubes
    .slice(0, lcdChainIndex)
    .some((c) => c.definition.id === "output/lcd");
  return !hasLcdBefore;
}

/** Viewport consumption trace step — grammar visible in debug. */
export interface ViewportConsumptionStep {
  targetId: string;
  label: string;
  address?: string;
  payloadBefore: Segment[];
  consumed: Segment[];
  remainderAfter: Segment[];
  rendered: string;
}

export interface ViewportConsumptionResult {
  texts: Record<string, string>;
  steps: ViewportConsumptionStep[];
}

export function buildSegmentContext(
  cubes: ParsedChainSlot[],
  fmt: OutputFormatState,
  chain?: ParsedChain,
  lcdChainIndex = 0,
): SegmentBuildContext {
  const places = resolvePlaceProfilesFromSlots(cubes);
  const hasWeatherSource = cubes.some(
    (c) => c.definition.id === "identity/weather",
  );
  const hasTimeTransform = cubes.some((c) => c.definition.id === "source/time");
  const timeOnlyWindow =
    hasTimeTransform &&
    chain != null &&
    isWallClockWindow(cubes, chain, lcdChainIndex);

  let windowFmt = fmt;
  if (hasWeatherSource && places.length > 0) {
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
    hasTimeTransform,
    timeOnlyWindow,
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
    const boundPlace =
      ctx.places.length > 0 ? ctx.places[0]!.label : undefined;
    segments.push(
      formatWeather(fmt.weatherTemp, fmt.weatherRain, boundPlace),
    );
  }
  if (ctx.hasGithub) segments.push(formatGithub(fmt.githubActivity));
  if (ctx.hasTimeTransform) {
    if (ctx.places.length > 0) {
      for (const place of ctx.places) {
        segments.push(formatPlaceTime(place.label, place.timezone));
      }
    } else if (ctx.timeOnlyWindow) {
      segments.push(formatTime(fmt.timeHour));
    }
  }
  if (ctx.hasDial) segments.push(formatControlPercent(fmt.dialPosition));
  if (ctx.hasSlider) segments.push(formatControlPercent(fmt.sliderPosition));
  if (!ctx.hasTimeTransform) {
    // Weather binds to the first place in the window; omit duplicate place labels on LCD.
    const skipPlaceLabels =
      ctx.hasWeatherSource && ctx.places.length > 0;
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

function isSignalCube(cube: ParsedChainSlot): boolean {
  return cube.definition.role !== "core" && cube.definition.id !== "output/lcd";
}

function segmentsForWindowCubes(
  chain: ParsedChain,
  cubes: ParsedChainSlot[],
  lcdChainIndex: number,
  fmt: OutputFormatState,
): ConsumablePayload {
  if (!cubes.some(isSignalCube)) return [];
  return buildSegments(buildSegmentContext(cubes, fmt, chain, lcdChainIndex));
}

interface ViewportWindow {
  instanceId: string;
  label: string;
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
      label: viewport.definition.label,
      chainIndex,
      segments: segmentsForWindowCubes(chain, windowCubes, chainIndex, fmt),
    });
    windowStart = chainIndex + 1;
  }

  return windows;
}

/** Remainder fold: one viewport consumes the next segment from shared upstream. */
function consumeForViewport(
  payloadBefore: ConsumablePayload,
  singleViewportEatsAll: boolean,
): ConsumerResult {
  if (payloadBefore.length === 0) {
    return { consumed: [], remainder: [] };
  }
  if (singleViewportEatsAll) {
    return { consumed: [...payloadBefore], remainder: [] };
  }
  return {
    consumed: [payloadBefore[0]!],
    remainder: payloadBefore.slice(1),
  };
}

function windowSignalCubes(
  chain: ParsedChain,
  fromChainIndex: number,
  toChainIndex: number,
): ParsedChainSlot[] {
  return chain.cubes
    .slice(fromChainIndex + 1, toChainIndex)
    .filter(isSignalCube);
}

/** Empty window that only contains Time after an LCD — do not load-share cluster with prior LCD. */
function isOrphanTimeWindow(
  chain: ParsedChain,
  window: ViewportWindow,
  priorLcdChainIndex: number,
): boolean {
  const cubes = windowSignalCubes(chain, priorLcdChainIndex, window.chainIndex);
  return (
    cubes.some((c) => c.definition.id === "source/time") &&
    !cubes.some((c) => c.definition.role === "place")
  );
}

function clusterSuffixSegments(
  chain: ParsedChain,
  lastClusterChainIndex: number,
  nextWindowWithContent: ViewportWindow | undefined,
  fmt: OutputFormatState,
): ConsumablePayload {
  if (nextWindowWithContent && nextWindowWithContent.segments.length > 0) {
    return [];
  }

  const suffixEnd = nextWindowWithContent
    ? nextWindowWithContent.chainIndex
    : chain.cubes.length;

  const suffixCubes = chain.cubes
    .slice(lastClusterChainIndex + 1, suffixEnd)
    .filter(isSignalCube);

  return segmentsForWindowCubes(chain, suffixCubes, suffixEnd, fmt);
}

function runViewportConsumption(
  chain: ParsedChain,
  fmt: OutputFormatState,
  resolveAddress?: (targetId: string) => string | undefined,
): ViewportConsumptionResult {
  const windows = computeViewportWindows(chain, fmt);
  const texts: Record<string, string> = {};
  const steps: ViewportConsumptionStep[] = [];

  let i = 0;
  while (i < windows.length) {
    let j = i + 1;
    while (j < windows.length && windows[j]!.segments.length === 0) {
      const priorLcdChainIndex = windows[j - 1]!.chainIndex;
      if (isOrphanTimeWindow(chain, windows[j]!, priorLcdChainIndex)) {
        break;
      }
      j++;
    }

    const cluster = windows.slice(i, j);
    const upstreamPayload = [...windows[i]!.segments];
    const nextWindowWithContent = windows[j];
    const singleViewport = cluster.length === 1;

    let remainder = [...upstreamPayload];
    const clusterSteps: ViewportConsumptionStep[] = [];

    for (const w of cluster) {
      const payloadBefore = [...remainder];
      const { consumed, remainder: nextRemainder } = consumeForViewport(
        payloadBefore,
        singleViewport && upstreamPayload.length > 0,
      );
      remainder = nextRemainder;
      const rendered =
        consumed.length > 0 ? renderSegments(consumed) : "--";

      clusterSteps.push({
        targetId: w.instanceId,
        label: w.label,
        address: resolveAddress?.(w.instanceId),
        payloadBefore,
        consumed,
        remainderAfter: [...remainder],
        rendered,
      });
      texts[w.instanceId] = rendered;
    }

    const suffix = clusterSuffixSegments(
      chain,
      cluster[cluster.length - 1]!.chainIndex,
      nextWindowWithContent,
      fmt,
    );

    if (suffix.length > 0) {
      let suffixIdx = 0;
      for (const step of clusterSteps) {
        if (step.rendered === "--" && suffixIdx < suffix.length) {
          const seg = suffix[suffixIdx++]!;
          step.consumed = [seg];
          step.rendered = seg;
          texts[step.targetId] = seg;
        }
      }
    }

    steps.push(...clusterSteps);
    i = j;
  }

  return { texts, steps };
}

/** Trace viewport consumption (payload / consumed / remainder) per instanceId. */
export function traceViewportConsumption(
  chain: ParsedChain,
  fmt: OutputFormatState,
  resolveAddress?: (targetId: string) => string | undefined,
): ViewportConsumptionStep[] {
  return runViewportConsumption(chain, fmt, resolveAddress).steps;
}

/** Resolve rendered text per viewport instance from chain order and format state. */
export function resolveViewportTextsForChain(
  chain: ParsedChain,
  fmt: OutputFormatState,
): Record<string, string> {
  return runViewportConsumption(chain, fmt).texts;
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

/** @deprecated Use distributePayloadToViewports via viewport consumption. */
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
  for (let k = 0; k < viewportCount; k++) {
    const chunk = payload.slice(k * perBucket, (k + 1) * perBucket);
    result.push(chunk.length > 0 ? renderSegments(chunk) : "--");
  }
  return result;
}
