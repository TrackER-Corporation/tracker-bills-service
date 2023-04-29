
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "c8",
      all: true,
      lines: 65,
      branches: 75,
      functions: 75,
      statements: 65,
      include: ["**/*.ts"],
      exclude: ["**/types/*.ts", "**/test/*.ts", "vite-env.d.ts", "vite.config.ts"],
      reporter: ['text', 'json-summary', 'json'],
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: 3003,
  }
});