import type { ChainCubeInput } from "../chain-parser.js";

export interface AuditResult {
  chainIds: readonly string[];
  chainInput: ChainCubeInput[];
  errors: string[];
}

export interface RunChainAuditOptions {
  /** Dial position after seeding (default 1). */
  dialPosition?: number;
  /** Include Core cube (default true). */
  withCore?: boolean;
  /** Capture verbose Core Debug output (audit script only). */
  verbose?: boolean;
  weather?: { temp: number; rain: number };
}

export interface VerboseAuditResult extends AuditResult {
  state: import("../index.js").FoundryOutputState;
  debug: import("../index.js").CoreDebugSnapshot;
  topics: import("../signal-router.js").SignalMessage[];
}

export const DEFAULT_AUDIT_WEATHER = { temp: 17.04, rain: 0.206 } as const;
