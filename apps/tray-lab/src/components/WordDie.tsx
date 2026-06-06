import { useDraggable } from "@dnd-kit/core";
import type { WordDie } from "@foundry/cube-defs";
import { getCubeFaceDisplay } from "./cube-display";

interface WordDieProps {
  die: WordDie;
  activeModeId: string;
  inTray?: boolean;
  isDragging?: boolean;
  onRotate?: () => void;
}

export function WordDieView({
  die,
  activeModeId,
  inTray = false,
  isDragging = false,
  onRotate,
}: WordDieProps) {
  const { primaryLabel, secondaryLabel, isRotated } = getCubeFaceDisplay(
    die,
    activeModeId,
  );

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRotate?.();
      }}
      className={[
        "relative select-none touch-manipulation",
        "w-[72px] h-[72px] rounded-xl",
        "bg-tray-die text-tray-ink",
        "border-0 ring-0 outline-none",
        "transition-transform transition-shadow duration-200",
        isDragging
          ? "scale-[1.03] shadow-die-drag z-10"
          : inTray
            ? "shadow-none translate-y-0"
            : "shadow-die",
        onRotate ? "cursor-pointer hover:brightness-[1.02] active:scale-[0.98]" : "",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-tray-ink/25",
      ].join(" ")}
      aria-label={
        isRotated && secondaryLabel
          ? `${primaryLabel}, ${secondaryLabel}. Click to rotate.`
          : `${primaryLabel}. Click to rotate.`
      }
    >
      {isRotated && secondaryLabel ? (
        <span className="absolute top-1.5 inset-x-1 text-center text-[6px] font-normal tracking-wider text-tray-ink/30 leading-none pointer-events-none shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]">
          {secondaryLabel}
        </span>
      ) : null}

      <span
        className={[
          "absolute inset-x-1 flex items-center justify-center text-center",
          "text-[10px] font-semibold tracking-wide leading-tight px-1",
          isRotated ? "top-[26px] bottom-2" : "inset-y-0",
        ].join(" ")}
      >
        {primaryLabel}
      </span>
    </button>
  );
}

interface PoolDieProps {
  die: WordDie;
}

export function PoolDie({ die }: PoolDieProps) {
  const defaultModeId = die.modes[0]!.id;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${die.id}`,
    data: { dieId: die.id, fromPool: true },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <WordDieView
        die={die}
        activeModeId={defaultModeId}
        isDragging={isDragging}
      />
    </div>
  );
}
