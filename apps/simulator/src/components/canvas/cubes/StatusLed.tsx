import { Circle } from "react-konva";
import { CUBE_FACE, COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface StatusLedProps {
  color?: string;
  active?: boolean;
  pulse?: number;
}

export function StatusLed({
  color = COLORS.ledBlue,
  active = false,
  pulse = 1,
}: StatusLedProps) {
  const opacity = active ? 0.5 + pulse * 0.5 : 0.15;

  return (
    <Circle
      x={CUBE_SIZE / 2}
      y={CUBE_FACE.ledY}
      radius={CUBE_FACE.ledRadius}
      fill={active ? color : COLORS.connectorGrey}
      opacity={opacity}
    />
  );
}
