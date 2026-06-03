import { Circle } from "react-konva";
import { breatheOpacity } from "../animations";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface CalmVisualProps {
  animTime: number;
  active: boolean;
}

export function CalmVisual({ animTime, active }: CalmVisualProps) {
  if (!active) return null;

  const cx = CUBE_SIZE / 2;
  const cy = 50;
  const pulse = breatheOpacity(animTime, 0.0012);

  return (
    <>
      {[0, 1, 2].map((i) => (
        <Circle
          key={i}
          x={cx}
          y={cy}
          radius={8 + i * 8 + Math.sin(animTime * 0.001 + i) * 2}
          stroke={COLORS.ledBlue}
          strokeWidth={1}
          opacity={pulse * (0.5 - i * 0.12)}
        />
      ))}
    </>
  );
}

export function calmAccentOpacity(animTime: number, active: boolean): number {
  if (!active) return 1;
  return breatheOpacity(animTime, 0.0012);
}
