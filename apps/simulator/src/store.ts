import { create } from "zustand";
import {
  PRESET_CHAINS,
  getCubeDefinition,
  type CubeDefinition,
} from "@foundry/cube-defs";
import {
  FoundryEngine,
  type SignalMessage,
  type FoundryOutputState,
  type CoreDebugSnapshot,
} from "@foundry/runtime";
import { simulationAudio } from "./audio/simulation-audio";

export interface ChainCube {
  instanceId: string;
  definitionId: string;
}

let idCounter = 0;
function nextId(): string {
  return `inst-${++idCounter}`;
}

let engine: FoundryEngine | null = null;

function getEngine(): FoundryEngine {
  if (!engine) {
    engine = new FoundryEngine({ dialDefault: 0.65 });
    engine.start();
  }
  return engine;
}

function syncEngine(get: () => SimulatorState, set: (partial: Partial<SimulatorState>) => void) {
  const e = getEngine();
  e.setChain(get().chain.map((c) => ({
    instanceId: c.instanceId,
    definitionId: c.definitionId,
  })));
  e.setLiveWeather(get().useLiveWeather);
  const state = e.getOutputState();
  set({
    outputState: state,
    activeRecipeName: state.activeRecipeName,
    warnings: state.warnings,
    coreDebugSnapshot: e.getCoreDebugSnapshot(),
  });
}

export interface SimulatorState {
  chain: ChainCube[];
  signalLog: SignalMessage[];
  outputState: FoundryOutputState;
  activeRecipeName: string | null;
  warnings: string[];
  showAdvanced: boolean;
  showCoreDebug: boolean;
  coreDebugSnapshot: CoreDebugSnapshot | null;
  useLiveWeather: boolean;
  selectedPresetId: string | null;
  layoutVersion: number;
  audioUnlocked: boolean;
  soundEnabled: boolean;

  init: () => void;
  loadPreset: (presetId: string) => void;
  addCubeToChain: (definitionId: string, index?: number) => void;
  removeCube: (instanceId: string) => void;
  reorderChain: (fromIndex: number, toIndex: number) => void;
  setDialPosition: (value: number) => void;
  setSliderPosition: (value: number) => void;
  triggerMotion: () => void;
  triggerButton: () => void;
  toggleAdvanced: () => void;
  toggleCoreDebug: () => void;
  openCoreDebug: () => void;
  closeCoreDebug: () => void;
  toggleLiveWeather: () => void;
  exportChain: () => string;
  importChain: (json: string) => void;
  tick: () => void;
  setAudioUnlocked: (unlocked: boolean) => void;
  toggleSound: () => void;
}

