import { useRef } from "react";
import { Circle } from "react-konva";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { eventPhase, lerp } from "../animations";

interface ButtonVisualProps {
  pressed: boolean;
  animTime: number;
  buttonFiredAt: number;
}

export function ButtonVisual({ pressed, animTime, buttonFiredAt }: ButtonVisualProps) {
  const cx = CUBE_SIZE / 2;
  const cy = 50;
  const pressDepth = useRef(0);
  const lastFrame = useRef(animTime);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  const targetDepth = pressed ? 3 : 0;
  pressDepth.current = lerp(pressDepth.current, targetDepth, Math.min(1, dt / 80));

  const clickFlash = eventPhase(animTime, buttonFiredAt, 150);
  const showLed = pressed || (buttonFiredAt > 0 && clickFlash < 1);

  return (
    <>
      <Circle
        x={cx}
        y={cy + pressDepth.current}
        radius={16}
        fill="#D4D0C8"
        stroke={COLORS.muted}
        strokeWidth={1}
      />
      <Circle
        x={cx}
        y={cy - 2 + pressDepth.current}
        radius={12}
        fill={pressed ? "#C8C4BC" : "#E8E4DC"}
        stroke={COLORS.muted}
        strokeWidth={0.5}
      />
      {showLed && (
        <Circle
          x={cx}
          y={cy + 18}
          radius={3}
          fill={COLORS.ledRed}
          opacity={pressed ? 1 : 1 - clickFlash}
        />
      )}
    </>
  );
}
