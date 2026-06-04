import { SvgCircle, SvgGroup, SvgRect, getSvgPoint } from "../svg/primitives";
import { useRef } from "react";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { lerp } from "../animations";

interface SliderVisualProps {
  position: number;
  onChange: (value: number) => void;
  animTime: number;
}

export function SliderVisual({ position, onChange, animTime }: SliderVisualProps) {
  const trackW = 52;
  const trackX = (CUBE_SIZE - trackW) / 2;
  const trackY = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2 - 2;
  const displayPos = useRef(position);
  const lastFrame = useRef(animTime);
  const dragging = useRef(false);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayPos.current = lerp(displayPos.current, position, Math.min(1, dt / 250));

  const thumbX = trackX + displayPos.current * (trackW - 6);

  const handlePointer = (e: React.PointerEvent) => {
    e.stopPropagation();
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
    const pos = getSvgPoint(svg, e.clientX, e.clientY);
    if (!pos) return;
    const t = Math.max(0, Math.min(1, (pos.x - trackX) / (trackW - 6)));
    onChange(t);
  };

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
      <SvgRect
        x={trackX}
        y={trackY}
        width={trackW}
        height={3}
        fill={COLORS.stroke}
        cornerRadius={2}
      />
      <SvgCircle x={thumbX + 3} y={trackY + 1.5} radius={4} fill={COLORS.ink} opacity={0.5} />
    </SvgGroup>
  );
}
