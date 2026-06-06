import type { AxisLayout } from "./axis-layout.js";
import type { DomainRenderer, RenderResult } from "./domain-registry.js";
import { registerDomainRenderer } from "./domain-registry.js";
import {
  formatPlaceDisplayLabel,
  type WeatherFact,
} from "./weather-lens.js";

const PHENOMENA = new Set(["wind", "rain", "sun", "snow"]);

function momentPhrase(momentId?: string): string {
  switch (momentId) {
    case "afternoon":
      return "this afternoon";
    case "evening":
      return "this evening";
    case "night":
      return "tonight";
    case "morning":
    default:
      return "this morning";
  }
}

function momentLocal(momentId?: string): string {
  switch (momentId) {
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

function placeLocal(placeId?: string, fact?: WeatherFact): string {
  if (!placeId) return fact?.location ?? "Home";
  const labels: Record<string, string> = {
    home: "Home",
    work: "Work",
    outside: "Outside",
    commute: "Commute",
    london: "London",
    central: "London",
    north: "London",
    south: "London",
  };
  return labels[placeId] ?? formatPlaceDisplayLabel(placeId);
}

function phenomenonLocal(phenomenonId: string, fact: WeatherFact): string {
  switch (phenomenonId) {
    case "wind":
      return `${fact.windSpeed ?? 12} km/h wind`;
    case "rain":
      return `${fact.precipitationChance}% rain`;
    case "sun":
      return fact.uvIndex && fact.uvIndex >= 5 ? "High UV" : "Clear skies";
    case "snow":
      return fact.temperatureC <= 2 ? "Snow likely" : "Light snow";
    default:
      return "—";
  }
}

type PairingOutput = {
  local: string;
  final: string;
  tone: RenderResult["finalOutputTone"];
};

function evaluatePairing(
  phenomenon: string,
  response: string,
  fact: WeatherFact,
  timePhrase: string,
): PairingOutput {
  const rain = fact.precipitationChance;
  const temp = fact.temperatureC;
  const wind = fact.windSpeed ?? 12;

  if (phenomenon === "rain" && response === "umbrella") {
    if (rain <= 30) {
      return {
        local: "No umbrella",
        final: `No umbrella needed ${timePhrase}.`,
        tone: "answer",
      };
    }
    if (rain <= 55) {
      return {
        local: "Take umbrella",
        final: `Take an umbrella ${timePhrase}.`,
        tone: "answer",
      };
    }
    return {
      local: "Take umbrella",
      final: `Take an umbrella ${timePhrase}.`,
      tone: "answer",
    };
  }

  if (phenomenon === "wind" && response === "jacket") {
    const layer = wind >= 15 || temp < 12 ? "Light jacket" : "No extra layer";
    return {
      local: layer,
      final: `${layer} ${timePhrase}.`,
      tone: "answer",
    };
  }

  if (phenomenon === "sun" && response === "sunglasses") {
    const need = fact.uvIndex && fact.uvIndex >= 5;
    return {
      local: need ? "Take sunglasses" : "Sunglasses optional",
      final: need
        ? `Take sunglasses ${timePhrase}.`
        : `Sunglasses optional ${timePhrase}.`,
      tone: "answer",
    };
  }

  if (phenomenon === "snow" && response === "gloves") {
    const need = temp <= 2;
    return {
      local: need ? "Wear gloves" : "Gloves optional",
      final: need
        ? `Wear gloves ${timePhrase}.`
        : `Gloves optional ${timePhrase}.`,
      tone: "answer",
    };
  }

  // Cross-pairings — useful, not errors
  if (phenomenon === "wind" && response === "umbrella") {
    return {
      local: "Umbrella awkward",
      final: `High winds make umbrellas unmanageable ${timePhrase}.`,
      tone: "warning",
    };
  }

  if (phenomenon === "rain" && response === "jacket") {
    return {
      local: "Waterproof advised",
      final: `Waterproof jacket recommended ${timePhrase}.`,
      tone: "answer",
    };
  }

  if (phenomenon === "rain" && response === "sunglasses") {
    return {
      local: "Sunglasses unlikely",
      final: `Sunglasses unlikely due to cloud cover ${timePhrase}.`,
      tone: "answer",
    };
  }

  if (phenomenon === "sun" && response === "jacket") {
    const skip = temp >= 18;
    return {
      local: skip ? "Skip heavy layer" : "Light layer",
      final: skip
        ? `Skip a heavy jacket ${timePhrase}.`
        : `Light layer ${timePhrase}.`,
      tone: "answer",
    };
  }

  if (phenomenon === "snow" && response === "jacket") {
    return {
      local: "Heavy coat",
      final: `Heavy coat ${timePhrase}.`,
      tone: "answer",
    };
  }

  if (phenomenon === "wind" && response === "gloves") {
    return {
      local: "Gloves optional",
      final: `Gloves optional ${timePhrase}.`,
      tone: "answer",
    };
  }

  return {
    local: "Clear view",
    final: `Conditions look calm ${timePhrase}.`,
    tone: "answer",
  };
}

export const WeatherPackRenderer: DomainRenderer = {
  id: "weather-pack",
  canRender(layout: AxisLayout): boolean {
    return (
      layout.phenomenon !== undefined &&
      PHENOMENA.has(layout.phenomenon) &&
      layout.response !== undefined
    );
  },
  render(layout: AxisLayout, fact: WeatherFact): RenderResult {
    const phenomenon = layout.phenomenon!;
    const response = layout.response!;
    const timePhrase = momentPhrase(layout.moment);
    const pairing = evaluatePairing(phenomenon, response, fact, timePhrase);

    return {
      localTranslations: {
        place: placeLocal(layout.place, fact),
        moment: momentLocal(layout.moment),
        phenomenon: phenomenonLocal(phenomenon, fact),
        response: pairing.local,
      },
      finalOutput: pairing.final,
      finalOutputTone: pairing.tone,
    };
  },
};

registerDomainRenderer(WeatherPackRenderer);
