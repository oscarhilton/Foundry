import { Group, Rect, Text } from "react-konva";
import type { CubeDefinition } from "@foundry/cube-defs";
import { COLORS, CUBE_FACE, FONTS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { CubeConnectors } from "./CubeConnectors";
import { StatusLed } from "./StatusLed";

interface BaseCubeShellProps {
  definition: CubeDefinition;
  highlighted?: boolean;
  unpowered?: boolean;
  statusLedColor?: string;
  statusLedActive?: boolean;
  statusLedPulse?: number;
  children?: React.ReactNode;
}

export function BaseCubeShell({
  definition,
  highlighted = false,
  unpowered = false,
  statusLedColor,
  statusLedActive = false,
  statusLedPulse = 1,
  children,
}: BaseCubeShellProps) {
  const fill = unpowered ? COLORS.cubeUnpowered : COLORS.cube;
  const stroke = highlighted ? COLORS.ink : COLORS.ink;
  const strokeWidth = highlighted ? 2 : 1;

  return (
    <Group>
      <Rect
        width={CUBE_SIZE}
        height={CUBE_SIZE}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={4}
        shadowColor="#000"
        shadowBlur={4}
        shadowOpacity={unpowered ? 0.04 : 0.08}
        shadowOffsetY={2}
      />
      <Text
        x={4}
        y={CUBE_FACE.labelY}
        width={CUBE_SIZE - 8}
        text={definition.label.toUpperCase()}
        fontSize={FONTS.labelSize}
        fontStyle="bold"
        fill={unpowered ? COLORS.muted : COLORS.ink}
        align="center"
        fontFamily={FONTS.sans}
        letterSpacing={0.5}
      />
      <CubeConnectors side="left" />
      <CubeConnectors side="right" />
      {children}
      <StatusLed
        color={statusLedColor}
        active={statusLedActive}
        pulse={statusLedPulse}
      />
    </Group>
  );
}
