import { hourFractionInTimezone } from "./place-profile.js";

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
  /** Latched circuit: false = OPEN, true = CLOSED. */
  buttonCircuitClosed: boolean;
  /** Button is nearest control driving the light (omit button segment on LCD). */
  buttonControlsLight: boolean;
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
  placeLabel?: string,
): string {
  const temp = Math.round(weatherTemp ?? 14);
  const rain = Math.round((weatherRain ?? 0.3) * 100);
  const line = `${temp}°C · ${rain}% rain`;
  return placeLabel ? `${placeLabel}\n${line}` : line;
}

export function formatWeatherTempLine(
  weatherTemp: number | null | undefined,
  placeLabel?: string,
): string {
  const line = `${Math.round(weatherTemp ?? 14)}°C`;
  return placeLabel ? `${placeLabel}\n${line}` : line;
}

export function formatWeatherRainLine(
  weatherRain: number | null | undefined,
): string {
  const rain = Math.round((weatherRain ?? 0.3) * 100);
  return `${rain}% rain`;
}

export function formatWeatherCompact(weatherTemp: number | null | undefined): string {
  return `${Math.round(weatherTemp ?? 14)}°C`;
}

export function isWeatherTempSegment(segment: string): boolean {
  return segment.endsWith("°C") && !segment.includes("rain");
}

export function isWeatherRainSegment(segment: string): boolean {
  return segment.includes("% rain");
}

/** Atomic clauses for Split + Weather: optional place, temp, rain. */
export function buildSplitWeatherSegments(
  weatherTemp: number | null | undefined,
  weatherRain: number | null | undefined,
  placeLabel?: string,
): string[] {
  const segments: string[] = [];
  if (placeLabel) segments.push(placeLabel);
  segments.push(formatWeatherCompact(weatherTemp));
  segments.push(formatWeatherRainLine(weatherRain));
  return segments;
}

export function isSplitWeatherPayload(segments: string[]): boolean {
  if (segments.length === 2) {
    return (
      isWeatherTempSegment(segments[0]!) &&
      isWeatherRainSegment(segments[1]!)
    );
  }
  if (segments.length === 3) {
    return (
      !isWeatherTempSegment(segments[0]!) &&
      !isWeatherRainSegment(segments[0]!) &&
      isWeatherTempSegment(segments[1]!) &&
      isWeatherRainSegment(segments[2]!)
    );
  }
  return false;
}

/** Render a packed chunk of split weather clauses for one viewport. */
export function renderSplitWeatherChunk(chunks: string[]): string {
  if (chunks.length === 0) return "--";
  if (chunks.length === 1) return chunks[0]!;

  const temp = chunks.find(isWeatherTempSegment);
  const rain = chunks.find(isWeatherRainSegment);
  const place = chunks.find(
    (s) => s !== temp && s !== rain && !isWeatherTempSegment(s) && !isWeatherRainSegment(s),
  );

  if (place && temp && rain) {
    return `${place}\n${temp} · ${rain}`;
  }
  if (place && temp && !rain) {
    return `${place}\n${temp}`;
  }
  if (temp && rain && !place) {
    return `${temp} · ${rain}`;
  }
  return concatLcdSegments(chunks);
}

/** Dial in window with weather: pick one field for LCD. */
export function pickWeatherSegmentForDial(
  dialPosition: number,
  weatherTemp: number | null | undefined,
  weatherRain: number | null | undefined,
  placeLabel?: string,
): string {
  if (dialPosition < 0.34) {
    return formatWeatherTempLine(weatherTemp, placeLabel);
  }
  if (dialPosition < 0.67) {
    return formatWeatherRainLine(weatherRain);
  }
  return formatWeather(weatherTemp, weatherRain, placeLabel);
}

export function formatGithub(
  githubActivity: number | null | undefined,
  repoLabel?: string,
): string {
  const commits = Math.max(0, Math.round((githubActivity ?? 0.15) * 280));
  const line = `${commits} commits`;
  return repoLabel ? `${repoLabel}\n${line}` : line;
}

export function formatControlPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatButtonCircuit(closed: boolean): string {
  return closed ? "CLOSED" : "OPEN";
}

export function formatLightLcd(brightness: number): string {
  return `Light\n${formatControlPercent(brightness)}`;
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

export function concatLcdSegments(segments: string[]): string {
  return segments.join(" ");
}

/** @deprecated Use SegmentBuildContext from segment-pipeline. */
export type LcdSegmentContext = import("./segment-pipeline.js").SegmentBuildContext;
