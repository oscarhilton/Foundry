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
  /**
   * Legacy parser token for parseChain(). Product vocabulary must not leak this into UI.
   * e.g. home → identity/hallway until parser evolves to identity/place/home
   */
  runtimeToken: string;
};

function mode(
  id: string,
  label: string,
  faceText: string,
  dataKey?: string,
): TrayWordMode {
  return { id, label, faceText, dataKey };
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
    label: "Home",
    word: "HOME",
    role: "place",
    modes: [
      mode("home", "Home", "HOME"),
      mode("outside", "Outside", "OUTSIDE"),
      mode("door", "Door", "DOOR"),
      mode("away", "Away", "AWAY"),
    ],
    starter: true,
    pack: "starter",
    provides: ["place"],
    runtimeToken: "identity/hallway",
  }),
  cube({
    id: "morning",
    label: "Morning",
    word: "MORNING",
    role: "moment",
    modes: [
      mode("full", "Full", "MORNING"),
      mode("work", "Work", "MORNING"),
      mode("weekend", "Weekend", "MORNING"),
      mode("quick", "Quick", "MORNING"),
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
      mode("full", "Full", "WEATHER"),
      mode("temp", "Temp", "WEATHER"),
      mode("rain", "Rain", "WEATHER"),
      mode("wind", "Wind", "WEATHER"),
    ],
    starter: true,
    pack: "starter",
    provides: ["weather"],
    runtimeToken: "identity/weather",
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
      mode("rain", "Rain", "WEAR"),
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
      mode("5", "5", "5", "5"),
      mode("10", "10", "10", "10"),
      mode("15", "15", "15", "15"),
      mode("30", "30", "30", "30"),
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
      mode("london", "London", "LONDON"),
      mode("central", "Central", "LONDON"),
      mode("north", "North", "LONDON"),
      mode("south", "South", "LONDON"),
    ],
    pack: "weather",
    provides: ["place"],
    runtimeToken: "identity/london",
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
