import { describe, it, expect } from "vitest";
import {
  compileTrayState,
  buildTrayWeatherFact,
  resolveTrayTranslation,
  createTrayFromPlacements,
  detectHeroMoment,
} from "./tray-compile.js";
import { buildTrayCompileContext } from "./intent-resolver.js";

function canonicalMorningTray(responseModeId = "umbrella") {
  return createTrayFromPlacements([
    { slotIndex: 0, cubeId: "home", activeModeId: "home" },
    { slotIndex: 1, cubeId: "moment", activeModeId: "morning" },
    { slotIndex: 2, cubeId: "phenomenon", activeModeId: "rain" },
    { slotIndex: 3, cubeId: "response", activeModeId: responseModeId },
  ]);
}

describe("tray-compile — TRAY-115 matrix", () => {
  it("canonical: home moment rain umbrella with finalOutput", () => {
    const tray = canonicalMorningTray();
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const translation = resolveTrayTranslation(tray, fact, trayContext);

    expect(translation.localTranslations).toEqual([
      "Home",
      "Morning",
      "22% rain",
      "No umbrella",
      null,
    ]);
    expect(translation.finalOutput).toBe("No umbrella needed this morning.");
    expect(translation.finalOutputTone).toBe("answer");
  });

  it("express: moment rain umbrella uses default home context", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "moment", activeModeId: "morning" },
      { slotIndex: 1, cubeId: "phenomenon", activeModeId: "rain" },
      { slotIndex: 2, cubeId: "response", activeModeId: "umbrella" },
    ]);
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const translation = resolveTrayTranslation(tray, fact, trayContext);

    expect(translation.finalOutput).toBe("No umbrella needed this morning.");
    expect(translation.finalOutputTone).toBe("answer");
  });

  it("minimal: rain umbrella without place or moment", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 2, cubeId: "phenomenon", activeModeId: "rain" },
      { slotIndex: 3, cubeId: "response", activeModeId: "umbrella" },
    ]);
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const translation = resolveTrayTranslation(tray, fact, trayContext);

    expect(translation.localTranslations[2]).toBe("22% rain");
    expect(translation.localTranslations[3]).toBe("No umbrella");
    expect(translation.finalOutput).toBe("No umbrella needed this morning.");
  });

  it("afternoon moment scopes final output", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "moment", activeModeId: "afternoon" },
      { slotIndex: 2, cubeId: "phenomenon", activeModeId: "rain" },
      { slotIndex: 3, cubeId: "response", activeModeId: "umbrella" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildTrayWeatherFact(tray, ctx)!;
    const translation = resolveTrayTranslation(tray, fact, ctx);

    expect(translation.finalOutput).toBe("No umbrella needed this afternoon.");
  });

  it("detects hero moment when response changes but phenomenon stable", () => {
    const umbrellaTray = canonicalMorningTray("umbrella");
    const jacketTray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "moment", activeModeId: "morning" },
      { slotIndex: 2, cubeId: "phenomenon", activeModeId: "rain" },
      { slotIndex: 3, cubeId: "response", activeModeId: "jacket" },
    ]);

    const uCtx = compileTrayState(umbrellaTray).trayContext;
    const jCtx = compileTrayState(jacketTray).trayContext;
    const uFact = buildTrayWeatherFact(umbrellaTray, uCtx)!;
    const jFact = buildTrayWeatherFact(jacketTray, jCtx)!;
    const uTexts = resolveTrayTranslation(umbrellaTray, uFact, uCtx).slots;
    const jTexts = resolveTrayTranslation(jacketTray, jFact, jCtx).slots;

    expect(detectHeroMoment(uTexts, jTexts, jCtx)).toBe(true);
  });

  it("london rain umbrella uses 45% rain", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "london", activeModeId: "london" },
      { slotIndex: 1, cubeId: "phenomenon", activeModeId: "rain" },
      { slotIndex: 2, cubeId: "response", activeModeId: "umbrella" },
    ]);
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const translation = resolveTrayTranslation(tray, fact, trayContext);

    expect(translation.localTranslations[1]).toBe("45% rain");
    expect(translation.localTranslations[2]).toBe("Take umbrella");
  });

  it("response without phenomenon shows hint", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 2, cubeId: "response", activeModeId: "umbrella" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const translation = resolveTrayTranslation(tray, null, ctx);

    expect(translation.finalOutputTone).toBe("hint");
    expect(translation.finalOutput).toBe("Add weather condition");
  });

  it("wind + umbrella cross-pairing produces warning final", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "moment", activeModeId: "morning" },
      { slotIndex: 2, cubeId: "phenomenon", activeModeId: "wind" },
      { slotIndex: 3, cubeId: "response", activeModeId: "umbrella" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildTrayWeatherFact(tray, ctx)!;
    const translation = resolveTrayTranslation(tray, fact, ctx);

    expect(translation.finalOutputTone).toBe("warning");
    expect(translation.finalOutput).toContain("unmanageable");
  });
});

describe("TRAY-115 — partial matrix layouts", () => {
  it("phenomenon only without response hints to add response", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "moment", activeModeId: "night" },
      { slotIndex: 2, cubeId: "phenomenon", activeModeId: "rain" },
    ]);
    const ctx = buildTrayCompileContext(tray);
    const fact = buildTrayWeatherFact(tray, ctx)!;
    const translation = resolveTrayTranslation(tray, fact, ctx);

    expect(translation.localTranslations[2]).toBe("22% rain");
    expect(translation.finalOutputTone).toBe("hint");
  });
});
