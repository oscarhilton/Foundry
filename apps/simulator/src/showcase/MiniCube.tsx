import type { ReactNode } from "react";
import { getCubeDefinition } from "@foundry/cube-defs";
import type { FoundryOutputState } from "@foundry/runtime";
import { CubeIcon } from "../components/canvas/cubes/CubeIcon";
import { panelFill } from "../components/canvas/cubes/LightVisual";
import { COLORS } from "../components/canvas/design-tokens";

const MINI = 56;

interface MiniCubeProps {
  definitionId: string;
  instanceId: string;
  outputState: FoundryOutputState;
}

function lcdTextFor(
  definitionId: string,
  instanceId: string,
  outputState: FoundryOutputState,
): string | null {
  if (definitionId !== "output/lcd") return null;
  return outputState.lcdTexts[instanceId] ?? outputState.lcdText;
}

export function MiniCube({ definitionId, instanceId, outputState }: MiniCubeProps) {
  const def = getCubeDefinition(definitionId);
  if (!def) return null;

  const powered = outputState.powered;
  const lcdText = lcdTextFor(definitionId, instanceId, outputState);
  const isLight = definitionId === "output/light";
  const isCore = definitionId === "core/core";

  let stateBand: ReactNode = null;

  if (definitionId === "output/lcd" && lcdText) {
    const lines = lcdText.split("\n").slice(0, 2);
    stateBand = (
      <div
        className="px-1 py-0.5 text-center leading-tight font-mono text-[6px] text-[#1D3557] bg-[#E8F4F8] rounded-sm mx-1 mb-1 min-h-[22px] flex flex-col justify-center"
        style={{ whiteSpace: "pre-line" }}
      >
        {lines.map((line, i) => (
          <span key={i} className="block truncate">
            {line}
          </span>
        ))}
      </div>
    );
  } else if (isLight) {
    const fill = panelFill(outputState.lightBrightness, outputState.lightMood);
    stateBand = (
      <div className="flex items-center justify-center mb-1 h-6 px-1 w-full">
        <div
          className="w-full max-w-[28px] aspect-square border"
          style={{
            background: fill,
            borderColor: COLORS.stroke,
          }}
        />
      </div>
    );
  } else if (definitionId === "control/dial") {
    const pct = Math.round(outputState.dialPosition * 100);
    const angle = outputState.dialPosition * Math.PI * 2 - Math.PI / 2;
    const ringR = 9;
    const cx = 10;
    const cy = 10;
    const dotX = cx + Math.cos(angle) * ringR;
    const dotY = cy + Math.sin(angle) * ringR;
    stateBand = (
      <div className="flex flex-col items-center mb-1">
        <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke={COLORS.stroke}
            strokeWidth={1}
          />
          <circle cx={dotX} cy={dotY} r={1.5} fill={COLORS.ink} opacity={0.85} />
          <circle cx={cx} cy={cy} r={2.5} fill={COLORS.stroke} opacity={0.6} />
        </svg>
        <span className="text-[6px] text-foundry-muted font-mono -mt-0.5">{pct}%</span>
      </div>
    );
  } else if (definitionId === "sensor/motion" && outputState.motionDetected) {
    stateBand = (
      <div className="text-center text-[7px] font-medium text-green-700 mb-1">ON</div>
    );
  }

  return (
    <div
      className="shrink-0 flex flex-col rounded-md border bg-white overflow-hidden pointer-events-none select-none"
      style={{
        width: MINI,
        borderColor: isCore ? COLORS.ink : COLORS.stroke,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="h-0.5 w-full shrink-0"
        style={{ background: def.colorAccent, opacity: powered ? 0.7 : 0.25 }}
      />
      <div className="flex flex-col items-center pt-1.5 px-0.5 flex-1">
        <CubeIcon
          cubeId={definitionId}
          accent={def.colorAccent}
          unpowered={!powered}
          size={18}
          strokeWidth={1.5}
        />
        <span className="text-[7px] font-medium text-foundry-ink mt-0.5 truncate max-w-full px-0.5">
          {def.label}
        </span>
        {stateBand}
      </div>
    </div>
  );
}
