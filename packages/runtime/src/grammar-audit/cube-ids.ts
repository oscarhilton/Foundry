/** Cubes included in the generated grammar matrix (Core appended separately). */
export type AuditCubeId =
  | "identity/london"
  | "identity/tokyo"
  | "identity/hallway"
  | "identity/weather"
  | "transform/clothes"
  | "source/time"
  | "control/dial"
  | "control/timer"
  | "sensor/motion"
  | "output/lcd"
  | "output/light"
  | "output/chime";

export const CORE_CUBE_ID = "core/core" as const;

export const AUDIT_CUBES: AuditCubeId[] = [
  "identity/london",
  "identity/tokyo",
  "control/dial",
  "identity/weather",
  "source/time",
  "sensor/motion",
  "output/lcd",
  "output/light",
  "output/chime",
];

export const AUDIT_CUBE_LABELS: Record<AuditCubeId | typeof CORE_CUBE_ID, string> = {
  "identity/london": "London",
  "identity/tokyo": "Tokyo",
  "identity/hallway": "Hallway",
  "identity/weather": "Weather",
  "transform/clothes": "Clothes",
  "source/time": "Time",
  "control/dial": "Wheel",
  "control/timer": "Timer",
  "sensor/motion": "Motion",
  "output/lcd": "Display",
  "output/light": "Glow",
  "output/chime": "Chime",
  "core/core": "Core",
};
