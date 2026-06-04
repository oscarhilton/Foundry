/** Ambient light mood from weather — blue rain, yellow sun, grey overcast. */
export type LightMood = "rain" | "sun" | "overcast";

/** Rain at or above threshold (default 0.5 for light mood; dial can override). */
export function isRaining(rain: number, threshold = 0.5): boolean {
  return rain >= threshold;
}

export function weatherToLightMood(_temp: number, rain: number): LightMood {
  if (isRaining(rain)) return "rain";
  if (rain <= 0.28) return "sun";
  return "overcast";
}

export const LIGHT_MOOD_COLORS: Record<LightMood, string> = {
  rain: "#457B9D",
  sun: "#FFD166",
  overcast: "#9CA3AF",
};
