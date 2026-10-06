import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // MapLibre's worker is an ES module.
  worker: { format: "es" },
  build: {
    rollupOptions: {
      output: {
        // Keep the large map library in its own long-cacheable chunk.
        manualChunks: {
          maplibre: ["maplibre-gl"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 1100,
  },
});
