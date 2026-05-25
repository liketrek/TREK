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
      include: ['src/**/*.ts'],
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
      // @trek/shared — Zod contract package (tests resolve it to TS source,
      // mirroring the tsconfig `paths` the tsx runtime uses).
      '@trek/shared': new URL('../shared/src/index.ts', import.meta.url).pathname,
      '@modelcontextprotocol/sdk/server/mcp': new URL(
          './node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.js',
          import.meta.url
      ).pathname,
      '@modelcontextprotocol/sdk/server/streamableHttp': new URL(
          './node_modules/@modelcontextprotocol/sdk/dist/cjs/server/streamableHttp.js',
          import.meta.url
      ).pathname,
      '@modelcontextprotocol/sdk/inMemory': new URL(
          './node_modules/@modelcontextprotocol/sdk/dist/cjs/inMemory.js',
          import.meta.url
      ).pathname,
      '@modelcontextprotocol/sdk/client/index': new URL(
          './node_modules/@modelcontextprotocol/sdk/dist/cjs/client/index.js',
          import.meta.url
      ).pathname,
    },
    // The server build emits @trek/shared next to its source (shared/src/*.js,
    // needed by the prod dist via tsc-alias). Vite's default extension order
    // prefers .js over .ts, so after a build the tests would load that compiled
    // CJS instead of the source — and its `require('zod')` is unresolvable from
    // the shared/ dir on CI (only server deps are installed there). Resolve .ts
    // first so tests always run the source, whose zod import resolves via Vite.
    extensions: ['.ts', '.mts', '.mjs', '.js', '.cts', '.cjs', '.tsx', '.jsx', '.json'],
  },
});