import type { TrayState, WordDie, TrayWordRole } from "@foundry/cube-defs";
import {
  emptyTrayState,
  getWordDie,
  rotateModeId,
  defaultModeId,
  orderedStarterPool,
} from "@foundry/cube-defs";
import type { TrayTranslation } from "@foundry/runtime";
import { createTrayFromPlacements, FoundryEngine } from "@foundry/runtime";
import { create } from "zustand";
import {
  exportSessionJson,
  getElapsedMs,
  getSessionEvents,
  getSessionMilestones,
  recordDiePlaced,
  recordDieRemoved,
  recordDieRotated,
  recordTrayResolved,
  resetSessionJournal,
  type TrayMilestoneId,
  type TraySessionEvent,
} from "./observability/session-journal";
import { morningLeavingScenario } from "./scenarios/morning-leaving";

export type ScenarioId = "morning-leaving";

interface TrayLabState {
  tray: TrayState;
  scenarioId: ScenarioId;
  trayTranslation: TrayTranslation;
  silentMode: boolean;
  showcaseMode: boolean;
  observerMode: boolean;
  poolDice: WordDie[];
  placeDie: (slotIndex: number, cubeId: string) => void;
  removeDie: (slotIndex: number) => void;
  rotateDie: (slotIndex: number) => void;
  resetScenario: () => void;
}

let engine: FoundryEngine | null = null;

function getEngine(): FoundryEngine {
  if (!engine) {
    engine = new FoundryEngine({
      initialWeather: { temp: 12, rain: 0.22 },
    });
    engine.start();
  }
  return engine;
}

function resetEngine(): void {
  engine = null;
}

function emptyTranslation(): TrayTranslation {
  return {
    slots: Array.from({ length: 5 }, () => ({ kind: "empty" as const })),
    localTranslations: Array.from({ length: 5 }, () => null),
    finalOutput: null,
    finalOutputTone: "invalid",
  };
}

function commitTray(tray: TrayState): TrayTranslation {
  const eng = getEngine();
  eng.setTrayState(tray);
  const trayTranslation = eng.getTrayTranslation();
  recordTrayResolved(tray, trayTranslation);
  return trayTranslation;
}

function buildInitialTray(showcaseMode: boolean): TrayState {
  if (showcaseMode) {
    return createTrayFromPlacements([...morningLeavingScenario.canonicalSlots]);
  }
  return emptyTrayState();
}

function readSilentFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("silent");
}

function readShowcaseFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("showcase");
}

function readObserverFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("observer");
}

export const useTrayLabStore = create<TrayLabState>((set, get) => ({
  tray: emptyTrayState(),
  scenarioId: "morning-leaving",
  trayTranslation: emptyTranslation(),
  silentMode: readSilentFromUrl(),
  showcaseMode: readShowcaseFromUrl(),
  observerMode: readObserverFromUrl(),
  poolDice: morningLeavingScenario.dicePool,

  placeDie: (slotIndex, cubeId) => {
    const modeId = defaultModeId(cubeId);
    const tray = { ...get().tray, slots: [...get().tray.slots] };
    tray.slots[slotIndex] = {
      cubeId,
      slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
      activeModeId: modeId,
    };
    recordDiePlaced(slotIndex, cubeId, modeId);
    set({ tray, trayTranslation: commitTray(tray) });
  },

  removeDie: (slotIndex) => {
    const tray = { ...get().tray, slots: [...get().tray.slots] };
    tray.slots[slotIndex] = null;
    recordDieRemoved(slotIndex);
    set({ tray, trayTranslation: commitTray(tray) });
  },

  rotateDie: (slotIndex) => {
    const placed = get().tray.slots[slotIndex];
    if (!placed) return;
    const nextMode = rotateModeId(placed.cubeId, placed.activeModeId);
    const tray = { ...get().tray, slots: [...get().tray.slots] };
    tray.slots[slotIndex] = { ...placed, activeModeId: nextMode };
    recordDieRotated(slotIndex, placed.activeModeId, nextMode, placed.cubeId);
    set({ tray, trayTranslation: commitTray(tray) });
  },

  resetScenario: () => {
    const tray = buildInitialTray(get().showcaseMode);
    resetSessionJournal();
    set({ tray, trayTranslation: commitTray(tray) });
  },
}));

export function getDieFromPool(cubeId: string): WordDie | undefined {
  return getWordDie(cubeId) ?? orderedStarterPool().find((d) => d.id === cubeId);
}

export type InitTrayLabOptions = {
  silentMode?: boolean;
  showcaseMode?: boolean;
};

export function initTrayLab(options: InitTrayLabOptions = {}): TrayLabState {
  resetEngine();
  resetSessionJournal();

  const silentMode = options.silentMode ?? readSilentFromUrl();
  const showcaseMode = options.showcaseMode ?? readShowcaseFromUrl();
  const tray = buildInitialTray(showcaseMode);
  const trayTranslation = commitTray(tray);

  useTrayLabStore.setState({
    silentMode,
    showcaseMode,
    observerMode:
      options.silentMode !== undefined ? false : readObserverFromUrl(),
    poolDice: morningLeavingScenario.dicePool,
    tray,
    trayTranslation,
  });

  return useTrayLabStore.getState();
}

export {
  exportSessionJson,
  getElapsedMs,
  getSessionEvents,
  getSessionMilestones,
  type TrayMilestoneId,
  type TraySessionEvent,
};

export function roleDisplayLabel(role: TrayWordRole): string {
  switch (role) {
    case "lens":
      return "Decision";
    case "moment":
      return "Moment";
    case "place":
      return "Place";
    case "source":
      return "Source";
    case "control":
      return "Control";
    default:
      return role;
  }
}

export { buildInitialTray, emptyTrayState, readShowcaseFromUrl };
