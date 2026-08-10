import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  // SWC transform so NestJS decorator metadata is emitted in tests
  // (vitest's default esbuild does not emit it -> type-based DI would break).
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        keepClassNames: true,
      },
    }),
  ],
  test: {
    root: '.',
    include: ['tests/**/*.test.ts'],
    globals: true,
    setupFiles: ['tests/setup.ts', 'tests/setup.console-noise.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: 'forks',
    silent: false,
    reporters: ['verbose'],
    coverage: {
      // Vite 8 + Vitest 4 made the sourcemap-based `v8` provider under-report branch
      // coverage on the SWC/decorator-transformed output (it dropped to ~68% even
      // though every test passes). `istanbul` instruments the source directly, so
      // coverage is measured independently of the transform pipeline.
      provider: 'istanbul',
      // json-summary is what the per-domain ratchet below is derived from: the text
      // reporter prints one row per DIRECTORY, not a recursive total, so reading the
      // thresholds off it silently understates any domain with subdirectories.
      reporter: ['lcov', 'text', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      // The plugin child bootstrap runs in a forked subprocess via tsx, so the
      // parent's instrumentation can't measure it; it's exercised end-to-end by
      // the supervisor integration test instead. Everything else in the plugin
      // module runs in-process and is unit-tested.
      exclude: ['src/nest/plugins/runtime/plugin-host-entry.ts'],
      // Coverage gate scoped to the new NestJS code only — the legacy codebase is
      // intentionally ungated.
      //
      // The bar is PER DOMAIN and works as a ratchet: each entry is that domain's
      // measured coverage at the time it was set, minus one point of slack. Regenerate
      // with `node scripts/coverage-thresholds.mjs` after a run that RAISED coverage. A single
      // repo-wide 80% let a well-covered domain subsidise a thin one, so a domain could
      // lose ten points and the build stayed green. Now it cannot: the only way past a
      // number here is to raise it, which makes the ratchet visible in the diff.
      //
      // Raise an entry when you improve a domain. Never lower one to make a build pass —
      // that is the whole point of the mechanism.
      //
      // Regenerate from a LINUX run if you can: CI runs on Linux, and a few branches are
      // platform-specific (the drive-letter half of the backup zip-slip guard is only
      // reachable on win32). Numbers taken on Windows can therefore sit a hair above what
      // CI measures, which shows up as a threshold failure that reproduces nowhere local.
      //
      // A file matched by a glob below is EXCLUDED from the catch-all, so the last entry
      // only covers what sits directly under src/nest (app.module.ts and the like).
      thresholds: {
        'src/nest/accommodations/**/*.ts': { statements: 92, branches: 87, functions: 99, lines: 97 },
        'src/nest/addons/**/*.ts': { statements: 99, branches: 87, functions: 99, lines: 99 },
        'src/nest/admin/**/*.ts': { statements: 86, branches: 70, functions: 89, lines: 88 },
        'src/nest/airports/**/*.ts': { statements: 68, branches: 60, functions: 93, lines: 73 },
        'src/nest/app-config/**/*.ts': { statements: 79, branches: 100, functions: 65, lines: 71 },
        'src/nest/assignments/**/*.ts': { statements: 90, branches: 80, functions: 97, lines: 96 },
        'src/nest/atlas/**/*.ts': { statements: 91, branches: 78, functions: 96, lines: 93 },
        'src/nest/audit/**/*.ts': { statements: 92, branches: 79, functions: 99, lines: 96 },
        'src/nest/auth/**/*.ts': { statements: 93, branches: 85, functions: 95, lines: 96 },
        'src/nest/backup/**/*.ts': { statements: 96, branches: 92, functions: 99, lines: 98 },
        'src/nest/booking-import/**/*.ts': { statements: 48, branches: 28, functions: 56, lines: 52 },
        'src/nest/budget/**/*.ts': { statements: 91, branches: 77, functions: 97, lines: 95 },
        'src/nest/calendar/**/*.ts': { statements: 96, branches: 93, functions: 99, lines: 99 },
        'src/nest/categories/**/*.ts': { statements: 99, branches: 80, functions: 99, lines: 99 },
        'src/nest/collab/**/*.ts': { statements: 92, branches: 85, functions: 94, lines: 97 },
        'src/nest/collections/**/*.ts': { statements: 83, branches: 70, functions: 91, lines: 92 },
        'src/nest/common/**/*.ts': { statements: 95, branches: 89, functions: 99, lines: 97 },
        'src/nest/config/**/*.ts': { statements: 99, branches: 100, functions: 99, lines: 99 },
        'src/nest/database/**/*.ts': { statements: 99, branches: 100, functions: 99, lines: 99 },
        'src/nest/day-notes/**/*.ts': { statements: 92, branches: 83, functions: 99, lines: 99 },
        'src/nest/days/**/*.ts': { statements: 92, branches: 82, functions: 98, lines: 97 },
        'src/nest/feeds/**/*.ts': { statements: 91, branches: 83, functions: 83, lines: 91 },
        'src/nest/files/**/*.ts': { statements: 97, branches: 95, functions: 99, lines: 98 },
        'src/nest/health/**/*.ts': { statements: 99, branches: 65, functions: 99, lines: 99 },
        'src/nest/help/**/*.ts': { statements: 81, branches: 70, functions: 99, lines: 86 },
        'src/nest/integrations/**/*.ts': { statements: 19, branches: 0, functions: 10, lines: 19 },
        'src/nest/journey/**/*.ts': { statements: 90, branches: 84, functions: 83, lines: 91 },
        'src/nest/llm-parse/**/*.ts': { statements: 91, branches: 85, functions: 85, lines: 94 },
        'src/nest/maps/**/*.ts': { statements: 92, branches: 85, functions: 95, lines: 95 },
        'src/nest/memories/**/*.ts': { statements: 88, branches: 80, functions: 95, lines: 90 },
        'src/nest/notifications/**/*.ts': { statements: 83, branches: 72, functions: 84, lines: 86 },
        'src/nest/oauth/**/*.ts': { statements: 96, branches: 95, functions: 97, lines: 97 },
        'src/nest/oidc/**/*.ts': { statements: 88, branches: 83, functions: 91, lines: 92 },
        'src/nest/packing/**/*.ts': { statements: 92, branches: 83, functions: 98, lines: 97 },
        'src/nest/permissions/**/*.ts': { statements: 97, branches: 92, functions: 99, lines: 97 },
        'src/nest/photos/**/*.ts': { statements: 95, branches: 92, functions: 89, lines: 95 },
        // Landed on dev without an entry, so it sat on the 80 catch-all while
        // measuring 99.5/99.0/97.4/100 — the gap the per-domain ratchet exists to
        // close. Set with a few points of slack against the Linux/Windows drift.
        'src/nest/place-enrichment/**/*.ts': { statements: 96, branches: 95, functions: 94, lines: 97 },
        'src/nest/place-photos/**/*.ts': { statements: 79, branches: 70, functions: 72, lines: 80 },
        'src/nest/places/**/*.ts': { statements: 90, branches: 80, functions: 96, lines: 94 },
        'src/nest/platform/**/*.ts': { statements: 99, branches: 99, functions: 99, lines: 99 },
        'src/nest/plugins/**/*.ts': { statements: 86, branches: 81, functions: 78, lines: 89 },
        'src/nest/query-helpers/**/*.ts': { statements: 90, branches: 75, functions: 99, lines: 92 },
        'src/nest/realtime/**/*.ts': { statements: 99, branches: 100, functions: 99, lines: 99 },
        'src/nest/reservations/**/*.ts': { statements: 92, branches: 83, functions: 93, lines: 95 },
        'src/nest/settings/**/*.ts': { statements: 85, branches: 68, functions: 99, lines: 87 },
        'src/nest/share/**/*.ts': { statements: 97, branches: 87, functions: 99, lines: 99 },
        'src/nest/system-notices/**/*.ts': { statements: 99, branches: 99, functions: 99, lines: 99 },
        'src/nest/tags/**/*.ts': { statements: 97, branches: 89, functions: 99, lines: 99 },
        'src/nest/todo/**/*.ts': { statements: 90, branches: 82, functions: 99, lines: 99 },
        'src/nest/transit/**/*.ts': { statements: 92, branches: 83, functions: 97, lines: 94 },
        'src/nest/trip-invite/**/*.ts': { statements: 91, branches: 93, functions: 93, lines: 89 },
        'src/nest/trip-membership/**/*.ts': { statements: 99, branches: 86, functions: 99, lines: 99 },
        'src/nest/trip-members/**/*.ts': { statements: 93, branches: 89, functions: 99, lines: 94 },
        'src/nest/trip-read-model/**/*.ts': { statements: 97, branches: 96, functions: 99, lines: 97 },
        'src/nest/trips/**/*.ts': { statements: 92, branches: 82, functions: 91, lines: 94 },
        'src/nest/unsplash/**/*.ts': { statements: 97, branches: 82, functions: 99, lines: 96 },
        'src/nest/vacay/**/*.ts': { statements: 82, branches: 66, functions: 89, lines: 86 },
        'src/nest/weather/**/*.ts': { statements: 93, branches: 78, functions: 91, lines: 97 },
        'src/nest/**/*.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
  resolve: {
    alias: {
      // Use the package SOURCE in tests: the built CJS dist would be
      // externalized by vite and its require('@modelcontextprotocol/sdk/...')
      // would hit the SDK's unresolvable exports map natively (production
      // resolves it via the tsconfig-paths/register runtime hook instead).
      // Inlining the source also applies the SWC decorator transform and the
      // SDK aliases below, and drops the build-freshness dependency.
      '@trek/nest-mcp': new URL('../nest-mcp/src/index.ts', import.meta.url).pathname,
      // MCP SDK's exports map uses extension-less wildcard targets that neither
      // Node nor Vite can resolve. Point directly at the CJS dist files.
      // Paths are relative to the monorepo root (packages are hoisted there).
      '@modelcontextprotocol/sdk/server/mcp': new URL(
          '../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.js',
          import.meta.url
      ).pathname,
      '@modelcontextprotocol/sdk/server/streamableHttp': new URL(
          '../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/streamableHttp.js',
          import.meta.url
      ).pathname,
      '@modelcontextprotocol/sdk/inMemory': new URL(
          '../node_modules/@modelcontextprotocol/sdk/dist/cjs/inMemory.js',
          import.meta.url
      ).pathname,
      '@modelcontextprotocol/sdk/client/index': new URL(
          '../node_modules/@modelcontextprotocol/sdk/dist/cjs/client/index.js',
          import.meta.url
      ).pathname,
    },
  },
});