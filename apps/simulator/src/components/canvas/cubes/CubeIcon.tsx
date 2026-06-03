import { Arc, Circle, Group, Line, Rect } from "react-konva";
import type { ReactNode } from "react";
import { COLORS, CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface CubeIconProps {
  cubeId: string;
  accent: string;
  unpowered?: boolean;
  opacity?: number;
}

const cx = CUBE_SIZE / 2;
const cy = CUBE_FACE.iconCenterY;
const stroke = 1.5;

function iconStroke(accent: string, unpowered: boolean) {
  return unpowered ? COLORS.muted : accent;
}

function iconOpacity(unpowered: boolean, opacity: number) {
  return unpowered ? opacity * 0.45 : opacity;
}

function PlacePin({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Circle x={cx} y={cy + 4} radius={3} fill={color} />
      <Line points={[cx - 10, cy - 6, cx + 10, cy - 6]} stroke={color} strokeWidth={stroke} />
      <Line points={[cx, cy - 6, cx, cy + 1]} stroke={color} strokeWidth={stroke} />
      <Line points={[cx - 10, cy - 6, cx - 10, cy + 2]} stroke={color} strokeWidth={stroke} />
      <Line points={[cx + 10, cy - 6, cx + 10, cy + 2]} stroke={color} strokeWidth={stroke} />
    </Group>
  );
}

function WeatherIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Arc x={cx} y={cy} innerRadius={0} outerRadius={12} angle={180} rotation={180} stroke={color} strokeWidth={stroke} />
      <Line points={[cx - 4, cy + 10, cx - 6, cy + 18]} stroke={color} strokeWidth={stroke} lineCap="round" />
      <Line points={[cx + 2, cy + 10, cx, cy + 18]} stroke={color} strokeWidth={stroke} lineCap="round" />
    </Group>
  );
}

function TimeIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Circle x={cx} y={cy} radius={12} stroke={color} strokeWidth={stroke} />
      <Line points={[cx, cy, cx, cy - 7]} stroke={color} strokeWidth={stroke} lineCap="round" />
      <Line points={[cx, cy, cx + 6, cy + 2]} stroke={color} strokeWidth={stroke} lineCap="round" />
    </Group>
  );
}

function GitHubIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Circle x={cx} y={cy - 4} radius={3} fill={color} />
      <Line points={[cx, cy - 1, cx - 10, cy + 10]} stroke={color} strokeWidth={stroke} lineCap="round" />
      <Line points={[cx, cy - 1, cx + 10, cy + 10]} stroke={color} strokeWidth={stroke} lineCap="round" />
      <Circle x={cx - 10} y={cy + 10} radius={3} fill={color} />
      <Circle x={cx + 10} y={cy + 10} radius={3} fill={color} />
    </Group>
  );
}

function CalmIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  const wave = Array.from({ length: 9 }, (_, i) => {
    const x = cx - 16 + i * 4;
    const y = cy + Math.sin(i * 0.8) * 4;
    return [x, y];
  }).flat();
  return (
    <Group opacity={o}>
      <Line points={wave} stroke={color} strokeWidth={stroke} lineCap="round" tension={0.4} bezier />
    </Group>
  );
}

function RandomIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  const dots = [
    [cx - 8, cy - 6],
    [cx + 6, cy - 8],
    [cx - 2, cy + 2],
    [cx + 10, cy + 4],
    [cx - 10, cy + 8],
  ];
  return (
    <Group opacity={o}>
      {dots.map(([x, y], i) => (
        <Circle key={i} x={x} y={y} radius={2} fill={color} />
      ))}
    </Group>
  );
}

function DialIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Circle x={cx} y={cy} radius={12} stroke={color} strokeWidth={stroke} />
      <Line points={[cx, cy, cx + 8, cy - 6]} stroke={color} strokeWidth={stroke} lineCap="round" />
    </Group>
  );
}

function SliderIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Line points={[cx - 14, cy, cx + 14, cy]} stroke={color} strokeWidth={stroke} lineCap="round" />
      <Circle x={cx + 4} y={cy} radius={4} fill={color} />
    </Group>
  );
}

function ButtonIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Circle x={cx} y={cy} radius={10} stroke={color} strokeWidth={stroke} />
      <Circle x={cx} y={cy} radius={5} fill={color} opacity={0.35} />
    </Group>
  );
}

function MotionIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Arc x={cx + 6} y={cy} innerRadius={8} outerRadius={10} angle={90} rotation={135} stroke={color} strokeWidth={stroke} />
      <Line points={[cx + 6, cy, cx + 14, cy - 6]} stroke={color} strokeWidth={stroke} lineCap="round" />
    </Group>
  );
}

function TemperatureIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Line points={[cx, cy - 10, cx, cy + 6]} stroke={color} strokeWidth={stroke} lineCap="round" />
      <Circle x={cx} y={cy + 10} radius={5} stroke={color} strokeWidth={stroke} />
    </Group>
  );
}

function LightIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  const rays = [0, 90, 180, 270];
  return (
    <Group opacity={o}>
      {rays.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <Line
            key={deg}
            points={[
              cx + Math.cos(rad) * 14,
              cy + Math.sin(rad) * 14,
              cx + Math.cos(rad) * 18,
              cy + Math.sin(rad) * 18,
            ]}
            stroke={color}
            strokeWidth={stroke}
            lineCap="round"
          />
        );
      })}
      <Circle x={cx} y={cy} radius={8} fill={color} opacity={0.25} />
      <Circle x={cx} y={cy} radius={5} fill={color} />
    </Group>
  );
}

function MusicIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  const bars = [
    { x: cx - 8, h: 14 },
    { x: cx, h: 20 },
    { x: cx + 8, h: 10 },
  ];
  return (
    <Group opacity={o}>
      {bars.map((b) => (
        <Rect
          key={b.x}
          x={b.x - 2}
          y={cy + 10 - b.h}
          width={4}
          height={b.h}
          fill={color}
          cornerRadius={1}
        />
      ))}
    </Group>
  );
}

function LcdIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Rect x={cx - 16} y={cy - 10} width={32} height={20} stroke={color} strokeWidth={stroke} cornerRadius={2} />
      <Line points={[cx - 12, cy - 2, cx + 12, cy - 2]} stroke={color} strokeWidth={1} opacity={0.6} />
      <Line points={[cx - 12, cy + 4, cx + 8, cy + 4]} stroke={color} strokeWidth={1} opacity={0.6} />
    </Group>
  );
}

function ChimeIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  return (
    <Group opacity={o}>
      <Arc x={cx} y={cy + 2} innerRadius={0} outerRadius={12} angle={180} rotation={180} stroke={color} strokeWidth={stroke} />
      <Circle x={cx} y={cy + 14} radius={2} fill={color} />
    </Group>
  );
}

function CoreIcon({ accent, unpowered, opacity }: CubeIconProps) {
  const color = iconStroke(accent, unpowered ?? false);
  const o = iconOpacity(unpowered ?? false, opacity ?? 1);
  const dots = [
    [cx - 5, cy - 5],
    [cx + 5, cy - 5],
    [cx - 5, cy + 5],
    [cx + 5, cy + 5],
  ];
  return (
    <Group opacity={o}>
      {dots.map(([x, y], i) => (
        <Circle key={i} x={x} y={y} radius={2.5} fill={color} />
      ))}
    </Group>
  );
}

const ICON_MAP: Record<string, (props: CubeIconProps) => ReactNode> = {
  "identity/london": PlacePin,
  "identity/tokyo": PlacePin,
  "identity/weather": WeatherIcon,
  "source/time": TimeIcon,
  "source/github": GitHubIcon,
  "modifier/calm": CalmIcon,
  "modifier/random": RandomIcon,
  "control/dial": DialIcon,
  "control/slider": SliderIcon,
  "control/button": ButtonIcon,
  "sensor/motion": MotionIcon,
  "sensor/temperature": TemperatureIcon,
  "output/light": LightIcon,
  "output/music": MusicIcon,
  "output/lcd": LcdIcon,
  "output/chime": ChimeIcon,
  "core/core": CoreIcon,
};

export function CubeIcon(props: CubeIconProps) {
  const Icon = ICON_MAP[props.cubeId];
  if (!Icon) return null;
  return <Icon {...props} />;
}
