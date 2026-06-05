import type { CSSProperties } from "react";
import { useId } from "react";
import { eventPhase } from "../animations";
import { FONTS, COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface LcdVisualProps {
  text: string | null;
  animTime: number;
  lcdChangedAt: number;
}

const LCD_CHARS = 16;
const LCD_PAD = 10;
const LCD_W = CUBE_SIZE * 2 - LCD_PAD * 2;
const LCD_H = CUBE_SIZE - LCD_PAD * 2;

const BEZEL_OFFSET = "translate(-3.41 -3.05)";
const LCD_FONT = `"HD44780", ${FONTS.mono}`;
const LCD_INK = "#000000";

function lcdLine(text: string, size = LCD_CHARS): string {
  return text.slice(0, size);
}

function lcdLines(text: string): [string, string] {
  const parts = text.split("\n");
  return [lcdLine(parts[0] ?? ""), lcdLine(parts[1] ?? "")];
}

interface LCDProps {
  gradientId: string;
  backlit: boolean;
  line1: string;
  line2: string;
  width: number;
  height: number;
  style?: CSSProperties;
}

function LCD({
  gradientId,
  backlit,
  line1,
  line2,
  width,
  height,
  style,
}: LCDProps) {
  const bgcolor = backlit ? COLORS.cubeUnpowered : COLORS.cube;

  return (
    <svg
      className="LCD"
      viewBox="0 0 78 32"
      width={width}
      height={height}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#454545" />
          <stop offset="1" stopColor="#646464" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <path
        fill={COLORS.cubeUnpowered}
        className="shadow-lg"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.1}
        d="M5.12 4.33h74.96v29.31H5.12z"
        transform={BEZEL_OFFSET}
      />
      <path
        fill={COLORS.cubeUnpowered}
        className="shadow-lg"
        stroke="#646464"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.1}
        strokeWidth={0.1}
        d="M7.51 6.95h70.34v24.42H7.51z"
        transform={BEZEL_OFFSET}
      />
      <path
        fill={COLORS.ink}
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.3}
        strokeWidth={0.1}
        d="M8.76 8.3h67.73v21.6H8.76z"
        transform={BEZEL_OFFSET}
      />
      <text
        fill={bgcolor}
        x={10}
        y={17}
        fontFamily={LCD_FONT}
        fontSize={5.5}
        transform={BEZEL_OFFSET}
        style={{ whiteSpace: "pre", ...style }}
      >
        {line1}
      </text>
      <text
        fill={bgcolor}
        x={10}
        y={26}
        fontFamily={LCD_FONT}
        fontSize={5.5}
        transform={BEZEL_OFFSET}
        style={{ whiteSpace: "pre", ...style }}
      >
        {line2}
      </text>
    </svg>
  );
}

export function LcdVisual({ text, animTime, lcdChangedAt }: LcdVisualProps) {
  const gradientId = useId();
  const pulsePhase = eventPhase(animTime, lcdChangedAt, 180);
  const pulseBoost = lcdChangedAt > 0 && pulsePhase < 1 ? 1 - pulsePhase * 0.5 : 0;
  const displayText = text ?? "--";
  const [line1, line2] = lcdLines(displayText);
  const textOpacity = 0.75 + pulseBoost * 0.2;

  return (
    <div className="box-border flex h-full w-full items-center justify-center shadow-lg rounded-sm">
      <div className="inset-0 rounded-sm overflow-hidden border border-gray-200 flex h-full w-full items-center justify-center" style={{ backgroundColor: COLORS.cubeUnpowered, width: LCD_W, height: LCD_H }}>
        <LCD
          gradientId={gradientId}
          backlit
          line1={line1}
          line2={line2}
          width={LCD_W}
          height={LCD_H}
          style={{ opacity: textOpacity }}
        />
      </div>
    </div>
  );
}
