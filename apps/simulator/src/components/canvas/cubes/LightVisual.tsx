import { useRef } from "react";
import { Circle } from "react-konva";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { lerp, warmGlowColor } from "../animations";

interface LightVisualProps {
  brightness: number;
  animTime: number;
}

export function LightVisual({ brightness, animTime }: LightVisualProps) {
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
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;
  const glow = warmGlowColor(b);
  const breathe = b > 0.15 ? 1 + Math.sin(animTime * 0.0012) * 0.03 * b : 1;
  const shadowBlur = 8 + b * 20;

  const outerRadius = (10 + b * 22) * breathe;
  const outerOpacity = (0.04 + b * 0.32) * breathe;
  const midRadius = 6 + b * 12;
  const midOpacity = 0.08 + b * 0.45;
  const coreRadius = 3 + b * 5;
  const coreOpacity = 0.15 + b * 0.85;

  return (
    <>
      <Circle
        x={cx}
        y={cy}
        radius={outerRadius}
        fill={glow}
        opacity={outerOpacity}
        shadowColor={glow}
        shadowBlur={shadowBlur}
        shadowOpacity={0.35 + b * 0.45}
      />
      <Circle
        x={cx}
        y={cy}
        radius={midRadius}
        fill={glow}
        opacity={midOpacity}
        shadowColor={glow}
        shadowBlur={shadowBlur * 0.6}
        shadowOpacity={0.25 + b * 0.35}
      />
      <Circle
        x={cx}
        y={cy}
        radius={coreRadius}
        fill={b > 0.4 ? COLORS.ledYellow : glow}
        opacity={coreOpacity}
      />
    </>
  );
}
