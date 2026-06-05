import type { ParsedChain } from "../chain-parser.js";
import {
  dialTunesWeatherInSlots,
} from "../chain-parser.js";
import type { CoreDebugSnapshot, FoundryOutputState } from "../index.js";
import {
  matchesPlaceWeatherLightWindow,
  resolveLightBehaviour,
} from "../output-bindings.js";
import { resolveWeatherForUpstreamWindow } from "../resolved-weather.js";
import { dialToRainThreshold } from "../weather-face.js";
import {
  collectSymbolicFaceErrors,
  collectWeatherDebugErrors,
  expectedPlaceProfileRainPct,
  type WeatherFaceNormalized,
} from "./weather-assertions.js";

const PLACE_LABELS = ["London", "Tokyo"] as const;

function chainHas(parsed: ParsedChain, definitionId: string): boolean {
  return parsed.cubes.some((c) => c.definition.id === definitionId);
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

const WEATHER_DRIVEN_LIGHT = new Set([
  "london-weather-light",
  "tuned-weather-light",
  "weather-dial-light",
]);

function parseRainFromLcd(text: string): number | null {
  const match = text.match(/(\d+)% rain/);
  return match ? parseInt(match[1]!, 10) : null;
}

function parseTempFromLcd(text: string): number | null {
  const match = text.match(/(\d+)°C/);
  return match ? parseInt(match[1]!, 10) : null;
}

function collectWeatherUnificationErrors(
  parsed: ParsedChain,
  state: FoundryOutputState,
): string[] {
  const errors: string[] = [];
  const resolved = state.resolvedWeather;
  if (!resolved) return errors;

  const behaviour = resolveLightBehaviour(parsed);
  if (
    behaviour &&
    WEATHER_DRIVEN_LIGHT.has(behaviour) &&
    state.lightMood != null &&
    state.lightMood !== resolved.mood
  ) {
    errors.push(
      `Light mood ${state.lightMood} disagrees with resolved weather mood ${resolved.mood}`,
    );
  }

  const face = state.weatherFace;
  if (face?.mode === "condition" && face.symbol !== resolved.faceSymbol) {
    errors.push(
      `Weather face symbol ${face.symbol} disagrees with resolved symbol ${resolved.faceSymbol}`,
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
      if (weather.gateOpen != null) {
        const rain = state.resolvedWeather?.rain ?? state.weatherRain ?? 0;
        const expectedGate = rain >= dialToRainThreshold(state.dialPosition);
        if (weather.gateOpen !== expectedGate) {
          errors.push(
            `Gate ${weather.gateOpen ? "open" : "closed"} disagrees with rain vs threshold`,
          );
        }
      }
    }

    errors.push(...collectWeatherDebugErrors(weather, debug));
    errors.push(...collectSymbolicFaceErrors(state));
  }

  errors.push(...collectRecipeNameErrors(parsed, state));
  errors.push(...collectI2cDuplicateErrors(debug));
  errors.push(...collectPlaceWeatherLightErrors(parsed));
  errors.push(...collectWeatherUnificationErrors(parsed, state));

  if (hasLcd && parsed.powered) {
    const pipelineTemp = state.weatherTemp ?? 14;
    const pipelineRain = state.weatherRain ?? 0.3;

    for (const lcdCube of parsed.cubes.filter(
      (c) => c.definition.id === "output/lcd",
    )) {
      const lcdIdx = parsed.cubes.findIndex(
        (c) => c.instanceId === lcdCube.instanceId,
      );
      const text =
        state.lcdTexts[lcdCube.instanceId] ??
        (Object.keys(state.lcdTexts).length === 1 ? state.lcdText : null);
      if (!text || text === "--") continue;

      const upstream = parsed.cubes.slice(0, lcdIdx);
      const windowHasWeather = upstream.some(
        (c) => c.definition.id === "identity/weather",
      );
      if (!windowHasWeather) continue;

      const windowSupportsWeather =
        !upstream.some((c) => c.definition.id === "sensor/motion") &&
        !upstream.some((c) => c.definition.id === "source/time") &&
        !upstream.some((c) => c.definition.id === "modifier/calm") &&
        !upstream.some((c) => c.definition.id === "modifier/random") &&
        !upstream.some((c) => c.definition.id === "transform/split");

      const windowResolved = resolveWeatherForUpstreamWindow(
        upstream,
        { temp: pipelineTemp, rain: pipelineRain },
        dialTunesWeatherInSlots(upstream),
      );

      const tunesWeatherInWindow = dialTunesWeatherInSlots(upstream);
      const fieldSelectInWindow =
        upstream.some((c) => c.definition.id === "control/dial") &&
        upstream.some((c) => c.definition.id === "identity/weather") &&
        upstream.findIndex((c) => c.definition.id === "control/dial") >
          upstream.findIndex((c) => c.definition.id === "identity/weather");

      if (
        windowResolved &&
        windowSupportsWeather &&
        !tunesWeatherInWindow &&
        !fieldSelectInWindow &&
        isPlainWeatherLcd(text)
      ) {
        const lcdRain = parseRainFromLcd(text);
        const lcdTemp = parseTempFromLcd(text);
        const expectedRain = Math.round(windowResolved.rain * 100);
        const expectedTemp = Math.round(windowResolved.temp);
        if (lcdRain != null && lcdRain !== expectedRain) {
          errors.push(
            `LCD rain ${lcdRain}% disagrees with resolved weather ${expectedRain}%`,
          );
        }
        if (lcdTemp != null && lcdTemp !== expectedTemp) {
          errors.push(
            `LCD temp ${lcdTemp}°C disagrees with resolved weather ${expectedTemp}°C`,
          );
        }
      }

      if (
        windowSupportsWeather &&
        !fieldSelectInWindow &&
        !tunesWeatherInWindow &&
        isLightOnlyTelemetry(text)
      ) {
        errors.push("LCD shows light telemetry in weather upstream window");
      }

      if (tunesWeatherInWindow && windowHasWeather && windowSupportsWeather) {
        if (!isTunedWeatherLcd(text)) {
          errors.push("LCD rendered plain weather, expected tuned threshold state");
        }
        if (isPlainWeatherLcd(text)) {
          errors.push("LCD shows combined temp/rain line under Wheel → Weather tuning");
        }
      }

      if (fieldSelectInWindow && windowHasWeather && !tunesWeatherInWindow) {
        if (isTunedWeatherLcd(text)) {
          errors.push("LCD shows threshold state under Weather → Wheel field-select");
        }
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
