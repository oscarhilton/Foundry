import type { TrayState } from "@foundry/cube-defs";
import { emptyTrayState, TRAY_SLOT_COUNT } from "@foundry/cube-defs";
import {
  shouldCancelRunningTimer,
  type RunningTimerState,
  type TimerIntentCandidate,
  type TrayCompileContext,
} from "./intent-resolver.js";
import { compileTrayState } from "./tray-compile.js";

export type TrayEvent =
  | { type: "button_pressed"; slotIndex: number; timestamp: number }
  | { type: "die_placed"; slotIndex: number; cubeId: string; activeModeId: string }
  | { type: "die_removed"; slotIndex: number }
  | { type: "die_rotated"; slotIndex: number; activeModeId: string };

export type TrayRuntimeState = {
  tray: TrayState;
  ctx: TrayCompileContext;
  timer: TimerIntentCandidate | RunningTimerState | null;
  nowMs: number;
};

function applyStructuralEvent(tray: TrayState, event: TrayEvent): TrayState {
  const next = { ...tray, slots: [...tray.slots] };

  switch (event.type) {
    case "die_placed":
      next.slots[event.slotIndex] = {
        cubeId: event.cubeId,
        slotIndex: event.slotIndex as 0 | 1 | 2 | 3 | 4,
        activeModeId: event.activeModeId,
      };
      return next;
    case "die_removed":
      next.slots[event.slotIndex] = null;
      return next;
    case "die_rotated": {
      const placed = next.slots[event.slotIndex];
      if (!placed) return next;
      next.slots[event.slotIndex] = {
        ...placed,
        activeModeId: event.activeModeId,
      };
      return next;
    }
    default:
      return next;
  }
}

export function rebuildRuntimeStateFromTray(
  tray: TrayState,
  nowMs: number,
): TrayRuntimeState {
  const { trayContext } = compileTrayState(tray);
  return {
    tray,
    ctx: trayContext,
    timer: trayContext.timerIntent,
    nowMs,
  };
}

export function createInitialRuntimeState(nowMs = Date.now()): TrayRuntimeState {
  return rebuildRuntimeStateFromTray(emptyTrayState(), nowMs);
}

export function reduceTrayEvent(
  state: TrayRuntimeState,
  event: TrayEvent,
): TrayRuntimeState {
  switch (event.type) {
    case "button_pressed": {
      const timer = state.timer;
      if (!timer || timer.state !== "armed") return state;
      if (timer.triggerSlotIndex !== event.slotIndex) return state;

      return {
        ...state,
        timer: {
          state: "running",
          startedAtMs: event.timestamp,
          durationMs: timer.durationMinutes * 60 * 1000,
          triggerSlotIndex: event.slotIndex,
          boundSlots: timer.boundSlots,
          boundSignature: timer.boundSignature,
        },
      };
    }

    case "die_placed":
    case "die_removed":
    case "die_rotated": {
      const nextTray = applyStructuralEvent(state.tray, event);

      if (state.timer?.state === "running") {
        const shouldCancel = shouldCancelRunningTimer(
          state.timer as RunningTimerState,
          nextTray,
        );

        if (!shouldCancel) {
          const { trayContext } = compileTrayState(nextTray);
          return {
            ...state,
            tray: nextTray,
            ctx: trayContext,
            timer: state.timer,
          };
        }
      }

      return rebuildRuntimeStateFromTray(nextTray, state.nowMs);
    }

    default:
      return state;
  }
}

export function isTraySlotIndex(index: number): index is 0 | 1 | 2 | 3 | 4 {
  return index >= 0 && index < TRAY_SLOT_COUNT;
}
