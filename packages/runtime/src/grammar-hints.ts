import type { ParsedChain, ParsedChainSlot } from "./chain-parser.js";
import {
  hasLcdOutput,
  hasTimeCube,
  hasWeatherSource,
  isChainPowered,
} from "./chain-parser.js";

export const CITY_TIME_GRAMMAR_HINT =
  "Tip: put Time after each city to show city-specific times (e.g. Tokyo → Time → London → Time → LCD).";

export const CITY_WEATHER_GRAMMAR_HINT =
  "Tip: place Weather after each city to compare weather across cities.";

function isSignalCube(cube: ParsedChainSlot): boolean {
  return cube.definition.role !== "core" && cube.definition.id !== "output/lcd";
}

function windowCubesBeforeLcd(
  chain: ParsedChain,
  lcdChainIndex: number,
  prevLcdChainIndex: number,
): ParsedChainSlot[] {
  return chain.cubes
    .slice(prevLcdChainIndex + 1, lcdChainIndex)
    .filter(isSignalCube);
}

function windowHasPlaceWithoutTime(cubes: ParsedChainSlot[]): boolean {
  const hasPlace = cubes.some((c) => c.definition.role === "place");
  const hasTime = cubes.some((c) => c.definition.id === "source/time");
  return hasPlace && !hasTime;
}

function windowIsTimeOnly(cubes: ParsedChainSlot[]): boolean {
  if (!cubes.some((c) => c.definition.id === "source/time")) return false;
  return !cubes.some((c) => c.definition.role === "place");
}

/** Detect place → LCD → … → Time → LCD without per-city Time binding. */
export function needsCityTimeGrammarHint(chain: ParsedChain): boolean {
  if (!isChainPowered(chain) || !hasLcdOutput(chain) || !hasTimeCube(chain)) {
    return false;
  }

  const lcds = chain.cubes.filter((c) => c.definition.id === "output/lcd");
  if (lcds.length < 2) return false;

  let sawPlaceBeforeLcdWithoutTime = false;

  for (let i = 0; i < lcds.length; i++) {
    const lcd = lcds[i]!;
    const lcdIndex = chain.cubes.findIndex(
      (c) => c.instanceId === lcd.instanceId,
    );
    const prevLcdIndex =
      i === 0
        ? -1
        : chain.cubes.findIndex((c) => c.instanceId === lcds[i - 1]!.instanceId);

    const window = windowCubesBeforeLcd(chain, lcdIndex, prevLcdIndex);
    if (windowHasPlaceWithoutTime(window)) {
      sawPlaceBeforeLcdWithoutTime = true;
    }
    if (sawPlaceBeforeLcdWithoutTime && windowIsTimeOnly(window)) {
      return true;
    }
  }

  return false;
}

function windowHasMultiPlaceWithWeather(cubes: ParsedChainSlot[]): boolean {
  const placeCount = cubes.filter((c) => c.definition.role === "place").length;
  const hasWeather = cubes.some((c) => c.definition.id === "identity/weather");
  return placeCount >= 2 && hasWeather;
}

/** Two+ places and Weather in the same window — Weather binds to the first place only. */
export function needsCityWeatherGrammarHint(chain: ParsedChain): boolean {
  if (!isChainPowered(chain) || !hasLcdOutput(chain) || !hasWeatherSource(chain)) {
    return false;
  }

  const lcds = chain.cubes.filter((c) => c.definition.id === "output/lcd");
  for (let i = 0; i < lcds.length; i++) {
    const lcd = lcds[i]!;
    const lcdIndex = chain.cubes.findIndex(
      (c) => c.instanceId === lcd.instanceId,
    );
    const prevLcdIndex =
      i === 0
        ? -1
        : chain.cubes.findIndex((c) => c.instanceId === lcds[i - 1]!.instanceId);

    const window = windowCubesBeforeLcd(chain, lcdIndex, prevLcdIndex);
    if (windowHasMultiPlaceWithWeather(window)) {
      return true;
    }
  }

  return false;
}

export function collectGrammarHints(chain: ParsedChain): string[] {
  const hints: string[] = [];
  if (needsCityTimeGrammarHint(chain)) {
    hints.push(CITY_TIME_GRAMMAR_HINT);
  }
  if (needsCityWeatherGrammarHint(chain)) {
    hints.push(CITY_WEATHER_GRAMMAR_HINT);
  }
  return hints;
}
