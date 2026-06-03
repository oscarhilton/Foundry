import { Circle, Group } from "react-konva";
import { CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { decayPulse, eventPhase, springScale } from "../animations";

interface ChimeVisualProps {
  triggered: boolean;
  animTime: number;
  chimeCount: number;
  chimeFiredAt: number;
}

export function ChimeVisual({
  triggered,
  animTime,
  chimeCount,
  chimeFiredAt,
}: ChimeVisualProps) {
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;
  const scale = springScale(animTime, chimeFiredAt, 450);

  const rings = [0, 120].map((delay) => {
    const phase = eventPhase(animTime, chimeFiredAt + delay, 500);
    return {
      r: 8 + phase * 18,
      opacity: triggered || chimeFiredAt > 0 ? (1 - phase) * 0.45 : 0,
    };
  });

  return (
    <Group scaleX={scale} scaleY={scale}>
      {rings.map((ring, i) =>
        ring.opacity > 0.01 ? (
          <Circle
            key={i}
            x={cx}
            y={cy}
            radius={ring.r}
            stroke="#8338EC"
            strokeWidth={1.5}
            opacity={ring.opacity}
          />
        ) : null,
      )}
      <Circle
        x={cx}
        y={cy}
        radius={8}
        fill="#8338EC"
        opacity={0.12 + (chimeCount > 0 ? 0.15 : 0) + decayPulse(animTime, chimeFiredAt, 400) * 0.2}
      />
    </Group>
  );
}