const defaultOutputState = (): FoundryOutputState => ({
  powered: false,
  coreCount: 0,
  lightBrightness: 0.02,
  chimeTriggered: false,
  chimeCount: 0,
  activeRecipeId: null,
  activeRecipeName: null,
  warnings: [],
  placeLabel: null,
  weatherTemp: null,
  weatherRain: null,
  dialPosition: 0.65,
  sliderPosition: 0.5,
  motionDetected: false,
  buttonPressed: false,
  githubActivity: null,
  musicNote: null,
  musicVelocity: null,
  displayText: null,
  lcdText: null,
  sensorTemp: null,
  timeHour: null,
});

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  chain: [],
  signalLog: [],
  outputState: defaultOutputState(),
  activeRecipeName: null,
  warnings: [],
  showAdvanced: false,
  showCoreDebug: false,
  coreDebugSnapshot: null,
  useLiveWeather: false,
  selectedPresetId: null,
  layoutVersion: 0,
  audioUnlocked: false,
  soundEnabled: true,

  init: () => {
    const e = getEngine();
    e.router.reset();
    e.destroy();
    engine = new FoundryEngine({
      dialDefault: 0.65,
      onSignal: (msg) => {
        const eng = getEngine();
        set((s) => ({
          signalLog: [msg, ...s.signalLog].slice(0, 200),
          outputState: eng.getOutputState(),
          coreDebugSnapshot: eng.getCoreDebugSnapshot(),
        }));
      },
    });
    engine.start();

    const defaultPreset = PRESET_CHAINS.find((p) => p.id === "weather-dial-light");
    if (defaultPreset) {
      get().loadPreset(defaultPreset.id);
    }

    const params = new URLSearchParams(window.location.search);
    const chainParam = params.get("chain");
    if (chainParam) {
      try {
        const json = decodeURIComponent(escape(atob(chainParam)));
        get().importChain(json);
      } catch {
        // ignore invalid share URL
      }
    }
  },

  loadPreset: (presetId) => {
    const preset = PRESET_CHAINS.find((p) => p.id === presetId);
    if (!preset) return;

    const chain = preset.cubes.map((definitionId) => ({
      instanceId: nextId(),
      definitionId,
    }));

    set({
      chain,
      selectedPresetId: presetId,
      signalLog: [],
      layoutVersion: get().layoutVersion + 1,
    });
    syncEngine(get, set);
  },

  addCubeToChain: (definitionId, index) => {
    const cube = { instanceId: nextId(), definitionId };
    const chain = [...get().chain];
    const insertAt = index ?? chain.length;
    chain.splice(insertAt, 0, cube);
    set({ chain, selectedPresetId: null, layoutVersion: get().layoutVersion + 1 });
    syncEngine(get, set);
  },

  removeCube: (instanceId) => {
    set({
      chain: get().chain.filter((c) => c.instanceId !== instanceId),
      selectedPresetId: null,
    });
    syncEngine(get, set);
  },

  reorderChain: (fromIndex, toIndex) => {
    const chain = [...get().chain];
    const [moved] = chain.splice(fromIndex, 1);
    chain.splice(toIndex, 0, moved);
    set({ chain, selectedPresetId: null });
    syncEngine(get, set);
  },

  setDialPosition: (value) => {
    getEngine().setDialPosition(value);
    const eng = getEngine();
    set({
      outputState: eng.getOutputState(),
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
    });
  },

  setSliderPosition: (value) => {
    getEngine().setSliderPosition(value);
    const eng = getEngine();
    set({
      outputState: eng.getOutputState(),
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
    });
  },

  triggerMotion: () => {
    getEngine().triggerMotion();
    const eng = getEngine();
    set({
      outputState: eng.getOutputState(),
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
    });
  },

  triggerButton: () => {
    getEngine().triggerButton();
    const eng = getEngine();
    set({
      outputState: eng.getOutputState(),
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
    });
  },

  toggleAdvanced: () => set({ showAdvanced: !get().showAdvanced }),

  toggleCoreDebug: () => set({ showCoreDebug: !get().showCoreDebug }),

  openCoreDebug: () => {
    const eng = getEngine();
    set({
      showCoreDebug: true,
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
    });
  },

  closeCoreDebug: () => set({ showCoreDebug: false }),

  toggleLiveWeather: () => {
    const useLiveWeather = !get().useLiveWeather;
    set({ useLiveWeather });
    getEngine().setLiveWeather(useLiveWeather);
    if (!useLiveWeather) {
      getEngine().mockAdapters.start();
    }
    syncEngine(get, set);
  },

  exportChain: () => {
    return JSON.stringify(
      {
        version: 1,
        chain: get().chain,
        dialPosition: get().outputState.dialPosition,
        sliderPosition: get().outputState.sliderPosition,
      },
      null,
      2,
    );
  },

  importChain: (json) => {
    try {
      const data = JSON.parse(json) as {
        chain: ChainCube[];
        dialPosition?: number;
        sliderPosition?: number;
      };
      set({
        chain: data.chain,
        selectedPresetId: null,
        layoutVersion: get().layoutVersion + 1,
      });
      syncEngine(get, set);
      if (data.dialPosition !== undefined) {
        get().setDialPosition(data.dialPosition);
      }
      if (data.sliderPosition !== undefined) {
        get().setSliderPosition(data.sliderPosition);
      }
    } catch {
      // ignore invalid JSON
    }
  },

  tick: () => {
    const eng = getEngine();
    set({
      outputState: eng.getOutputState(),
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
    });
  },

  setAudioUnlocked: (unlocked) => set({ audioUnlocked: unlocked }),

  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    simulationAudio.setMuted(!next);
  },
}));

export function getDefinition(definitionId: string): CubeDefinition | undefined {
  return getCubeDefinition(definitionId);
}

export { PRESET_CHAINS, getCubesByCategory } from "@foundry/cube-defs";
