export function warmGlowColor(brightness: number): string {
  const b = Math.max(0, Math.min(1, brightness));
  const r = Math.round(255);
  const g = Math.round(180 + b * 60);
  const bl = Math.round(80 + b * 80);
  return `rgb(${r},${g},${bl})`;
}

export function breatheOpacity(time: number, speed = 0.0015): number {
  return 0.45 + Math.sin(time * speed) * 0.25;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function eventPhase(now: number, firedAt: number, duration: number): number {
  if (firedAt <= 0 || duration <= 0) return 1;
  return Math.max(0, Math.min(1, (now - firedAt) / duration));
}

export function smoothStep(current: number, target: number, dtMs: number, tauMs = 250): number {
  const alpha = 1 - Math.exp(-dtMs / tauMs);
  return lerp(current, target, alpha);
}

export function springScale(animTime: number, firedAt: number, duration = 400): number {
  const phase = eventPhase(animTime, firedAt, duration);
  if (phase >= 1) return 1;
  return 1 + Math.sin(phase * Math.PI) * 0.08 * (1 - phase);
}

export function decayPulse(animTime: number, firedAt: number, duration = 500): number {
  const phase = eventPhase(animTime, firedAt, duration);
  if (phase >= 1) return 0;
  return (1 - phase) * (0.5 + Math.sin(phase * Math.PI * 4) * 0.5);
}
