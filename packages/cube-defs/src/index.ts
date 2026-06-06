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

export type {
  TrayWordRole,
  TrayWordMode,
  TrayWordCube,
} from "./vocabulary.js";

export {
  STARTER_CUBES,
  CATALOG_CUBES,
  ALL_WORD_CUBES,
  STARTER_POOL_ORDER,
  getTrayWordCube,
  getTrayWordMode,
  rotateTrayModeId,
  defaultModeId,
  orderedStarterPool,
} from "./vocabulary.js";

export type {
  DieFamily,
  DieFaceRole,
  DieFace,
  WordDie,
  TrayWordCubeDefinition,
  TraySlotIndex,
  PlacedCube,
  PlacedDie,
  TrayState,
} from "./dice.js";

export {
  WORD_DICE,
  TRAY_SLOT_COUNT,
  emptyTrayState,
  getTrayCubeDefinition,
  getWordDie,
  getCubeMode,
  getDieFace,
  getActiveMode,
  getActiveFace,
  rotateModeId,
  rotateFaceId,
  getDefaultModeId,
  getDefaultFaceId,
  isWeatherLensToken,
  weatherLensFromToken,
} from "./dice.js";
