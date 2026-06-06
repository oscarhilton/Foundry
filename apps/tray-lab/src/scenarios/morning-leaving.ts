import { orderedStarterPool } from "@foundry/cube-defs";

/** Canonical arrangement: HOME → MORNING → WEATHER → UMBRELLA */
export const morningLeavingScenario = {
  id: "morning-leaving" as const,
  prompt: "Make the tray tell you whether to take an umbrella.",
  canonicalSlots: [
    { slotIndex: 0, cubeId: "home", activeModeId: "home" },
    { slotIndex: 1, cubeId: "morning", activeModeId: "morning" },
    { slotIndex: 2, cubeId: "weather", activeModeId: "full" },
    { slotIndex: 3, cubeId: "umbrella", activeModeId: "any" },
  ] as const,
  expectedLocalTranslations: [
    "Home",
    "Morning",
    "22% rain after 4pm",
    "No umbrella needed",
  ] as const,
  expectedFinalOutput: "No umbrella needed this morning." as const,
  dicePool: orderedStarterPool(),
  hint: "Place dice in the tray slots. Click a placed die to rotate its face.",
};
