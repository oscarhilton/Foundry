import { describe, it, expect } from "vitest";
import { buildWeatherFact } from "./weather-lens.js";
import { WeatherPackRenderer } from "./weather-pack-renderer.js";

const HOME_FACT = buildWeatherFact("Home", 12, 0.22);
const WINDY_FACT = buildWeatherFact("Home", 12, 0.45);

describe("WeatherPackRenderer", () => {
  it("evaluates canonical rain + umbrella with afternoon moment", () => {
    const result = WeatherPackRenderer.render(
      {
        place: "home",
        moment: "afternoon",
        phenomenon: "rain",
        response: "umbrella",
      },
      HOME_FACT,
    );

    expect(result.localTranslations.phenomenon).toBe("22% rain");
    expect(result.localTranslations.response).toBe("No umbrella");
    expect(result.finalOutput).toBe("No umbrella needed this afternoon.");
    expect(result.finalOutputTone).toBe("answer");
  });

  it("scales final output to night moment", () => {
    const result = WeatherPackRenderer.render(
      {
        place: "home",
        moment: "night",
        phenomenon: "rain",
        response: "umbrella",
      },
      HOME_FACT,
    );

    expect(result.finalOutput).toBe("No umbrella needed tonight.");
  });

  it("handles wind + umbrella cross-pairing as warning not error", () => {
    const result = WeatherPackRenderer.render(
      {
        place: "home",
        moment: "morning",
        phenomenon: "wind",
        response: "umbrella",
      },
      HOME_FACT,
    );

    expect(result.localTranslations.response).toBe("Umbrella awkward");
    expect(result.finalOutput).toBe(
      "High winds make umbrellas unmanageable this morning.",
    );
    expect(result.finalOutputTone).toBe("warning");
  });

  it("canonical wind + jacket produces clothing advice", () => {
    const result = WeatherPackRenderer.render(
      {
        moment: "morning",
        phenomenon: "wind",
        response: "jacket",
      },
      WINDY_FACT,
    );

    expect(result.localTranslations.response).toBe("Light jacket");
    expect(result.finalOutput).toBe("Light jacket this morning.");
  });
});
