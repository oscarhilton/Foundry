import type { AuditCubeId } from "./cube-ids.js";

export interface RebindPair {
  name: string;
  from: readonly AuditCubeId[];
  to: readonly AuditCubeId[];
}

export const REBIND_PAIRS: RebindPair[] = [
  {
    name: "LCD weather → motion chime",
    from: ["identity/london", "identity/weather", "output/lcd"],
    to: ["sensor/motion", "output/chime"],
  },
  {
    name: "tuned weather LCD → london only",
    from: ["control/dial", "identity/weather", "output/lcd"],
    to: ["identity/london"],
  },
  {
    name: "weather light → time lcd",
    from: ["identity/london", "identity/weather", "output/light"],
    to: ["source/time", "output/lcd"],
  },
  {
    name: "tokyo time lcd → core only",
    from: ["identity/tokyo", "source/time", "output/lcd"],
    to: [],
  },
  {
    name: "motion chime → weather lcd",
    from: ["sensor/motion", "output/chime"],
    to: ["identity/weather", "output/lcd"],
  },
  {
    name: "wheel weather lcd → weather wheel lcd",
    from: ["identity/london", "control/dial", "identity/weather", "output/lcd"],
    to: ["identity/london", "identity/weather", "control/dial", "output/lcd"],
  },
  {
    name: "light → lcd only",
    from: ["identity/london", "identity/weather", "output/light"],
    to: ["output/lcd"],
  },
  {
    name: "time weather → motion",
    from: ["identity/tokyo", "source/time", "identity/weather"],
    to: ["sensor/motion"],
  },
  {
    name: "chime → tokyo time",
    from: ["output/chime"],
    to: ["identity/tokyo", "source/time"],
  },
  {
    name: "weather lcd → london",
    from: ["identity/weather", "output/lcd"],
    to: ["identity/london"],
  },
];
