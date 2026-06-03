import {
  getCubeDefinition,
  type CubeDefinition,
} from "@foundry/cube-defs";

export interface ParsedChainSlot {
  instanceId: string;
  definition: CubeDefinition;
}

export interface ParsedChain {
  cubes: ParsedChainSlot[];
  places: ParsedChainSlot[];
  place?: ParsedChainSlot;
  sources: ParsedChainSlot[];
  modifiers: ParsedChainSlot[];
  controls: ParsedChainSlot[];
  sensors: ParsedChainSlot[];
  outputs: ParsedChainSlot[];
  hasCore: boolean;
  coreCount: number;
  powered: boolean;
  warnings: string[];
}

export interface ChainCubeInput {
  instanceId: string;
  definitionId: string;
}

export function parseChain(cubes: ChainCubeInput[]): ParsedChain {
  const warnings: string[] = [];
  const parsed: ParsedChainSlot[] = [];

  for (const cube of cubes) {
    const definition = getCubeDefinition(cube.definitionId);
    if (!definition) {
      warnings.push(`Unknown cube: ${cube.definitionId}`);
      continue;
    }
    parsed.push({ instanceId: cube.instanceId, definition });
  }

  const places = parsed.filter((c) => c.definition.role === "place");
  const place = places[0];
  const sources = parsed.filter((c) => c.definition.role === "source");
  const modifiers = parsed.filter((c) => c.definition.role === "modifier");
  const controls = parsed.filter((c) => c.definition.role === "control");
  const sensors = parsed.filter((c) => c.definition.role === "sensor");
  const outputs = parsed.filter((c) => c.definition.role === "output");
  const coreCount = parsed.filter((c) => c.definition.role === "core").length;
  const hasCore = coreCount > 0;

  if (coreCount === 0) {
    warnings.push("Chain unpowered — add Core cube");
  } else if (coreCount > 1) {
    warnings.push("Multiple Core cubes detected — chain unpowered");
  }

  if (outputs.length > 1) {
    warnings.push("Multiple outputs detected; only the last output is active");
  }
  if (controls.length > 1 && outputs.length > 0) {
    warnings.push(
      "Multiple controls: nearest control to output binds first",
    );
  }

  const chain: ParsedChain = {
    cubes: parsed,
    places,
    place,
    sources,
    modifiers,
    controls,
    sensors,
    outputs,
    hasCore,
    coreCount,
    powered: false,
    warnings,
  };
  chain.powered = isChainPowered(chain);
  return chain;
}

export function countCore(chain: ParsedChain): number {
  return chain.cubes.filter((c) => c.definition.role === "core").length;
}

export function isChainPowered(chain: ParsedChain): boolean {
  return countCore(chain) === 1 && chain.cubes.length >= 2;
}

export function chainHasPattern(
  chain: ParsedChain,
  roles: Array<CubeDefinition["role"] | "*">,
): boolean {
  const chainRoles = chain.cubes
    .filter((c) => c.definition.role !== "core")
    .map((c) => c.definition.role);

  let ci = 0;
  for (const role of roles) {
    if (role === "*") {
      if (ci >= chainRoles.length) return false;
      ci++;
      continue;
    }
    const idx = chainRoles.indexOf(role, ci);
    if (idx === -1) return false;
    ci = idx + 1;
  }
  return true;
}

export function getNearestControl(
  chain: ParsedChain,
): ParsedChainSlot | undefined {
  if (chain.controls.length === 0) return undefined;
  if (chain.outputs.length === 0) {
    return chain.controls[chain.controls.length - 1];
  }

  const outputIdx = chain.cubes.findIndex(
    (c) => c.instanceId === chain.outputs[chain.outputs.length - 1].instanceId,
  );

  let nearest: ParsedChainSlot | undefined;
  let nearestDist = Infinity;

  for (const control of chain.controls) {
    const controlIdx = chain.cubes.findIndex(
      (c) => c.instanceId === control.instanceId,
    );
    if (controlIdx < outputIdx) {
      const dist = outputIdx - controlIdx;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = control;
      }
    }
  }

  return nearest ?? chain.controls[chain.controls.length - 1];
}

export function getActiveOutput(
  chain: ParsedChain,
): ParsedChainSlot | undefined {
  return chain.outputs[chain.outputs.length - 1];
}

export function hasWeatherSource(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "identity/weather");
}

export function hasMotionSensor(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "sensor/motion");
}

export function hasChimeOutput(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "output/chime");
}

export function hasLightOutput(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "output/light");
}

export function hasCalmModifier(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "modifier/calm");
}

export function hasRandomModifier(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "modifier/random");
}

export function hasMusicOutput(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "output/music");
}

export function hasDisplayOutput(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "output/display");
}

export function hasLcdOutput(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "output/lcd");
}

export function hasLcdSignalModules(chain: ParsedChain): boolean {
  return chain.cubes.some(
    (c) => c.definition.role !== "core" && c.definition.id !== "output/lcd",
  );
}

export function hasButtonControl(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "control/button");
}

export function hasTemperatureSensor(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "sensor/temperature");
}

export function hasTimeSource(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "source/time");
}

export function hasTokyoPlace(chain: ParsedChain): boolean {
  return chain.cubes.some((c) => c.definition.id === "identity/tokyo");
}
