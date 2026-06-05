import type { ParsedChain } from "./chain-parser.js";
import { hasCalmModifier } from "./chain-parser.js";
import {
  formatWeatherFaceMood,
  type WeatherFaceState,
} from "./weather-face.js";
import { isRaining } from "./weather-light.js";

export interface WeatherFaceDebugInput {
  weatherRain: number | null;
  smoothedRain: number;
  /** Resolved sentence weather — used for gate and displayed rain when present. */
  resolvedRain?: number | null;
}

export interface WeatherFaceDebugContext {
  modeLabel: "Rain threshold" | "Live condition";
  sourceRainPercent: number;
  displayedRainPercent: number | null;
  thresholdPercent: number | null;
  gate: "open" | "closed" | null;
  moodLabel: string | null;
}

export function parseRainPercentFromDetail(detail: string | null): number | null {
  if (!detail) return null;
  const match = detail.match(/(\d+)% rain/);
  return match ? parseInt(match[1]!, 10) : null;
}

export function buildWeatherFaceDebugContext(
  parsed: ParsedChain,
  face: WeatherFaceState,
  input: WeatherFaceDebugInput,
): WeatherFaceDebugContext {
  const useCalm = hasCalmModifier(parsed);
  const pipelineRain = useCalm ? input.smoothedRain : (input.weatherRain ?? 0.3);
  const sourceRainPercent = Math.round(pipelineRain * 100);
  const resolvedRain = input.resolvedRain ?? pipelineRain;

  if (face.mode === "threshold") {
    const threshold = face.rainThreshold ?? 0.5;
    const thresholdPercent = Math.round(threshold * 100);
    return {
      modeLabel: "Rain threshold",
      sourceRainPercent,
      displayedRainPercent: null,
      thresholdPercent,
      gate: isRaining(resolvedRain, threshold) ? "open" : "closed",
      moodLabel: null,
    };
  }

  const displayedRainPercent =
    input.resolvedRain != null
      ? Math.round(input.resolvedRain * 100)
      : parseRainPercentFromDetail(face.detail);

  return {
    modeLabel: "Live condition",
    sourceRainPercent,
    displayedRainPercent,
    thresholdPercent: null,
    gate: null,
    moodLabel: formatWeatherFaceMood(face.symbol),
  };
}
