import type { ParsedChain } from "./chain-parser.js";
import {
  cubesAppearInOrder,
  dialSelectsWeatherField,
  dialTunesWeather,
  getNearestControl,
  hasButtonControl,
  hasCalmModifier,
  hasDialCube,
  hasLightOutput,
  hasTemperatureSensor,
  hasTimeSource,
  hasWeatherSource,
  isChainPowered,
} from "./chain-parser.js";
import { matchRecipe } from "./recipes.js";

export type LightBehaviourId =
  | "london-weather-light"
  | "tuned-weather-light"
  | "weather-dial-light"
  | "time-calm-light"
  | "github-activity-light"
  | "temperature-light"
  | "button-light";

const WEATHER_LIGHT_HARD_BOUNDARIES = new Set([
  "output/lcd",
  "output/chime",
  "sensor/motion",
  "source/time",
  "control/dial",
  "identity/weather",
]);

/** Any place cube in chain — place-agnostic, no city-specific special cases. */
export function hasPlaceContext(chain: ParsedChain): boolean {
  return chain.places.length > 0;
}

function isAllowedWeatherLightModifier(cubeId: string): boolean {
  return cubeId === "modifier/calm";
}

/** Place-weather-light: Weather must precede Light with only allowed modifiers between. */
export function matchesPlaceWeatherLightWindow(chain: ParsedChain): boolean {
  const wIdx = chain.cubes.findIndex((c) => c.definition.id === "identity/weather");
  const lIdx = chain.cubes.findIndex((c) => c.definition.id === "output/light");
  if (wIdx < 0 || lIdx < 0 || wIdx >= lIdx) return false;
  const between = chain.cubes.slice(wIdx + 1, lIdx);
  return between.every(
    (c) =>
      isAllowedWeatherLightModifier(c.definition.id) &&
      !WEATHER_LIGHT_HARD_BOUNDARIES.has(c.definition.id),
  );
}

/** Which light driver applies — independent of LCD segment pipeline. */
export function resolveLightBehaviour(
  chain: ParsedChain,
): LightBehaviourId | null {
  if (!isChainPowered(chain) || !hasLightOutput(chain)) return null;

  if (hasWeatherSource(chain) && hasDialCube(chain)) {
    if (dialTunesWeather(chain)) {
      return "tuned-weather-light";
    }
    if (
      dialSelectsWeatherField(chain) ||
      cubesAppearInOrder(chain, [
        "identity/weather",
        "control/dial",
        "output/light",
      ])
    ) {
      return "weather-dial-light";
    }
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
    hasPlaceContext(chain) &&
    matchesPlaceWeatherLightWindow(chain)
  ) {
    return "london-weather-light";
  }

  if (hasButtonControl(chain) && hasLightOutput(chain)) {
    const nearest = getNearestControl(chain);
    if (nearest?.definition.id === "control/button") {
      return "button-light";
    }
  }

  return null;
}

export function resolvePrimaryRecipeLabel(
  chain: ParsedChain,
  lightBehaviour: LightBehaviourId | null,
): string | null {
  if (lightBehaviour === "london-weather-light") return "Place Weather Light";
  if (lightBehaviour === "tuned-weather-light") return "Tuned Weather Light";
  if (lightBehaviour === "weather-dial-light") return "Weather Dial Light";
  if (lightBehaviour === "time-calm-light") return "Time Calm Light";
  if (lightBehaviour === "github-activity-light") return "GitHub Activity Light";
  if (lightBehaviour === "temperature-light") return "Temperature Light";
  if (lightBehaviour === "button-light") return "Button Light";

  if (!isChainPowered(chain)) return null;

  const recipe = matchRecipe(chain);
  if (recipe?.id === "rain-motion-chime") return recipe.name;
  if (recipe?.id === "room-motion-chime") return recipe.name;
  if (recipe?.id === "tokyo-weather-music") return recipe.name;

  return null;
}

const LEGACY_RECIPE_IDS = new Set([
  "button-chime",
  "rain-motion-chime",
  "room-motion-chime",
  "tokyo-weather-music",
]);

/** Legacy recipe pattern checks for chime / music / button — delegates to matchRecipe. */
export function matchLegacyRecipe(chain: ParsedChain) {
  if (!isChainPowered(chain)) return undefined;
  const recipe = matchRecipe(chain);
  if (recipe && LEGACY_RECIPE_IDS.has(recipe.id)) {
    return { id: recipe.id, name: recipe.name };
  }
  return undefined;
}
