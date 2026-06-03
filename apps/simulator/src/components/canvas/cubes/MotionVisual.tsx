import { Circle, Arc, Line } from "react-konva";
import { COLORS } from "../design-tokens";
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
  const cx = CUBE_SIZE / 2 - 6;
  const cy = 50;
  const sweepAngle = (animTime * 0.002) % (Math.PI * 2);
  const flash = decayPulse(animTime, motionFiredAt, 600);
  const pulse = motionDetected
    ? 0.6 + Math.sin(animTime * 0.02) * 0.3 + flash * 0.4
    : 0.15 + Math.sin(animTime * 0.003) * 0.05;

  const sweepX = cx + 22 + Math.cos(sweepAngle) * 14;
  const sweepY = cy - 4 + Math.sin(sweepAngle) * 14;

  return (
    <>
      <Circle x={cx} y={cy - 10} radius={4} fill={COLORS.ink} opacity={0.8} />
      <Line
        points={[cx, cy - 6, cx, cy + 4]}
        stroke={COLORS.ink}
        strokeWidth={2}
        lineCap="round"
        opacity={0.8}
      />
      <Line
        points={[cx, cy - 2, cx - 6, cy + 2]}
        stroke={COLORS.ink}
        strokeWidth={2}
        lineCap="round"
        opacity={0.8}
      />
      <Line
        points={[cx, cy - 2, cx + 6, cy + 6]}
        stroke={COLORS.ink}
        strokeWidth={2}
        lineCap="round"
        opacity={0.8}
      />
      <Line
        points={[cx, cy + 4, cx - 5, cy + 12]}
        stroke={COLORS.ink}
        strokeWidth={2}
        lineCap="round"
        opacity={0.8}
      />
      <Line
        points={[cx, cy + 4, cx + 5, cy + 12]}
        stroke={COLORS.ink}
        strokeWidth={2}
        lineCap="round"
        opacity={0.8}
      />
      {[0, 1, 2].map((i) => (
        <Arc
          key={i}
          x={cx + 22}
          y={cy - 4}
          innerRadius={6 + i * 6}
          outerRadius={8 + i * 6}
          angle={90}
          rotation={135}
          stroke={COLORS.ledGreen}
          strokeWidth={1.5}
          opacity={pulse * (0.9 - i * 0.25)}
        />
      ))}
      <Line
        points={[cx + 22, cy - 4, sweepX, sweepY]}
        stroke={COLORS.ledGreen}
        strokeWidth={2}
        opacity={0.4 + pulse * 0.5}
        lineCap="round"
      />
    </>
  );
}
