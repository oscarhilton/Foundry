import type { CoreDebugSnapshot } from "../index.js";
import type { FoundryOutputState } from "../index.js";
import type { ParsedChain } from "../chain-parser.js";
import { dialTunesWeather } from "../chain-parser.js";
import { resolvePlaceProfile } from "../place-profile.js";
import { dialToRainThreshold } from "../weather-face.js";
import { parseRainPercentFromDetail } from "../weather-face-debug.js";

export interface WeatherFaceNormalized {
  mode: "condition" | "threshold";
  placeLabel: string | null;
  tempC: number | null;
  sourceRainPct: number | null;
  displayedRainPct: number | null;
  thresholdPct: number | null;
  gateOpen: boolean | null;
  latched: boolean;
  usesPlaceProfile: boolean;
}

export function usesPlaceProfileDisplay(parsed: ParsedChain): boolean {
  return (
    parsed.places.length > 0 &&
    parsed.cubes.some((c) => c.definition.id === "identity/weather") &&
    !dialTunesWeather(parsed)
  );
}

export function normalizeWeatherFace(
  state: FoundryOutputState,
  dialPosition: number,
  parsed?: ParsedChain | null,
): WeatherFaceNormalized | null {
  const face = state.weatherFace;
  if (!face) return null;

  const sourceRainPct =
    state.weatherRain != null ? Math.round(state.weatherRain * 100) : null;
  const tempC =
    state.resolvedWeather != null
      ? Math.round(state.resolvedWeather.temp)
      : state.weatherTemp != null
        ? Math.round(state.weatherTemp)
        : null;
  const displayedRainPct =
    face.mode === "condition"
      ? state.resolvedWeather != null
        ? Math.round(state.resolvedWeather.rain * 100)
        : parseRainPercentFromDetail(face.detail)
      : null;
  const usesPlaceProfile =
    state.resolvedWeather?.source === "place-profile" ||
    (parsed ? usesPlaceProfileDisplay(parsed) : false);

  if (face.mode === "threshold") {
    const threshold = face.rainThreshold ?? dialToRainThreshold(dialPosition);
    const thresholdPct = Math.round(threshold * 100);
    const rain = state.resolvedWeather?.rain ?? state.weatherRain ?? 0;
    const gateOpen = rain >= threshold;

    return {
      mode: "threshold",
      placeLabel: face.placeLabel,
      tempC,
      sourceRainPct,
      displayedRainPct,
      thresholdPct,
      gateOpen,
      latched: face.latched,
      usesPlaceProfile,
    };
  }

  return {
    mode: "condition",
    placeLabel: face.placeLabel,
    tempC,
    sourceRainPct,
    displayedRainPct,
    thresholdPct: null,
    gateOpen: null,
    latched: face.latched,
    usesPlaceProfile,
  };
}

export function collectWeatherDebugErrors(
  weather: WeatherFaceNormalized,
  debug: CoreDebugSnapshot | null | undefined,
): string[] {
  const errors: string[] = [];
  if (!debug?.weatherFace) return errors;

  const runtime = debug.weatherFace.runtime;
  if (
    weather.sourceRainPct != null &&
    runtime.sourceRainPercent !== weather.sourceRainPct
  ) {
    errors.push(
      `Weather debug source rain ${runtime.sourceRainPercent}% disagrees with pipeline ${weather.sourceRainPct}%`,
    );
  }
  if (
    weather.displayedRainPct != null &&
    runtime.displayedRainPercent !== weather.displayedRainPct
  ) {
    errors.push(
      `Weather debug displayed rain ${runtime.displayedRainPercent}% disagrees with face detail ${weather.displayedRainPct}%`,
    );
  }
  return errors;
}

export function expectedPlaceProfileRainPct(parsed: ParsedChain): number | null {
  const profile = resolvePlaceProfile(parsed);
  if (!profile) return null;
  return Math.round(profile.mockRainBias * 100);
}
