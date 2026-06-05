import type { ReactNode } from "react";
import type { CubeDefinition } from "@foundry/cube-defs";
import { COLORS, CUBE_SHELL } from "../design-tokens";
import { CUBE_SIZE } from "../layout";

const CORE_CABLE_BG = `${import.meta.env.BASE_URL}images/core-core-bg.png`;

const IDENTITY_LABELS = [
  "identity/weather",
  "identity/london",
  "identity/tokyo",
  "identity/foundry",
  "source/time",
] as const;

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
  width?: number;
  /** Footer under state band for identity cubes (e.g. Weather face detail). */
  identityFooter?: string | null;
}

export function BaseCubeShell({
  definition,
  highlighted = false,
  unpowered = false,
  inChain = false,
  iconSlot,
  stateSlot,
  width = CUBE_SIZE,
  identityFooter,
}: BaseCubeShellProps) {
  const isCore = definition.id === "core/core";
  const fill = unpowered ? COLORS.cubeUnpowered : COLORS.einkBackground;
  const stroke = highlighted
    ? COLORS.ink
    : inChain && !unpowered
      ? CUBE_SHELL.chainBorder
      : COLORS.stroke;
  const strokeWidth = highlighted ? 2 : 1;
  const hasStateBand = stateSlot != null;
  const radius = inChain ? CUBE_SHELL.cornerRadius : 6;
  const showIdentityLabel = IDENTITY_LABELS.includes(
    definition.id as (typeof IDENTITY_LABELS)[number],
  );

  const boxShadow = highlighted
    ? `0 0 0 1px ${COLORS.ink}, ${CUBE_SHELL.chainShadow}`
    : unpowered
      ? undefined
      : inChain
        ? CUBE_SHELL.chainShadow
        : `0 ${CUBE_SHELL.shadowOffsetY}px ${CUBE_SHELL.shadowBlur}px rgba(0,0,0,${CUBE_SHELL.shadowOpacity})`;

  return (
    <div
      className="relative grid h-full w-full shadow-xl"
      style={{
        width,
        height: CUBE_SIZE,
        backgroundColor: fill,
        borderRadius: radius,
        border: `${strokeWidth}px solid ${stroke}`,
        boxShadow,
        overflow: isCore && inChain ? "visible" : "hidden",
      }}
    >
      <div
        className="relative flex min-h-0 h-full w-full flex-1 flex-col items-center justify-center rounded-md border border-gray-200"
        style={{ overflow: isCore ? "visible" : "hidden" }}
      >
        {isCore && inChain ? (
          <div className="absolute top-0 w-screen h-full z-[-1] flex items-center" style={{ left: CUBE_SIZE }}>
            <img
              src={CORE_CABLE_BG}
              alt=""
              aria-hidden
              className="pointer-events-none relatve left-0 top-0 z-0 h-full object-cover object-left h-16"
              />
          </div>
        ) : null}
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center">
          {hasStateBand ? stateSlot : iconSlot}
          {showIdentityLabel && identityFooter ? (
            <div className="text-[10px] font-bold">{identityFooter}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
