import { Circle, Rect } from "react-konva";
import { breatheOpacity } from "../animations";
import { COLORS } from "../design-tokens";
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
  const bootProgress =
    powered && poweredAt > 0
      ? Math.min(1, (animTime - poweredAt) / 800)
      : 0;

  return (
    <>
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => {
          const idx = row * 5 + col;
          const lit = bootProgress > idx / 20;
          return (
            <Circle
              key={`${row}-${col}`}
              x={cx - 16 + col * 8}
              y={36 + row * 6}
              radius={1.5}
              fill={lit ? COLORS.ledGreen : COLORS.muted}
              opacity={lit ? 0.5 + pulse * 0.3 : 0.25}
            />
          );
        }),
      )}
      <Rect
        x={cx - 12}
        y={68}
        width={24}
        height={6}
        fill={COLORS.magnet}
        cornerRadius={2}
      />
      <Rect
        x={cx - 8}
        y={70}
        width={16}
        height={2}
        fill={COLORS.ink}
        opacity={0.3}
        cornerRadius={1}
      />
      <Circle
        x={cx - 10}
        y={58}
        radius={3}
        fill={powered ? COLORS.ledGreen : COLORS.connectorGrey}
        opacity={powered ? pulse : 0.4}
      />
      <Circle
        x={cx + 10}
        y={58}
        radius={3}
        fill={debugOpen ? COLORS.ledBlue : COLORS.connectorGrey}
        opacity={debugOpen ? pulse : 0.3}
      />
    </>
  );
}
