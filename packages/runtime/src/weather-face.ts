/** E-ink Weather cube face — independent of LightMood (light output colours). */
export type WeatherFaceSymbol = "rain" | "sun" | "cloud" | "unavailable";

export type WeatherFaceMode = "condition" | "threshold";

export interface WeatherFaceState {
  mode: WeatherFaceMode;
  symbol: WeatherFaceSymbol;
  /** Primary line, e.g. RAIN or SUN */
  headline: string;
  /** Secondary line, e.g. > 60% for threshold mode */
  detail: string | null;
  /** When mode is threshold — rain fraction that must be exceeded */
  rainThreshold: number | null;
}

/** Dial position 0–1 → rain gate for chime / threshold face. */
export function dialToRainThreshold(dialPosition: number): number {
  return 0.15 + dialPosition * 0.7;
}

export function rainToFaceSymbol(rain: number): WeatherFaceSymbol {
  if (rain >= 0.5) return "rain";
  if (rain <= 0.28) return "sun";
  return "cloud";
}

export function symbolToHeadline(symbol: WeatherFaceSymbol): string {
  switch (symbol) {
    case "rain":
      return "RAIN";
    case "sun":
      return "SUN";
    case "cloud":
      return "CLOUD";
    case "unavailable":
      return "--";
  }
}

export function buildConditionFaceState(
  rain: number | null | undefined,
): WeatherFaceState {
  const r = rain ?? 0.3;
  const symbol = rainToFaceSymbol(r);
  return {
    mode: "condition",
    symbol,
    headline: symbolToHeadline(symbol),
    detail: null,
    rainThreshold: null,
  };
}

/** Dial → Weather: face shows the gate, not live “it is raining”. */
export function buildThresholdFaceState(dialPosition: number): WeatherFaceState {
  const rainThreshold = dialToRainThreshold(dialPosition);
  const pct = Math.round(rainThreshold * 100);
  return {
    mode: "threshold",
    symbol: "rain",
    headline: "RAIN",
    detail: `> ${pct}%`,
    rainThreshold,
  };
}

export const WEATHER_FACE_COLORS: Record<WeatherFaceSymbol, string> = {
  rain: "#457B9D",
  sun: "#FFD166",
  cloud: "#9CA3AF",
  unavailable: "#6B7280",
};
