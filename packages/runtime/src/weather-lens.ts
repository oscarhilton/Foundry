import type { ResolvedWeatherSnapshot } from "./resolved-weather.js";

export type WeatherLens = "rain" | "umbrella" | "coat" | "sun";

export interface WeatherFact {
  location: string;
  temperatureC: number;
  feelsLikeC: number;
  precipitationChance: number;
  precipitationWindow?: string;
  windSpeed?: number;
  condition: "sunny" | "cloudy" | "rain" | "overcast";
  uvIndex?: number;
}

export function weatherLensFromFaceToken(token: string): WeatherLens | null {
  const id = token.startsWith("lens/") ? token.slice("lens/".length) : token;
  if (id === "rain" || id === "umbrella" || id === "coat" || id === "sun") {
    return id;
  }
  return null;
}

export function buildWeatherFact(
  placeLabel: string,
  temp: number,
  rain: number,
): WeatherFact {
  const precipitationChance = Math.round(rain * 100);
  const condition =
    rain > 0.55 ? "rain" : rain <= 0.28 ? "sunny" : "cloudy";
  const windSpeed = rain > 0.4 ? 18 : 12;

  return {
    location: placeLabel,
    temperatureC: Math.round(temp),
    feelsLikeC: Math.round(temp - (windSpeed > 15 ? 2 : 0)),
    precipitationChance,
    precipitationWindow: "after 4pm",
    windSpeed,
    condition,
    uvIndex: rain <= 0.28 ? 6 : 2,
  };
}

export function buildWeatherFactFromSnapshot(
  snapshot: ResolvedWeatherSnapshot,
): WeatherFact {
  return buildWeatherFact(
    snapshot.placeLabel ?? "Home",
    snapshot.temp,
    snapshot.rain,
  );
}

/** Stable source-slot line — does not change when lens rotates (except rain-emphasis mode). */
export function renderWeatherSourceSummary(fact: WeatherFact): string {
  return `${fact.precipitationChance}% rain after 4pm`;
}

/** Rain-emphasis source line when primary lens is RAIN. */
export function renderWeatherSourceSummaryRainEmphasis(fact: WeatherFact): string {
  return `Rain ${fact.precipitationChance}% after 4pm`;
}

export function renderNeutralWeather(fact: WeatherFact): string {
  const conditionLabel =
    fact.condition === "rain"
      ? "rainy"
      : fact.condition === "sunny"
        ? "bright"
        : "cloudy";
  return `${fact.temperatureC}°C · ${conditionLabel}\n${fact.precipitationChance}% rain`;
}

export function renderWeatherLens(
  fact: WeatherFact,
  lens: WeatherLens,
): string {
  switch (lens) {
    case "rain":
      return "Light showers likely";
    case "umbrella":
      if (fact.precipitationChance <= 30) return "No umbrella needed";
      if (fact.precipitationChance <= 55) return "Take umbrella later";
      return "Take umbrella";
    case "coat":
      if (fact.temperatureC < 10) return "Warm layer";
      if (fact.windSpeed && fact.windSpeed >= 15) {
        return "Light jacket";
      }
      return "Light jacket";
    case "sun":
      return fact.uvIndex && fact.uvIndex >= 5
        ? "Sunglasses advised"
        : "Sunglasses optional";
    default:
      return renderNeutralWeather(fact);
  }
}

export function formatPlaceDisplayLabel(faceLabel: string): string {
  const lower = faceLabel.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
