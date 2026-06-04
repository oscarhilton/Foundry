import type { ReactNode } from "react";
import type { CubeDefinition } from "@foundry/cube-defs";
import { COLORS, CUBE_FACE, CUBE_SHELL } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { StatusLed } from "./StatusLed";

const LED_ROW_H = CUBE_SIZE - CUBE_FACE.stateBottom;

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
  definition,
  highlighted = false,
  unpowered = false,
  inChain = false,
  statusLedColor,
  statusLedActive = false,
  statusLedPulse = 1,
  iconSlot,
  badgeSlot,
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
        gridTemplateRows: `${CUBE_SHELL.accentStripeHeight}px 1fr ${LED_ROW_H}px`,
        backgroundColor: fill,
        borderRadius: radius,
        border: `${strokeWidth}px solid ${stroke}`,
        boxShadow,
      }}
    >
      <div
        className="shrink-0"
        style={{
          height: CUBE_SHELL.accentStripeHeight,
          marginLeft: radius,
          marginRight: radius,
          backgroundColor: definition.colorAccent,
          opacity: CUBE_SHELL.accentStripeOpacity,
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
        }}
      />
      {hasStateBand ? (
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {badgeSlot && (
            <div className="absolute top-1.5 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-white/90 px-1 py-0.5 shadow-sm">
              {badgeSlot}
            </div>
          )}
          {stateSlot}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">{iconSlot}</div>
      )}
      <StatusLed
        color={statusLedColor}
        active={statusLedActive}
        pulse={statusLedPulse}
        inChain={inChain}
      />
    </div>
  );
}
