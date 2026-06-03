import { Rect, Text } from "react-konva";
import { CUBE_SIZE } from "../layout";
import { eventPhase } from "../animations";

interface DisplayVisualProps {
  text: string | null;
  animTime: number;
  displayChangedAt: number;
}

export function DisplayVisual({
  text,
  animTime,
  displayChangedAt,
}: DisplayVisualProps) {
  const blinkPhase = eventPhase(animTime, displayChangedAt, 120);
  const invert = displayChangedAt > 0 && blinkPhase < 1;
  const bg = invert ? "#1A1A1A" : "#F8F9FA";
  const fg = invert ? "#F8F9FA" : "#1A1A1A";

  return (
    <>
      <Rect
        x={12}
        y={22}
        width={CUBE_SIZE - 24}
        height={36}
        fill={bg}
        stroke="#D1D5DB"
        strokeWidth={1}
        cornerRadius={2}
      />
      <Text
        x={14}
        y={32}
        width={CUBE_SIZE - 28}
        text={text ?? "—"}
        fontSize={9}
        fill={fg}
        align="center"
        fontFamily="Helvetica Neue, Helvetica, Arial, monospace"
      />
    </>
  );
}
