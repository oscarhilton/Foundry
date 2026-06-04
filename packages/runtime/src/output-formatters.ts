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

export function concatLcdSegments(segments: string[]): string {
  return segments.join(" ");
}

/** @deprecated Use SegmentBuildContext from segment-pipeline. */
export type LcdSegmentContext = import("./segment-pipeline.js").SegmentBuildContext;
