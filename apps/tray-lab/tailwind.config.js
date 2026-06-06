/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        tray: {
          surface: "#E8E4DC",
          recess: "#DAD6CE",
          ink: "#1A1A1A",
          muted: "#6B6B6B",
          lcd: "#C8C4BC",
          hint: "#8A8A8A",
          die: "#F2EFE8",
          border: "#2A2A2A",
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
      boxShadow: {
        die: "0 2px 0 rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.08)",
        tray: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.4)",
      },
    },
  },
  plugins: [],
};
