import { describe, it, expect } from "vitest";
import {
  reduceTrayEvent,
  rebuildRuntimeStateFromTray,
} from "./event-reducer.js";
import { createTrayFromPlacements, resolveTrayTranslation } from "./tray-compile.js";
import { buildTrayWeatherFact } from "./tray-compile.js";

const NOW = 1_717_632_000_000;

function armedTimerState() {
  const tray = createTrayFromPlacements([
    { slotIndex: 0, cubeId: "button", activeModeId: "button" },
    { slotIndex: 1, cubeId: "timer", activeModeId: "15_min" },
  ]);
  const state = rebuildRuntimeStateFromTray(tray, NOW);
  expect(state.timer?.state).toBe("armed");
  return state;
}

describe("event-reducer", () => {
  it("button press starts armed timer", () => {
    const armed = armedTimerState();
    const running = reduceTrayEvent(armed, {
      type: "button_pressed",
      slotIndex: 0,
      timestamp: NOW,
    });

    expect(running.timer?.state).toBe("running");
    if (running.timer?.state === "running") {
      expect(running.timer.durationMs).toBe(15 * 60 * 1000);
    }

    const fact = buildTrayWeatherFact(running.tray, running.ctx);
    const translation = resolveTrayTranslation(running.tray, fact, running.ctx, {
      runningTimer: running.timer?.state === "running" ? running.timer : null,
      nowMs: NOW,
    });
    expect(translation.finalOutput).toBe("15:00 remaining");
    expect(translation.finalOutputTone).toBe("timer");
  });

  it("unrelated slot change does not cancel running timer", () => {
    const armed = armedTimerState();
    const running = reduceTrayEvent(armed, {
      type: "button_pressed",
      slotIndex: 0,
      timestamp: NOW,
    });

    const expanded = reduceTrayEvent(running, {
      type: "die_placed",
      slotIndex: 4,
      cubeId: "phenomenon",
      activeModeId: "rain",
    });

    expect(expanded.timer?.state).toBe("running");

    const fact = buildTrayWeatherFact(expanded.tray, expanded.ctx);
    const translation = resolveTrayTranslation(expanded.tray, fact, expanded.ctx, {
      runningTimer: expanded.timer?.state === "running" ? expanded.timer : null,
      nowMs: NOW + 1000,
    });
    expect(translation.finalOutput).toBe("14:59 remaining");
  });

  it("mutating bound slot cancels running timer", () => {
    const armed = armedTimerState();
    const running = reduceTrayEvent(armed, {
      type: "button_pressed",
      slotIndex: 0,
      timestamp: NOW,
    });

    const mutated = reduceTrayEvent(running, {
      type: "die_rotated",
      slotIndex: 1,
      activeModeId: "30_min",
    });

    expect(mutated.timer?.state).not.toBe("running");
  });

  it("wrong button does not start armed timer", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "button", activeModeId: "button" },
      { slotIndex: 2, cubeId: "timer", activeModeId: "15_min" },
      { slotIndex: 4, cubeId: "button", activeModeId: "button" },
    ]);
    const state = rebuildRuntimeStateFromTray(tray, NOW);
    expect(state.timer?.state).toBe("armed");

    const afterWrongPress = reduceTrayEvent(state, {
      type: "button_pressed",
      slotIndex: 4,
      timestamp: NOW,
    });

    expect(afterWrongPress.timer?.state).toBe("armed");
  });
});
