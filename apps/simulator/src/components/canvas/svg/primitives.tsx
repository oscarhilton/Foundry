import type { CSSProperties, ReactNode } from "react";

export interface SvgGroupProps {
  children?: ReactNode;
  opacity?: number;
  clipX?: number;
  clipY?: number;
  clipWidth?: number;
  clipHeight?: number;
  transform?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
  className?: string;
}

export function SvgGroup({
  children,
  opacity = 1,
  clipX,
  clipY,
  clipWidth,
  clipHeight,
  transform,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClick,
  style,
  className,
}: SvgGroupProps) {
  const clipId =
    clipWidth != null && clipHeight != null
      ? `clip-${clipX ?? 0}-${clipY ?? 0}-${clipWidth}-${clipHeight}`
      : undefined;

  return (
    <g
      opacity={opacity}
      transform={transform}
      style={style}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
    >
      {clipId && (
        <defs>
          <clipPath id={clipId}>
            <rect x={clipX} y={clipY} width={clipWidth} height={clipHeight} />
          </clipPath>
        </defs>
      )}
      <g clipPath={clipId ? `url(#${clipId})` : undefined}>{children}</g>
    </g>
  );
}

export interface SvgRectProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number | number[];
}

export function SvgRect({
  x = 0,
  y = 0,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
  opacity,
  cornerRadius = 0,
}: SvgRectProps) {
  const rx = Array.isArray(cornerRadius) ? cornerRadius[0] : cornerRadius;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      rx={rx}
      ry={rx}
    />
  );
}

export function SvgCubeShellRect(props: SvgRectProps & { shadow?: boolean }) {
  const { shadow = true, ...rest } = props;
  return (
    <rect
      x={rest.x ?? 0}
      y={rest.y ?? 0}
      width={rest.width}
      height={rest.height}
      fill={rest.fill}
      stroke={rest.stroke}
      strokeWidth={rest.strokeWidth}
      opacity={rest.opacity}
      rx={Array.isArray(rest.cornerRadius) ? rest.cornerRadius[0] : (rest.cornerRadius ?? 0)}
      style={
        shadow
          ? {
              filter: `drop-shadow(0 1px 6px rgba(0,0,0,${rest.opacity != null && rest.opacity < 0.1 ? 0.025 : 0.05}))`,
            }
          : undefined
      }
    />
  );
}

export interface SvgCircleProps {
  x: number;
  y: number;
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  style?: CSSProperties;
}

export function SvgCircle({
  x,
  y,
  radius,
  fill,
  stroke,
  strokeWidth,
  opacity,
  style,
}: SvgCircleProps) {
  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      style={style}
    />
  );
}

export interface SvgLineProps {
  points: number[];
  stroke?: string;
  strokeWidth?: number;
  lineCap?: "round" | "butt" | "square";
  opacity?: number;
  tension?: number;
}

export function SvgLine({
  points,
  stroke,
  strokeWidth,
  lineCap = "butt",
  opacity,
  tension,
}: SvgLineProps) {
  if (points.length < 4) return null;
  const pairs: [number, number][] = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push([points[i]!, points[i + 1]!]);
  }

  let d = `M ${pairs[0]![0]} ${pairs[0]![1]}`;
  if (tension != null && tension > 0 && pairs.length > 2) {
    for (let i = 0; i < pairs.length - 1; i++) {
      const p0 = pairs[Math.max(0, i - 1)]!;
      const p1 = pairs[i]!;
      const p2 = pairs[i + 1]!;
      const p3 = pairs[Math.min(pairs.length - 1, i + 2)]!;
      const cp1x = p1[0] + ((p2[0] - p0[0]) * tension) / 6;
      const cp1y = p1[1] + ((p2[1] - p0[1]) * tension) / 6;
      const cp2x = p2[0] - ((p3[0] - p1[0]) * tension) / 6;
      const cp2y = p2[1] - ((p3[1] - p1[1]) * tension) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
    }
  } else {
    for (let i = 1; i < pairs.length; i++) {
      d += ` L ${pairs[i]![0]} ${pairs[i]![1]}`;
    }
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={lineCap}
      opacity={opacity}
    />
  );
}

export interface SvgArcProps {
  x: number;
  y: number;
  innerRadius: number;
  outerRadius: number;
  angle: number;
  rotation?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
}

export function SvgArc({
  x,
  y,
  innerRadius,
  outerRadius,
  angle,
  rotation = 0,
  stroke,
  strokeWidth,
  fill,
  opacity,
}: SvgArcProps) {
  const startRad = ((rotation - 90) * Math.PI) / 180;
  const endRad = ((rotation + angle - 90) * Math.PI) / 180;
  const largeArc = angle > 180 ? 1 : 0;

  const x1 = x + Math.cos(startRad) * outerRadius;
  const y1 = y + Math.sin(startRad) * outerRadius;
  const x2 = x + Math.cos(endRad) * outerRadius;
  const y2 = y + Math.sin(endRad) * outerRadius;

  if (innerRadius > 0) {
    const x3 = x + Math.cos(endRad) * innerRadius;
    const y3 = y + Math.sin(endRad) * innerRadius;
    const x4 = x + Math.cos(startRad) * innerRadius;
    const y4 = y + Math.sin(startRad) * innerRadius;
    const d = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    return (
      <path
        d={d}
        fill={fill ?? stroke}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }

  const d = `M ${x} ${y} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  return (
    <path
      d={d}
      fill={fill ?? "none"}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
}

export interface SvgTextProps {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fill?: string;
  opacity?: number;
  textAnchor?: "start" | "middle" | "end";
  width?: number;
  wrap?: boolean;
}

export function SvgText({
  x,
  y,
  text,
  fontSize = 10,
  fill,
  opacity,
  textAnchor = "start",
  width,
  wrap,
}: SvgTextProps) {
  if (wrap && width) {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (test.length * fontSize * 0.55 > width && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return (
      <text
        x={x}
        y={y}
        fontSize={fontSize}
        fill={fill}
        opacity={opacity}
        textAnchor={textAnchor}
        fontFamily="SF Mono, Menlo, Monaco, Consolas, monospace"
      >
        {lines.map((ln, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : fontSize * 1.15}>
            {ln}
          </tspan>
        ))}
      </text>
    );
  }

  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fill={fill}
      opacity={opacity}
      textAnchor={textAnchor}
      fontFamily="SF Mono, Menlo, Monaco, Consolas, monospace"
      dominantBaseline="hanging"
    >
      {text}
    </text>
  );
}

export function getSvgPoint(
  svg: SVGSVGElement | null,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  if (!svg) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}
