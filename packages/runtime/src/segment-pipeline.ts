import type { ParsedChain, ParsedChainSlot } from "./chain-parser.js";
import {
  dialSelectsWeatherInSlots,
  dialTunesWeatherInSlots,
  hasMotionSensor,
  hasWeatherSource,
} from "./chain-parser.js";
import type { PlaceProfile } from "./place-profile.js";
import {
  resolvePlaceProfileForWeatherWindow,
  resolvePlaceProfilesFromSlots,
} from "./place-profile.js";
import { resolveWeatherForUpstreamWindow } from "./resolved-weather.js";
import {
  concatLcdSegments,
  formatButtonCircuit,
  formatControlPercent,
  formatGithub,
  formatLightLcd,
  formatModifierNoise,
  formatPlaceTime,
  formatTemp,
  formatTime,
  formatTunedWeatherLcd,
  formatWeather,
  formatWeatherDialLightViewport,
  pickWeatherSegmentForDial,
  buildSplitWeatherSegments,
  renderSplitWeatherChunk,
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
  /** Weather → Dial: dial selects weather field on LCD. */
  dialSelectsWeather: boolean;
  /** Dial → Weather: dial tunes threshold; omit dial % segment on LCD. */
  dialTunesWeather: boolean;
  hasSplit: boolean;
  hasSlider: boolean;
  places: PlaceProfile[];
  /** Place bound to the weather cube in this upstream window. */
  weatherPlace: PlaceProfile | null;
  hasCalm: boolean;
  hasRandom: boolean;
  hasButton: boolean;
  hasLight: boolean;
  /** Light exists anywhere in the chain (not only the LCD upstream window). */
  hasLightInChain: boolean;
  /** Single composite weather–dial–light LCD (one viewport, light scales via dial). */
  useWeatherDialLightComposite: boolean;
  buttonControlsLight: boolean;
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
  /** Present when upstream window includes motion gate (sensor/motion). */
  motionGate?: "active" | "inactive";
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
  const weatherPlace = resolvePlaceProfileForWeatherWindow(cubes);
  const hasWeatherSource = cubes.some(
    (c) => c.definition.id === "identity/weather",
  );
  const hasTimeTransform = cubes.some((c) => c.definition.id === "source/time");
  const timeOnlyWindow =
    hasTimeTransform &&
    chain != null &&
    isWallClockWindow(cubes, chain, lcdChainIndex);

  const dialTunesWeather = dialTunesWeatherInSlots(cubes);

  let windowFmt = fmt;
  if (hasWeatherSource) {
    const resolved = resolveWeatherForUpstreamWindow(
      cubes,
      {
        temp: fmt.weatherTemp ?? 14,
        rain: fmt.weatherRain ?? 0.3,
      },
      dialTunesWeather,
    );
    if (resolved) {
      windowFmt = {
        ...fmt,
        weatherTemp: resolved.temp,
        weatherRain: resolved.rain,
      };
    }
  }

  const hasDial = cubes.some((c) => c.definition.id === "control/dial");
  const hasLightInWindow = cubes.some(
    (c) => c.definition.id === "output/light",
  );
  const hasLightInChain = chain
    ? chain.cubes.some((c) => c.definition.id === "output/light")
    : hasLightInWindow;
  const lcdCount = chain
    ? chain.cubes.filter((c) => c.definition.id === "output/lcd").length
    : 1;
  const dialSelectsWeather =
    hasDial &&
    hasWeatherSource &&
    dialSelectsWeatherInSlots(cubes) &&
    !hasLightInChain;
  const useWeatherDialLightComposite =
    hasDial &&
    hasWeatherSource &&
    hasLightInChain &&
    lcdCount === 1 &&
    dialSelectsWeatherInSlots(cubes) &&
    !dialTunesWeatherInSlots(cubes);

  return {
    fmt: windowFmt,
    hasTemperatureSensor: cubes.some(
      (c) => c.definition.id === "sensor/temperature",
    ),
    hasWeatherSource,
    hasGithub: cubes.some((c) => c.definition.id === "source/github"),
    hasTimeTransform,
    timeOnlyWindow,
    hasDial,
    dialSelectsWeather,
    dialTunesWeather,
    hasSplit: cubes.some((c) => c.definition.id === "transform/split"),
    hasSlider: cubes.some((c) => c.definition.id === "control/slider"),
    places,
    weatherPlace,
    hasCalm: cubes.some((c) => c.definition.id === "modifier/calm"),
    hasRandom: cubes.some((c) => c.definition.id === "modifier/random"),
    hasButton: cubes.some((c) => c.definition.id === "control/button"),
    hasLight: hasLightInWindow,
    hasLightInChain,
    useWeatherDialLightComposite,
    buttonControlsLight: fmt.buttonControlsLight,
  };
}

