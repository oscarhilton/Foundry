import type { ExamplePresetId } from "@/lib/assets";

export const site = {
  name: "Foundry",
  tagline: "Snap cubes into a sentence.",
  hero: {
    headline: "Snap cubes into a sentence.",
    subhead:
      "Foundry is a physical language for behaviours. Snap magnetic cubes together to sense, decide, and act — right on your desk.",
    promise:
      "I snapped together a little sentence, and now my desk knows something useful.",
    badge: "Designed in London. Built to last.",
  },
  infoCards: [
    {
      title: "What is Foundry?",
      body: "Magnetic cubes that snap into a chain — a physical language for behaviours, not a smart-home dashboard.",
      icon: "cube" as const,
    },
    {
      title: "What do I need?",
      body: "A Starter Kit: Core, Place, Weather, and Light. Build Place → Weather → Light, then add vocabulary cubes as you go.",
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
    body: "Everything you need to build your first sentence on a desk.",
    cta: "Explore the showcase",
    firstSentence: "Place → Weather → Light",
    addOns: ["Display", "Time", "Dial", "Motion"],
    cubes: [
      {
        name: "Core",
        role: "Power, Wi-Fi, and runtime for your sentence.",
      },
      {
        name: "Place",
        role: "Programmable context — demo kits may show London or Tokyo.",
      },
      {
        name: "Weather",
        role: "Fetches weather for your place — rain, temperature, and conditions.",
      },
      {
        name: "Light",
        role: "Blue for rain. Yellow when dry. Grey when overcast.",
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
      id: "weather-moods" as ExamplePresetId,
      title: "Weather Moods",
      chain: "London → Weather → Light",
      description: "Blue for rain. Yellow for dry weather. Grey when overcast.",
    },
    {
      id: "weather-dial-lcd" as ExamplePresetId,
      title: "Weather Dial LCD",
      chain: "London → Weather → Dial → Display",
      description: "Dial picks temperature, rain, or full forecast on the display.",
    },
    {
      id: "split-weather-dual-lcd" as ExamplePresetId,
      title: "Split Weather LCD",
      chain: "London → Weather → Split → Display → Display",
      description: "London and 12°C on one display; 45% rain on the other.",
    },
    {
      id: "presence-weather-lcd" as ExamplePresetId,
      title: "Presence Weather",
      chain: "Motion → London → Weather → Display",
      description: "Weather on the display only when someone walks by.",
    },
    {
      id: "world-desk" as ExamplePresetId,
      title: "World Desk",
      chain: "Tokyo → Time → Display · London → Weather → Display · Foundry → GitHub → Light",
      description: "Tokyo clock, London weather, GitHub light — three sentences at once.",
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
      examples: "Light, Display",
      detail: "Where the sentence becomes visible on your desk.",
    },
  },
  trust: {
    headline: "Foundry is not a smart-home platform.",
    subhead: "It is a physical language for behaviours.",
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
