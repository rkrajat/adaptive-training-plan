import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.integration.test.ts"],
    testTimeout: 120000, // 120 seconds for integration tests with LLM calls
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
