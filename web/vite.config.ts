import { defineConfig } from "vitest/config";

export default defineConfig({
  // MapLibre GL alone is about 1 MB minified; it is one chunk on purpose.
  build: { chunkSizeWarningLimit: 1500 },
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  test: {
    environment: "node",
    testTimeout: 30_000,
    include: ["tests/**/*.test.ts"],
  },
});
