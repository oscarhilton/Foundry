export const CUBE_SIZE = 100;
export const CHAIN_GAP = 16;
export const CONNECTOR_W = 24;
export const SLOT_WIDTH = CUBE_SIZE + CHAIN_GAP + CONNECTOR_W;
export const SHELF_GAP = 10;

export type ChainLayout = "horizontal" | "vertical";

export interface ChainStripRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function chainStartOffset(
  stripSpan: number,
  chainLength: number,
): number {
  const totalSpan = chainLength * SLOT_WIDTH - CONNECTOR_W;
  return Math.max(0, (stripSpan - totalSpan) / 2);
}

export function findNearestChainSlot(
  pointerCoord: number,
  stripRect: ChainStripRect,
  chainLength: number,
  insertMode: boolean,
  layout: ChainLayout,
): number {
  const isVertical = layout === "vertical";
  const stripOrigin = isVertical ? stripRect.top : stripRect.left;
  const stripSpan = isVertical ? stripRect.height : stripRect.width;
  const start = stripOrigin + chainStartOffset(stripSpan, Math.max(chainLength, 1));
  const maxIndex = insertMode ? chainLength : Math.max(0, chainLength - 1);
  let best = 0;
  let bestDist = Infinity;

  for (let i = 0; i <= maxIndex; i++) {
    const slotCenter = start + i * SLOT_WIDTH + CUBE_SIZE / 2;
    const dist = Math.abs(pointerCoord - slotCenter);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }

  return best;
}

export function pointerCoordForLayout(
  pointer: { x: number; y: number },
  layout: ChainLayout,
): number {
  return layout === "vertical" ? pointer.y : pointer.x;
}

export function chainStripRectFromElement(el: HTMLElement | null): ChainStripRect | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
