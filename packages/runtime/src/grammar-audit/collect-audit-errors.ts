import type { ParsedChain } from "../chain-parser.js";
import {
  dialSelectsWeatherField,
  dialTunesWeather,
} from "../chain-parser.js";
import type { CoreDebugSnapshot, FoundryOutputState } from "../index.js";
import {
  matchesPlaceWeatherLightWindow,
  resolveLightBehaviour,
} from "../output-bindings.js";
import { dialToRainThreshold } from "../weather-face.js";
import {
  collectWeatherDebugErrors,
  expectedPlaceProfileRainPct,
  type WeatherFaceNormalized,
} from "./weather-assertions.js";

const PLACE_LABELS = ["London", "Tokyo"] as const;

function chainHas(parsed: ParsedChain, definitionId: string): boolean {
  return parsed.cubes.some((c) => c.definition.id === definitionId);
}

function firstCubeIndex(parsed: ParsedChain, definitionId: string): number {
  return parsed.cubes.findIndex((c) => c.definition.id === definitionId);
}

function lcdUpstreamWindow(parsed: ParsedChain): ParsedChain["cubes"] {
  const lcdIdx = firstCubeIndex(parsed, "output/lcd");
  if (lcdIdx < 0) return [];
  return parsed.cubes.slice(0, lcdIdx);
}

function lcdWindowHasCube(parsed: ParsedChain, definitionId: string): boolean {
  return lcdUpstreamWindow(parsed).some((c) => c.definition.id === definitionId);
}

/** Tuned / field-select LCD rules only when the LCD upstream window is weather-shaped. */
function lcdWindowSupportsWeatherSemantics(parsed: ParsedChain): boolean {
  if (!lcdWindowHasCube(parsed, "identity/weather")) return false;
  if (lcdWindowHasCube(parsed, "sensor/motion")) return false;
  if (lcdWindowHasCube(parsed, "source/time")) return false;
  if (lcdWindowHasCube(parsed, "modifier/calm")) return false;
  if (lcdWindowHasCube(parsed, "modifier/random")) return false;
  if (lcdWindowHasCube(parsed, "transform/split")) return false;
  return true;
}

/** LCD only sees tuned threshold when Dial tunes Weather in a clean upstream window. */
function lcdDownstreamOfTunedWeather(parsed: ParsedChain): boolean {
  if (!dialTunesWeather(parsed)) return false;
  const weatherIdx = firstCubeIndex(parsed, "identity/weather");
  const lcdIdx = firstCubeIndex(parsed, "output/lcd");
  if (weatherIdx < 0 || lcdIdx < 0 || lcdIdx <= weatherIdx) return false;
  return lcdWindowSupportsWeatherSemantics(parsed);
}

/** Field-select LCD when Dial follows Weather in a clean upstream window. */
function lcdDownstreamOfWeatherFieldSelect(parsed: ParsedChain): boolean {
  if (!dialSelectsWeatherField(parsed)) return false;
  const dialIdx = firstCubeIndex(parsed, "control/dial");
  const lcdIdx = firstCubeIndex(parsed, "output/lcd");
  if (dialIdx < 0 || lcdIdx < 0 || lcdIdx <= dialIdx) return false;
  const weatherIdx = firstCubeIndex(parsed, "identity/weather");
  if (weatherIdx < 0 || weatherIdx >= dialIdx) return false;
  return lcdWindowSupportsWeatherSemantics(parsed);
}

function allLcdTexts(state: FoundryOutputState): string[] {
  const fromRecord = Object.values(state.lcdTexts).filter(Boolean);
  if (fromRecord.length > 0) return fromRecord;
  if (state.lcdText) return [state.lcdText];
  return [];
}

function isPlainWeatherLcd(text: string): boolean {
  return text.includes("°C") && text.includes("rain") && !text.includes("RAIN >");
}

function isTunedWeatherLcd(text: string): boolean {
  return text.includes("RAIN >");
}

