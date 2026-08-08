import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

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
      // istanbul instruments the source directly, independent of the SWC
      // transform pipeline (the v8 provider under-reports on decorator output —
      // same rationale as server/vitest.config.ts).
      provider: 'istanbul',
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      thresholds: {
        'src/**/*.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
  resolve: {
    alias: {
      // MCP SDK's exports map uses extension-less wildcard targets that neither
      // Node nor Vite can resolve. Point directly at the CJS dist files.
      // Paths are relative to the monorepo root (packages are hoisted there).
      '@modelcontextprotocol/sdk/server/mcp': new URL(
        '../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.js',
        import.meta.url,
      ).pathname,
      '@modelcontextprotocol/sdk/client/index': new URL(
        '../node_modules/@modelcontextprotocol/sdk/dist/cjs/client/index.js',
        import.meta.url,
      ).pathname,
      '@modelcontextprotocol/sdk/inMemory': new URL(
        '../node_modules/@modelcontextprotocol/sdk/dist/cjs/inMemory.js',
        import.meta.url,
      ).pathname,
      '@modelcontextprotocol/sdk/types': new URL(
        '../node_modules/@modelcontextprotocol/sdk/dist/cjs/types.js',
        import.meta.url,
      ).pathname,
    },
  },
});
