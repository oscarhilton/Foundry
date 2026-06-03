import { Circle } from "react-konva";
import { CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface RandomVisualProps {
  animTime: number;
  active: boolean;
}

export function RandomVisual({ animTime, active }: RandomVisualProps) {
  if (!active) return null;
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;

  return (
    <>
      {[0, 1].map((i) => {
        const ox = Math.sin(animTime * 0.005 + i * 2) * 8;
        const oy = Math.cos(animTime * 0.004 + i * 1.5) * 5;
        return (
          <Circle
            key={i}
            x={cx + ox}
            y={cy + oy}
            radius={2}
            fill="#9B59B6"
            opacity={0.35}
          />
        );
      })}
    </>
  );
}
