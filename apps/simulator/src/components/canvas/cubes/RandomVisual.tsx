import { Circle } from "react-konva";
import { CUBE_SIZE } from "../layout";

interface RandomVisualProps {
  animTime: number;
  active: boolean;
}

export function RandomVisual({ animTime, active }: RandomVisualProps) {
  if (!active) return null;
  const cx = CUBE_SIZE / 2;
  const cy = 36;

  return (
    <>
      {[0, 1, 2].map((i) => {
        const ox = Math.sin(animTime * 0.005 + i * 2) * 12;
        const oy = Math.cos(animTime * 0.004 + i * 1.5) * 8;
        const opacity = 0.4 + Math.sin(animTime * 0.008 + i * 1.7) * 0.25 + 0.25;
        return (
          <Circle
            key={i}
            x={cx + ox}
            y={cy + oy}
            radius={3}
            fill="#9B59B6"
            opacity={opacity}
          />
        );
      })}
    </>
  );
}
