/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        foundry: {
          cream: "#EDE8E0",
          white: "#FFFFFF",
          ink: "#1A1A1A",
          muted: "#6B6B6B",
          border: "#1A1A1A",
          pogo: "#C9A227",
        },
      },
      fontFamily: {
        sans: [
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
