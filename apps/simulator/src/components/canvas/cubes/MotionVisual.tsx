import { Arc, Line } from "react-konva";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { decayPulse } from "../animations";

interface MotionVisualProps {
  motionDetected: boolean;
  animTime: number;
  motionFiredAt: number;
}

export function MotionVisual({
  motionDetected,
  animTime,
  motionFiredAt,
}: MotionVisualProps) {
  const cx = CUBE_SIZE / 2 + 4;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;
  const sweepAngle = (animTime * 0.002) % (Math.PI * 2);
  const flash = decayPulse(animTime, motionFiredAt, 600);
  const pulse = motionDetected
    ? 0.5 + Math.sin(animTime * 0.02) * 0.25 + flash * 0.3
    : 0.12;

  const sweepX = cx + Math.cos(sweepAngle) * 10;
  const sweepY = cy + Math.sin(sweepAngle) * 10;

  return (
    <>
      <Arc
        x={cx}
        y={cy}
        innerRadius={10}
        outerRadius={12}
        angle={90}
        rotation={135}
        stroke={COLORS.ledGreen}
        strokeWidth={1.5}
        opacity={pulse}
      />
      <Line
        points={[cx, cy, sweepX, sweepY]}
        stroke={COLORS.ledGreen}
        strokeWidth={1.5}
        opacity={0.35 + pulse * 0.5}
        lineCap="round"
      />
    </>
  );
}
