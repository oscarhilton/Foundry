/** Place mock weather defaults shared by tray compile (mirrors place-profile). */
export const PLACE_DEFAULTS: Record<
  string,
  { mockBaseTemp: number; mockRainBias: number }
> = {
  "identity/london": { mockBaseTemp: 12, mockRainBias: 0.45 },
  "identity/hallway": { mockBaseTemp: 12, mockRainBias: 0.22 },
  "identity/tokyo": { mockBaseTemp: 22, mockRainBias: 0.3 },
  "identity/foundry": { mockBaseTemp: 14, mockRainBias: 0.35 },
};
