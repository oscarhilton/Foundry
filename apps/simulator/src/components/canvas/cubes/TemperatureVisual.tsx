import { useRef } from "react";
import { SvgArc, SvgText } from "../svg/primitives";
import { COLORS, CUBE_FACE } from "../design-tokens";
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

  const norm = displayNorm.current;
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2 - 4;
  const displayTemp = temp != null ? `${Math.round(temp)}°` : "--";

  return (
    <>
      <SvgArc
        x={cx}
        y={cy}
        innerRadius={14}
        outerRadius={17}
        angle={180 * norm}
        rotation={180}
        stroke={COLORS.ledRed}
        strokeWidth={2.5}
        opacity={0.4 + norm * 0.5}
      />
      <SvgText
        x={cx}
        y={cy + 10}
        text={displayTemp}
        fontSize={13}
        fill={COLORS.ink}
        textAnchor="middle"
        opacity={0.85}
      />
    </>
  );
}
