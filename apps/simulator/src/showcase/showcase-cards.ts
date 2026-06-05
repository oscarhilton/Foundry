import {
  getCubeDefinition,
  HERO_PRESET_IDS,
  PRESET_CHAINS,
  type PresetChain,
} from "@foundry/cube-defs";

export const SHOWCASE_PRESET_IDS = [
  "morning-check",
  "doorway-signal",
  "kitchen-timer",
  "dual-weather-clothing",
  "hallway-clothing-display",
  "weather-lcd",
  "weather-moods",
  "presence-weather-lcd",
] as const;

export type ShowcasePresetId = (typeof SHOWCASE_PRESET_IDS)[number];

export interface ShowcaseCardContent {
  presetId: ShowcasePresetId;
  title: string;
  chainLabel: string;
  whatItDoes: string;
  sentenceTeaches: string;
  hero?: boolean;
}

function chainLabelFromPreset(preset: PresetChain): string {
  return preset.cubes
    .filter((id) => id !== "core/core")
    .map((id) => getCubeDefinition(id)?.label ?? id)
    .join(" → ");
}

const TEACHES: Record<ShowcasePresetId, { whatItDoes: string; sentenceTeaches: string }> =
  {
    "morning-check": {
      whatItDoes:
        "Press while getting ready. Display shows what to wear — only when you ask.",
      sentenceTeaches:
        "Button = ask me. Display speaks only when you press.",
    },
    "doorway-signal": {
      whatItDoes:
        "As you pass the door, Glow hints if the weather needs attention — no words.",
      sentenceTeaches: "Motion = notice me. Glow hints without words.",
    },
    "kitchen-timer": {
      whatItDoes: "Turn the cube to pick 5, 10, 15, or 30 minutes. Chime when time is up.",
      sentenceTeaches: "Timer = remind me later.",
    },
    "dual-weather-clothing": {
      whatItDoes:
        "Forecast on the first Display, clothing suggestion on the second.",
      sentenceTeaches:
        "Add another Display to see forecast and suggestion separately.",
    },
    "hallway-clothing-display": {
      whatItDoes:
        "When you pass the hallway, a short urgent reminder — umbrella, jacket, sun cream.",
      sentenceTeaches:
        "Motion gates a ritual; Clothes turns weather into a doorway reminder.",
    },
    "weather-lcd": {
      whatItDoes:
        "Weather shows a symbol on its face (OVERCAST, RAIN, SUN). Display shows the full sentence.",
      sentenceTeaches: "Weather is the source; Display is where the sentence is read.",
    },
    "weather-moods": {
      whatItDoes:
        "Glow reflects the weather — blue for rain, yellow when dry, soft grey in between.",
      sentenceTeaches: "Nouns scope facts; outputs express them as ambient signals.",
    },
    "presence-weather-lcd": {
      whatItDoes: "Weather appears on Display only when motion is detected.",
      sentenceTeaches: "Sensors can gate whether a sentence is spoken.",
    },
  };

const HERO_IDS = new Set<string>(HERO_PRESET_IDS);

function buildCards(): ShowcaseCardContent[] {
  return SHOWCASE_PRESET_IDS.map((presetId) => {
    const preset = PRESET_CHAINS.find((p) => p.id === presetId);
    if (!preset) {
      throw new Error(`Showcase preset missing: ${presetId}`);
    }
    const copy = TEACHES[presetId];
    return {
      presetId,
      title: preset.name,
      chainLabel: chainLabelFromPreset(preset),
      whatItDoes: copy.whatItDoes,
      sentenceTeaches: copy.sentenceTeaches,
      hero: HERO_IDS.has(presetId),
    };
  });
}

export const SHOWCASE_CARDS = buildCards();

/** M6 consumer entry — matches docs/starter-kit.md proof kit */
export const START_HERE = {
  title: "Start Here",
  kitTitle: "Starter Kit",
  kitItems: ["Core", "Place", "Weather", "Motion", "Glow", "Display"] as const,
  firstSentence: "Place → Weather → Glow",
  addOns: ["Timer", "Chime", "Time", "Wheel"] as const,
  kitchenPack: ["Timer", "Chime"] as const,
  tryPresetId: "morning-check" as const satisfies ShowcasePresetId,
};
