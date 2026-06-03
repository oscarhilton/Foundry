import { Arc, Line } from "react-konva";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface WeatherVisualProps {
  rain: number | null;
  temp: number | null;
  animTime: number;
}

export function WeatherVisual({ rain, animTime }: WeatherVisualProps) {
  const r = rain ?? 0.3;
  const shimmer = 0.3 + Math.sin(animTime * 0.002) * 0.15;
  const cx = CUBE_SIZE / 2;

  return (
    <>
      <Arc
        x={cx}
        y={38}
        innerRadius={0}
        outerRadius={14}
        angle={180}
        rotation={180}
        fill={COLORS.muted}
        opacity={0.35}
      />
      <Arc
        x={cx - 10}
        y={40}
        innerRadius={0}
        outerRadius={10}
        angle={180}
        rotation={180}
        fill={COLORS.muted}
        opacity={0.25}
      />
      <Arc
        x={cx + 10}
        y={40}
        innerRadius={0}
        outerRadius={10}
        angle={180}
        rotation={180}
        fill={COLORS.muted}
        opacity={0.25}
      />
      {[0, 1, 2, 3].map((i) => {
        const dropOffset = (animTime * 0.05 + i * 25) % 14;
        return (
          <Line
            key={i}
            points={[
              cx - 18 + i * 12,
              52 + dropOffset,
              cx - 20 + i * 12,
              52 + 10 + r * 8 + dropOffset,
            ]}
            stroke={COLORS.ledBlue}
            strokeWidth={1.5}
            opacity={shimmer * (0.4 + r * 0.6)}
            lineCap="round"
          />
        );
      })}
    </>
  );
}
