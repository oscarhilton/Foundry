import type { ParsedChain } from "./chain-parser.js";
import {
  cubesAppearInOrder,
  dialTunesWeather,
  getActiveVisualOutput,
  getNearestControl,
  getPrimaryAudioOutput,
  getPrimaryOutput,
  hasButtonControl,
  hasCalmModifier,
  hasChimeOutput,
  hasLcdOutput,
  hasLightOutput,
  hasMotionSensor,
  hasMusicOutput,
  hasPlaceBefore,
  hasTemperatureSensor,
  hasDialCube,
  hasTimeSource,
  hasTokyoPlace,
  hasWeatherSource,
  isChainPowered,
} from "./chain-parser.js";

export interface Recipe {
  id: string;
  name: string;
  description: string;
  match: (chain: ParsedChain) => boolean;
}

function powered(chain: ParsedChain, predicate: () => boolean): boolean {
  return isChainPowered(chain) && predicate();
}

export const RECIPES: Recipe[] = [
  {
    id: "button-chime",
    name: "Button Chime",
    description: "Button press triggers chime",
    match: (chain) =>
      powered(chain, () => hasButtonControl(chain) && hasChimeOutput(chain)),
  },
  {
    id: "rain-motion-chime",
    name: "Rain Motion Chime",
    description: "Chime when motion happens while it's raining",
    match: (chain) =>
      powered(
        chain,
        () =>
          hasMotionSensor(chain) &&
          hasChimeOutput(chain) &&
          hasWeatherSource(chain) &&
          cubesAppearInOrder(chain, [
            "identity/weather",
            "sensor/motion",
            "output/chime",
          ]) &&
          hasPlaceBefore(chain, "identity/weather"),
      ),
  },
  {
    id: "room-motion-chime",
    name: "Room Motion Chime",
    description: "Motion triggers chime output",
    match: (chain) =>
      powered(
        chain,
        () =>
          hasMotionSensor(chain) &&
          hasChimeOutput(chain) &&
          !hasWeatherSource(chain),
      ),
  },
  {
    id: "tuned-weather-light",
    name: "Tuned Weather Light",
    description: "Dial sets rain threshold; light follows gate open/closed",
    match: (chain) =>
      powered(
        chain,
        () =>
          hasWeatherSource(chain) &&
          hasLightOutput(chain) &&
          hasDialCube(chain) &&
          dialTunesWeather(chain) &&
          cubesAppearInOrder(chain, [
            "control/dial",
            "identity/weather",
            "output/light",
          ]),
      ),
  },
  {
    id: "weather-dial-light",
    name: "Weather Dial Light",
    description: "Dial scales weather-driven light brightness",
    match: (chain) =>
      powered(
        chain,
        () =>
          hasWeatherSource(chain) &&
          hasLightOutput(chain) &&
          hasDialCube(chain) &&
          !dialTunesWeather(chain) &&
          cubesAppearInOrder(chain, [
            "identity/weather",
            "control/dial",
            "output/light",
          ]),
      ),
  },
  {
    id: "time-calm-light",
    name: "Time Calm Light",
    description: "Time of day drives calm ambient light",
    match: (chain) =>
      powered(
        chain,
        () =>
          hasTimeSource(chain) &&
          hasCalmModifier(chain) &&
          hasLightOutput(chain),
      ),
  },
  {
    id: "tokyo-weather-music",
    name: "Tokyo Weather Music",
    description: "Tokyo weather as generative notes",
    match: (chain) =>
      powered(
        chain,
        () =>
          hasTokyoPlace(chain) &&
          hasWeatherSource(chain) &&
          hasMusicOutput(chain),
      ),
  },
  {
    id: "temperature-light",
    name: "Temperature Light",
    description: "Room temperature drives light warmth",
    match: (chain) =>
      powered(
        chain,
        () => hasTemperatureSensor(chain) && hasLightOutput(chain),
      ),
  },
  {
    id: "github-lcd",
    name: "GitHub LCD",
    description: "GitHub activity on backlit LCD",
    match: (chain) =>
      powered(
        chain,
        () =>
          chain.cubes.some((c) => c.definition.id === "source/github") &&
          hasLcdOutput(chain) &&
          !hasLightOutput(chain) &&
          !hasTemperatureSensor(chain) &&
          !hasWeatherSource(chain),
      ),
  },
  {
    id: "london-weather-light",
    name: "London Weather Light",
    description: "Place + weather drives ambient light",
    match: (chain) =>
      powered(
        chain,
        () =>
          chain.place !== undefined &&
          hasWeatherSource(chain) &&
          hasLightOutput(chain) &&
          !hasDialCube(chain),
      ),
  },
  {
    id: "github-activity-light",
    name: "GitHub Activity Light",
    description: "GitHub activity drives light brightness",
    match: (chain) =>
      powered(
        chain,
        () =>
          chain.cubes.some((c) => c.definition.id === "source/github") &&
          hasLightOutput(chain) &&
          !hasLcdOutput(chain),
      ),
  },
];

export function matchRecipe(chain: ParsedChain): Recipe | undefined {
  return RECIPES.find((r) => r.match(chain));
}

export interface RecipeContext {
  chain: ParsedChain;
  recipe: Recipe;
  placeLabel?: string;
  useCalm: boolean;
  useRandom: boolean;
  controlInstanceId?: string;
  outputInstanceId?: string;
  lightInstanceId?: string;
  musicInstanceId?: string;
  chimeInstanceId?: string;
  randomInstanceId?: string;
}

export function buildRecipeContext(chain: ParsedChain): RecipeContext | null {
  const recipe = matchRecipe(chain);
  if (!recipe) return null;

  const control = getNearestControl(chain);
  const visualOutput = getActiveVisualOutput(chain);

  return {
    chain,
    recipe,
    placeLabel: chain.place?.definition.label,
    useCalm: hasCalmModifier(chain),
    useRandom: chain.cubes.some((c) => c.definition.id === "modifier/random"),
    controlInstanceId: control?.instanceId,
    outputInstanceId: visualOutput?.instanceId,
    lightInstanceId: getPrimaryOutput(chain, "output/light")?.instanceId,
    musicInstanceId: getPrimaryAudioOutput(chain, "output/music")?.instanceId,
    chimeInstanceId: getPrimaryAudioOutput(chain, "output/chime")?.instanceId,
    randomInstanceId: getPrimaryOutput(chain, "modifier/random")?.instanceId,
  };
}
