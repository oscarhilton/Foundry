import type { ExamplePresetId } from "@/lib/assets";

export const site = {
  name: "Foundry",
  tagline: "Snap cubes into a sentence.",
  hero: {
    headline: "Snap cubes into a sentence.",
    subhead:
      "No voice. No app doom-scroll. Physical cause and effect for daily rituals.",
    promise:
      "I snapped together a little sentence, and now my hallway knows when to remind me.",
    badge: "Designed in London. Built to last.",
  },
  infoCards: [
    {
      title: "What is Foundry?",
      body: "Magnetic cubes that snap into a chain — calm physical routines you build with your hands, not a smart-home dashboard.",
      icon: "cube" as const,
    },
    {
      title: "What do I need?",
      body: "Starter Kit: Core, Place, Weather, Motion, Glow, and Display. Build Place → Weather → Glow, then add packs as you go.",
      icon: "cube" as const,
    },
    {
      title: "Can I configure it?",
      body: "Yes. Choose your place when setting up your Core — change it later without replacing the cube. Wi-Fi lives in the Core.",
      icon: "settings" as const,
    },
  ],
  starterKit: {
    eyebrow: "Start Here",
    title: "Starter Kit",
    body: "Everything you need for your first ritual on a desk or in a hallway.",
    cta: "Explore the showcase",
    firstSentence: "Place → Weather → Glow",
    addOns: ["Timer", "Chime", "Time", "Wheel"],
    cubes: [
      {
        name: "Core",
        role: "Power, Wi-Fi, and runtime for your sentence.",
      },
      {
        name: "Place",
        role: "Programmable context — demo kits may show London or Hallway.",
      },
      {
        name: "Weather",
        role: "Source symbol — OVERCAST, RAIN, or SUN on the cube face.",
      },
      {
        name: "Motion",
        role: "Gate rituals — speak the sentence when someone walks past.",
      },
      {
        name: "Glow",
        role: "Ambient colour signal — not a lamp. Blue for rain, yellow when dry.",
      },
      {
        name: "Display",
        role: "Sentence viewport — where the chain is read aloud.",
      },
    ],
  },
  examples: {
    eyebrow: "Behaviours in the wild",
    title: "Copy a sentence, then swap one word.",
    browseLabel: "Browse all examples",
  },
  examplePresets: [
    {
      id: "morning-check" as ExamplePresetId,
      title: "Morning Check",
      chain: "Button → Weather → Clothes → Display",
      description: "Press while getting ready. Foundry suggests what to wear.",
    },
    {
      id: "doorway-signal" as ExamplePresetId,
      title: "Doorway Signal",
      chain: "Motion → Hallway → Weather → Glow",
      description: "As you pass the door, it glows if the weather needs attention.",
    },
    {
      id: "kitchen-timer" as ExamplePresetId,
      title: "Kitchen Timer",
      chain: "Timer → Chime",
      description: "Turn the cube to choose 5, 10, 15, or 30 minutes.",
    },
    {
      id: "hallway-clothing-display" as ExamplePresetId,
      title: "Hallway Clothing Display",
      chain: "Motion → Hallway → Weather → Clothes → Display",
      description: "A short urgent reminder when you pass the hallway.",
    },
    {
      id: "dual-weather-clothing" as ExamplePresetId,
      title: "Two Displays",
      chain: "Weather → Display → Clothes → Display",
      description: "Forecast on one Display, clothing suggestion on the other.",
    },
    {
      id: "weather-lcd" as ExamplePresetId,
      title: "Place Weather Display",
      chain: "London → Weather → Display",
      description: "Weather shows a symbol; Display shows the full sentence.",
    },
    {
      id: "weather-moods" as ExamplePresetId,
      title: "Weather Moods",
      chain: "London → Weather → Glow",
      description: "Glow reflects the weather — blue for rain, yellow when dry.",
    },
    {
      id: "presence-weather-lcd" as ExamplePresetId,
      title: "Presence Weather",
      chain: "Motion → London → Weather → Display",
      description: "Weather on Display only when someone walks by.",
    },
  ],
  language: {
    eyebrow: "A physical language",
    title: "Nouns. Verbs. Outputs.",
    body: "Chains read left to right like a sentence. Place scopes context; sources and transforms shape facts; outputs make the sentence visible.",
    nouns: {
      label: "Nouns",
      examples: "Place, Foundry",
      detail: "Context — where or what the sentence is about.",
    },
    verbs: {
      label: "Verbs",
      examples: "Weather, Time, GitHub",
      detail: "Sources and transforms that fetch or reshape facts.",
    },
    outputs: {
      label: "Outputs",
      examples: "Glow, Display",
      detail: "Where the sentence becomes visible on your desk.",
    },
  },
  trust: {
    headline: "Foundry is not a smart-home platform.",
    subhead: "It is a physical language for daily rituals.",
    bullets: [
      "Sentences execute on the Core",
      "Place cubes are programmable — not one cube per city",
      "Wi-Fi lives in the Core, not in your sentence",
    ],
  },
  footer: {
    tagline: "Build behaviours you can hold in your hand.",
    newsletter: "New ideas and updates.",
    copyright: "© 2025 Foundry Labs Ltd.",
  },
  nav: [
    { label: "Product", href: "#starter-kit" },
    { label: "Examples", href: "#examples" },
    { label: "Learn", href: "#language" },
    { label: "Community", href: "#" },
    { label: "Shop", href: "#starter-kit" },
  ],
} as const;
