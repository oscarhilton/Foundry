import { useEffect, useRef, useState } from "react";
import { FoundryEngine, type FoundryOutputState } from "@foundry/runtime";
import { PRESET_CHAINS } from "@foundry/cube-defs";
import type { ShowcasePresetId } from "./showcase-cards";

export interface ShowcaseChainCube {
  instanceId: string;
  definitionId: string;
}

function buildChain(presetId: ShowcasePresetId): ShowcaseChainCube[] {
  const preset = PRESET_CHAINS.find((p) => p.id === presetId);
  if (!preset) return [];
  return preset.cubes.map((definitionId, i) => ({
    instanceId: `showcase-${presetId}-${i}`,
    definitionId,
  }));
}

export function useShowcaseEngine(presetId: ShowcasePresetId) {
  const [outputState, setOutputState] = useState<FoundryOutputState | null>(null);
  const [chain, setChain] = useState<ShowcaseChainCube[]>([]);
  const engineRef = useRef<FoundryEngine | null>(null);

  useEffect(() => {
    const cubes = buildChain(presetId);
    setChain(cubes);

    const engine = new FoundryEngine({ dialDefault: 0.65 });
    engineRef.current = engine;
    engine.setChain(cubes);
    engine.start();
    engine.mockAdapters.setWeather({ temp: 14, rain: 0.45 });

    if (presetId === "presence-weather-lcd") {
      engine.mockAdapters.triggerMotion(true);
    }

    setOutputState(engine.getOutputState());

    const tick = () => setOutputState(engine.getOutputState());
    const interval = setInterval(tick, 400);

    return () => {
      clearInterval(interval);
      engine.destroy();
      engineRef.current = null;
    };
  }, [presetId]);

  return { chain, outputState };
}
