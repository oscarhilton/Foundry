import { useRef } from "react";
import { Group, Rect } from "react-konva";
import type Konva from "konva";
import { CUBE_SIZE } from "../layout";
import { lerp } from "../animations";

interface SliderVisualProps {
  position: number;
  onChange: (value: number) => void;
  animTime: number;
}

export function SliderVisual({ position, onChange, animTime }: SliderVisualProps) {
  const trackW = 60;
  const trackX = (CUBE_SIZE - trackW) / 2;
  const trackY = 40;
  const displayPos = useRef(position);
  const lastFrame = useRef(animTime);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayPos.current = lerp(displayPos.current, position, Math.min(1, dt / 250));

  const thumbX = trackX + displayPos.current * (trackW - 8);
  const groupRef = useRef<Konva.Group>(null);

  const handleDrag = () => {
    const pos = groupRef.current?.getRelativePointerPosition();
    if (!pos) return;
    const t = Math.max(0, Math.min(1, (pos.x - trackX) / (trackW - 8)));
    onChange(t);
  };

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
      <Rect
        x={trackX}
        y={trackY}
        width={trackW}
        height={6}
        fill="#E5E7EB"
        cornerRadius={3}
      />
      <Rect
        x={trackX}
        y={trackY}
        width={displayPos.current * trackW}
        height={6}
        fill="#2A9D8F"
        opacity={0.35}
        cornerRadius={3}
      />
      <Rect
        x={thumbX}
        y={trackY - 4}
        width={8}
        height={14}
        fill="#2A9D8F"
        cornerRadius={2}
      />
    </Group>
  );
}
