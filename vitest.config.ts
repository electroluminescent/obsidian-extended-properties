import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest runs the *pure* modules (`src/utils/*`, most of `src/core/*`) directly.
 * Those files only ever `import type` from "obsidian", which the TS transform
 * strips - but the alias points any stray "obsidian" specifier at a tiny stub
 * so a value import can never pull the real (unavailable) module into a test.
 */
export default defineConfig({
  resolve: {
    alias: {
      obsidian: fileURLToPath(new URL("./tests/stubs/obsidian.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
});
