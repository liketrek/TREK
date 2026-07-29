import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
      // Without these the Client Tests job produced a report, uploaded it and
      // passed no matter what the number was — which is how coverage drifted
      // down to ~48% unnoticed. Set a few points below the current run so an
      // ordinary PR doesn't trip them; raise them when the number rises.
      thresholds: {
        statements: 90,
        branches: 82,
        functions: 89,
        lines: 92,
      },
    },
    css: false,
  },
});
