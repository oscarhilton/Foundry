/** Tray word-cube vocabulary (v2). Distinct from chain CubeDefinition in schema.ts. */

export type TrayWordRole =
  | "place"
  | "moment"
  | "phenomenon"
  | "response"
  | "control"
  /** @deprecated Legacy chain-parser roles — not used in weather starter kit */
  | "source"
  /** @deprecated Legacy chain-parser roles — not used in weather starter kit */
  | "lens"
  | "output";

export type TrayWordMode = {
  id: string;
  label: string;
  faceText: string;
  /** Face-level runtime token — canonical when present. */
  runtimeToken?: string;
  dataKey?: string;
};

export type TrayWordCube = {
  id: string;
  label: string;
  word: string;
  role: TrayWordRole;
  modes: TrayWordMode[];
  starter?: boolean;
  pack?: "starter" | "weather" | "routine" | "reminder";
  requires?: TrayWordRole[];
  provides: string[];
  /** Fallback parser token when modes lack face-level runtimeToken. */
  runtimeToken: string;
};

function mode(
  id: string,
  label: string,
  faceText: string,
  runtimeToken?: string,
  dataKey?: string,
): TrayWordMode {
  return { id, label, faceText, runtimeToken, dataKey };
}

function cube(
  def: Omit<TrayWordCube, "modes"> & { modes: TrayWordMode[] },
): TrayWordCube {
  return def;
}

/** Starter kit — orthogonal weather matrix + controls (TRAY-115). */
export const STARTER_CUBES: TrayWordCube[] = [
  cube({
    id: "home",
    label: "Place Context",
    word: "HOME",
    role: "place",
    modes: [
      mode("home", "Home", "HOME", "place/home"),
      mode("work", "Work", "WORK", "place/work"),
      mode("outside", "Outside", "OUTSIDE", "place/outside"),
      mode("commute", "Commute", "COMMUTE", "place/commute"),
    ],
    starter: true,
    pack: "starter",
    provides: ["place"],
    runtimeToken: "place/home",
  }),
  cube({
    id: "moment",
    label: "Temporal Context",
    word: "MORNING",
    role: "moment",
    modes: [
      mode("morning", "Morning", "MORNING", "moment/morning"),
      mode("afternoon", "Afternoon", "AFTERNOON", "moment/afternoon"),
      mode("evening", "Evening", "EVENING", "moment/evening"),
      mode("night", "Night", "NIGHT", "moment/night"),
    ],
    starter: true,
    pack: "starter",
    provides: ["moment"],
    runtimeToken: "moment/morning",
  }),
  cube({
    id: "phenomenon",
    label: "Atmospheric Source",
    word: "WIND",
    role: "phenomenon",
    modes: [
      mode("wind", "Wind", "WIND", "phenomenon/wind", "windSpeed"),
      mode("rain", "Rain", "RAIN", "phenomenon/rain", "rainChance"),
      mode("sun", "Sun", "SUN", "phenomenon/sun", "uvIndex"),
      mode("snow", "Snow", "SNOW", "phenomenon/snow", "snowAccumulation"),
    ],
    starter: true,
    pack: "starter",
    provides: ["weather"],
    runtimeToken: "phenomenon/wind",
  }),
  cube({
    id: "response",
    label: "Utility Response",
    word: "JACKET",
    role: "response",
    modes: [
      mode("jacket", "Jacket", "JACKET", "response/jacket"),
      mode("umbrella", "Umbrella", "UMBRELLA", "response/umbrella"),
      mode("sunglasses", "Sunglasses", "SUNGLASSES", "response/sunglasses"),
      mode("gloves", "Gloves", "GLOVES", "response/gloves"),
    ],
    starter: true,
    pack: "starter",
    provides: ["response"],
    runtimeToken: "response/jacket",
  }),
  cube({
    id: "button",
    label: "Button",
    word: "BUTTON",
    role: "control",
    modes: [mode("button", "Button", "BUTTON")],
    starter: true,
    pack: "starter",
    provides: ["trigger"],
    runtimeToken: "control/button",
  }),
  cube({
    id: "timer",
    label: "Timer",
    word: "TIMER",
    role: "control",
    modes: [
      mode("timer", "Timer", "TIMER"),
      mode("5_min", "5 MIN", "5 MIN", undefined, "5"),
      mode("15_min", "15 MIN", "15 MIN", undefined, "15"),
      mode("30_min", "30 MIN", "30 MIN", undefined, "30"),
    ],
    starter: true,
    pack: "starter",
    provides: ["timer"],
    runtimeToken: "control/timer",
  }),
];

/** Catalog-only cubes — not in tray-lab starter pool. */
export const CATALOG_CUBES: TrayWordCube[] = [
  cube({
    id: "london",
    label: "London",
    word: "LONDON",
    role: "place",
    modes: [
      mode("london", "London", "LONDON", "place/london"),
      mode("central", "Central", "LONDON", "place/london"),
      mode("north", "North", "LONDON", "place/london"),
      mode("south", "South", "LONDON", "place/london"),
    ],
    pack: "weather",
    provides: ["place"],
    runtimeToken: "place/london",
  }),
];

export const ALL_WORD_CUBES: TrayWordCube[] = [
  ...STARTER_CUBES,
  ...CATALOG_CUBES,
];

export function getTrayWordCube(cubeId: string): TrayWordCube | undefined {
  return ALL_WORD_CUBES.find((c) => c.id === cubeId);
}

export function getTrayWordMode(
  cubeId: string,
  modeId: string,
): TrayWordMode | undefined {
  return getTrayWordCube(cubeId)?.modes.find((m) => m.id === modeId);
}

export function rotateTrayModeId(cubeId: string, activeModeId: string): string {
  const cubeDef = getTrayWordCube(cubeId);
  if (!cubeDef || cubeDef.modes.length === 0) return activeModeId;
  const index = cubeDef.modes.findIndex((m) => m.id === activeModeId);
  const next = index === -1 ? 0 : (index + 1) % cubeDef.modes.length;
  return cubeDef.modes[next]!.id;
}

export function defaultModeId(cubeId: string): string {
  return getTrayWordCube(cubeId)?.modes[0]?.id ?? "";
}

/** Grammar-biased tray-lab pool order (6 starter cubes). */
export const STARTER_POOL_ORDER = [
  "home",
  "moment",
  "phenomenon",
  "response",
  "button",
  "timer",
] as const;

export function orderedStarterPool(): TrayWordCube[] {
  return STARTER_POOL_ORDER.map((id) => getTrayWordCube(id)!);
}
