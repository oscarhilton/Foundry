import { describe, it, expect, beforeEach } from "vitest";
import { emptyTrayState } from "@foundry/cube-defs";
import { createTrayFromPlacements } from "@foundry/runtime";
import { morningLeavingScenario } from "./scenarios/morning-leaving";
import {
  initTrayLab,
  useTrayLabStore,
  buildInitialTray,
} from "./store";

describe("tray-lab store", () => {
  beforeEach(() => {
    useTrayLabStore.setState({
      tray: emptyTrayState(),
      trayTranslation: {
        slots: Array.from({ length: 5 }, () => ({ kind: "empty" as const })),
        localTranslations: Array.from({ length: 5 }, () => null),
        finalOutput: null,
        finalOutputTone: "invalid",
      },
    });
  });

  it("resetScenario keeps empty tray in silent mode", () => {
    initTrayLab({ silentMode: true, showcaseMode: false });
    useTrayLabStore.getState().resetScenario();
    expect(useTrayLabStore.getState().tray).toEqual(emptyTrayState());
  });

  it("resetScenario preloads canonical tray in showcase mode", () => {
    initTrayLab({ silentMode: false, showcaseMode: true });
    useTrayLabStore.getState().resetScenario();
    expect(useTrayLabStore.getState().tray).toEqual(
      createTrayFromPlacements([...morningLeavingScenario.canonicalSlots]),
    );
  });

  it("buildInitialTray is empty unless showcase", () => {
    expect(buildInitialTray(false)).toEqual(emptyTrayState());
    expect(buildInitialTray(true)).toEqual(
      createTrayFromPlacements([...morningLeavingScenario.canonicalSlots]),
    );
  });

  it("pool has six starter cubes in grammar order", () => {
    initTrayLab({ silentMode: true, showcaseMode: false });
    expect(useTrayLabStore.getState().poolDice).toHaveLength(6);
    expect(useTrayLabStore.getState().poolDice[2]?.id).toBe("phenomenon");
  });
});
