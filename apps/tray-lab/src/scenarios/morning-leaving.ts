import { orderedStarterPool } from "@foundry/cube-defs";

/** Canonical arrangement: HOME → MORNING → RAIN → UMBRELLA */
export const morningLeavingScenario = {
  id: "morning-leaving" as const,
  prompt: "Make the tray tell you whether to take an umbrella.",
  canonicalSlots: [
    { slotIndex: 0, cubeId: "home", activeModeId: "home" },
    { slotIndex: 1, cubeId: "moment", activeModeId: "morning" },
    { slotIndex: 2, cubeId: "phenomenon", activeModeId: "rain" },
    { slotIndex: 3, cubeId: "response", activeModeId: "umbrella" },
  ] as const,
  expectedLocalTranslations: [
    "Home",
    "Morning",
    "22% rain",
    "No umbrella",
  ] as const,
  expectedFinalOutput: "No umbrella needed this morning." as const,
  dicePool: orderedStarterPool(),
  hint: "Place dice in the tray slots. Click a placed die to rotate its face.",
};
