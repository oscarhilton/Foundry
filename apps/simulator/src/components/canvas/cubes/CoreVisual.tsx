import { SvgCircle } from "../svg/primitives";
import { breatheOpacity } from "../animations";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface CoreVisualProps {
  animTime: number;
  powered: boolean;
  debugOpen: boolean;
  poweredAt: number;
}

export function CoreVisual({
  animTime,
  powered,
  debugOpen,
  poweredAt,
}: CoreVisualProps) {
  const pulse = breatheOpacity(animTime, debugOpen ? 0.006 : 0.003);
  const cx = CUBE_SIZE / 2;
  const cy = (CUBE_FACE.stateTop + CUBE_FACE.stateBottom) / 2;
  const bootProgress =
    powered && poweredAt > 0
      ? Math.min(1, (animTime - poweredAt) / 800)
      : 0;

  const dots = [
    [cx - 5, cy - 5],
    [cx + 5, cy - 5],
    [cx - 5, cy + 5],
    [cx + 5, cy + 5],
  ];

  return (
    <>
      {dots.map(([x, y], i) => {
        const lit = bootProgress > i / 4;
        return (
          <SvgCircle
            key={i}
            x={x}
            y={y}
            radius={2}
            fill={lit ? COLORS.ledGreen : COLORS.muted}
            opacity={lit ? 0.45 + pulse * 0.25 : 0.2}
          />
        );
      })}
      <SvgCircle
        x={cx - 8}
        y={cy + 12}
        radius={2}
        fill={powered ? COLORS.ledGreen : COLORS.connectorGrey}
        opacity={powered ? pulse : 0.35}
      />
      <SvgCircle
        x={cx + 8}
        y={cy + 12}
        radius={2}
        fill={debugOpen ? COLORS.ledBlue : COLORS.connectorGrey}
        opacity={debugOpen ? pulse : 0.25}
      />
    </>
  );
}
