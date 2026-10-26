import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // The suite imports ~2,000 cards and several large data files; under parallel load the default 5 s caused intermittent timeouts.
    testTimeout: 20000,
    include: ["tests/**/*.test.ts", "tests/**/*.test.mjs"],
  },
});
