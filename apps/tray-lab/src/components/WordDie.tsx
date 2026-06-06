import { useDraggable } from "@dnd-kit/core";
import type { WordDie } from "@foundry/cube-defs";

interface WordDieProps {
  die: WordDie;
  activeModeId: string;
  inTray?: boolean;
  onRotate?: () => void;
}

function modeRingIndex(die: WordDie, activeModeId: string): number {
  const idx = die.modes.findIndex((m) => m.id === activeModeId);
  return idx === -1 ? 0 : idx;
}

export function WordDieView({
  die,
  activeModeId,
  inTray = false,
  onRotate,
}: WordDieProps) {
  const idx = modeRingIndex(die, activeModeId);
  const front = die.modes[idx]!;
  const top = die.modes[(idx + 1) % die.modes.length]!;
  const side = die.modes[(idx + 2) % die.modes.length]!;

  const frontLabel = front.faceText;
  const topLabel = top.faceText;
  const sideLabel = side.faceText;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRotate?.();
      }}
      className={[
        "relative select-none touch-manipulation",
        "w-[72px] h-[72px] rounded-md",
        "bg-tray-die border border-tray-border/20",
        "shadow-die overflow-hidden",
        "transition-transform duration-200",
        inTray ? "translate-y-[-2px]" : "",
        onRotate ? "cursor-pointer hover:brightness-[1.02] active:scale-[0.98]" : "",
      ].join(" ")}
      aria-label={`${frontLabel}. Click to rotate.`}
    >
      {inTray && (
        <>
          <span
            className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] font-medium tracking-wide text-tray-ink/40 scale-90 -skew-x-6 pointer-events-none max-w-[90%] truncate"
            aria-hidden
          >
            {topLabel}
          </span>
          <span
            className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[7px] font-medium tracking-wide text-tray-ink/40 scale-90 skew-y-6 pointer-events-none max-w-[40%] truncate"
            aria-hidden
          >
            {sideLabel}
          </span>
        </>
      )}

      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tracking-wide text-tray-ink text-center leading-tight px-1">
        {frontLabel}
      </span>
    </button>
  );
}

interface PoolDieProps {
  die: WordDie;
}

export function PoolDie({ die }: PoolDieProps) {
  const modeId = die.modes[0]!.id;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${die.id}`,
    data: { dieId: die.id, fromPool: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-40" : ""}
    >
      <WordDieView die={die} activeModeId={modeId} />
    </div>
  );
}
