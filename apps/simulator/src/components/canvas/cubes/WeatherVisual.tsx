import type { WeatherFaceState } from "@foundry/runtime";
import {
  truncatePlaceLabel,
  WEATHER_FACE_EINK_INK,
} from "@foundry/runtime";
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
  mono,
}: {
  symbol: WeatherFaceState["symbol"];
  cx: number;
  cy: number;
  color: string;
  mono?: boolean;
}) {
  const fillOpacity = mono ? 1 : undefined;
  const strokeOpacity = mono ? 0.9 : undefined;

  if (symbol === "sun") {
    return (
      <>
        <SvgCircle
          x={cx}
          y={cy}
          radius={5}
          fill={color}
          opacity={fillOpacity ?? 0.85}
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = cx + Math.cos(rad) * 7;
          const y1 = cy + Math.sin(rad) * 7;
          const x2 = cx + Math.cos(rad) * 9;
          const y2 = cy + Math.sin(rad) * 9;
          return (
            <SvgLine
              key={deg}
              points={[x1, y1, x2, y2]}
              stroke={color}
              strokeWidth={1.2}
              opacity={strokeOpacity ?? 0.7}
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
        <SvgCircle x={cx - 4} y={cy} radius={3.5} fill={color} opacity={mono ? 0.55 : 0.5} />
        <SvgCircle x={cx + 3} y={cy - 1} radius={4} fill={color} opacity={mono ? 0.75 : 0.65} />
        <SvgCircle x={cx + 7} y={cy + 1} radius={3} fill={color} opacity={mono ? 0.45 : 0.45} />
      </>
    );
  }

  return (
    <>
      <SvgLine
        points={[cx - 4, cy - 1, cx - 5, cy + 4]}
        stroke={color}
        strokeWidth={1.5}
        opacity={strokeOpacity ?? 0.75}
        lineCap="round"
      />
      <SvgLine
        points={[cx + 1, cy - 2, cx, cy + 4]}
        stroke={color}
        strokeWidth={1.5}
        opacity={strokeOpacity ?? 0.85}
        lineCap="round"
      />
      <SvgLine
        points={[cx + 5, cy, cx + 4, cy + 5]}
        stroke={color}
        strokeWidth={1.5}
        opacity={strokeOpacity ?? 0.7}
        lineCap="round"
      />
    </>
  );
}

function LatchedFace({ face }: { face: WeatherFaceState }) {
  const cx = CUBE_SIZE / 2;
  const ink = WEATHER_FACE_EINK_INK;
  const isThreshold = face.mode === "threshold";

  if (isThreshold) {
    const glyphY = CUBE_FACE.stateTop + 12;
    const headlineY = CUBE_FACE.stateTop + 24;
    return (
      <>
        <ConditionGlyph symbol={face.symbol} cx={cx} cy={glyphY} color={ink} mono />
        <SvgText
          x={cx}
          y={headlineY}
          text={face.headline}
          fontSize={8}
          fill={ink}
          textAnchor="middle"
        />
        {face.detail ? (
          <SvgText
            x={cx}
            y={CUBE_FACE.stateBottom - 3}
            text={face.detail}
            fontSize={7}
            fill={ink}
            textAnchor="middle"
            opacity={0.85}
          />
        ) : null}
      </>
    );
  }

  const placeY = CUBE_FACE.stateTop + 5;
  const glyphY = CUBE_FACE.stateTop + 13;
  const headlineY = CUBE_FACE.stateTop + 21;
  const detailY = CUBE_FACE.stateBottom - 3;

  return (
    <>
      {face.placeLabel ? (
        <SvgText
          x={cx}
          y={placeY}
          text={truncatePlaceLabel(face.placeLabel)}
          fontSize={7}
          fill={ink}
          textAnchor="middle"
          opacity={0.7}
        />
      ) : null}
      <ConditionGlyph symbol={face.symbol} cx={cx} cy={glyphY} color={ink} mono />
      <SvgText
        x={cx}
        y={headlineY}
        text={face.headline}
        fontSize={8}
        fill={ink}
        textAnchor="middle"
      />
      {face.detail ? (
        <SvgText
          x={cx}
          y={detailY}
          text={face.detail}
          fontSize={6.5}
          fill={ink}
          textAnchor="middle"
          opacity={0.85}
        />
      ) : null}
    </>
  );
}

export function WeatherVisual({ face, rain, animTime }: WeatherVisualProps) {
  const cx = CUBE_SIZE / 2;

  if (face) {
    return <LatchedFace face={face} />;
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