export function buildSegments(ctx: SegmentBuildContext): ConsumablePayload {
  const { fmt } = ctx;
  const segments: Segment[] = [];
  const dialScalesLight = ctx.useWeatherDialLightComposite;

  if (ctx.hasTemperatureSensor) segments.push(formatTemp(fmt.sensorTemp));
  if (ctx.hasWeatherSource) {
    const boundPlace = ctx.weatherPlace?.label ?? ctx.places[0]?.label;
    if (dialScalesLight) {
      segments.push(
        formatWeatherDialLightViewport(
          fmt.weatherTemp,
          fmt.weatherRain,
          boundPlace,
          ctx.hasCalm ? fmt.modifierCalmNoise : null,
          fmt.lightBrightness,
          fmt.lightMood,
        ),
      );
    } else if (ctx.hasSplit) {
      segments.push(
        ...buildSplitWeatherSegments(
          fmt.weatherTemp,
          fmt.weatherRain,
          boundPlace,
        ),
      );
    } else if (ctx.dialTunesWeather) {
      segments.push(
        formatTunedWeatherLcd(
          fmt.dialPosition,
          fmt.weatherRain,
          boundPlace,
        ),
      );
    } else if (ctx.dialSelectsWeather) {
      segments.push(
        pickWeatherSegmentForDial(
          fmt.dialPosition,
          fmt.weatherTemp,
          fmt.weatherRain,
          boundPlace,
        ),
      );
    } else {
      segments.push(
        formatWeather(fmt.weatherTemp, fmt.weatherRain, boundPlace),
      );
    }
  }
  if (ctx.hasGithub) {
    const repoLabel =
      ctx.places.length > 0 ? ctx.places[0]!.label : "Foundry";
    segments.push(formatGithub(fmt.githubActivity, repoLabel));
  }
  if (ctx.hasTimeTransform) {
    if (ctx.places.length > 0) {
      for (const place of ctx.places) {
        segments.push(formatPlaceTime(place.label, place.timezone));
      }
    } else if (ctx.timeOnlyWindow) {
      segments.push(formatTime(fmt.timeHour));
    }
  }
  if (
    ctx.hasDial &&
    !ctx.dialSelectsWeather &&
    !ctx.dialTunesWeather &&
    !dialScalesLight
  ) {
    segments.push(formatControlPercent(fmt.dialPosition));
  }
  if (ctx.hasSlider) segments.push(formatControlPercent(fmt.sliderPosition));
  if (!ctx.hasTimeTransform) {
    // Weather/GitHub bind to the first place; omit duplicate place labels on LCD.
    const skipPlaceLabels =
      (ctx.hasWeatherSource || ctx.hasGithub) && ctx.places.length > 0;
    if (!skipPlaceLabels) {
      for (const place of ctx.places) {
        segments.push(place.label);
      }
    }
  }
  if (ctx.hasCalm && !dialScalesLight) {
    segments.push(formatModifierNoise("Calm", fmt.modifierCalmNoise));
  }
  if (ctx.hasRandom) {
    segments.push(formatModifierNoise("RND", fmt.modifierRandom));
  }
  if (ctx.hasButton && !ctx.buttonControlsLight) {
    segments.push(formatButtonCircuit(fmt.buttonCircuitClosed));
  }
  if (ctx.hasLight && !dialScalesLight) {
    if (ctx.buttonControlsLight) {
      segments.push(formatLightLcd(fmt.lightBrightness));
    } else {
      segments.push(formatControlPercent(fmt.lightBrightness));
    }
  }

  return segments;
}

