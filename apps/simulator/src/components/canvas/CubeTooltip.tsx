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

export function CubeTooltip({ tooltip }: CubeTooltipProps) {
  if (!tooltip) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-[200px] rounded-lg border border-[#E8E8E8] bg-white px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, calc(-100% - 10px))",
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
