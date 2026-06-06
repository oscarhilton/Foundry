import type { TrayTranslation } from "@foundry/runtime";
import { compileTrayState, detectHeroMoment } from "@foundry/runtime";
import type { TrayState } from "@foundry/cube-defs";

export type TrayMilestoneId =
  | "placement_started"
  | "sentence_complete"
  | "umbrella_decision_visible"
  | "hero_moment"
  | "lens_rotated_before_complete";

export type TraySessionEvent =
  | { t: number; type: "die_placed"; slotIndex: number; cubeId: string; modeId: string }
  | { t: number; type: "die_rotated"; slotIndex: number; fromModeId: string; toModeId: string }
  | { t: number; type: "die_removed"; slotIndex: number }
  | {
      t: number;
      type: "tray_resolved";
      translation: TrayTranslation;
    }
  | { t: number; type: "milestone"; id: TrayMilestoneId };

const UMBRELLA_DECISION_PATTERN =
  /no umbrella needed|take umbrella later|take umbrella/i;

let sessionStart = Date.now();
let events: TraySessionEvent[] = [];
let milestones = new Set<TrayMilestoneId>();
let lastTranslation: TrayTranslation = {
  slots: Array.from({ length: 5 }, () => ({ kind: "empty" as const })),
  localTranslations: Array.from({ length: 5 }, () => null),
  finalOutput: null,
  finalOutputTone: "invalid",
};
let hasRotatedLens = false;

export function resetSessionJournal(): void {
  sessionStart = Date.now();
  events = [];
  milestones = new Set();
  lastTranslation = {
    slots: Array.from({ length: 5 }, () => ({ kind: "empty" as const })),
    localTranslations: Array.from({ length: 5 }, () => null),
    finalOutput: null,
    finalOutputTone: "invalid",
  };
  hasRotatedLens = false;
}

export function getSessionEvents(): TraySessionEvent[] {
  return [...events];
}

export function getSessionMilestones(): TrayMilestoneId[] {
  return [...milestones];
}

function recordMilestone(id: TrayMilestoneId): void {
  if (milestones.has(id)) return;
  milestones.add(id);
  events.push({ t: Date.now() - sessionStart, type: "milestone", id });
}

function isSentenceComplete(tray: TrayState): boolean {
  const { trayContext } = compileTrayState(tray);
  const hasPlace = trayContext.placeSlotIndex !== null;
  const hasMoment = trayContext.momentSlotIndex !== null;
  const hasWeather = trayContext.sourceSlotIndex !== null;
  const hasLens = trayContext.primaryLensSlotIndex !== null;
  return hasPlace && hasMoment && hasWeather && hasLens;
}

function hasUmbrellaDecision(translation: TrayTranslation): boolean {
  if (
    translation.finalOutput &&
    UMBRELLA_DECISION_PATTERN.test(translation.finalOutput)
  ) {
    return true;
  }
  return translation.localTranslations.some(
    (text) => text !== null && UMBRELLA_DECISION_PATTERN.test(text),
  );
}

export function recordDiePlaced(
  slotIndex: number,
  cubeId: string,
  modeId: string,
): void {
  events.push({
    t: Date.now() - sessionStart,
    type: "die_placed",
    slotIndex,
    cubeId,
    modeId,
  });
  recordMilestone("placement_started");
}

export function recordDieRotated(
  slotIndex: number,
  fromModeId: string,
  toModeId: string,
  cubeId: string,
): void {
  events.push({
    t: Date.now() - sessionStart,
    type: "die_rotated",
    slotIndex,
    fromModeId,
    toModeId,
  });
  if (cubeId === "umbrella" || cubeId === "wear") {
    hasRotatedLens = true;
  }
}

export function recordDieRemoved(slotIndex: number): void {
  events.push({ t: Date.now() - sessionStart, type: "die_removed", slotIndex });
}

export function recordTrayResolved(
  tray: TrayState,
  translation: TrayTranslation,
): void {
  const { trayContext } = compileTrayState(tray);

  events.push({
    t: Date.now() - sessionStart,
    type: "tray_resolved",
    translation,
  });

  if (isSentenceComplete(tray)) {
    recordMilestone("sentence_complete");
  } else if (hasRotatedLens) {
    recordMilestone("lens_rotated_before_complete");
  }

  if (hasUmbrellaDecision(translation)) {
    recordMilestone("umbrella_decision_visible");
  }

  if (detectHeroMoment(lastTranslation.slots, translation.slots, trayContext)) {
    recordMilestone("hero_moment");
  }

  lastTranslation = {
    ...translation,
    slots: translation.slots.map((s) => ({ ...s })),
    localTranslations: [...translation.localTranslations],
  };
}

export function exportSessionJson(extra?: Record<string, unknown>): string {
  return JSON.stringify(
    {
      startedAt: sessionStart,
      elapsedMs: Date.now() - sessionStart,
      milestones: [...milestones],
      events,
      ...extra,
    },
    null,
    2,
  );
}

export function getElapsedMs(): number {
  return Date.now() - sessionStart;
}
