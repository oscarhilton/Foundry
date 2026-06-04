import type { CSSProperties } from "react";
import { eventPhase } from "../animations";
import { COLORS, CUBE_FACE, FONTS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface LcdVisualProps {
  text: string | null;
  animTime: number;
  lcdChangedAt: number;
}

const LCD_INNER_X = 18;
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
    const textStyle: CSSProperties = {
      fontFamily: FONTS.mono,
      fontSize: FONT_SIZE,
      color: COLORS.ink,
      opacity: textOpacity,
      lineHeight: 1.2,
    };

    if (isShort) {
      return (
        <div
          className="flex items-center justify-center h-full w-full"
          style={textStyle}
        >
          {displayText}
        </div>
      );
    }

    if (isMedium) {
      return (
        <div
          className="flex items-center justify-center h-full w-full text-center px-0.5"
          style={{
            ...textStyle,
            wordBreak: "break-word",
            overflow: "hidden",
          }}
        >
          {displayText}
        </div>
      );
    }

    return (
      <div className="flex items-center h-full overflow-hidden">
        <span
          className="whitespace-nowrap"
          style={{
            ...textStyle,
            transform: `translateX(-${scrollOffset}px)`,
          }}
        >
          {displayText}
        </span>
      </div>
    );
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center box-border"
      style={{ paddingLeft: LCD_INNER_X - 2, paddingRight: LCD_INNER_X - 2 }}
    >
      <div
        className="w-full overflow-hidden rounded-sm border"
        style={{
          maxWidth: LCD_INNER_W + 4,
          height: LCD_INNER_H,
          backgroundColor: "#F2F2F7",
          borderColor: COLORS.stroke,
        }}
      >
        {renderText()}
      </div>
    </div>
  );
}