function isLightOnlyTelemetry(text: string): boolean {
  const trimmed = text.trim();
  if (/^\d+%$/.test(trimmed)) return true;
  return trimmed.includes("Light\n") || trimmed.startsWith("Light\n");
}

function collectRecipeNameErrors(
  parsed: ParsedChain,
  state: FoundryOutputState,
): string[] {
  const errors: string[] = [];
  const name = state.activeRecipeName;
  if (!name) return errors;

  for (const placeLabel of PLACE_LABELS) {
    if (
      name.includes(placeLabel) &&
      !parsed.places.some((p) => p.definition.label === placeLabel)
    ) {
      errors.push(
        `Recipe name mentions ${placeLabel} but chain is not bound to ${placeLabel}`,
      );
    }
  }
  return errors;
}

function collectI2cDuplicateErrors(
  debug: CoreDebugSnapshot | null | undefined,
): string[] {
  const errors: string[] = [];
  if (!debug?.discovered.length) return errors;

  const addrs = debug.discovered.map((d) => d.address).filter(Boolean) as string[];
  const dupes = addrs.filter((a, i) => addrs.indexOf(a) !== i);
  if (dupes.length) {
    errors.push(
      `Duplicate I2C addresses in discovery: ${[...new Set(dupes)].join(", ")}`,
    );
  }
  return errors;
}

function collectPlaceWeatherLightErrors(parsed: ParsedChain): string[] {
  const errors: string[] = [];
  const behaviour = resolveLightBehaviour(parsed);

  if (behaviour === "london-weather-light" && !matchesPlaceWeatherLightWindow(parsed)) {
    errors.push(
      "Place weather-light matched across hard boundary (LCD/Motion/Weather)",
    );
  }

  return errors;
}

