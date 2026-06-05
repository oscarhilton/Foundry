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
    lines.push(
      `Runtime: ${wf.runtime.modeLabel}, rain ${wf.runtime.currentRainPercent}%` +
        (wf.runtime.gate ? `, gate ${wf.runtime.gate}` : ""),
    );
    lines.push("");
  }

  const lcdValues = Object.entries(state.lcdTexts);
  if (lcdValues.length > 0) {
    lines.push("LCD:");
    for (const [, text] of lcdValues) {
      for (const line of text.split("\n")) {
        lines.push(line);
      }
    }
    lines.push("");
  }

  if (entry.debug.viewportTrace.length > 0) {
    lines.push("Viewport trace:");
    for (const step of entry.debug.viewportTrace) {
      lines.push(`- ${step.label}: ${step.rendered.replace(/\n/g, " / ")}`);
    }
    lines.push("");
  }

  if (entry.debug.discovered.length > 0) {
    lines.push("Discovery:");
    for (const d of entry.debug.discovered) {
      lines.push(`- ${d.label} (${d.address})`);
    }
    lines.push("");
  }

  const lcdTopics = entry.topics.filter((t) => t.topic === "output/lcd/text");
  if (lcdTopics.length > 0) {
    lines.push("Topic stream (LCD):");
    for (const t of lcdTopics.slice(-5)) {
      lines.push(`- ${t.targetId ?? "?"}: ${String(t.value).replace(/\n/g, " / ")}`);
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
