/** Cubes included in the generated grammar matrix (Core appended separately). */
export type AuditCubeId =
  | "identity/london"
  | "identity/tokyo"
  | "identity/weather"
  | "source/time"
  | "control/dial"
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
  "identity/weather": "Weather",
  "source/time": "Time",
  "control/dial": "Wheel",
  "sensor/motion": "Motion",
  "output/lcd": "LCD",
  "output/light": "Light",
  "output/chime": "Chime",
  "core/core": "Core",
};