export function renderSegments(segments: ConsumablePayload): string {
  return segments.length > 0 ? concatLcdSegments(segments) : "--";
}

function isSignalCube(cube: ParsedChainSlot): boolean {
  return cube.definition.role !== "core" && cube.definition.id !== "output/lcd";
}

function windowNeedsMotionGate(cubes: ParsedChainSlot[]): boolean {
  const hasMotion = cubes.some((c) => c.definition.id === "sensor/motion");
  if (!hasMotion) return false;
  return cubes.some(
    (c) =>
      c.definition.id === "identity/weather" ||
      c.definition.role === "place" ||
      c.definition.id === "source/github",
  );
}

export interface SegmentPipelineOptions {
  motionDetected?: boolean;
}

function segmentsForWindowCubes(
  chain: ParsedChain,
  cubes: ParsedChainSlot[],
  lcdChainIndex: number,
  fmt: OutputFormatState,
  options: SegmentPipelineOptions = {},
): ConsumablePayload {
  if (!cubes.some(isSignalCube)) return [];
  if (
    windowNeedsMotionGate(cubes) &&
    options.motionDetected === false
  ) {
    return [];
  }
  return buildSegments(buildSegmentContext(cubes, fmt, chain, lcdChainIndex));
}

interface ViewportWindow {
  instanceId: string;
  label: string;
  chainIndex: number;
  segments: ConsumablePayload;
  splitWeatherPayload: boolean;
}

function computeViewportWindows(
  chain: ParsedChain,
  fmt: OutputFormatState,
  options: SegmentPipelineOptions = {},
): ViewportWindow[] {
  const viewports = chain.cubes.filter((c) => c.definition.id === "output/lcd");
  let windowStart = 0;
  const windows: ViewportWindow[] = [];

  for (const viewport of viewports) {
    const chainIndex = chain.cubes.findIndex(
      (c) => c.instanceId === viewport.instanceId,
    );
    const windowCubes = chain.cubes.slice(windowStart, chainIndex);
    const windowCtx = buildSegmentContext(
      windowCubes,
      fmt,
      chain,
      chainIndex,
    );
    windows.push({
      instanceId: viewport.instanceId,
      label: viewport.definition.label,
      chainIndex,
      segments: segmentsForWindowCubes(
        chain,
        windowCubes,
        chainIndex,
        fmt,
        options,
      ),
      splitWeatherPayload:
        windowCtx.hasSplit && windowCtx.hasWeatherSource,
    });
    windowStart = chainIndex + 1;
  }

  return windows;
}

function segmentsToTake(segmentsLeft: number, viewportsLeft: number): number {
  if (segmentsLeft === 0 || viewportsLeft <= 0) return 0;
  if (segmentsLeft <= viewportsLeft) return 1;
  return segmentsLeft - viewportsLeft + 1;
}

function renderConsumedSegments(
  consumed: ConsumablePayload,
  splitWeatherPayload: boolean,
): string {
  if (consumed.length === 0) return "--";
  if (splitWeatherPayload) return renderSplitWeatherChunk(consumed);
  return renderSegments(consumed);
}

