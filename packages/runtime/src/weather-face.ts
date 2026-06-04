import { formatWeather } from "./output-formatters.js";

/** E-ink Weather cube face — independent of LightMood (light output colours). */
export type WeatherFaceSymbol = "rain" | "sun" | "cloud" | "unavailable";

export type WeatherFaceMode = "condition" | "threshold";

export interface WeatherFaceState {
  mode: WeatherFaceMode;
  symbol: WeatherFaceSymbol;
  /** Primary line, e.g. RAIN or SUN */
  headline: string;
  /** Condition: temp/rain line; threshold: rain gate e.g. > 60% */
  detail: string | null;
  /** Bound place label when in condition mode */
  placeLabel: string | null;
  /** Full committed string (formatWeather or gate label) */
  text: string;
  /** When mode is threshold — rain fraction that must be exceeded */
  rainThreshold: number | null;
  /** True once committed while powered; persists when unpowered (e-ink latch) */
  latched: boolean;
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
      return "OVERCAST";
    case "unavailable":
      return "--";
  }
}

export function formatWeatherFaceMood(symbol: WeatherFaceSymbol): string {
  switch (symbol) {
    case "rain":
      return "Rain";
    case "sun":
      return "Sun";
    case "cloud":
      return "Overcast";
    case "unavailable":
      return "Unavailable";
  }
}

export function weatherFaceContentKey(face: WeatherFaceState): string {
  return `${face.mode}|${face.symbol}|${face.headline}|${face.text}|${face.detail ?? ""}`;
}

function weatherDetailLine(
  temp: number | null | undefined,
  rain: number | null | undefined,
): string {
  const t = Math.round(temp ?? 14);
  const r = Math.round((rain ?? 0.3) * 100);
  return `${t}°C · ${r}% rain`;
}

export function truncatePlaceLabel(label: string, max = 12): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function buildConditionFaceState(
  temp: number | null | undefined,
  rain: number | null | undefined,
  placeLabel?: string,
): WeatherFaceState {
  const r = rain ?? 0.3;
  const symbol = rainToFaceSymbol(r);
  const text = formatWeather(temp, rain, placeLabel);
  return {
    mode: "condition",
    symbol,
    headline: symbolToHeadline(symbol),
    detail: weatherDetailLine(temp, rain),
    placeLabel: placeLabel ?? null,
    text,
    rainThreshold: null,
    latched: false,
  };
}

/** Dial → Weather: face shows the gate, not live “it is raining”. */
export function buildThresholdFaceState(dialPosition: number): WeatherFaceState {
  const rainThreshold = dialToRainThreshold(dialPosition);
  const pct = Math.round(rainThreshold * 100);
  const detail = `> ${pct}%`;
  return {
    mode: "threshold",
    symbol: "rain",
    headline: "RAIN",
    detail,
    placeLabel: null,
    text: `RAIN\n${detail}`,
    rainThreshold,
    latched: false,
  };
}

export const WEATHER_FACE_COLORS: Record<WeatherFaceSymbol, string> = {
  rain: "#457B9D",
  sun: "#FFD166",
  cloud: "#9CA3AF",
  unavailable: "#6B7280",
};

/** Monochrome ink for latched e-ink face (200×200 B/W panel). */
export const WEATHER_FACE_EINK_INK = "#1a1a1a";
