export const COLORS = {
  bg: "#F5F5F3",
  cube: "#FFFFFF",
  cubeUnpowered: "#FAFAF8",
  ink: "#1D1D1F",
  rule: "#1D1D1F",
  stroke: "#E8E8E8",
  muted: "#86868B",
  pogo: "#C9A227",
  magnet: "#2A2A2A",
  ledRed: "#E63946",
  ledBlue: "#457B9D",
  ledGreen: "#22C55E",
  ledYellow: "#FFD166",
  ledPurple: "#8338EC",
  connectorGrey: "#D1D5DB",
} as const;

export const FONTS = {
  sans: "Helvetica Neue, Helvetica, Arial, sans-serif",
  mono: "SF Mono, Menlo, Monaco, Consolas, monospace",
  labelSize: 10,
  sectionSize: 11,
  headerSize: 13,
} as const;

export const CUBE_SHELL = {
  cornerRadius: 6,
  shadowBlur: 6,
  shadowOpacity: 0.05,
  shadowOffsetY: 1,
  accentStripeHeight: 2,
  accentStripeOpacity: 0.4,
} as const;

export const CUBE_FACE = {
  iconTop: 18,
  iconBottom: 52,
  iconCenterY: 35,
  stateTop: 52,
  stateBottom: 82,
  ledY: 90,
  ledRadius: 3,
} as const;
