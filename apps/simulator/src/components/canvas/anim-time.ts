let current = 0;
const listeners = new Set<() => void>();
let rafId: number | null = null;

export function getAnimTime(): number {
  return current;
}

export function subscribeAnimTime(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    startLoop();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopLoop();
    }
  };
}

function startLoop(): void {
  const loop = (t: number) => {
    current = t;
    for (const listener of listeners) {
      listener();
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

function stopLoop(): void {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
