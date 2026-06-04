import { SvgLine } from "../svg/primitives";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface WeatherVisualProps {
  rain: number | null;
  temp: number | null;
  animTime: number;
}

export function WeatherVisual({ rain, animTime }: WeatherVisualProps) {
  const r = rain ?? 0.3;
  const cx = CUBE_SIZE / 2;
  const baseY = CUBE_FACE.stateTop + 6;

  return (
    <>
      {[0, 1].map((i) => {
        const dropOffset = (animTime * 0.04 + i * 30) % 12;
        return (
          <SvgLine
            key={i}
            points={[
              cx - 4 + i * 8,
              baseY + dropOffset,
              cx - 6 + i * 8,
              baseY + 8 + r * 6 + dropOffset,
            ]}
            stroke={COLORS.ledBlue}
            strokeWidth={1.5}
            opacity={0.25 + r * 0.45}
            lineCap="round"
          />
        );
      })}
    </>
  );
}
