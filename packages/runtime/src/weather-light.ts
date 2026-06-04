/** Ambient light mood from weather — blue rain, yellow sun, grey overcast. */
export type LightMood = "rain" | "sun" | "overcast";

export function weatherToLightMood(_temp: number, rain: number): LightMood {
  if (rain >= 0.5) return "rain";
  if (rain <= 0.28) return "sun";
  return "overcast";
}

export const LIGHT_MOOD_COLORS: Record<LightMood, string> = {
  rain: "#457B9D",
  sun: "#FFD166",
  overcast: "#9CA3AF",
};
