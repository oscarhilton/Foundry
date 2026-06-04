import { getCubeDefinition, PRESET_CHAINS, type PresetChain } from "@foundry/cube-defs";

export const SHOWCASE_PRESET_IDS = [
  "weather-moods",
  "weather-dial-lcd",
  "split-weather-dual-lcd",
  "presence-weather-lcd",
  "world-desk",
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
    "weather-moods": {
      whatItDoes: "Turns local weather into ambient colour.",
      sentenceTeaches: "Nouns scope facts; outputs express them.",
    },
    "weather-dial-lcd": {
      whatItDoes: "Dial picks which weather line hits the LCD.",
      sentenceTeaches: "Transforms reshape facts before the viewport.",
    },
    "split-weather-dual-lcd": {
      whatItDoes: "Temperature on one LCD, rain on the other.",
      sentenceTeaches: "Split turns one sentence into two clauses.",
    },
    "presence-weather-lcd": {
      whatItDoes: "Weather appears only when motion is detected.",
      sentenceTeaches: "Sensors can gate whether a sentence is spoken.",
    },
    "world-desk": {
      whatItDoes: "Tokyo clock, London weather, GitHub light — at once.",
      sentenceTeaches: "Multiple sentences on one bus, without fighting.",
    },
  };

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
      hero: presetId === "world-desk",
    };
  });
}

export const SHOWCASE_CARDS = buildCards();

/** M6 consumer entry — matches docs/starter-kit.md proof kit */
export const START_HERE = {
  title: "Start Here",
  kitTitle: "Starter Kit",
  kitItems: ["Core", "Place", "Weather", "Light"] as const,
  firstSentence: "Place → Weather → Light",
  addOns: ["Display", "Time", "Dial", "Motion"] as const,
  tryPresetId: "weather-moods" as const satisfies ShowcasePresetId,
};
