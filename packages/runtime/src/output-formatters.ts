import type { ParsedChain, ParsedChainSlot } from "./chain-parser.js";
import type { PlaceProfile } from "./place-profile.js";
import {
  hourFractionInTimezone,
  resolvePlaceProfilesFromSlots,
} from "./place-profile.js";

export interface OutputFormatState {
  timeHour: number | null;
  sensorTemp: number | null;
  weatherTemp: number | null;
  weatherRain: number | null;
  githubActivity: number | null;
  dialPosition: number;
  sliderPosition: number;
  lightBrightness: number;
  modifierRandom: number | null;
  modifierCalmNoise: number | null;
}

export function formatTime(timeHour: number | null | undefined): string {
  const hourFrac = timeHour ?? 0.5;
  const totalMinutes = Math.floor(hourFrac * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatPlaceTime(
  label: string,
  timezone: string,
  now = new Date(),
): string {
  return `${label} ${formatTime(hourFractionInTimezone(timezone, now))}`;
}

export function formatTemp(sensorTemp: number | null | undefined): string {
  return `${Math.round(sensorTemp ?? 20)}°C`;
}

export function formatWeather(
  weatherTemp: number | null | undefined,
  weatherRain: number | null | undefined,
): string {
  const temp = Math.round(weatherTemp ?? 14);
  const rain = Math.round((weatherRain ?? 0.3) * 100);
  return `${temp}°C ${rain}%`;
}

export function formatWeatherCompact(weatherTemp: number | null | undefined): string {
  return `${Math.round(weatherTemp ?? 14)}°C`;
}

export function formatGithub(githubActivity: number | null | undefined): string {
  return `${Math.round((githubActivity ?? 0) * 20)}/hr`;
}

export function formatControlPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatModifierNoise(
  label: string,
  value: number | null | undefined,
): string {
  if (value != null) {
    return `${label} ${formatControlPercent(value)}`;
  }
  return label;
}

export function formatPowerBattery(
  source: "usb" | "battery",
  percent: number,
): string {
  const pct = Math.round(Math.max(0, Math.min(100, percent)));
  return source === "usb" ? `PWR USB ${pct}%` : `BAT ${pct}%`;
}

export function combineLine(
  primary: string,
  secondary: string,
  maxLen = 16,
): string {
  const combined = `${primary} ${secondary}`;
  return combined.length <= maxLen ? combined : primary;
}

export interface LcdSegmentContext {
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

export function resolveLcdSegments(ctx: LcdSegmentContext): string[] {
  const { fmt } = ctx;
  const segments: string[] = [];

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

export function concatLcdSegments(segments: string[]): string {
  return segments.join(" ");
}

export function buildLcdSegmentContext(
  cubes: ParsedChainSlot[],
  fmt: OutputFormatState,
): LcdSegmentContext {
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

export function resolveLcdTextForWindow(
  cubes: ParsedChainSlot[],
  fmt: OutputFormatState,
): string {
  const signalCubes = cubes.filter(
    (c) => c.definition.role !== "core" && c.definition.id !== "output/lcd",
  );
  if (signalCubes.length === 0) return "--";
  const segments = resolveLcdSegments(buildLcdSegmentContext(cubes, fmt));
  return segments.length > 0 ? concatLcdSegments(segments) : "--";
}

export function distributeSegmentsToLcds(
  segments: string[],
  lcdCount: number,
): string[] {
  if (lcdCount === 0) return [];
  if (lcdCount === 1) {
    return segments.length > 0 ? [concatLcdSegments(segments)] : ["--"];
  }
  if (segments.length === 0) {
    return Array.from({ length: lcdCount }, () => "--");
  }
  if (segments.length <= lcdCount) {
    const result = [...segments];
    while (result.length < lcdCount) result.push("--");
    return result;
  }

  const perBucket = Math.ceil(segments.length / lcdCount);
  const result: string[] = [];
  for (let i = 0; i < lcdCount; i++) {
    const chunk = segments.slice(i * perBucket, (i + 1) * perBucket);
    result.push(chunk.length > 0 ? concatLcdSegments(chunk) : "--");
  }
  return result;
}

interface LcdWindow {
  instanceId: string;
  chainIndex: number;
  segments: string[];
}

function isSignalCube(cube: ParsedChainSlot): boolean {
  return cube.definition.role !== "core" && cube.definition.id !== "output/lcd";
}

function segmentsForWindowCubes(
  cubes: ParsedChainSlot[],
  fmt: OutputFormatState,
): string[] {
  if (!cubes.some(isSignalCube)) return [];
  return resolveLcdSegments(buildLcdSegmentContext(cubes, fmt));
}

function computeLcdWindows(
  chain: ParsedChain,
  fmt: OutputFormatState,
): LcdWindow[] {
  const lcdOutputs = chain.cubes.filter((c) => c.definition.id === "output/lcd");
  let windowStart = 0;
  const windows: LcdWindow[] = [];

  for (const lcd of lcdOutputs) {
    const chainIndex = chain.cubes.findIndex(
      (c) => c.instanceId === lcd.instanceId,
    );
    const windowCubes = chain.cubes.slice(windowStart, chainIndex);
    windows.push({
      instanceId: lcd.instanceId,
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
): string[] {
  const suffixCubes = chain.cubes
    .slice(lastChainIndex + 1)
    .filter(isSignalCube);
  return segmentsForWindowCubes(suffixCubes, fmt);
}

export function resolveLcdTextsForChain(
  chain: ParsedChain,
  fmt: OutputFormatState,
): Record<string, string> {
  const windows = computeLcdWindows(chain, fmt);
  const texts: Record<string, string> = {};

  let i = 0;
  while (i < windows.length) {
    let j = i + 1;
    while (j < windows.length && windows[j]!.segments.length === 0) {
      j++;
    }

    const clusterSize = j - i;
    const upstreamSegments = windows[i]!.segments;
    const distributed = distributeSegmentsToLcds(upstreamSegments, clusterSize);
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
