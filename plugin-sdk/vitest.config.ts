import fs from 'node:fs';
import { defineConfig } from 'vitest/config';

// The host's copy of the plugin API, which test/host-types.test-d.ts compares the SDK's
// types against. It exists only inside the TREK monorepo; a standalone checkout of the
// published package has no server, so the type parity check is off there.
const hostTypes = new URL('../server/src/nest/plugins/runtime/plugin-sdk.ts', import.meta.url);

export default defineConfig({
  test: {
    typecheck: {
      enabled: fs.existsSync(hostTypes),
      include: ['test/**/*.test-d.ts'],
      tsconfig: './tsconfig.typecheck.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      // Mirrored in the repo root's sonar.coverage.exclusions — a file skipped
      // here emits no lcov entry, so Sonar must not count it as uncovered either.
      exclude: [
        // Machine-written by server/scripts/gen-plugin-facts.ts.
        'src/generated/**',
        // Generated snapshot (scripts/gen-lucide-icon-names.mjs) — pure data.
        'src/lucide-icon-names.ts',
      ],
    },
  },
});
