import type { ChainCubeInput } from "../chain-parser.js";
import { CORE_CUBE_ID, type AuditCubeId } from "./cube-ids.js";

export interface BuildChainOptions {
  /** Append Core cube (default true). */
  withCore?: boolean;
  instancePrefix?: string;
}

export function buildChain(
  chainIds: readonly string[],
  options: BuildChainOptions = {},
): ChainCubeInput[] {
  const { withCore = true, instancePrefix = "audit" } = options;
  const cubes: ChainCubeInput[] = chainIds.map((definitionId, i) => ({
    instanceId: `${instancePrefix}-${i}-${definitionId.replace(/\//g, "-")}`,
    definitionId,
  }));
  if (withCore && !chainIds.includes(CORE_CUBE_ID)) {
    cubes.push({
      instanceId: `${instancePrefix}-core`,
      definitionId: CORE_CUBE_ID,
    });
  }
  return cubes;
}

export function buildChainFromAuditIds(
  chainIds: readonly AuditCubeId[],
  options?: BuildChainOptions,
): ChainCubeInput[] {
  return buildChain(chainIds, options);
}

/** Explicit instance ids for duplicate-cube golden chains. */
export function buildExplicitChain(
  slots: readonly { instanceId: string; definitionId: string }[],
  options: BuildChainOptions = {},
): ChainCubeInput[] {
  const { withCore = true } = options;
  const cubes = slots.map((s) => ({ ...s }));
  if (withCore && !cubes.some((c) => c.definitionId === CORE_CUBE_ID)) {
    cubes.push({ instanceId: "core", definitionId: CORE_CUBE_ID });
  }
  return cubes;
}
