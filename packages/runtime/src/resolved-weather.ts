import type { ParsedChain } from "./chain-parser.js";
import { dialTunesWeather, hasWeatherSource } from "./chain-parser.js";
import {
  resolvePlaceProfile,
  resolvePlaceProfileForWeatherWindow,
} from "./place-profile.js";
import { rainToFaceSymbol, type WeatherFaceSymbol } from "./weather-face.js";
import { weatherToLightMood, type LightMood } from "./weather-light.js";

export type WeatherResolutionSource = "live" | "place-profile";

export interface WeatherPipelineInput {
  temp: number;
  rain: number;
}

export interface ResolvedWeatherSnapshot {
  placeId: string | null;
  placeLabel: string | null;
  temp: number;
  rain: number;
  mood: LightMood;
  faceSymbol: WeatherFaceSymbol;
  source: WeatherResolutionSource;
  pipelineTemp: number;
  pipelineRain: number;
  isThresholdMode: boolean;
}

/** Single weather reality for face, LCD, light, chime, and debug display. */
export function resolveWeatherForChain(
  chain: ParsedChain,
  pipeline: WeatherPipelineInput,
): ResolvedWeatherSnapshot | null {
  if (!hasWeatherSource(chain)) return null;

  const profile = resolvePlaceProfile(chain);
  const isThresholdMode = dialTunesWeather(chain);

  let temp = pipeline.temp;
  let rain = pipeline.rain;
  let source: WeatherResolutionSource = "live";

  if (profile) {
    temp = profile.mockBaseTemp;
    rain = profile.mockRainBias;
    source = "place-profile";
  }

  return {
    placeId: profile?.id ?? null,
    placeLabel: profile?.label ?? null,
    temp,
    rain,
    mood: weatherToLightMood(temp, rain),
    faceSymbol: rainToFaceSymbol(rain),
    source,
    pipelineTemp: pipeline.temp,
    pipelineRain: pipeline.rain,
    isThresholdMode,
  };
}

/** Resolved weather for one LCD upstream window (place-local). */
export function resolveWeatherForUpstreamWindow(
  cubes: import("./chain-parser.js").ParsedChainSlot[],
  pipeline: WeatherPipelineInput,
  _dialTunesWeather: boolean,
): { temp: number; rain: number } | null {
  if (!cubes.some((c) => c.definition.id === "identity/weather")) return null;

  const profile = resolvePlaceProfileForWeatherWindow(cubes);
  if (profile) {
    return {
      temp: profile.mockBaseTemp,
      rain: profile.mockRainBias,
    };
  }

  return { temp: pipeline.temp, rain: pipeline.rain };
}
