#!/usr/bin/env tsx
/**
 * Grammar Audit — verbose Core Debug-style output for human inspection.
 * Not run in CI. Use: npm run audit:grammar [-- --golden-only]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUDIT_CUBES,
  DUPLICATE_CUBE_CHAINS,
  formatChainLabel,
  GOLDEN_CHAINS,
  permutations,
  runChainAudit,
  type VerboseAuditResult,
} from "../src/grammar-audit/index.js";
import type { SignalMessage } from "../src/signal-router.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../audit-output");

const goldenOnly = process.argv.includes("--golden-only");

function chainsToAudit(): readonly (readonly string[])[] {
  if (goldenOnly) {
    return [
      ...GOLDEN_CHAINS.map((c) => c.chainIds),
      ...DUPLICATE_CUBE_CHAINS.map((c) => c.chainIds),
    ];
  }

  const all: string[][] = [];
  for (let length = 1; length <= 5; length++) {
    for (const chain of permutations(AUDIT_CUBES, length)) {
      all.push([...chain]);
    }
  }
  return all;
}

function normalizeLcdValue(value: string): string {
  return value.replace(/\n/g, " / ");
}

function settleLcdTopics(
  topics: SignalMessage[],
  finalByTarget: Map<string, string>,
): SignalMessage[] {
  const lcdTopics = topics.filter((t) => t.topic === "output/lcd/text");
  return lcdTopics.filter((t) => {
    const target = t.targetId ?? "?";
    const value = String(t.value);
    const final = finalByTarget.get(target);
    return final == null || normalizeLcdValue(value) !== normalizeLcdValue(final);
  });
}

function formatMarkdown(entry: VerboseAuditResult): string {
  const label = formatChainLabel(entry.chainIds);
  const lines: string[] = [`## ${label}`, ""];

  if (entry.errors.length > 0) {
    lines.push("**Errors:**");
    for (const e of entry.errors) {
      lines.push(`- ${e}`);
    }
    lines.push("");
  }

  const state = entry.state;
  lines.push(`Recipe: ${state.activeRecipeName ?? state.activeRecipeId ?? "—"}`);
  lines.push(`Powered: ${state.powered}`);
  lines.push("");

  if (entry.debug.weatherFace) {
    const wf = entry.debug.weatherFace;
    lines.push("Weather face:");
    if (wf.face.placeLabel) lines.push(wf.face.placeLabel);
    lines.push(wf.face.headline);
    if (wf.face.detail) lines.push(wf.face.detail);
    lines.push(`Mode: ${wf.runtime.modeLabel}`);
    lines.push(`Source rain: ${wf.runtime.sourceRainPercent}%`);
    if (wf.runtime.displayedRainPercent != null) {
      lines.push(`Displayed rain: ${wf.runtime.displayedRainPercent}%`);
    }
    if (wf.runtime.gate) {
      lines.push(`Gate: ${wf.runtime.gate}`);
    }
    lines.push("");
  }

  const lcdValues = Object.entries(state.lcdTexts);
  if (lcdValues.length > 0) {
    lines.push("Final LCD:");
    for (const [id, text] of lcdValues) {
      lines.push(`${id}: ${normalizeLcdValue(text)}`);
    }
    lines.push("");
  }

  const finalByTarget = new Map(
    Object.entries(state.lcdTexts).map(([id, text]) => [id, text]),
  );
  const settleTopics = settleLcdTopics(entry.topics, finalByTarget);
  if (settleTopics.length > 0) {
    lines.push("Events during settle:");
    for (const t of settleTopics.slice(-8)) {
      lines.push(
        `- ${t.targetId ?? "?"}: ${normalizeLcdValue(String(t.value))}`,
      );
    }
    lines.push("");
  }

  const trace = entry.debug.viewportTrace;
  if (trace.length > 0) {
    const last = trace[trace.length - 1]!;
    lines.push("Final viewport:");
    lines.push(`- ${last.label}: ${last.rendered.replace(/\n/g, " / ")}`);
    lines.push("");

    if (trace.length > 1) {
      lines.push("Viewport steps during settle:");
      for (const step of trace.slice(0, -1)) {
        lines.push(`- ${step.label}: ${step.rendered.replace(/\n/g, " / ")}`);
      }
      lines.push("");
    }
  }

  if (entry.debug.discovered.length > 0) {
    lines.push("Discovery:");
    for (const d of entry.debug.discovered) {
      lines.push(`- ${d.label} (${d.address}, mock)`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main(): void {
  const chains = chainsToAudit();
  const results: VerboseAuditResult[] = [];
  let errors = 0;

  console.log(
    `Grammar audit: ${chains.length} chains (${goldenOnly ? "golden only" : "full matrix"})`,
  );

  for (const chainIds of chains) {
    const result = runChainAudit(chainIds, { verbose: true });
    if ("debug" in result) {
      results.push(result);
      if (result.errors.length > 0) errors++;
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const md = [
    "# Foundry Grammar Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Chains: ${results.length}`,
    `Errors: ${errors}`,
    "",
    ...results.map(formatMarkdown),
  ].join("\n");

  writeFileSync(join(OUT_DIR, "grammar-audit.md"), md);
  writeFileSync(
    join(OUT_DIR, "grammar-audit.json"),
    JSON.stringify(results, null, 2),
  );

  console.log(`Wrote ${OUT_DIR}/grammar-audit.md`);
  console.log(`Wrote ${OUT_DIR}/grammar-audit.json`);
  if (errors > 0) {
    console.error(`${errors} chains had invariant errors`);
    process.exit(1);
  }
}

main();
