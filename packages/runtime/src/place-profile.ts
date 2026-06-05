import type { ParsedChain, ParsedChainSlot } from "./chain-parser.js";

export interface PlaceProfile {
  id: string;
  label: string;
  lat: number;
  lon: number;
  timezone: string;
  mockBaseTemp: number;
  mockRainBias: number;
}

const PLACE_DEFAULTS: Record<
  string,
  Pick<PlaceProfile, "mockBaseTemp" | "mockRainBias" | "timezone">
> = {
  "identity/london": {
    timezone: "Europe/London",
    mockBaseTemp: 12,
    mockRainBias: 0.45,
  },
  "identity/tokyo": {
    timezone: "Asia/Tokyo",
    mockBaseTemp: 22,
    mockRainBias: 0.3,
  },
};

const FALLBACK_LAT = 51.5074;
const FALLBACK_LON = -0.1278;

function buildPlaceProfile(place: ParsedChainSlot): PlaceProfile {
  const meta = place.definition.metadata ?? {};
  const defaults = PLACE_DEFAULTS[place.definition.id] ?? {
    timezone: "UTC",
    mockBaseTemp: 14,
    mockRainBias: 0.35,
  };

  const lat = typeof meta.lat === "number" ? meta.lat : FALLBACK_LAT;
  const lon = typeof meta.lon === "number" ? meta.lon : FALLBACK_LON;
  const timezone =
    typeof meta.timezone === "string" ? meta.timezone : defaults.timezone;

  return {
    id: place.definition.id,
    label: place.definition.label,
    lat,
    lon,
    timezone,
    mockBaseTemp: defaults.mockBaseTemp,
    mockRainBias: defaults.mockRainBias,
  };
}

export function resolvePlaceProfile(chain: ParsedChain): PlaceProfile | null {
  const place = chain.place;
  if (!place) return null;
  return buildPlaceProfile(place);
}

export function resolvePlaceProfiles(chain: ParsedChain): PlaceProfile[] {
  return chain.places.map(buildPlaceProfile);
}

export function resolvePlaceProfilesFromSlots(
  slots: ParsedChainSlot[],
): PlaceProfile[] {
  return slots
    .filter((s) => s.definition.role === "place")
    .map(buildPlaceProfile);
}

/** Place profile bound to the weather cube feeding this upstream window. */
export function resolvePlaceProfileForWeatherWindow(
  slots: ParsedChainSlot[],
): PlaceProfile | null {
  let lastWeatherIdx = -1;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i]!.definition.id === "identity/weather") {
      lastWeatherIdx = i;
    }
  }
  if (lastWeatherIdx < 0) return null;

  const firstPlaceIdx = slots.findIndex((s) => s.definition.role === "place");
  if (firstPlaceIdx < 0 || firstPlaceIdx >= lastWeatherIdx) return null;

  const immediateBefore = slots[lastWeatherIdx - 1];
  const immediatePlace =
    immediateBefore?.definition.role === "place" ? immediateBefore : null;

  const between = slots.slice(firstPlaceIdx + 1, lastWeatherIdx);
  const hasSegmentBreak = between.some(
    (s) =>
      s.definition.id === "output/lcd" ||
      s.definition.id === "identity/weather",
  );

  if (hasSegmentBreak && immediatePlace) {
    return buildPlaceProfile(immediatePlace);
  }

  return buildPlaceProfile(slots[firstPlaceIdx]!);
}

export function hourFractionInTimezone(timezone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return (hour + minute / 60) / 24;
}

export function defaultLiveWeatherCoords(): { lat: number; lon: number } {
  return { lat: FALLBACK_LAT, lon: FALLBACK_LON };
}
