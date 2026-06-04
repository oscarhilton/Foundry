import type { ParsedChain } from "./chain-parser.js";
import {
  dialTunesWeather,
  getPrimaryAudioOutput,
  hasCalmModifier,
} from "./chain-parser.js";
import { dialToRainThreshold } from "./weather-face.js";
import { isRaining } from "./weather-light.js";

export interface ChimeGateDebugInput {
  activeRecipeId: string | null;
  activeRecipeName: string | null;
  weatherRain: number | null;
  smoothedRain: number;
  dialPosition: number;
}

export interface ChimeGateDebugOutput {
  recipeName: string;
  chimeInstanceId: string;
  chimeLabel: string;
  chimeAddress: string;
  rainPercent: number;
  thresholdPercent: number;
  gate: "open" | "closed";
  thresholdSource: "default" | "dial";
  hint: string;
}

export function buildChimeGateDebugOutput(
  parsed: ParsedChain,
  input: ChimeGateDebugInput,
  chimeAddress: string,
): ChimeGateDebugOutput | null {
  if (!parsed.powered || input.activeRecipeId !== "rain-motion-chime") {
    return null;
  }

  const chime = getPrimaryAudioOutput(parsed, "output/chime");
  if (!chime) return null;

  const useCalm = hasCalmModifier(parsed);
  const rain = useCalm ? input.smoothedRain : (input.weatherRain ?? 0.3);
  const dialGated = dialTunesWeather(parsed);
  const threshold = dialGated
    ? dialToRainThreshold(input.dialPosition)
    : 0.5;
  const thresholdPercent = Math.round(threshold * 100);
  const rainPercent = Math.round(rain * 100);
  const gateOpen = isRaining(rain, threshold);

  return {
    recipeName: input.activeRecipeName ?? "Rain Motion Chime",
    chimeInstanceId: chime.instanceId,
    chimeLabel: chime.definition.label,
    chimeAddress,
    rainPercent,
    thresholdPercent,
    gate: gateOpen ? "open" : "closed",
    thresholdSource: dialGated ? "dial" : "default",
    hint: gateOpen
      ? "Motion will chime"
      : `Waiting for rain ≥ ${thresholdPercent}%`,
  };
}
