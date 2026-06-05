import type { CoreDebugSnapshot } from "../index.js";
import type { FoundryOutputState } from "../index.js";
import { dialToRainThreshold } from "../weather-face.js";

export interface WeatherFaceNormalized {
  mode: "condition" | "threshold";
  placeLabel: string | null;
  tempC: number | null;
  rainPct: number | null;
  thresholdPct: number | null;
  gateOpen: boolean | null;
  latched: boolean;
}

export function normalizeWeatherFace(
  state: FoundryOutputState,
  dialPosition: number,
  debug?: CoreDebugSnapshot | null,
): WeatherFaceNormalized | null {
  const face = state.weatherFace;
  if (!face) return null;

  const rainPct =
    state.weatherRain != null ? Math.round(state.weatherRain * 100) : null;
  const tempC =
    state.weatherTemp != null ? Math.round(state.weatherTemp) : null;

  if (face.mode === "threshold") {
    const threshold = face.rainThreshold ?? dialToRainThreshold(dialPosition);
    const thresholdPct = Math.round(threshold * 100);
    const rain = state.weatherRain ?? 0;
    const gateOpen = rain >= threshold;

    if (debug?.weatherFace?.runtime.gate != null) {
      const debugGate = debug.weatherFace.runtime.gate === "open";
      if (debugGate !== gateOpen) {
        // surfaced by collectAuditErrors via debug mismatch helper
      }
    }

    return {
      mode: "threshold",
      placeLabel: face.placeLabel,
      tempC,
      rainPct,
      thresholdPct,
      gateOpen,
      latched: face.latched,
    };
  }

  return {
    mode: "condition",
    placeLabel: face.placeLabel,
    tempC,
    rainPct,
    thresholdPct: null,
    gateOpen: null,
    latched: face.latched,
  };
}

export function weatherDebugRainMismatch(
  normalized: WeatherFaceNormalized,
  debug: CoreDebugSnapshot | null | undefined,
): string | null {
  if (!debug?.weatherFace) return null;
  const debugRain = debug.weatherFace.runtime.currentRainPercent;
  if (
    normalized.rainPct != null &&
    debugRain !== normalized.rainPct
  ) {
    return `Weather debug rain ${debugRain}% disagrees with output rain ${normalized.rainPct}%`;
  }
  return null;
}
