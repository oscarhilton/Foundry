export const COLORS = {
  bg: "#F5F5F3",
  cube: "#FFFFFF",
  cubeUnpowered: "#FAFAF8",
  ink: "#1D1D1F",
  rule: "#1D1D1F",
  stroke: "#E8E8E8",
  muted: "#86868B",
  ledRed: "#E63946",
  ledBlue: "#457B9D",
  ledGreen: "#22C55E",
  ledYellow: "#FFD166",
  ledPurple: "#8338EC",
  connectorGrey: "#D1D5DB",
  einkBackground: "#f3f3f3",
} as const;

export const FONTS = {
  sans: "Helvetica Neue, Helvetica, Arial, sans-serif",
  mono: "SF Mono, Menlo, Monaco, Consolas, monospace",
  labelSize: 10,
  sectionSize: 11,
  headerSize: 13,
} as const;

export const CUBE_SHELL = {
  cornerRadius: 8,
  shadowBlur: 6,
  shadowOpacity: 0.05,
  shadowOffsetY: 1,
  accentStripeHeight: 2,
  accentStripeOpacity: 0.5,
  chainShadow: "0 1px 2px rgba(0,0,0,0.06), 0 4px 14px rgba(0,0,0,0.07)",
  chainBorder: "#D4D4D8",
} as const;

export const CUBE_ICON_BADGE_SIZE = 18;

export const CUBE_ICON_SIZE = 28;
export const CUBE_ICON_STROKE = 1.75;

export const CUBE_FACE = {
  iconTop: 18,
  iconBottom: 52,
  iconCenterY: 35,
  stateTop: 52,
  stateBottom: 82,
  ledY: 90,
  ledRadius: 3,
} as const;
