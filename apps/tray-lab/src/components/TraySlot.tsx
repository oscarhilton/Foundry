import { useDroppable } from "@dnd-kit/core";
import type { PlacedCube } from "@foundry/cube-defs";
import { getWordDie } from "@foundry/cube-defs";
import { WordDieView } from "./WordDie";

interface TraySlotProps {
  index: number;
  placed: PlacedCube | null;
  silent: boolean;
  onRotate: () => void;
  onRemove: () => void;
}

export function TraySlot({ index, placed, silent, onRotate, onRemove }: TraySlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${index}`,
    data: { slotIndex: index },
  });

  const die = placed ? getWordDie(placed.cubeId) : null;

  return (
    <div
      ref={setNodeRef}
      className={[
        "relative flex items-center justify-center",
        "w-[88px] h-[88px] rounded-md",
        "bg-tray-recess",
        isOver ? "bg-tray-recess/90" : "",
      ].join(" ")}
    >
      {placed && die ? (
        <div className="relative group">
          <WordDieView
            die={die}
            activeModeId={placed.activeModeId}
            inTray
            onRotate={onRotate}
          />
          {!silent && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-tray-ink/80 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove die"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        !silent && (
          <span className="text-tray-hint/30 text-xs">slot {index + 1}</span>
        )
      )}
    </div>
  );
}
