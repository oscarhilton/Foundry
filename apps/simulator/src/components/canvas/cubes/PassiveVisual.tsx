import { Circle, Rect, Text } from "react-konva";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface PassiveVisualProps {
  active: boolean;
  label?: string;
}

export function PassiveVisual({ active, label }: PassiveVisualProps) {
  const cx = CUBE_SIZE / 2;
  const cy = 50;
  return (
    <>
      <Rect
        x={cx - 14}
        y={cy - 6}
        width={28}
        height={12}
        fill={COLORS.ledBlue}
        opacity={active ? 0.9 : 0.5}
        cornerRadius={1}
      />
      <Circle
        x={cx}
        y={cy - 2}
        radius={8}
        fill={COLORS.ledRed}
        opacity={active ? 1 : 0.6}
      />
      {label && (
        <Text
          x={cx - 20}
          y={cy + 14}
          width={40}
          text={label}
          fontSize={8}
          fill={COLORS.muted}
          align="center"
          fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
        />
      )}
    </>
  );
}
