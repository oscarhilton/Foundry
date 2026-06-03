import { Circle, Rect } from "react-konva";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface CubeConnectorsProps {
  side: "left" | "right";
}

const POGO_Y = [28, 44, 60, 76];
const MAGNET_Y = [20, 84];

export function CubeConnectors({ side }: CubeConnectorsProps) {
  const x = side === "left" ? -3 : CUBE_SIZE + 1;
  const pogoX = side === "left" ? x - 2 : x;

  return (
    <>
      {MAGNET_Y.map((y) => (
        <Circle
          key={`mag-${y}`}
          x={x}
          y={y}
          radius={3}
          fill={COLORS.magnet}
        />
      ))}
      {POGO_Y.map((y) => (
        <Rect
          key={`pogo-${y}`}
          x={pogoX}
          y={y - 2}
          width={4}
          height={4}
          fill={COLORS.pogo}
          cornerRadius={1}
        />
      ))}
    </>
  );
}

export function PogoBridge({ x, y }: { x: number; y: number }) {
  return (
    <Rect
      x={x}
      y={y - 2}
      width={20}
      height={4}
      fill={COLORS.pogo}
      cornerRadius={1}
    />
  );
}
