import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @trek/shared — Zod contract package (tests resolve it to TS source,
      // mirroring the alias in vite.config.js used by the dev server / build).
      '@trek/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
    },
    // Mirror vite.config.js: keep a single zod instance resolvable from the
    // shared source, which lives outside this project root.
    dedupe: ['zod'],
  },
  test: {
    root: '.',
    globals: true,
    environment: './tests/environment/jsdom-native-abort.ts',
    include: [
      'tests/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: 'forks',
    silent: false,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
    },
    css: false,
  },
});
