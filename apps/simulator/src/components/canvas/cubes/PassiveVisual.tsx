import { Circle } from "react-konva";
import { CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface PassiveVisualProps {
  active: boolean;
  accent?: string;
}

export function PassiveVisual({ active, accent = "#457B9D" }: PassiveVisualProps) {
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;

  return (
    <Circle
      x={cx}
      y={cy}
      radius={6}
      fill={accent}
      opacity={active ? 0.35 : 0.12}
    />
  );
}
