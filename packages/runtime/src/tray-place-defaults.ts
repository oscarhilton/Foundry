/** Place mock weather defaults shared by tray compile (mirrors place-profile). */
export const PLACE_DEFAULTS: Record<
  string,
  { mockBaseTemp: number; mockRainBias: number }
> = {
  "identity/london": { mockBaseTemp: 12, mockRainBias: 0.45 },
  "identity/hallway": { mockBaseTemp: 12, mockRainBias: 0.22 },
  "identity/tokyo": { mockBaseTemp: 22, mockRainBias: 0.3 },
  "identity/foundry": { mockBaseTemp: 14, mockRainBias: 0.35 },
  "place/home": { mockBaseTemp: 12, mockRainBias: 0.22 },
  "place/work": { mockBaseTemp: 14, mockRainBias: 0.18 },
  "place/outside": { mockBaseTemp: 11, mockRainBias: 0.28 },
  "place/commute": { mockBaseTemp: 13, mockRainBias: 0.25 },
  "place/london": { mockBaseTemp: 12, mockRainBias: 0.45 },
};
