import type { TrayWordCube, TrayWordMode, TrayWordRole } from "./vocabulary.js";
import {
  ALL_WORD_CUBES,
  CATALOG_CUBES,
  STARTER_CUBES,
  defaultModeId,
  getTrayWordCube,
  getTrayWordMode,
  rotateTrayModeId,
} from "./vocabulary.js";

/** @deprecated Use TrayWordRole */
export type DieFamily = TrayWordRole;

/** @deprecated Use TrayWordRole */
export type DieFaceRole = TrayWordRole;

/** @deprecated Use TrayWordMode — legacy face shape for gradual migration */
export interface DieFace {
  id: string;
  label: string;
  role: DieFaceRole;
  token: string;
}

/** Per-word physical cube (v2). Alias: WordDie */
export type TrayWordCubeDefinition = TrayWordCube;
export type WordDie = TrayWordCube;

export type TraySlotIndex = 0 | 1 | 2 | 3 | 4;

export interface PlacedCube {
  cubeId: string;
  slotIndex: TraySlotIndex;
  activeModeId: string;
}

/** @deprecated Use PlacedCube */
export type PlacedDie = PlacedCube;

export interface TrayState {
  slots: (PlacedCube | null)[];
}

export const TRAY_SLOT_COUNT = 5;

/** v2 starter pool + catalog-only cubes */
export const WORD_DICE: WordDie[] = ALL_WORD_CUBES;

export { STARTER_CUBES, CATALOG_CUBES, ALL_WORD_CUBES };

export function emptyTrayState(): TrayState {
  return { slots: Array.from({ length: TRAY_SLOT_COUNT }, () => null) };
}

export function getWordDie(cubeId: string): WordDie | undefined {
  return getTrayWordCube(cubeId);
}

/** Tray word cube lookup — distinct from chain getCubeDefinition in cubes.js */
export function getTrayCubeDefinition(cubeId: string): TrayWordCube | undefined {
  return getTrayWordCube(cubeId);
}

export function getCubeMode(
  cubeId: string,
  modeId: string,
): TrayWordMode | undefined {
  return getTrayWordMode(cubeId, modeId);
}

export function getDieFace(cubeId: string, modeId: string): DieFace | undefined {
  const cubeDef = getTrayWordCube(cubeId);
  const modeDef = getTrayWordMode(cubeId, modeId);
  if (!cubeDef || !modeDef) return undefined;
  return {
    id: modeDef.id,
    label: modeDef.faceText,
    role: cubeDef.role,
    token: modeDef.runtimeToken ?? cubeDef.runtimeToken,
  };
}

export function getActiveMode(placed: PlacedCube): TrayWordMode | undefined {
  return getTrayWordMode(placed.cubeId, placed.activeModeId);
}

export function getActiveFace(placed: PlacedCube): DieFace | undefined {
  return getDieFace(placed.cubeId, placed.activeModeId);
}

export function rotateModeId(cubeId: string, activeModeId: string): string {
  return rotateTrayModeId(cubeId, activeModeId);
}

/** @deprecated Use rotateModeId */
export function rotateFaceId(cubeId: string, activeModeId: string): string {
  return rotateTrayModeId(cubeId, activeModeId);
}

export function getDefaultModeId(cubeId: string): string {
  return defaultModeId(cubeId);
}

/** @deprecated Use getDefaultModeId */
export function getDefaultFaceId(cubeId: string): string {
  return defaultModeId(cubeId);
}

export function isWeatherLensToken(token: string): boolean {
  return token.startsWith("lens/");
}

export function weatherLensFromToken(token: string): string | null {
  if (!isWeatherLensToken(token)) return null;
  return token.slice("lens/".length);
}
