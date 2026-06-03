export const CUBE_SIZE = 100;
export const CHAIN_GAP = 16;
export const CONNECTOR_W = 24;
export const SLOT_WIDTH = CUBE_SIZE + CHAIN_GAP + CONNECTOR_W;
export const SHELF_GAP = 10;

export interface StageLayout {
  width: number;
  height: number;
  chainY: number;
  shelfRow1Y: number;
  shelfRow2Y: number;
  chainStartX: (chainLength: number) => number;
}

export function getStageLayout(width: number, height: number): StageLayout {
  return {
    width,
    height,
    chainY: height * 0.36,
    shelfRow1Y: height * 0.66,
    shelfRow2Y: height * 0.8,
    chainStartX: (chainLength: number) => {
      const totalW = chainLength * SLOT_WIDTH - CONNECTOR_W;
      return Math.max(40, (width - totalW) / 2);
    },
  };
}

export function getChainSlotPosition(
  layout: StageLayout,
  index: number,
  chainLength: number,
): { x: number; y: number } {
  return {
    x: layout.chainStartX(chainLength) + index * SLOT_WIDTH,
    y: layout.chainY,
  };
}

export function getShelfSlotPosition(
  layout: StageLayout,
  row: 0 | 1,
  index: number,
  totalInRow: number,
): { x: number; y: number } {
  const totalW = totalInRow * (CUBE_SIZE + SHELF_GAP) - SHELF_GAP;
  const startX = Math.max(20, (layout.width - totalW) / 2);
  return {
    x: startX + index * (CUBE_SIZE + SHELF_GAP),
    y: row === 0 ? layout.shelfRow1Y : layout.shelfRow2Y,
  };
}

export function findNearestChainSlot(
  x: number,
  layout: StageLayout,
  chainLength: number,
  insertMode = false,
): number {
  const startX = layout.chainStartX(Math.max(chainLength, 1));
  const maxIndex = insertMode ? chainLength : Math.max(0, chainLength - 1);
  let best = 0;
  let bestDist = Infinity;

  for (let i = 0; i <= maxIndex; i++) {
    const slotX = startX + i * SLOT_WIDTH + CUBE_SIZE / 2;
    const dist = Math.abs(x - slotX);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }

  return best;
}

export function isNearChainStrip(
  x: number,
  y: number,
  layout: StageLayout,
): boolean {
  const slotY = layout.chainY;
  return (
    y > slotY - 60 &&
    y < slotY + CUBE_SIZE + 60 &&
    x > 20 &&
    x < layout.width - 20
  );
}
