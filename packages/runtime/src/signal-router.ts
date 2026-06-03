export type SignalValue = number | string | boolean;

export interface SignalMessage {
  topic: string;
  value: SignalValue;
  ts: number;
  source: string;
}

export type SignalHandler = (message: SignalMessage) => void;

export interface SignalRouterOptions {
  maxLogSize?: number;
  onPublish?: (message: SignalMessage) => void;
}

export class SignalRouter {
  private subscribers = new Map<string, Set<SignalHandler>>();
  private latest = new Map<string, SignalMessage>();
  private log: SignalMessage[] = [];
  private maxLogSize: number;
  private onPublish?: (message: SignalMessage) => void;

  constructor(options: SignalRouterOptions = {}) {
    this.maxLogSize = options.maxLogSize ?? 500;
    this.onPublish = options.onPublish;
  }

  publish(topic: string, value: SignalValue, source = "core"): void {
    const message: SignalMessage = {
      topic,
      value,
      ts: Date.now(),
      source,
    };
    this.latest.set(topic, message);
    this.log.unshift(message);
    if (this.log.length > this.maxLogSize) {
      this.log.length = this.maxLogSize;
    }
    this.onPublish?.(message);

    const handlers = this.subscribers.get(topic);
    if (handlers) {
      for (const handler of handlers) {
        handler(message);
      }
    }

    // Wildcard subscribers (e.g. "weather/*")
    for (const [pattern, patternHandlers] of this.subscribers) {
      if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, -2);
        if (topic.startsWith(prefix)) {
          for (const handler of patternHandlers) {
            handler(message);
          }
        }
      }
    }
  }

  subscribe(topic: string, handler: SignalHandler): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(handler);

    const latest = this.latest.get(topic);
    if (latest) {
      handler(latest);
    }

    return () => {
      this.subscribers.get(topic)?.delete(handler);
    };
  }

  getLatest(topic: string): SignalMessage | undefined {
    return this.latest.get(topic);
  }

  getLog(limit = 100): SignalMessage[] {
    return this.log.slice(0, limit);
  }

  clearLog(): void {
    this.log = [];
  }

  reset(): void {
    this.subscribers.clear();
    this.latest.clear();
    this.log = [];
  }
}

/** Exponential moving average smoother for calm modifier. */
export function smoothValue(
  current: number,
  previous: number,
  alpha = 0.08,
): number {
  return alpha * current + (1 - alpha) * previous;
}

/** Map weather temp (°C) and rain (0–1) to brightness 0–1. */
export function weatherToBrightness(temp: number, rain: number): number {
  const tempNorm = Math.max(0, Math.min(1, (temp + 5) / 35));
  const clearBoost = 1 - rain * 0.6;
  return Math.max(0.05, Math.min(1, tempNorm * 0.7 + clearBoost * 0.3));
}
