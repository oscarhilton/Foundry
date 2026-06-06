import type { WordDie, TrayWordMode } from "@foundry/cube-defs";

export type FaceDisplayProps = {
  primaryLabel: string;
  secondaryLabel: string | null;
  isRotated: boolean;
  defaultModeId: string;
};

function primaryFaceLabel(
  die: WordDie,
  active: TrayWordMode,
  isRotated: boolean,
): string {
  if (!isRotated) return die.word;
  if (active.faceText !== die.word) return active.faceText;
  return active.label.toUpperCase();
}

/** Cube face labels — active face owns visual hierarchy (TRAY-110). */
export function getCubeFaceDisplay(
  die: WordDie,
  activeModeId: string,
): FaceDisplayProps {
  const defaultModeId = die.modes[0]!.id;
  const active = die.modes.find((m) => m.id === activeModeId) ?? die.modes[0]!;
  const isRotated = activeModeId !== defaultModeId;

  return {
    primaryLabel: primaryFaceLabel(die, active, isRotated),
    secondaryLabel: isRotated ? die.word.toLowerCase() : null,
    isRotated,
    defaultModeId,
  };
}
