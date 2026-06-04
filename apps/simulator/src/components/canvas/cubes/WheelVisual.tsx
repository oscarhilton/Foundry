import { SvgCircle, SvgGroup, SvgText, getSvgPoint } from "../svg/primitives";
import { useRef } from "react";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { eventPhase, lerp } from "../animations";

interface WheelVisualProps {
  dialPosition: number;
  onDialChange: (value: number) => void;
  animTime: number;
  hintPulse?: boolean;
}

const TAU = Math.PI * 2;
const OUTER_R = 17;
const INNER_R = 11;
const CENTER_R = 5.5;

function shortestAngularDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= TAU;
  while (delta <= -Math.PI) delta += TAU;
  return delta;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function isOnRing(dx: number, dy: number): boolean {
  const d = Math.hypot(dx, dy);
  return d >= INNER_R - 2 && d <= OUTER_R + 3;
}

export function WheelVisual({
  dialPosition,
  onDialChange,
  animTime,
  hintPulse = false,
}: WheelVisualProps) {
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2 - 2;
  const displayPos = useRef(dialPosition);
  const lastFrame = useRef(animTime);
  const draggingRing = useRef(false);
  const dragPosition = useRef(dialPosition);
  const lastAngle = useRef(0);
  const centerPressed = useRef(false);
  const pressFlashAt = useRef(0);
  const pressDepth = useRef(0);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayPos.current = lerp(displayPos.current, dialPosition, Math.min(1, dt / 250));

  const targetDepth = centerPressed.current ? 1 : 0;
  pressDepth.current = lerp(pressDepth.current, targetDepth, Math.min(1, dt / 80));

  const flashPhase = eventPhase(animTime, pressFlashAt.current, 130);
  const centerFlash = pressFlashAt.current > 0 ? 1 - flashPhase : 0;

  const markerAngle = displayPos.current * TAU - Math.PI / 2;
  const markerX = cx + Math.cos(markerAngle) * OUTER_R;
  const markerY = cy + Math.sin(markerAngle) * OUTER_R;

  const hintGlow = hintPulse ? 0.2 + Math.sin(animTime * 0.006) * 0.15 : 0;

  const pointerOffset = (e: React.PointerEvent) => {
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
    const pos = getSvgPoint(svg, e.clientX, e.clientY);
    if (!pos) return null;
    return { dx: pos.x - cx, dy: pos.y - cy, svg };
  };

  const handleRingPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const off = pointerOffset(e);
    if (!off || !isOnRing(off.dx, off.dy)) return;
    draggingRing.current = true;
    dragPosition.current = dialPosition;
    lastAngle.current = Math.atan2(off.dy, off.dx);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const handleRingPointerMove = (e: React.PointerEvent) => {
    if (!draggingRing.current) return;
    e.stopPropagation();
    const off = pointerOffset(e);
    if (!off) return;
    const angle = Math.atan2(off.dy, off.dx);
    const delta = shortestAngularDelta(lastAngle.current, angle);
    lastAngle.current = angle;
    dragPosition.current = clamp01(dragPosition.current + delta / TAU);
    onDialChange(dragPosition.current);
  };

  const endRingDrag = (e: React.PointerEvent) => {
    if (!draggingRing.current) return;
    draggingRing.current = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
  };

  const handleCenterPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    centerPressed.current = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const handleCenterPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (centerPressed.current) pressFlashAt.current = animTime;
    centerPressed.current = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <>
      <SvgGroup
        onPointerDown={handleRingPointerDown}
        onPointerMove={handleRingPointerMove}
        onPointerUp={endRingDrag}
        onPointerCancel={endRingDrag}
      >
        {hintPulse && (
          <SvgCircle
            x={cx}
            y={cy}
            radius={OUTER_R + 4}
            stroke={COLORS.ink}
            strokeWidth={0.75}
            opacity={hintGlow}
          />
        )}
        <SvgCircle
          x={cx}
          y={cy}
          radius={(OUTER_R + INNER_R) / 2}
          fill="none"
          stroke="transparent"
          strokeWidth={OUTER_R - INNER_R + 8}
        />
        <SvgCircle
          x={cx}
          y={cy}
          radius={OUTER_R}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={1}
          opacity={0.85}
        />
        <SvgCircle
          x={markerX}
          y={markerY}
          radius={2}
          fill={COLORS.ink}
          opacity={0.9}
        />
      </SvgGroup>

      <SvgGroup
        onPointerDown={handleCenterPointerDown}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={handleCenterPointerUp}
        onPointerCancel={handleCenterPointerUp}
      >
        <SvgCircle
          x={cx}
          y={cy + pressDepth.current}
          radius={CENTER_R}
          fill={COLORS.stroke}
          stroke={COLORS.stroke}
          strokeWidth={1}
          opacity={0.55 + centerFlash * 0.25}
        />
      </SvgGroup>

      <SvgText
        x={cx}
        y={CUBE_FACE.stateBottom - 2}
        text={`${Math.round(displayPos.current * 100)}%`}
        textAnchor="middle"
        fontSize={8}
        fill={COLORS.muted}
        opacity={0.85}
      />
    </>
  );
}