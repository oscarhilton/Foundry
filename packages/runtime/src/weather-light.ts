/** Ambient light mood from weather — blue rain, yellow sun, grey overcast. */
export type LightMood = "rain" | "sun" | "overcast";

/** Same breakpoint as rain mood — keep chime and light behaviour aligned. */
export function isRaining(rain: number): boolean {
  return rain >= 0.5;
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
