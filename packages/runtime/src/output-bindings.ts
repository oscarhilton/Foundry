import type { ParsedChain } from "./chain-parser.js";
import {
  hasCalmModifier,
  hasDialCube,
  hasLightOutput,
  hasMotionSensor,
  hasMusicOutput,
  hasTemperatureSensor,
  hasTimeSource,
  hasTokyoPlace,
  hasWeatherSource,
  isChainPowered,
} from "./chain-parser.js";

export type LightBehaviourId =
  | "london-weather-light"
  | "weather-dial-light"
  | "time-calm-light"
  | "github-activity-light"
  | "temperature-light";

/** Which light driver applies — independent of LCD segment pipeline. */
export function resolveLightBehaviour(
  chain: ParsedChain,
): LightBehaviourId | null {
  if (!isChainPowered(chain) || !hasLightOutput(chain)) return null;

  if (hasWeatherSource(chain) && hasDialCube(chain) && hasLightOutput(chain)) {
    return "weather-dial-light";
  }

  if (
    hasTimeSource(chain) &&
    hasCalmModifier(chain) &&
    !hasWeatherSource(chain)
  ) {
    return "time-calm-light";
  }

  if (hasTemperatureSensor(chain) && hasLightOutput(chain)) {
    return "temperature-light";
  }

  if (
    chain.cubes.some((c) => c.definition.id === "source/github") &&
    hasLightOutput(chain)
  ) {
    return "github-activity-light";
  }

  if (
    hasWeatherSource(chain) &&
    !hasDialCube(chain) &&
    (chain.place !== undefined || hasTokyoPlace(chain))
  ) {
    return "london-weather-light";
  }

  return null;
}

export function resolvePrimaryRecipeLabel(
  chain: ParsedChain,
  lightBehaviour: LightBehaviourId | null,
): string | null {
  if (lightBehaviour === "london-weather-light") return "London Weather Light";
  if (lightBehaviour === "weather-dial-light") return "Weather Dial Light";
  if (lightBehaviour === "time-calm-light") return "Time Calm Light";
  if (lightBehaviour === "github-activity-light") return "GitHub Activity Light";
  if (lightBehaviour === "temperature-light") return "Temperature Light";

  if (!isChainPowered(chain)) return null;
  if (hasMotionSensor(chain) && chain.cubes.some((c) => c.definition.id === "output/chime")) {
    return "Room Motion Chime";
  }
  if (hasTokyoPlace(chain) && hasWeatherSource(chain) && hasMusicOutput(chain)) {
    return "Tokyo Weather Music";
  }

  return null;
}

/** Legacy recipe pattern checks for chime / music / button. */
export function matchLegacyRecipe(chain: ParsedChain) {
  if (!isChainPowered(chain)) return undefined;
  if (
    chain.cubes.some((c) => c.definition.id === "control/button") &&
    chain.cubes.some((c) => c.definition.id === "output/chime")
  ) {
    return { id: "button-chime", name: "Button Chime" };
  }
  if (hasMotionSensor(chain) && chain.cubes.some((c) => c.definition.id === "output/chime")) {
    return { id: "room-motion-chime", name: "Room Motion Chime" };
  }
  if (
    hasTokyoPlace(chain) &&
    hasWeatherSource(chain) &&
    hasMusicOutput(chain)
  ) {
    return { id: "tokyo-weather-music", name: "Tokyo Weather Music" };
  }
  return undefined;
}
