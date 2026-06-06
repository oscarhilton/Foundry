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

export function translateMomentSlot(modeId: string): string {
  switch (modeId) {
    case "afternoon":
      return "Afternoon";
    case "evening":
      return "Evening";
    case "night":
      return "Tonight";
    case "morning":
    default:
      return "Morning";
  }
}

export function translateControlSlot(cubeId: string, modeId: string): string {
  if (cubeId === "button") {
    return "Press to ask";
  }
  if (cubeId === "timer") {
    if (modeId === "timer") return "Timer";
    const labels: Record<string, string> = {
      "5_min": "5 MIN",
      "15_min": "15 MIN",
      "30_min": "30 MIN",
    };
    return labels[modeId] ?? modeId;
  }
  return modeId.charAt(0).toUpperCase() + modeId.slice(1);
}

export function translateWeatherSourceSlot(fact: WeatherFact): string {
  return renderWeatherSourceSummary(fact);
}

export function translateSourceSlot(
  fact: WeatherFact,
  primaryLens: WeatherLens | null,
  weatherMode?: string | null,
): string {
  if (weatherMode) {
    return translateWeatherSourceSlot(fact);
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

export function translateRainLens(fact: WeatherFact): string {
  if (fact.precipitationChance > 55) {
    return "Rain likely";
  }
  if (fact.precipitationChance > 30) {
    return "Rain possible";
  }
  return "Rain unlikely";
}

export function translateWearLens(fact: WeatherFact, modeId: string): string {
  switch (modeId) {
    case "coat":
      return fact.temperatureC < 15 ? "Heavy coat" : "Light jacket";
    case "smart":
      return renderWeatherLens(fact, "coat");
    case "light":
    case "wear":
    default:
      return renderWeatherLens(fact, "coat");
  }
}

export function translateUmbrellaLens(fact: WeatherFact): string {
  return renderWeatherLens(fact, "umbrella");
}

/** Local slot text keyed by lens cube id — active word determines domain. */
export function translateLensLocal(
  lensCubeId: string,
  modeId: string,
  fact: WeatherFact,
): string {
  switch (lensCubeId) {
    case "rain":
      return translateRainLens(fact);
    case "umbrella":
      return translateUmbrellaLens(fact);
    case "wear":
      return translateWearLens(fact, modeId);
    default:
      return "—";
  }
}

function formatTimePhrase(timeContext: string | null): string {
  return timeContext ?? "today";
}

/** Final ambient line keyed by lens cube id — must match visible intent. */
export function composeLensFinal(
  lensCubeId: string,
  _modeId: string,
  fact: WeatherFact,
  timeContext: string | null,
): string {
  const phrase = formatTimePhrase(timeContext);

  switch (lensCubeId) {
    case "rain":
      return fact.precipitationChance > 30
        ? `Rain expected ${phrase}.`
        : `Rain unlikely ${phrase}.`;

    case "umbrella":
      if (fact.precipitationChance <= 30) {
        return `No umbrella needed ${phrase}.`;
      }
      if (fact.precipitationChance <= 55) {
        return `Take umbrella later ${phrase}.`;
      }
      return `Take an umbrella ${phrase}.`;

    case "wear":
      if (fact.temperatureC < 10) {
        return `Heavy coat ${phrase}.`;
      }
      return `Light jacket ${phrase}.`;

    default:
      return "Choose a concern.";
  }
}

export function translateTimeSourceSlot(modeId: string): string {
  if (modeId === "calendar") return "Today";
  return "Now";
}