export function collectAuditErrors(
  parsed: ParsedChain,
  state: FoundryOutputState,
  weather: WeatherFaceNormalized | null,
  debug?: CoreDebugSnapshot | null,
): string[] {
  const errors: string[] = [];

  const hasLcd = chainHas(parsed, "output/lcd");
  const hasLight = chainHas(parsed, "output/light");
  const hasChime = chainHas(parsed, "output/chime");
  const hasWeather = chainHas(parsed, "identity/weather");
  const tunesWeather = dialTunesWeather(parsed);
  const tunedLcdWindow = lcdDownstreamOfTunedWeather(parsed);
  const fieldSelectLcdWindow = lcdDownstreamOfWeatherFieldSelect(parsed);

  if (state.powered !== parsed.powered) {
    errors.push(
      `Powered mismatch: state=${state.powered} parsed=${parsed.powered}`,
    );
  }

  if (!hasLcd) {
    if (state.lcdText != null) {
      errors.push("LCD output exists without LCD cube (lcdText)");
    }
    if (Object.keys(state.lcdTexts).length > 0) {
      errors.push("LCD output exists without LCD cube (lcdTexts)");
    }
  }

  if (!hasChime && state.chimeCount > 0) {
    errors.push("Chime output exists without Chime cube");
  }

  if (!hasLight) {
    if (state.lightBrightness > 0.05) {
      errors.push("Light brightness elevated without Light cube");
    }
    if (state.activeRecipeId?.includes("light")) {
      errors.push(`Light recipe active without Light cube: ${state.activeRecipeId}`);
    }
  }

  if (weather && hasWeather) {
    if (weather.mode === "condition") {
      if (
        weather.displayedRainPct != null &&
        weather.sourceRainPct != null &&
        !weather.usesPlaceProfile &&
        weather.displayedRainPct !== weather.sourceRainPct
      ) {
        errors.push(
          `Displayed rain ${weather.displayedRainPct}% disagrees with source rain ${weather.sourceRainPct}%`,
        );
      }

      if (weather.usesPlaceProfile && weather.displayedRainPct != null) {
        const expectedDisplay = expectedPlaceProfileRainPct(parsed);
        if (expectedDisplay != null && weather.displayedRainPct !== expectedDisplay) {
          errors.push(
            `Displayed rain ${weather.displayedRainPct}% disagrees with place profile ${expectedDisplay}%`,
          );
        }
      }
    }

    if (weather.mode === "threshold" && weather.thresholdPct != null) {
      const expectedThreshold = Math.round(
        dialToRainThreshold(state.dialPosition) * 100,
      );
      if (weather.thresholdPct !== expectedThreshold) {
        errors.push(
          `Threshold ${weather.thresholdPct}% disagrees with dial-derived ${expectedThreshold}%`,
        );
      }
      if (weather.gateOpen != null && state.weatherRain != null) {
        const expectedGate = state.weatherRain >= dialToRainThreshold(state.dialPosition);
        if (weather.gateOpen !== expectedGate) {
          errors.push(
            `Gate ${weather.gateOpen ? "open" : "closed"} disagrees with rain vs threshold`,
          );
        }
      }
    }

    errors.push(...collectWeatherDebugErrors(weather, debug));
  }

  errors.push(...collectRecipeNameErrors(parsed, state));
  errors.push(...collectI2cDuplicateErrors(debug));
  errors.push(...collectPlaceWeatherLightErrors(parsed));

  if (hasLcd && parsed.powered) {
    for (const lcd of allLcdTexts(state)) {
      if (lcd === "--") continue;

      if (tunedLcdWindow && hasWeather) {
        if (!isTunedWeatherLcd(lcd)) {
          errors.push("LCD rendered plain weather, expected tuned threshold state");
        }
        if (isPlainWeatherLcd(lcd)) {
          errors.push("LCD shows combined temp/rain line under Wheel → Weather tuning");
        }
      }

      if (fieldSelectLcdWindow && hasWeather && !tunesWeather) {
        if (isTunedWeatherLcd(lcd)) {
          errors.push("LCD shows threshold state under Weather → Wheel field-select");
        }
      }

      if (
        lcdWindowSupportsWeatherSemantics(parsed) &&
        !fieldSelectLcdWindow &&
        !tunedLcdWindow &&
        isLightOnlyTelemetry(lcd)
      ) {
        errors.push("LCD shows light telemetry in weather upstream window");
      }
    }
  }

  return errors;
}

/** After rebind to chain B, assert outputs from chain A are cleared when B lacks those cubes. */
export function collectRebindStaleErrors(
  parsedB: ParsedChain,
  state: FoundryOutputState,
  recipeIdBefore: string | null,
): string[] {
  const errors: string[] = [];
  const hasLcd = chainHas(parsedB, "output/lcd");
  const hasWeather = chainHas(parsedB, "identity/weather");
  const hasChime = chainHas(parsedB, "output/chime");

  if (!hasLcd) {
    if (Object.keys(state.lcdTexts).length > 0) {
      errors.push("Stale lcdTexts after rebind to chain without LCD");
    }
    if (state.lcdText != null) {
      errors.push("Stale lcdText after rebind to chain without LCD");
    }
  }

  if (!hasWeather && state.weatherFace != null && parsedB.powered) {
    errors.push("Stale weatherFace after rebind to powered chain without Weather");
  }

  if (!hasChime && state.chimeCount > 0) {
    errors.push("Stale chimeCount after rebind to chain without Chime");
  }

  if (
    recipeIdBefore != null &&
    parsedB.powered &&
    state.activeRecipeId === recipeIdBefore
  ) {
    const hasMotion = chainHas(parsedB, "sensor/motion");
    const hasWeather = chainHas(parsedB, "identity/weather");
    if (recipeIdBefore.includes("weather") && !hasWeather) {
      errors.push(`Stale recipe ${recipeIdBefore} after rebind without Weather`);
    }
    if (recipeIdBefore.includes("motion") && !hasMotion) {
      errors.push(`Stale recipe ${recipeIdBefore} after rebind without Motion`);
    }
  }

  return errors;
}
