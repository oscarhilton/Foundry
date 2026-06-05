import type { ChainCubeInput } from "../chain-parser.js";
import type { AuditCubeId } from "./cube-ids.js";

export interface GoldenChainCase {
  name: string;
  chainIds: readonly AuditCubeId[];
  /** Override dial after seed (default 1 in runChainAudit). */
  dialPosition?: number;
  chainInput?: ChainCubeInput[];
  lcdIncludes?: string[];
  lcdExcludes?: string[];
  expectRecipe?: string | null;
  expectPowered?: boolean;
  assert?: (state: import("../index.js").FoundryOutputState) => void;
}

export const GOLDEN_CHAINS: GoldenChainCase[] = [
  {
    name: "London → Weather → LCD",
    chainIds: ["identity/london", "identity/weather", "output/lcd"],
    lcdIncludes: ["London", "12°C", "45% rain"],
  },
  {
    name: "London → Wheel → Weather → LCD",
    chainIds: [
      "identity/london",
      "control/dial",
      "identity/weather",
      "output/lcd",
    ],
    lcdIncludes: ["London", "RAIN > 85%", "21%", "closed"],
    lcdExcludes: ["°C ·", "45% rain"],
  },
  {
    name: "London → Weather → Wheel → LCD",
    chainIds: [
      "identity/london",
      "identity/weather",
      "control/dial",
      "output/lcd",
    ],
    dialPosition: 0.5,
    lcdIncludes: ["45% rain"],
    lcdExcludes: ["RAIN >"],
  },
  {
    name: "London → Wheel → Weather → Light",
    chainIds: [
      "identity/london",
      "control/dial",
      "identity/weather",
      "output/light",
    ],
    expectRecipe: "tuned-weather-light",
  },
  {
    name: "London → Weather → Wheel → Light",
    chainIds: [
      "identity/london",
      "identity/weather",
      "control/dial",
      "output/light",
    ],
    expectRecipe: "weather-dial-light",
  },
  {
    name: "London → Weather → Motion → Chime",
    chainIds: [
      "identity/london",
      "identity/weather",
      "sensor/motion",
      "output/chime",
    ],
  },
  {
    name: "Tokyo → Time → LCD",
    chainIds: ["identity/tokyo", "source/time", "output/lcd"],
    lcdIncludes: ["Tokyo"],
  },
  {
    name: "Tokyo → Time → Weather",
    chainIds: ["identity/tokyo", "source/time", "identity/weather"],
  },
  {
    name: "Weather → LCD",
    chainIds: ["identity/weather", "output/lcd"],
    lcdIncludes: ["17°C", "21%"],
  },
  {
    name: "Wheel → Weather → LCD",
    chainIds: ["control/dial", "identity/weather", "output/lcd"],
    lcdIncludes: ["RAIN > 85%", "21%", "closed"],
    lcdExcludes: ["°C ·"],
  },
  {
    name: "Motion → Chime",
    chainIds: ["sensor/motion", "output/chime"],
    expectRecipe: "room-motion-chime",
  },
  {
    name: "LCD → Core",
    chainIds: ["output/lcd"],
  },
  {
    name: "Core only",
    chainIds: [],
    expectPowered: false,
  },
];

export const DUPLICATE_CUBE_CHAINS: GoldenChainCase[] = [
  {
    name: "London → Weather → LCD → LCD",
    chainInput: [
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather", definitionId: "identity/weather" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: "core/core" },
    ],
    chainIds: ["identity/london", "identity/weather", "output/lcd", "output/lcd"],
    lcdIncludes: ["London"],
  },
  {
    name: "London → Weather → LCD → Tokyo → Weather → LCD",
    chainInput: [
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "weather1", definitionId: "identity/weather" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "weather2", definitionId: "identity/weather" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: "core/core" },
    ],
    chainIds: [
      "identity/london",
      "identity/weather",
      "output/lcd",
      "identity/tokyo",
      "identity/weather",
      "output/lcd",
    ],
  },
  {
    name: "Tokyo → London → Weather → LCD",
    chainIds: [
      "identity/tokyo",
      "identity/london",
      "identity/weather",
      "output/lcd",
    ],
    lcdIncludes: ["Tokyo"],
  },
  {
    name: "Weather → LCD → Light",
    chainIds: ["identity/weather", "output/lcd", "output/light"],
  },
  {
    name: "Light → LCD",
    chainIds: ["output/light", "output/lcd"],
  },
  {
    name: "Tokyo → Time → LCD → LCD",
    chainInput: [
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: "core/core" },
    ],
    chainIds: ["identity/tokyo", "source/time", "output/lcd", "output/lcd"],
    lcdIncludes: ["Tokyo"],
  },
  {
    name: "Tokyo → Time → LCD → London → Time → LCD",
    chainInput: [
      { instanceId: "tokyo", definitionId: "identity/tokyo" },
      { instanceId: "time1", definitionId: "source/time" },
      { instanceId: "lcd1", definitionId: "output/lcd" },
      { instanceId: "london", definitionId: "identity/london" },
      { instanceId: "time2", definitionId: "source/time" },
      { instanceId: "lcd2", definitionId: "output/lcd" },
      { instanceId: "core", definitionId: "core/core" },
    ],
    chainIds: [
      "identity/tokyo",
      "source/time",
      "output/lcd",
      "identity/london",
      "source/time",
      "output/lcd",
    ],
    lcdIncludes: ["Tokyo", "London"],
  },
];

export const UNPOWERED_CHAINS: Array<{
  name: string;
  chainIds: readonly string[];
  withCore: boolean;
}> = [
  {
    name: "Core only (single cube — parser unpowered)",
    chainIds: [],
    withCore: true,
  },
  {
    name: "Weather → LCD (no Core)",
    chainIds: ["identity/weather", "output/lcd"],
    withCore: false,
  },
  {
    name: "LCD alone (no Core)",
    chainIds: ["output/lcd"],
    withCore: false,
  },
  {
    name: "London → Weather (no Core)",
    chainIds: ["identity/london", "identity/weather"],
    withCore: false,
  },
];
