import type { CSSProperties } from "react";
import { eventPhase } from "../animations";
import { COLORS, FONTS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface LcdVisualProps {
  text: string | null;
  animTime: number;
  lcdChangedAt: number;
}

const LCD_INNER_X = 10;
const LCD_INNER_W = CUBE_SIZE * 2 - 20;
const LCD_INNER_H = CUBE_SIZE - 20;
const FONT_SIZE = 12;
const CHARS_PER_LINE = 10;
const MAX_LINES = 2;
const SCROLL_SPEED = 0;
const SCROLL_GAP = 24;

function estimateTextWidth(text: string): number {
  return text.length * FONT_SIZE * 0.55;
}

export function LcdVisual({ text, animTime, lcdChangedAt }: LcdVisualProps) {
  const pulsePhase = eventPhase(animTime, lcdChangedAt, 180);
  const pulseBoost = lcdChangedAt > 0 && pulsePhase < 1 ? 1 - pulsePhase * 0.5 : 0;
  const displayText = text ?? "BLANK";
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
      color: COLORS.oledInk,
      opacity: textOpacity,
      lineHeight: 1.2,
      whiteSpace: "pre-line",
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
      style={{ paddingLeft: LCD_INNER_X, paddingRight: LCD_INNER_X }}
    >
      <div
        className="w-full overflow-hidden rounded-sm border rounded-lg"
        style={{
          maxWidth: LCD_INNER_W,
          height: LCD_INNER_H,
          backgroundColor: COLORS.oledBackground,
          borderColor: COLORS.stroke,
        }}
      >
        {renderText()}
      </div>
    </div>
  );
}
