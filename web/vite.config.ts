import { defineConfig } from "vitest/config";

export default defineConfig({
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  test: {
    environment: "node",
    testTimeout: 30_000,
    include: ["tests/**/*.test.ts"],
  },
});
