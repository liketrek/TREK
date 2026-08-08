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
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      // The plugin child bootstrap runs in a forked subprocess via tsx, so the
      // parent's instrumentation can't measure it; it's exercised end-to-end by
      // the supervisor integration test instead. Everything else in the plugin
      // module runs in-process and is unit-tested.
      exclude: ['src/nest/plugins/runtime/plugin-host-entry.ts'],
      // Coverage gate scoped to the new NestJS code only — the legacy codebase
      // is intentionally ungated. Raised to the DoD's >=80% bar once the first
      // module (weather) landed; ratchet further as more modules are migrated.
      thresholds: {
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