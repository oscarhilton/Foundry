import { SvgCircle, SvgGroup, SvgLine, getSvgPoint } from "../svg/primitives";
import { useRef } from "react";
import { COLORS, CUBE_FACE } from "../design-tokens";
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
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;
  const knobR = 14;
  const displayPos = useRef(dialPosition);
  const lastFrame = useRef(animTime);
  const dragging = useRef(false);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayPos.current = lerp(displayPos.current, dialPosition, Math.min(1, dt / 250));

  const angle = -135 + displayPos.current * 270;
  const rad = (angle * Math.PI) / 180;
  const indicatorX = cx + Math.cos(rad) * (knobR - 4);
  const indicatorY = cy + Math.sin(rad) * (knobR - 4);

  const handlePointer = (e: React.PointerEvent) => {
    e.stopPropagation();
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
    const pos = getSvgPoint(svg, e.clientX, e.clientY);
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

  const hintGlow = hintPulse ? 0.25 + Math.sin(animTime * 0.006) * 0.2 : 0;

  return (
    <SvgGroup
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (dragging.current) handlePointer(e);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        (e.target as Element).releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      {hintPulse && (
        <SvgCircle
          x={cx}
          y={cy}
          radius={knobR + 6}
          stroke={COLORS.ink}
          strokeWidth={1}
          opacity={hintGlow}
        />
      )}
      <SvgCircle
        x={cx}
        y={cy}
        radius={knobR}
        fill={COLORS.cube}
        stroke={COLORS.stroke}
        strokeWidth={1}
      />
      <SvgLine
        points={[cx, cy, indicatorX, indicatorY]}
        stroke={COLORS.ink}
        strokeWidth={1.5}
        lineCap="round"
      />
    </SvgGroup>
  );
}
