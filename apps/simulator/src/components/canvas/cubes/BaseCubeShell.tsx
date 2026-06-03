import { Group, Rect } from "react-konva";
import type { CubeDefinition } from "@foundry/cube-defs";
import { COLORS, CUBE_SHELL } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { CubeConnectors } from "./CubeConnectors";
import { CubeIcon } from "./CubeIcon";
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
  const stroke = highlighted ? COLORS.ink : COLORS.stroke;
  const strokeWidth = highlighted ? 1.5 : 1;

  return (
    <Group>
      <Rect
        width={CUBE_SIZE}
        height={CUBE_SIZE}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={CUBE_SHELL.cornerRadius}
        shadowColor="#000"
        shadowBlur={CUBE_SHELL.shadowBlur}
        shadowOpacity={unpowered ? CUBE_SHELL.shadowOpacity * 0.5 : CUBE_SHELL.shadowOpacity}
        shadowOffsetY={CUBE_SHELL.shadowOffsetY}
      />
      <Rect
        x={CUBE_SHELL.cornerRadius}
        y={0}
        width={CUBE_SIZE - CUBE_SHELL.cornerRadius * 2}
        height={CUBE_SHELL.accentStripeHeight}
        fill={definition.colorAccent}
        opacity={CUBE_SHELL.accentStripeOpacity}
        cornerRadius={[CUBE_SHELL.cornerRadius, CUBE_SHELL.cornerRadius, 0, 0]}
      />
      <CubeIcon
        cubeId={definition.id}
        accent={definition.colorAccent}
        unpowered={unpowered}
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
