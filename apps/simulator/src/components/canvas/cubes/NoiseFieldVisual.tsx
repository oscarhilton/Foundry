import { Rect } from "react-konva";
import { perlin2D } from "@foundry/runtime";
import { CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface NoiseFieldVisualProps {
  animTime: number;
  phaseOffset?: number | null;
  speed: number;
  accent: string;
  contrast: number;
  active: boolean;
}

const COLS = 6;
const ROWS = 4;
const PAD_X = 16;
const PAD_Y = CUBE_FACE.stateTop + 2;
const CELL_W = (CUBE_SIZE - PAD_X * 2) / COLS;
const CELL_H = (CUBE_FACE.stateBottom - CUBE_FACE.stateTop - 6) / ROWS;

export function NoiseFieldVisual({
  animTime,
  phaseOffset,
  speed,
  accent,
  contrast,
  active,
}: NoiseFieldVisualProps) {
  if (!active) return null;

  const phase =
    (phaseOffset ?? 0) * 4 + (animTime * speed) / 1000;

  const cells: React.ReactNode[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const n = perlin2D(col * 0.55, row * 0.55 + phase);
      const opacity = Math.max(0.08, Math.min(0.85, (n * 0.5 + 0.5) * contrast));
      cells.push(
        <Rect
          key={`${row}-${col}`}
          x={PAD_X + col * CELL_W + 0.5}
          y={PAD_Y + row * CELL_H + 0.5}
          width={CELL_W - 1}
          height={CELL_H - 1}
          fill={accent}
          opacity={opacity}
          cornerRadius={1}
        />,
      );
    }
  }

  return <>{cells}</>;
}
