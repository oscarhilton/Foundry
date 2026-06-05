import { Clock } from "lucide-react";
import { COLORS, CUBE_ICON_BADGE_SIZE } from "../design-tokens";

interface TimeVisualProps {
  hour: number | null;
  animTime: number;
}

/** Wall-clock fraction 0–1 → `HH:MM` (matches runtime LCD formatter). */
export function formatTimeDisplay(hour: number | null | undefined): string {
  const hourFrac = hour ?? 0.5;
  const totalMinutes = Math.floor(hourFrac * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function TimeVisual(_props: TimeVisualProps) {
  return (
    <div
      className="pointer-events-none flex select-none flex-col items-center justify-center gap-2 p-2 px-1.5 text-center font-mono leading-tight"
      style={{ color: COLORS.ink, backgroundColor: COLORS.einkBackground }}
    >
      <Clock
        aria-hidden
        size={CUBE_ICON_BADGE_SIZE}
        stroke={COLORS.ink}
        strokeWidth={1.5}
      />
    </div>
  );
}
