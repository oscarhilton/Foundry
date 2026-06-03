export type {
  CubeCategory,
  CubeRole,
  CubeRegister,
  CubeTopics,
  CubeDefinition,
  OutputModality,
  ChainCubeInstance,
  PresetChain,
} from "./schema.js";

export {
  CUBE_DEFINITIONS,
  PRESET_CHAINS,
  STARTER_CUBE_IDS,
  HERO_PRESET_IDS,
  getCubeDefinition,
  getCubesByCategory,
  getOutputModality,
  isAudioOutput,
  isVisualOutput,
} from "./cubes.js";

export {
  validateCubeDefinition,
  CUBE_DEFINITION_JSON_SCHEMA,
} from "./validate.js";
