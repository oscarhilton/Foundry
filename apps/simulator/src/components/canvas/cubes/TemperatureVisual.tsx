import { useRef } from "react";
import { Arc, Text } from "react-konva";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { lerp } from "../animations";

interface TemperatureVisualProps {
  temp: number | null;
  animTime: number;
}

export function TemperatureVisual({ temp, animTime }: TemperatureVisualProps) {
  const targetNorm = Math.max(0, Math.min(1, ((temp ?? 22) - 10) / 25));
  const displayNorm = useRef(targetNorm);
  const lastFrame = useRef(animTime);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayNorm.current = lerp(displayNorm.current, targetNorm, Math.min(1, dt / 300));

  const t = temp ?? 22;
  const norm = displayNorm.current;
  const shimmer = 0.6 + Math.sin(animTime * 0.002) * 0.2;
  const cx = CUBE_SIZE / 2;

  return (
    <>
      <Text
        x={8}
        y={36}
        width={CUBE_SIZE - 16}
        text={`${Math.round(t)}°C`}
        fontSize={12}
        fontStyle="bold"
        fill={COLORS.ink}
        align="center"
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
      />
      <Arc
        x={cx}
        y={58}
        innerRadius={12}
        outerRadius={16}
        angle={120}
        rotation={210}
        stroke={COLORS.ledBlue}
        strokeWidth={3}
        opacity={0.4 + (1 - norm) * 0.4}
      />
      <Arc
        x={cx}
        y={58}
        innerRadius={12}
        outerRadius={16}
        angle={120 * norm}
        rotation={210}
        stroke={COLORS.ledRed}
        strokeWidth={3}
        opacity={shimmer}
      />
    </>
  );
}
