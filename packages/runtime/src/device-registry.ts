import type { ParsedChain } from "./chain-parser.js";

export interface DiscoveredDevice {
  instanceId: string;
  cubeId: string;
  label: string;
  role: string;
  chainIndex: number;
  address?: string;
}

const I2C_DEBUG_BASE = 0x52;

/** Simulator mock I²C address — unique per chain position when index is known. */
export function debugAddressFor(instanceId: string, chainIndex?: number): string {
  if (chainIndex != null) {
    return `0x${(I2C_DEBUG_BASE + chainIndex).toString(16).toUpperCase()}`;
  }
  let hash = 0;
  for (let i = 0; i < instanceId.length; i++) {
    hash = (hash * 31 + instanceId.charCodeAt(i)) >>> 0;
  }
  const offset = hash % 0x2d;
  return `0x${(I2C_DEBUG_BASE + offset).toString(16).toUpperCase()}`;
}

export function buildDeviceRegistry(chain: ParsedChain): Map<string, DiscoveredDevice> {
  const registry = new Map<string, DiscoveredDevice>();

  for (let index = 0; index < chain.cubes.length; index++) {
    const slot = chain.cubes[index]!;
    registry.set(slot.instanceId, {
      instanceId: slot.instanceId,
      cubeId: slot.definition.id,
      label: slot.definition.label,
      role: slot.definition.role,
      chainIndex: index,
      address: debugAddressFor(slot.instanceId, index),
    });
  }

  return registry;
}

export function registryToDiscoveredList(
  registry: Map<string, DiscoveredDevice>,
): DiscoveredDevice[] {
  return [...registry.values()].sort((a, b) => a.chainIndex - b.chainIndex);
}
