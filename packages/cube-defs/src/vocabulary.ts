/** Tray word-cube vocabulary (v2). Distinct from chain CubeDefinition in schema.ts. */

export type TrayWordRole =
  | "place"
  | "moment"
  | "control"
  | "source"
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

/** Starter kit — one physical die per word (tray-lab pool v2). */
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
    id: "morning",
    label: "Temporal Context",
    word: "MORNING",
    role: "moment",
    modes: [
      mode("morning", "Morning", "MORNING", "moment/morning"),
      mode("now", "Now", "NOW", "moment/now"),
      mode("later", "Later", "LATER", "moment/later"),
      mode("evening", "Evening", "EVENING", "moment/evening"),
    ],
    starter: true,
    pack: "starter",
    provides: ["moment"],
    runtimeToken: "moment/morning",
  }),
  cube({
    id: "weather",
    label: "Weather",
    word: "WEATHER",
    role: "source",
    modes: [
      mode("full", "Full", "WEATHER", "source/weather"),
      mode("temp", "Temp", "WEATHER", "source/weather"),
      mode("rain", "Rain", "WEATHER", "source/weather"),
      mode("wind", "Wind", "WEATHER", "source/weather"),
    ],
    starter: true,
    pack: "starter",
    provides: ["weather"],
    runtimeToken: "source/weather",
  }),
  cube({
    id: "rain",
    label: "Rain",
    word: "RAIN",
    role: "lens",
    modes: [
      mode("any", "Any", "RAIN"),
      mode("later", "Later", "RAIN"),
      mode("today", "Today", "RAIN"),
      mode("now", "Now", "RAIN"),
    ],
    starter: true,
    pack: "starter",
    requires: ["source"],
    provides: ["rain-outlook"],
    runtimeToken: "lens/rain",
  }),
  cube({
    id: "umbrella",
    label: "Umbrella",
    word: "UMBRELLA",
    role: "lens",
    modes: [
      mode("any", "Any", "UMBRELLA"),
      mode("heavy", "Heavy", "UMBRELLA"),
      mode("today", "Today", "UMBRELLA"),
      mode("now", "Now", "UMBRELLA"),
    ],
    starter: true,
    pack: "starter",
    requires: ["source"],
    provides: ["umbrella-decision"],
    runtimeToken: "lens/umbrella",
  }),
  cube({
    id: "wear",
    label: "Wear",
    word: "WEAR",
    role: "lens",
    modes: [
      mode("light", "Light", "WEAR"),
      mode("warm", "Warm", "WEAR"),
      mode("coat", "Coat", "WEAR"),
      mode("smart", "Smart", "WEAR"),
    ],
    starter: true,
    pack: "starter",
    requires: ["source"],
    provides: ["wear-advice"],
    runtimeToken: "lens/coat",
  }),
  cube({
    id: "button",
    label: "Button",
    word: "BUTTON",
    role: "control",
    modes: [
      mode("press", "Press", "BUTTON"),
      mode("hold", "Hold", "BUTTON"),
      mode("toggle", "Toggle", "BUTTON"),
      mode("quiet", "Quiet", "BUTTON"),
    ],
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

/** Grammar-biased tray-lab pool order (8 starter cubes). */
export const STARTER_POOL_ORDER = [
  "home",
  "morning",
  "weather",
  "rain",
  "umbrella",
  "wear",
  "button",
  "timer",
] as const;

export function orderedStarterPool(): TrayWordCube[] {
  return STARTER_POOL_ORDER.map((id) => getTrayWordCube(id)!);
}
