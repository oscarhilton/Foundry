import { useEffect, useState } from "react";
import type { ChainLayout } from "./layout";
import { CHAIN_GAP, CUBE_SIZE } from "./layout";
import { COLORS } from "./design-tokens";

const GAP_SIZE = CUBE_SIZE + CHAIN_GAP;
const TRANSITION =
  "max-width 200ms ease, max-height 200ms ease, opacity 200ms ease";

interface ChainInsertGapProps {
  showConnector: boolean;
  connectorOpacity: number;
  flowHintActive: boolean;
  powered: boolean;
  orientation?: ChainLayout;
}

export function ChainInsertGap({
  orientation = "horizontal",
}: ChainInsertGapProps) {
  const [open, setOpen] = useState(false);
  const isVertical = orientation === "vertical";

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`flex shrink-0 items-center overflow-hidden ${
        isVertical ? "flex-col" : "flex-row"
      }`}
      aria-hidden
      style={{
        maxWidth: isVertical ? undefined : open ? GAP_SIZE : 0,
        maxHeight: isVertical ? (open ? GAP_SIZE : 0) : undefined,
        opacity: open ? 1 : 0,
        transition: TRANSITION,
      }}
    >
      <div
        className="shrink-0 rounded-md border border-dashed"
        style={{
          width: CUBE_SIZE,
          height: CUBE_SIZE,
          borderColor: COLORS.stroke,
          backgroundColor: "rgba(232, 232, 232, 0.35)",
        }}
      />
    </div>
  );
}
