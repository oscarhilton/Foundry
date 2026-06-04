import type { WeatherFaceState } from "@foundry/runtime";
import { WEATHER_FACE_COLORS } from "@foundry/runtime";
import { SvgCircle, SvgLine, SvgText } from "../svg/primitives";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface WeatherVisualProps {
  face: WeatherFaceState | null;
  /** Live rain when no latched face (shelf preview). */
  rain: number | null;
  animTime: number;
}

function ConditionGlyph({
  symbol,
  cx,
  cy,
  color,
}: {
  symbol: WeatherFaceState["symbol"];
  cx: number;
  cy: number;
  color: string;
}) {
  if (symbol === "sun") {
    return (
      <>
        <SvgCircle x={cx} y={cy} radius={7} fill={color} opacity={0.85} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = cx + Math.cos(rad) * 10;
          const y1 = cy + Math.sin(rad) * 10;
          const x2 = cx + Math.cos(rad) * 13;
          const y2 = cy + Math.sin(rad) * 13;
          return (
            <SvgLine
              key={deg}
              points={[x1, y1, x2, y2]}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.7}
              lineCap="round"
            />
          );
        })}
      </>
    );
  }

  if (symbol === "cloud") {
    return (
      <>
        <SvgCircle x={cx - 5} y={cy} radius={5} fill={color} opacity={0.5} />
        <SvgCircle x={cx + 4} y={cy - 1} radius={6} fill={color} opacity={0.65} />
        <SvgCircle x={cx + 10} y={cy + 1} radius={4.5} fill={color} opacity={0.45} />
      </>
    );
  }

  // rain / threshold gate — static droplets (e-ink)
  return (
    <>
      <SvgLine
        points={[cx - 5, cy - 2, cx - 7, cy + 6]}
        stroke={color}
        strokeWidth={2}
        opacity={0.75}
        lineCap="round"
      />
      <SvgLine
        points={[cx + 2, cy - 4, cx, cy + 5]}
        stroke={color}
        strokeWidth={2}
        opacity={0.85}
        lineCap="round"
      />
      <SvgLine
        points={[cx + 8, cy - 1, cx + 6, cy + 7]}
        stroke={color}
        strokeWidth={2}
        opacity={0.7}
        lineCap="round"
      />
    </>
  );
}

export function WeatherVisual({ face, rain, animTime }: WeatherVisualProps) {
  const cx = CUBE_SIZE / 2;
  const glyphY = CUBE_FACE.stateTop + 14;
  const textY = CUBE_FACE.stateTop + 32;

  if (face) {
    const color = WEATHER_FACE_COLORS[face.symbol];
    return (
      <>
        <ConditionGlyph symbol={face.symbol} cx={cx} cy={glyphY} color={color} />
        <SvgText
          x={cx}
          y={textY}
          text={face.headline}
          fontSize={10}
          fontWeight={600}
          fill={COLORS.ink}
          textAnchor="middle"
          opacity={0.9}
        />
        {face.detail ? (
          <SvgText
            x={cx}
            y={textY + 12}
            text={face.detail}
            fontSize={9}
            fill={COLORS.ink}
            textAnchor="middle"
            opacity={0.85}
          />
        ) : null}
      </>
    );
  }

  const r = rain ?? 0.3;
  const baseY = CUBE_FACE.stateTop + 6;
  return (
    <>
      {[0, 1].map((i) => {
        const dropOffset = (animTime * 0.04 + i * 30) % 12;
        return (
          <SvgLine
            key={i}
            points={[
              cx - 4 + i * 8,
              baseY + dropOffset,
              cx - 6 + i * 8,
              baseY + 8 + r * 6 + dropOffset,
            ]}
            stroke={COLORS.ledBlue}
            strokeWidth={1.5}
            opacity={0.25 + r * 0.45}
            lineCap="round"
          />
        );
      })}
    </>
  );
}
