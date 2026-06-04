/** Marketing image paths — see public/marketing/manifest.json */
export const marketingAssets = {
  logo: "/marketing/foundry_logo_header.png",
  heroChain: "/marketing/hero_core_place_weather_light.png",
  cubeCore: "/marketing/cube_core.png",
  cubePlace: "/marketing/cube_place.png",
  cubeWeather: "/marketing/cube_weather.png",
  cubeLight: "/marketing/cube_light.png",
  languageDiagram: "/marketing/nouns_verbs_outputs_diagram_only.png",
  trustCube: "/marketing/trust_banner_light_cube.png",
  examples: {
    "weather-moods": {
      card: "/marketing/example_weather_moods_card.png",
      miniChain: "/marketing/mini_chain_weather_moods.png",
    },
    "weather-dial-lcd": {
      card: "/marketing/example_weather_dial_lcd_card.png",
      miniChain: "/marketing/mini_chain_weather_dial_lcd.png",
    },
    "split-weather-dual-lcd": {
      card: "/marketing/example_split_weather_lcd_card.png",
      miniChain: "/marketing/mini_chain_split_weather_lcd.png",
    },
    "presence-weather-lcd": {
      card: "/marketing/example_presence_weather_card.png",
      miniChain: "/marketing/mini_chain_presence_weather.png",
    },
    "world-desk": {
      card: "/marketing/example_world_desk_card.png",
      miniChain: "/marketing/mini_chain_world_desk.png",
    },
  },
} as const;

export type ExamplePresetId = keyof typeof marketingAssets.examples;
