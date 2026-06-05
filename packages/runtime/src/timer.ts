/** Timer cube face durations in minutes (hex-style rotation). */
export const TIMER_FACE_MINUTES = [5, 10, 15, 30] as const;

export type TimerFaceIndex = 0 | 1 | 2 | 3;

export function timerFaceIndexFromPosition(position: number): TimerFaceIndex {
  const clamped = Math.max(0, Math.min(0.999, position));
  const idx = Math.floor(clamped * TIMER_FACE_MINUTES.length);
  return Math.min(TIMER_FACE_MINUTES.length - 1, idx) as TimerFaceIndex;
}

export function timerMinutesForFace(faceIndex: TimerFaceIndex): number {
  return TIMER_FACE_MINUTES[faceIndex] ?? TIMER_FACE_MINUTES[0];
}

export function formatTimerFaceLabel(faceIndex: TimerFaceIndex): string {
  return `${timerMinutesForFace(faceIndex)}m`;
}

export function formatTimerCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}
