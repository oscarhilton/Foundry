import { SvgRect } from "../svg/primitives";
import { COLORS, CUBE_FACE } from "../design-tokens";
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
    ? 0.5 + Math.sin(animTime * 0.01 + (note ?? 60)) * 0.25 + spike * 0.3
    : 0.1;
  const baseY = CUBE_FACE.stateBottom - 2;

  return (
    <>
      {[0, 1, 2].map((i) => {
        const h = active ? 6 + v * 16 * pulse * (1 + i * 0.15) : 3;
        return (
          <SvgRect
            key={i}
            x={34 + i * 10}
            y={baseY - h}
            width={5}
            height={h}
            fill={COLORS.ink}
            opacity={active ? 0.25 + v * 0.4 : 0.12}
            cornerRadius={1}
          />
        );
      })}
    </>
  );
}