/** Viewport consumption — one segment per LCD, or front-packs when segments exceed LCDs. */
function consumeForViewport(
  payloadBefore: ConsumablePayload,
  singleViewportEatsAll: boolean,
  viewportsLeft = 1,
): ConsumerResult {
  if (payloadBefore.length === 0) {
    return { consumed: [], remainder: [] };
  }
  if (singleViewportEatsAll) {
    return { consumed: [...payloadBefore], remainder: [] };
  }
  const take = segmentsToTake(payloadBefore.length, viewportsLeft);
  return {
    consumed: payloadBefore.slice(0, take),
    remainder: payloadBefore.slice(take),
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

function lastLcdIndexBefore(chain: ParsedChain, viewportChainIndex: number): number {
  let last = -1;
  for (let k = 0; k < viewportChainIndex; k++) {
    if (chain.cubes[k]!.definition.id === "output/lcd") last = k;
  }
  return last;
}

function resolveMotionGate(
  chain: ParsedChain,
  viewportChainIndex: number,
  options: SegmentPipelineOptions,
): ViewportConsumptionStep["motionGate"] {
  const cubes = windowSignalCubes(
    chain,
    lastLcdIndexBefore(chain, viewportChainIndex),
    viewportChainIndex,
  );
  if (!windowNeedsMotionGate(cubes)) return undefined;
  return options.motionDetected === false ? "inactive" : "active";
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
  options: SegmentPipelineOptions = {},
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

  return segmentsForWindowCubes(chain, suffixCubes, suffixEnd, fmt, options);
}

function runViewportConsumption(
  chain: ParsedChain,
  fmt: OutputFormatState,
  resolveAddress?: (targetId: string) => string | undefined,
  options: SegmentPipelineOptions = {},
): ViewportConsumptionResult {
  const windows = computeViewportWindows(chain, fmt, options);
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
    const splitWeatherPayload = windows[i]!.splitWeatherPayload;
    const nextWindowWithContent = windows[j];
    const singleViewport = cluster.length === 1;

    let remainder = [...upstreamPayload];
    const clusterSteps: ViewportConsumptionStep[] = [];

    for (let vi = 0; vi < cluster.length; vi++) {
      const w = cluster[vi]!;
      const payloadBefore = [...remainder];
      const { consumed, remainder: nextRemainder } = consumeForViewport(
        payloadBefore,
        singleViewport && upstreamPayload.length > 0,
        cluster.length - vi,
      );
      remainder = nextRemainder;
      const rendered = renderConsumedSegments(consumed, splitWeatherPayload);

      clusterSteps.push({
        targetId: w.instanceId,
        label: w.label,
        address: resolveAddress?.(w.instanceId),
        payloadBefore,
        consumed,
        remainderAfter: [...remainder],
        rendered,
        motionGate: resolveMotionGate(chain, w.chainIndex, options),
      });
      texts[w.instanceId] = rendered;
    }

    const suffix = clusterSuffixSegments(
      chain,
      cluster[cluster.length - 1]!.chainIndex,
      nextWindowWithContent,
      fmt,
      options,
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
  options: SegmentPipelineOptions = {},
): ViewportConsumptionStep[] {
  return runViewportConsumption(chain, fmt, resolveAddress, options).steps;
}

/** Resolve rendered text per viewport instance from chain order and format state. */
export function resolveViewportTextsForChain(
  chain: ParsedChain,
  fmt: OutputFormatState,
  options: SegmentPipelineOptions = {},
): Record<string, string> {
  return runViewportConsumption(chain, fmt, undefined, options).texts;
}

/** MOTION broadcast only when motion is not gating richer upstream content. */
export function shouldBroadcastMotionToLcds(chain: ParsedChain): boolean {
  if (!hasMotionSensor(chain)) return false;
  if (hasWeatherSource(chain)) return false;
  if (chain.cubes.some((c) => c.definition.id === "source/github")) {
    return false;
  }
  return true;
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
  const ctx = buildSegmentContext(cubes, fmt);
  const segments = buildSegments(ctx);
  if (ctx.hasSplit && ctx.hasWeatherSource) {
    return renderSplitWeatherChunk(segments);
  }
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
