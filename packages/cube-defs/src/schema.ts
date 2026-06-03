export type CubeCategory =
  | "identity"
  | "control"
  | "sensor"
  | "output"
  | "core";

export type CubeRole =
  | "place"
  | "source"
  | "modifier"
  | "control"
  | "sensor"
  | "output"
  | "core";

export interface CubeRegister {
  name: string;
  offset: number;
  type: "uint8" | "uint16" | "int16" | "float";
  scale?: number;
}

export interface CubeTopics {
  publish: string[];
  subscribe: string[];
}

export interface CubeDefinition {
  schema: number;
  id: string;
  label: string;
  category: CubeCategory;
  role: CubeRole;
  colorAccent: string;
  capabilities: string[];
  metadata?: Record<string, unknown>;
  registers: CubeRegister[];
  topics: CubeTopics;
  description?: string;
}

export interface ChainCubeInstance {
  instanceId: string;
  definitionId: string;
}

export interface PresetChain {
  id: string;
  name: string;
  description: string;
  cubes: string[];
}
