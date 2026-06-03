import { Circle, Line } from "react-konva";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface TimeVisualProps {
  hour: number | null;
  animTime: number;
}

export function TimeVisual({ hour }: TimeVisualProps) {
  const h = hour ?? 0.5;
  const angle = h * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;
  const handX = cx + Math.cos(rad) * 10;
  const handY = cy + Math.sin(rad) * 10;

  return (
    <>
      <Circle
        x={cx}
        y={cy}
        radius={12}
        stroke={COLORS.muted}
        strokeWidth={1}
        opacity={0.5}
      />
      <Line
        points={[cx, cy, handX, handY]}
        stroke={COLORS.ink}
        strokeWidth={1.5}
        lineCap="round"
        opacity={0.6}
      />
    </>
  );
}
