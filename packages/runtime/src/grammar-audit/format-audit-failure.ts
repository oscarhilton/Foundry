import type { AuditResult } from "./types.js";
import { formatChainLabel } from "./format-chain-label.js";

export function formatAuditFailure(result: AuditResult): string {
  const lines = [
    "Failed chain:",
    formatChainLabel(result.chainIds),
    "",
    "Errors:",
    ...result.errors.map((e) => `- ${e}`),
  ];
  return lines.join("\n");
}

export function throwIfAuditErrors(result: AuditResult): void {
  if (result.errors.length === 0) return;
  throw new Error(formatAuditFailure(result));
}
