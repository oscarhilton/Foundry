import { Circle } from "react-konva";
import { breatheOpacity } from "../animations";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface CalmVisualProps {
  animTime: number;
  active: boolean;
}

export function CalmVisual({ animTime, active }: CalmVisualProps) {
  if (!active) return null;

  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;
  const pulse = breatheOpacity(animTime, 0.0012);

  return (
    <Circle
      x={cx}
      y={cy}
      radius={10 + Math.sin(animTime * 0.001) * 2}
      stroke={COLORS.ledBlue}
      strokeWidth={1}
      opacity={pulse * 0.45}
    />
  );
}
