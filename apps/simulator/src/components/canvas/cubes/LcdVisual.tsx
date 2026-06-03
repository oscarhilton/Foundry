import { Group, Rect, Text } from "react-konva";
import { eventPhase } from "../animations";
import { COLORS, CUBE_FACE, FONTS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface LcdVisualProps {
  text: string | null;
  animTime: number;
  lcdChangedAt: number;
}

const LCD_INNER_X = 18;
const LCD_INNER_Y = CUBE_FACE.stateTop;
const LCD_INNER_W = CUBE_SIZE - 36;
const LCD_INNER_H = CUBE_FACE.stateBottom - CUBE_FACE.stateTop - 4;
const FONT_SIZE = 8;
const CHARS_PER_LINE = 10;
const MAX_LINES = 2;
const SCROLL_SPEED = 0.03;
const SCROLL_GAP = 24;

function estimateTextWidth(text: string): number {
  return text.length * FONT_SIZE * 0.55;
}

export function LcdVisual({ text, animTime, lcdChangedAt }: LcdVisualProps) {
  const pulsePhase = eventPhase(animTime, lcdChangedAt, 180);
  const pulseBoost = lcdChangedAt > 0 && pulsePhase < 1 ? 1 - pulsePhase * 0.5 : 0;
  const displayText = text ?? "--";
  const textOpacity = 0.75 + pulseBoost * 0.2;

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
          y={LCD_INNER_Y + 8}
          width={LCD_INNER_W}
          text={displayText}
          fontSize={FONT_SIZE}
          fill={COLORS.ink}
          align="center"
          fontFamily={FONTS.mono}
          opacity={textOpacity}
        />
      );
    }

    if (isMedium) {
      return (
        <Text
          x={LCD_INNER_X}
          y={LCD_INNER_Y + 4}
          width={LCD_INNER_W}
          text={displayText}
          fontSize={FONT_SIZE}
          fill={COLORS.ink}
          align="center"
          wrap="word"
          lineHeight={1.15}
          fontFamily={FONTS.mono}
          opacity={textOpacity}
        />
      );
    }

    return (
      <Text
        x={LCD_INNER_X - scrollOffset}
        y={LCD_INNER_Y + 8}
        text={displayText}
        fontSize={FONT_SIZE}
        fill={COLORS.ink}
        align="left"
        fontFamily={FONTS.mono}
        opacity={textOpacity}
      />
    );
  };

  return (
    <>
      <Rect
        x={LCD_INNER_X - 2}
        y={LCD_INNER_Y}
        width={LCD_INNER_W + 4}
        height={LCD_INNER_H}
        fill="#F2F2F7"
        stroke={COLORS.stroke}
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
