import type { ReactNode } from "react";
import type { CubeDefinition } from "@foundry/cube-defs";
import { COLORS, CUBE_SHELL } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

interface BaseCubeShellProps {
  definition: CubeDefinition;
  highlighted?: boolean;
  unpowered?: boolean;
  inChain?: boolean;
  statusLedColor?: string;
  statusLedActive?: boolean;
  statusLedPulse?: number;
  iconSlot?: ReactNode;
  badgeSlot?: ReactNode;
  stateSlot?: ReactNode;
}

export function BaseCubeShell({
  highlighted = false,
  unpowered = false,
  inChain = false,
  iconSlot,
  stateSlot,
}: BaseCubeShellProps) {
  const fill = unpowered ? COLORS.cubeUnpowered : COLORS.cube;
  const stroke = highlighted
    ? COLORS.ink
    : inChain && !unpowered
      ? CUBE_SHELL.chainBorder
      : COLORS.stroke;
  const strokeWidth = highlighted ? 2 : 1;
  const hasStateBand = stateSlot != null;
  const radius = inChain ? CUBE_SHELL.cornerRadius : 6;

  const boxShadow = highlighted
    ? `0 0 0 1px ${COLORS.ink}, ${CUBE_SHELL.chainShadow}`
    : unpowered
      ? undefined
      : inChain
        ? CUBE_SHELL.chainShadow
        : `0 ${CUBE_SHELL.shadowOffsetY}px ${CUBE_SHELL.shadowBlur}px rgba(0,0,0,${CUBE_SHELL.shadowOpacity})`;

  return (
    <div
      className="relative grid h-full w-full overflow-hidden"
      style={{
        width: CUBE_SIZE,
        height: CUBE_SIZE,
        backgroundColor: fill,
        borderRadius: radius,
        border: `${strokeWidth}px solid ${stroke}`,
        boxShadow,
      }}
    >
      {hasStateBand ? (
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {stateSlot}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">{iconSlot}</div>
      )}
    </div>
  );
}
