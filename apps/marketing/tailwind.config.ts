import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          50: "#fafaf9",
          100: "#f5f5f4",
        },
        ink: "#1a1a1a",
        muted: "#737373",
      },
      maxWidth: {
        site: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
