import type { TrayState, WordDie, TrayWordRole } from "@foundry/cube-defs";
import {
  emptyTrayState,
  getWordDie,
  rotateModeId,
  defaultModeId,
  STARTER_CUBES,
} from "@foundry/cube-defs";
import type { TrayTranslation } from "@foundry/runtime";
import { FoundryEngine } from "@foundry/runtime";
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

function initialTray(): TrayState {
  return emptyTrayState();
}

const searchParams = new URLSearchParams(window.location.search);

export const useTrayLabStore = create<TrayLabState>((set, get) => ({
  tray: initialTray(),
  scenarioId: "morning-leaving",
  trayTranslation: emptyTranslation(),
  silentMode: searchParams.has("silent"),
  observerMode: searchParams.has("observer"),
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
    const tray = initialTray();
    resetSessionJournal();
    set({ tray, trayTranslation: commitTray(tray) });
  },
}));

export function getDieFromPool(cubeId: string): WordDie | undefined {
  return getWordDie(cubeId) ?? STARTER_CUBES.find((d) => d.id === cubeId);
}

export function initTrayLab(): void {
  resetSessionJournal();
  const tray = initialTray();
  useTrayLabStore.setState({ trayTranslation: commitTray(tray) });
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
