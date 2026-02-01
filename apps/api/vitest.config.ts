import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@adaptive-training-plan/utils": path.resolve(
        __dirname,
        "../../packages/utils/src"
      ),
      "@adaptive-training-plan/types": path.resolve(
        __dirname,
        "../../packages/types/src"
      ),
    },
  },
});
