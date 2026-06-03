import { Rect } from "react-konva";
import { COLORS } from "../design-tokens";
import { decayPulse } from "../animations";

interface MusicVisualProps {
  note: number | null;
  velocity: number | null;
  animTime: number;
  musicNoteFiredAt: number;
}

export function MusicVisual({
  note,
  velocity,
  animTime,
  musicNoteFiredAt,
}: MusicVisualProps) {
  const active = note !== null;
  const v = active ? (velocity ?? 40) / 127 : 0;
  const spike = decayPulse(animTime, musicNoteFiredAt, 350);
  const pulse = active
    ? 0.5 + Math.sin(animTime * 0.01 + (note ?? 60)) * 0.3 + spike * 0.4
    : 0.15;
  const baseY = 62;

  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const idleH = 4 + i * 0.5;
        const h = active
          ? 8 + v * 28 * pulse * (1 + i * 0.12)
          : idleH;
        return (
          <Rect
            key={i}
            x={18 + i * 13}
            y={baseY - h}
            width={8}
            height={h}
            fill={i % 2 === 0 ? COLORS.ledBlue : COLORS.ink}
            opacity={active ? 0.5 + v * 0.5 : 0.2}
          />
        );
      })}
    </>
  );
}
