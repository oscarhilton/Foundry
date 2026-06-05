import { COLORS } from "../design-tokens";
import {
  formatTimerCountdown,
  formatTimerFaceLabel,
  type TimerFaceIndex,
} from "@foundry/runtime";

interface TimerVisualProps {
  faceIndex: TimerFaceIndex;
  remainingMs: number | null;
  running: boolean;
  onRotate?: () => void;
  onStart?: () => void;
}

const FACE_LABELS: TimerFaceIndex[] = [0, 1, 2, 3];

export function TimerVisual({
  faceIndex,
  remainingMs,
  running,
  onRotate,
  onStart,
}: TimerVisualProps) {
  const activeLabel = running && remainingMs != null
    ? formatTimerCountdown(remainingMs)
    : formatTimerFaceLabel(faceIndex);

  return (
    <button
      type="button"
      className="pointer-events-auto flex h-full w-full flex-col items-center justify-center gap-1 p-1 font-mono select-none"
      style={{ backgroundColor: COLORS.einkBackground, color: COLORS.ink }}
      onClick={(e) => {
        e.stopPropagation();
        onRotate?.();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStart?.();
      }}
      title="Click to rotate face · double-click to start"
    >
      <span className="text-[9px] font-semibold tracking-wide">{activeLabel}</span>
      <div className="grid grid-cols-2 gap-0.5">
        {FACE_LABELS.map((idx) => (
          <span
            key={idx}
            className="rounded px-1 text-[5px] leading-tight"
            style={{
              opacity: idx === faceIndex ? 1 : 0.35,
              backgroundColor: idx === faceIndex ? COLORS.cubeUnpowered : "transparent",
            }}
          >
            {formatTimerFaceLabel(idx)}
          </span>
        ))}
      </div>
    </button>
  );
}
