import { useRef } from "react";
import { Circle, Group, Line } from "react-konva";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { decayPulse, lerp, warmGlowColor } from "../animations";

interface LightVisualProps {
  brightness: number;
  animTime: number;
}

export function LightVisual({ brightness, animTime }: LightVisualProps) {
  const prevBrightness = useRef(brightness);
  const displayBrightness = useRef(brightness);
  const lastFrame = useRef(animTime);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayBrightness.current = lerp(
    displayBrightness.current,
    brightness,
    Math.min(1, dt / 250),
  );

  const b = Math.max(0.02, Math.min(1, displayBrightness.current));
  const flicker =
    b > 0.7 ? 1 + Math.sin(animTime * 0.012) * 0.04 * (b - 0.7) : 1;
  const warmed = b * flicker;

  if (Math.abs(brightness - prevBrightness.current) > 0.01) {
    prevBrightness.current = brightness;
  }

  const cx = CUBE_SIZE / 2;
  const cy = 50;
  const glow = warmGlowColor(warmed);

  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  const innerR = 10;
  const outerR = 18 + warmed * 6;

  return (
    <>
      {rays.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <Line
            key={deg}
            points={[
              cx + Math.cos(rad) * innerR,
              cy + Math.sin(rad) * innerR,
              cx + Math.cos(rad) * outerR,
              cy + Math.sin(rad) * outerR,
            ]}
            stroke={glow}
            strokeWidth={2}
            opacity={0.3 + warmed * 0.6}
            lineCap="round"
          />
        );
      })}
      <Circle
        x={cx}
        y={cy}
        radius={10}
        fill={COLORS.ledYellow}
        opacity={0.5 + warmed * 0.5}
      />
      <Circle
        x={cx}
        y={cy}
        radius={6}
        fill={glow}
        opacity={0.6 + warmed * 0.4}
      />
    </>
  );
}
