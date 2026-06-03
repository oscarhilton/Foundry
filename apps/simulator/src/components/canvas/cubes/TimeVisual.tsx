import { Circle, Line } from "react-konva";
import { CUBE_SIZE } from "../layout";

interface TimeVisualProps {
  hour: number | null;
  animTime: number;
}

export function TimeVisual({ hour, animTime }: TimeVisualProps) {
  const h = hour ?? 0.5;
  const angle = h * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = CUBE_SIZE / 2;
  const cy = 36;
  const handX = cx + Math.cos(rad) * 18;
  const handY = cy + Math.sin(rad) * 18;
  const pulse = 0.5 + Math.sin(animTime * 0.001) * 0.15;

  return (
    <>
      <Circle
        x={cx}
        y={cy}
        radius={20}
        stroke="#5C6BC0"
        strokeWidth={1.5}
        opacity={pulse}
      />
      <Line
        points={[cx, cy, handX, handY]}
        stroke="#5C6BC0"
        strokeWidth={2}
        lineCap="round"
      />
      <Circle x={cx} y={cy} radius={3} fill="#5C6BC0" />
    </>
  );
}
