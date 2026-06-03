import { Rect, Text } from "react-konva";
import { CUBE_SIZE } from "../layout";
import { breatheOpacity, eventPhase } from "../animations";
import { COLORS } from "../design-tokens";

interface LcdVisualProps {
  text: string | null;
  animTime: number;
  lcdChangedAt: number;
}

export function LcdVisual({ text, animTime, lcdChangedAt }: LcdVisualProps) {
  const glowOpacity = breatheOpacity(animTime, 0.0015);
  const pulsePhase = eventPhase(animTime, lcdChangedAt, 180);
  const pulseBoost = lcdChangedAt > 0 && pulsePhase < 1 ? 1 - pulsePhase * 0.5 : 0;

  return (
    <>
      <Rect
        x={10}
        y={20}
        width={CUBE_SIZE - 20}
        height={40}
        fill="#06D6A0"
        opacity={0.12 + glowOpacity * 0.08 + pulseBoost * 0.15}
        cornerRadius={3}
      />
      <Rect
        x={12}
        y={22}
        width={CUBE_SIZE - 24}
        height={36}
        fill="#0D1B2A"
        stroke="#1B4332"
        strokeWidth={1}
        cornerRadius={2}
      />
      <Text
        x={14}
        y={32}
        width={CUBE_SIZE - 28}
        text={text ?? "--"}
        fontSize={9}
        fill={COLORS.ledGreen}
        align="center"
        fontFamily="Helvetica Neue, Helvetica, Arial, monospace"
        opacity={0.85 + glowOpacity * 0.15 + pulseBoost * 0.15}
      />
    </>
  );
}
