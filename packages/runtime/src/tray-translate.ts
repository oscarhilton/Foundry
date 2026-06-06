import {
  formatPlaceDisplayLabel,
  renderWeatherLens,
  renderWeatherSourceSummary,
  renderWeatherSourceSummaryRainEmphasis,
  type WeatherFact,
  type WeatherLens,
} from "./weather-lens.js";

export function translatePlaceSlot(modeLabel: string): string {
  return formatPlaceDisplayLabel(modeLabel);
}

export function translateMomentSlot(_modeId: string): string {
  return "Morning";
}

export function translateControlSlot(cubeId: string, modeId: string): string {
  if (cubeId === "button") {
    switch (modeId) {
      case "press":
        return "Press to ask";
      case "hold":
        return "Hold to ask";
      case "toggle":
        return "Toggle ask";
      case "quiet":
        return "Quiet ask";
      default:
        return "Press to ask";
    }
  }
  if (cubeId === "timer") {
    return `${modeId} min`;
  }
  return modeId.charAt(0).toUpperCase() + modeId.slice(1);
}

export function translateWeatherSourceSlot(
  fact: WeatherFact,
  modeId: string,
): string {
  switch (modeId) {
    case "temp":
      return `${fact.temperatureC}°C`;
    case "rain":
      return renderWeatherSourceSummaryRainEmphasis(fact);
    case "wind":
      return fact.windSpeed
        ? `${fact.windSpeed} km/h wind`
        : "Light wind";
    case "full":
    default:
      return renderWeatherSourceSummary(fact);
  }
}

export function translateSourceSlot(
  fact: WeatherFact,
  primaryLens: WeatherLens | null,
  weatherMode?: string | null,
): string {
  if (weatherMode) {
    return translateWeatherSourceSlot(fact, weatherMode);
  }
  if (primaryLens === "rain") {
    return renderWeatherSourceSummaryRainEmphasis(fact);
  }
  return renderWeatherSourceSummary(fact);
}

export function translateLensSlot(
  fact: WeatherFact,
  lens: WeatherLens,
): string {
  return renderWeatherLens(fact, lens);
}

export function translateWearLens(fact: WeatherFact, modeId: string): string {
  switch (modeId) {
    case "warm":
      return fact.temperatureC < 10 ? "Warm layer" : "No extra layer";
    case "rain":
      return fact.precipitationChance > 40 ? "Waterproof layer" : "Light jacket";
    case "smart":
      return renderWeatherLens(fact, "coat");
    case "light":
    default:
      return renderWeatherLens(fact, "coat");
  }
}

export function translateTimeSourceSlot(modeId: string): string {
  if (modeId === "calendar") return "Today";
  return "Now";
}
