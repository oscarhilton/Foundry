import { Group, Rect, Text } from "react-konva";
import { CUBE_SIZE } from "../layout";
import { breatheOpacity, eventPhase } from "../animations";
import { COLORS } from "../design-tokens";

interface LcdVisualProps {
  text: string | null;
  animTime: number;
  lcdChangedAt: number;
}

const LCD_INNER_X = 14;
const LCD_INNER_Y = 22;
const LCD_INNER_W = CUBE_SIZE - 28;
const LCD_INNER_H = 32;
const FONT_SIZE = 9;
const CHARS_PER_LINE = 11;
const MAX_LINES = 2;
const SCROLL_SPEED = 0.03;
const SCROLL_GAP = 24;

function estimateTextWidth(text: string): number {
  return text.length * FONT_SIZE * 0.6;
}

export function LcdVisual({ text, animTime, lcdChangedAt }: LcdVisualProps) {
  const glowOpacity = breatheOpacity(animTime, 0.0015);
  const pulsePhase = eventPhase(animTime, lcdChangedAt, 180);
  const pulseBoost = lcdChangedAt > 0 && pulsePhase < 1 ? 1 - pulsePhase * 0.5 : 0;
  const displayText = text ?? "--";
  const textOpacity = 0.85 + glowOpacity * 0.15 + pulseBoost * 0.15;

  const isShort = displayText.length <= CHARS_PER_LINE;
  const isMedium =
    displayText.length > CHARS_PER_LINE &&
    displayText.length <= CHARS_PER_LINE * MAX_LINES;
  const isLong = displayText.length > CHARS_PER_LINE * MAX_LINES;

  const textWidth = estimateTextWidth(displayText);
  const scrollOffset = isLong
    ? (animTime * SCROLL_SPEED) % (textWidth + SCROLL_GAP)
    : 0;

  const renderText = () => {
    if (isShort) {
      return (
        <Text
          x={LCD_INNER_X}
          y={32}
          width={LCD_INNER_W}
          text={displayText}
          fontSize={FONT_SIZE}
          fill={COLORS.ledGreen}
          align="center"
          fontFamily="Helvetica Neue, Helvetica, Arial, monospace"
          opacity={textOpacity}
        />
      );
    }

    if (isMedium) {
      return (
        <Text
          x={LCD_INNER_X}
          y={26}
          width={LCD_INNER_W}
          text={displayText}
          fontSize={FONT_SIZE}
          fill={COLORS.ledGreen}
          align="center"
          wrap="word"
          lineHeight={1.2}
          fontFamily="Helvetica Neue, Helvetica, Arial, monospace"
          opacity={textOpacity}
        />
      );
    }

    return (
      <Text
        x={LCD_INNER_X - scrollOffset}
        y={32}
        text={displayText}
        fontSize={FONT_SIZE}
        fill={COLORS.ledGreen}
        align="left"
        fontFamily="Helvetica Neue, Helvetica, Arial, monospace"
        opacity={textOpacity}
      />
    );
  };

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
      <Group
        clipX={LCD_INNER_X}
        clipY={LCD_INNER_Y}
        clipWidth={LCD_INNER_W}
        clipHeight={LCD_INNER_H}
      >
        {renderText()}
      </Group>
    </>
  );
}
