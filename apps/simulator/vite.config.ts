import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@foundry/cube-defs": resolve(dir, "../../packages/cube-defs/src/index.ts"),
      "@foundry/runtime": resolve(dir, "../../packages/runtime/src/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          konva: ["konva", "react-konva"],
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
});
