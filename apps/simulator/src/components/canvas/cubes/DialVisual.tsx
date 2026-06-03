import { useRef } from "react";
import { Group, Circle, Line, Text } from "react-konva";
import type Konva from "konva";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { lerp } from "../animations";

interface DialVisualProps {
  dialPosition: number;
  onDialChange: (value: number) => void;
  animTime: number;
  hintPulse?: boolean;
}

export function DialVisual({
  dialPosition,
  onDialChange,
  animTime,
  hintPulse = false,
}: DialVisualProps) {
  const cx = CUBE_SIZE / 2;
  const cy = 50;
  const knobR = 18;
  const displayPos = useRef(dialPosition);
  const lastFrame = useRef(animTime);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayPos.current = lerp(displayPos.current, dialPosition, Math.min(1, dt / 250));

  const angle = -135 + displayPos.current * 270;
  const rad = (angle * Math.PI) / 180;
  const indicatorX = cx + Math.cos(rad) * (knobR - 5);
  const indicatorY = cy + Math.sin(rad) * (knobR - 5);
  const groupRef = useRef<Konva.Group>(null);

  const handleDrag = () => {
    const pos = groupRef.current?.getRelativePointerPosition();
    if (!pos) return;
    const dx = pos.x - cx;
    const dy = pos.y - cy;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    const min = 225;
    const max = 495;
    let a = deg;
    if (a < min) a += 360;
    const t = Math.max(0, Math.min(1, (a - min) / (max - min)));
    onDialChange(t);
  };

  const hintGlow = hintPulse ? 0.35 + Math.sin(animTime * 0.006) * 0.25 : 0;

  return (
    <Group
      ref={groupRef}
      onMouseDown={handleDrag}
      onTouchStart={handleDrag}
      onMouseMove={(e) => {
        if (e.evt.buttons === 1) handleDrag();
      }}
      onTouchMove={handleDrag}
    >
      {hintPulse && (
        <Circle
          x={cx}
          y={cy}
          radius={knobR + 8}
          stroke="#F4A261"
          strokeWidth={2}
          opacity={hintGlow}
        />
      )}
      <Text
        x={cx - 28}
        y={cy - 4}
        text="−"
        fontSize={14}
        fill={COLORS.muted}
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
      />
      <Text
        x={cx + 20}
        y={cy - 4}
        text="+"
        fontSize={14}
        fill={COLORS.muted}
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
      />
      <Circle
        x={cx}
        y={cy}
        radius={knobR}
        fill="#E8E4DC"
        stroke={COLORS.muted}
        strokeWidth={1}
      />
      <Circle
        x={cx}
        y={cy}
        radius={knobR - 4}
        fill="#F5F2EC"
        stroke={COLORS.rule}
        strokeWidth={0.5}
      />
      <Line
        points={[cx, cy, indicatorX, indicatorY]}
        stroke={COLORS.ink}
        strokeWidth={2}
        lineCap="round"
      />
      <Circle x={indicatorX} y={indicatorY} radius={2.5} fill={COLORS.ink} />
    </Group>
  );
}
