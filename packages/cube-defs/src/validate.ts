import type { CubeDefinition } from "./schema.js";

/** Minimal JSON Schema for cube descriptor validation (runtime checks). */
export const CUBE_DEFINITION_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["schema", "id", "label", "category", "role", "colorAccent", "topics"],
  properties: {
    schema: { type: "integer", minimum: 1 },
    id: { type: "string", pattern: "^[a-z]+/[a-z0-9-]+$" },
    label: { type: "string", minLength: 1 },
    category: {
      enum: ["identity", "control", "sensor", "output", "core"],
    },
    role: {
      enum: ["place", "source", "modifier", "control", "sensor", "output", "core"],
    },
    colorAccent: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    capabilities: { type: "array", items: { type: "string" } },
    metadata: { type: "object" },
    registers: { type: "array" },
    topics: {
      type: "object",
      required: ["publish", "subscribe"],
      properties: {
        publish: { type: "array", items: { type: "string" } },
        subscribe: { type: "array", items: { type: "string" } },
      },
    },
    description: { type: "string" },
  },
} as const;

export function validateCubeDefinition(cube: CubeDefinition): string[] {
  const errors: string[] = [];

  if (cube.schema < 1) {
    errors.push("schema must be >= 1");
  }
  if (!/^[a-z]+\/[a-z0-9-]+$/.test(cube.id)) {
    errors.push(`invalid id format: ${cube.id}`);
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(cube.colorAccent)) {
    errors.push(`invalid colorAccent: ${cube.colorAccent}`);
  }
  if (!cube.topics.publish || !cube.topics.subscribe) {
    errors.push("topics must include publish and subscribe arrays");
  }

  return errors;
}
