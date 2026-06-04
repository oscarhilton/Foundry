import { useEffect, useState } from "react";
import { FONTS } from "./design-tokens";

export interface CubeTooltipData {
  label: string;
  description: string;
  x: number;
  y: number;
}

interface CubeTooltipProps {
  tooltip: CubeTooltipData | null;
}

const MARGIN = 8;
const MAX_W = 200;

function clampPosition(x: number, y: number): { left: number; top: number; transform: string } {
  if (typeof window === "undefined") {
    return { left: x, top: y, transform: "translate(-50%, calc(-100% - 10px))" };
  }

  const halfW = MAX_W / 2;
  const clampedX = Math.max(
    MARGIN + halfW,
    Math.min(window.innerWidth - MARGIN - halfW, x),
  );
  const aboveY = y - 10;
  const showBelow = aboveY < 60;
  const clampedY = showBelow
    ? Math.min(window.innerHeight - MARGIN, y + 20)
    : Math.max(MARGIN + 40, aboveY);

  return {
    left: clampedX,
    top: clampedY,
    transform: showBelow
      ? "translate(-50%, 0)"
      : "translate(-50%, -100%)",
  };
}

export function CubeTooltip({ tooltip }: CubeTooltipProps) {
  const [pos, setPos] = useState({ left: 0, top: 0, transform: "" });

  useEffect(() => {
    if (!tooltip) return;
    setPos(clampPosition(tooltip.x, tooltip.y));
  }, [tooltip]);

  if (!tooltip) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-[#E8E8E8] bg-white px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      style={{
        left: pos.left,
        top: pos.top,
        transform: pos.transform,
        maxWidth: MAX_W,
        fontFamily: FONTS.sans,
      }}
    >
      <div className="text-[12px] font-medium text-[#1D1D1F]">{tooltip.label}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-[#86868B]">
        {tooltip.description}
      </div>
    </div>
  );
}
