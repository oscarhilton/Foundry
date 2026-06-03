import { useRef } from "react";
import { Circle } from "react-konva";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { eventPhase, lerp } from "../animations";

interface ButtonVisualProps {
  pressed: boolean;
  animTime: number;
  buttonFiredAt: number;
}

export function ButtonVisual({ pressed, animTime, buttonFiredAt }: ButtonVisualProps) {
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;
  const pressDepth = useRef(0);
  const lastFrame = useRef(animTime);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  const targetDepth = pressed ? 2 : 0;
  pressDepth.current = lerp(pressDepth.current, targetDepth, Math.min(1, dt / 80));

  const clickFlash = eventPhase(animTime, buttonFiredAt, 150);
  const showLed = pressed || (buttonFiredAt > 0 && clickFlash < 1);

  return (
    <>
      <Circle
        x={cx}
        y={cy + pressDepth.current}
        radius={12}
        fill={COLORS.cube}
        stroke={COLORS.stroke}
        strokeWidth={1}
      />
      <Circle
        x={cx}
        y={cy + pressDepth.current}
        radius={7}
        fill={pressed ? COLORS.muted : COLORS.stroke}
        opacity={pressed ? 0.35 : 0.2}
      />
      {showLed && (
        <Circle
          x={cx}
          y={cy + 14}
          radius={2}
          fill={COLORS.ledRed}
          opacity={pressed ? 1 : 1 - clickFlash}
        />
      )}
    </>
  );
}
