import {
  AUDIT_CUBE_LABELS,
  CORE_CUBE_ID,
  type AuditCubeId,
} from "./cube-ids.js";

export function formatChainLabel(
  chainIds: readonly string[],
  includeCore = true,
): string {
  const labels = chainIds.map((id) => {
    const label = AUDIT_CUBE_LABELS[id as AuditCubeId | typeof CORE_CUBE_ID];
    return label ?? id;
  });
  if (includeCore && !chainIds.includes(CORE_CUBE_ID)) {
    labels.push(AUDIT_CUBE_LABELS[CORE_CUBE_ID]);
  }
  return labels.join(" → ");
}
