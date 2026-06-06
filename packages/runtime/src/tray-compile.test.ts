import { describe, it, expect } from "vitest";
import {
  compileTrayState,
  buildTrayWeatherFact,
  resolveTrayTranslation,
  createTrayFromPlacements,
  detectHeroMoment,
  resolveTraySlotTexts,
} from "./tray-compile.js";

function canonicalMorningTray(lensModeId = "any") {
  return createTrayFromPlacements([
    { slotIndex: 0, cubeId: "home", activeModeId: "home" },
    { slotIndex: 1, cubeId: "morning", activeModeId: "full" },
    { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
    { slotIndex: 3, cubeId: "umbrella", activeModeId: lensModeId },
  ]);
}

describe("tray-compile v2", () => {
  it("canonical: home morning weather umbrella with finalOutput", () => {
    const tray = canonicalMorningTray();
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const translation = resolveTrayTranslation(tray, fact, trayContext);

    expect(translation.localTranslations).toEqual([
      "Home",
      "Morning",
      "22% rain after 4pm",
      "No umbrella needed",
      null,
    ]);
    expect(translation.finalOutput).toBe("No umbrella needed this morning.");
    expect(translation.finalOutputTone).toBe("answer");
  });

  it("minimal: weather umbrella without place or moment", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
      { slotIndex: 3, cubeId: "umbrella", activeModeId: "any" },
    ]);
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const translation = resolveTrayTranslation(tray, fact, trayContext);

    expect(translation.localTranslations[2]).toBe("22% rain after 4pm");
    expect(translation.localTranslations[3]).toBe("No umbrella needed");
    expect(translation.finalOutput).toBe("No umbrella needed.");
  });

  it("weather rain mode changes source line; lens stable on rotate", () => {
    const rainModeTray = canonicalMorningTray();
    const rainModeTray2 = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "morning", activeModeId: "full" },
      { slotIndex: 2, cubeId: "weather", activeModeId: "rain" },
      { slotIndex: 3, cubeId: "umbrella", activeModeId: "any" },
    ]);

    const fullCtx = compileTrayState(rainModeTray).trayContext;
    const rainCtx = compileTrayState(rainModeTray2).trayContext;
    const fullFact = buildTrayWeatherFact(rainModeTray, fullCtx)!;
    const rainFact = buildTrayWeatherFact(rainModeTray2, rainCtx)!;

    const fullTranslation = resolveTrayTranslation(
      rainModeTray,
      fullFact,
      fullCtx,
    );
    const rainTranslation = resolveTrayTranslation(
      rainModeTray2,
      rainFact,
      rainCtx,
    );

    expect(fullTranslation.localTranslations[2]).toBe("22% rain after 4pm");
    expect(rainTranslation.localTranslations[2]).toBe("Rain 22% after 4pm");
    expect(fullTranslation.localTranslations[0]).toBe("Home");
    expect(rainTranslation.localTranslations[0]).toBe("Home");
    expect(fullTranslation.localTranslations[1]).toBe("Morning");
    expect(rainTranslation.localTranslations[1]).toBe("Morning");
  });

  it("detects hero moment when lens changes but weather stable", () => {
    const umbrellaTray = canonicalMorningTray("any");
    const wearTray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "morning", activeModeId: "full" },
      { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
      { slotIndex: 3, cubeId: "wear", activeModeId: "light" },
    ]);

    const uCtx = compileTrayState(umbrellaTray).trayContext;
    const wCtx = compileTrayState(wearTray).trayContext;
    const uFact = buildTrayWeatherFact(umbrellaTray, uCtx)!;
    const wFact = buildTrayWeatherFact(wearTray, wCtx)!;
    const uTexts = resolveTraySlotTexts(umbrellaTray, uFact, uCtx);
    const wTexts = resolveTraySlotTexts(wearTray, wFact, wCtx);

    expect(detectHeroMoment(uTexts, wTexts, wCtx)).toBe(true);
  });

  it("gapped tray compacts chain but preserves display indices", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 2, cubeId: "morning", activeModeId: "full" },
      { slotIndex: 4, cubeId: "weather", activeModeId: "full" },
    ]);
    const { chainCubes, trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const translation = resolveTrayTranslation(tray, fact, trayContext);

    expect(chainCubes.filter((c) => c.definitionId !== "core/core")).toHaveLength(
      2,
    );
    expect(trayContext.chainToSlot).toEqual([0, 4]);
    expect(translation.localTranslations[0]).toBe("Home");
    expect(translation.localTranslations[1]).toBeNull();
    expect(translation.localTranslations[2]).toBe("Morning");
    expect(translation.localTranslations[4]).toBe("22% rain after 4pm");
  });

  it("home umbrella without weather shows gentle hints", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 2, cubeId: "umbrella", activeModeId: "any" },
    ]);
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext);
    const texts = resolveTraySlotTexts(tray, fact, trayContext);

    expect(texts[0]?.kind).toBe("text");
    expect(texts[1]?.kind).toBe("hint");
    expect(texts[2]?.kind).toBe("hint");
  });

  it("two lenses: leftmost wins, second hints", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "home", activeModeId: "home" },
      { slotIndex: 1, cubeId: "weather", activeModeId: "full" },
      { slotIndex: 2, cubeId: "wear", activeModeId: "light" },
      { slotIndex: 3, cubeId: "umbrella", activeModeId: "any" },
    ]);
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const texts = resolveTraySlotTexts(tray, fact, trayContext);

    expect(texts[2]?.kind).toBe("text");
    expect((texts[2] as { value: string }).value).toBe("Light jacket");
    expect(texts[3]?.kind).toBe("hint");
  });

  it("london weather uses 45% rain", () => {
    const tray = createTrayFromPlacements([
      { slotIndex: 0, cubeId: "london", activeModeId: "london" },
      { slotIndex: 1, cubeId: "weather", activeModeId: "full" },
      { slotIndex: 2, cubeId: "umbrella", activeModeId: "any" },
    ]);
    const { trayContext } = compileTrayState(tray);
    const fact = buildTrayWeatherFact(tray, trayContext)!;
    const translation = resolveTrayTranslation(tray, fact, trayContext);

    expect(translation.localTranslations[1]).toBe("45% rain after 4pm");
    expect(translation.localTranslations[2]).toBe("Take umbrella later");
  });

  it("injects synthetic tray core without lens tokens in chain", () => {
    const tray = canonicalMorningTray();
    const { chainCubes } = compileTrayState(tray);
    expect(chainCubes.some((c) => c.definitionId === "core/core")).toBe(true);
    expect(chainCubes.some((c) => c.definitionId.startsWith("lens/"))).toBe(
      false,
    );
  });

  it("morning is moment role, not control", () => {
    const tray = canonicalMorningTray();
    const { trayContext } = compileTrayState(tray);
    expect(trayContext.momentSlotIndex).toBe(1);
    expect(trayContext.slots[1]?.role).toBe("moment");
  });
});
