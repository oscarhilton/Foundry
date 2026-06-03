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

let shareToastTimer: ReturnType<typeof setTimeout> | undefined;

function syncRecipeTiming(
  get: () => SimulatorState,
  set: (partial: Partial<SimulatorState>) => void,
  recipeName: string | null,
) {
  const prev = get().recipeActiveSince;
  const hadRecipe = prev !== null;
  const hasRecipe = recipeName !== null;
  if (hasRecipe && !hadRecipe) {
    set({ recipeActiveSince: Date.now() });
  } else if (!hasRecipe && hadRecipe) {
    set({ recipeActiveSince: null });
  }
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
  syncRecipeTiming(get, set, state.activeRecipeName);
  if (state.activeRecipeName && get().onboarding.flowHintActive) {
    set({ onboarding: { ...get().onboarding, flowHintActive: false } });
  }
}

export interface OnboardingState {
  flowHintActive: boolean;
  hasUsedDial: boolean;
}

export interface SimulatorState {
  chain: ChainCube[];
  signalLog: SignalMessage[];
  outputState: FoundryOutputState;
  activeRecipeName: string | null;
  warnings: string[];
  productMode: boolean;
  showAdvanced: boolean;
  showCoreDebug: boolean;
  showAllPresets: boolean;
  showExtendedCubes: boolean;
  showValidationPanel: boolean;
  coreDebugSnapshot: CoreDebugSnapshot | null;
  useLiveWeather: boolean;
  selectedPresetId: string | null;
  layoutVersion: number;
  audioUnlocked: boolean;
  soundEnabled: boolean;
  shareToast: string | null;
  onboarding: OnboardingState;
  recipeActiveSince: number | null;

  init: () => void;
  loadPreset: (presetId: string) => void;
  addCubeToChain: (definitionId: string, index?: number) => void;
  removeCube: (instanceId: string) => void;
  reorderChain: (fromIndex: number, toIndex: number) => void;
  setDialPosition: (value: number) => void;
  setSliderPosition: (value: number) => void;
  setPowerSource: (source: "usb" | "battery") => void;
  setBatteryPercent: (percent: number) => void;
  togglePowerSource: () => void;
  triggerMotion: () => void;
  triggerButton: () => void;
  toggleProductMode: () => void;
  toggleAdvanced: () => void;
  toggleCoreDebug: () => void;
  openCoreDebug: () => void;
  closeCoreDebug: () => void;
  toggleLiveWeather: () => void;
  toggleAllPresets: () => void;
  toggleExtendedCubes: () => void;
  toggleValidationPanel: () => void;
  dismissFlowHint: () => void;
  exportChain: () => string;
  importChain: (json: string) => void;
  tick: () => void;
  setAudioUnlocked: (unlocked: boolean) => void;
  toggleSound: () => void;
  showShareToast: (message: string) => void;
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
  placeId: null,
  placeTimezone: null,
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
  lcdTexts: {},
  sensorTemp: null,
  timeHour: null,
  powerSource: "usb",
  batteryPercent: 100,
});

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  chain: [],
  signalLog: [],
  outputState: defaultOutputState(),
  activeRecipeName: null,
  warnings: [],
  productMode: typeof window !== "undefined"
    ? !new URLSearchParams(window.location.search).has("builder")
    : true,
  showAdvanced: false,
  showCoreDebug: false,
  showAllPresets: false,
  showExtendedCubes: false,
  showValidationPanel: false,
  coreDebugSnapshot: null,
  useLiveWeather: false,
  selectedPresetId: null,
  layoutVersion: 0,
  audioUnlocked: false,
  soundEnabled: true,
  shareToast: null,
  onboarding: { flowHintActive: false, hasUsedDial: false },
  recipeActiveSince: null,

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
    const wasEmpty = get().chain.length === 0;
    const cube = { instanceId: nextId(), definitionId };
    const chain = [...get().chain];
    const insertAt = index ?? chain.length;
    chain.splice(insertAt, 0, cube);
    set({
      chain,
      selectedPresetId: null,
      layoutVersion: get().layoutVersion + 1,
      onboarding: wasEmpty
        ? { ...get().onboarding, flowHintActive: true }
        : get().onboarding,
    });
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
    const prev = get().outputState.dialPosition;
    getEngine().setDialPosition(value);
    const eng = getEngine();
    const onboarding = get().onboarding;
    set({
      outputState: eng.getOutputState(),
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
      onboarding:
        !onboarding.hasUsedDial && Math.abs(value - prev) > 0.02
          ? { ...onboarding, hasUsedDial: true }
          : onboarding,
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

  setPowerSource: (source) => {
    getEngine().setPowerSource(source);
    const eng = getEngine();
    set({
      outputState: eng.getOutputState(),
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
    });
  },

  setBatteryPercent: (percent) => {
    getEngine().setBatteryPercent(percent);
    const eng = getEngine();
    set({
      outputState: eng.getOutputState(),
      coreDebugSnapshot: eng.getCoreDebugSnapshot(),
    });
  },

  togglePowerSource: () => {
    const current = get().outputState.powerSource;
    get().setPowerSource(current === "usb" ? "battery" : "usb");
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

  toggleProductMode: () => {
    const next = !get().productMode;
    set({
      productMode: next,
      showAdvanced: next ? false : get().showAdvanced,
      showCoreDebug: next ? false : get().showCoreDebug,
      showValidationPanel: next ? false : get().showValidationPanel,
    });
  },

  toggleAdvanced: () => set({ showAdvanced: !get().showAdvanced }),

  toggleAllPresets: () => set({ showAllPresets: !get().showAllPresets }),

  toggleExtendedCubes: () => set({ showExtendedCubes: !get().showExtendedCubes }),

  toggleValidationPanel: () =>
    set({ showValidationPanel: !get().showValidationPanel }),

  dismissFlowHint: () =>
    set({ onboarding: { ...get().onboarding, flowHintActive: false } }),

  showShareToast: (message) => {
    if (shareToastTimer) clearTimeout(shareToastTimer);
    set({ shareToast: message });
    shareToastTimer = setTimeout(() => set({ shareToast: null }), 3000);
  },

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

export { PRESET_CHAINS, STARTER_CUBE_IDS, HERO_PRESET_IDS, getCubesByCategory } from "@foundry/cube-defs";
