import { defineConfig } from "vitest/config";
import path from "path";

// Minimal unit-test setup for pure helpers in src/lib (no jsdom, no React
// rendering) — this app's pages are server components verified by `next build`
// and in-browser checks; this covers the logic that must not silently regress.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
