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

  return (
    <>
      <Circle
        x={cx}
        y={cy}
        radius={14 + b * 4}
        fill={glow}
        opacity={0.12 + b * 0.25}
      />
      <Circle
        x={cx}
        y={cy}
        radius={6 + b * 3}
        fill={COLORS.ledYellow}
        opacity={0.35 + b * 0.45}
      />
    </>
  );
}
