import { defineConfig } from 'vitest/config';

export default defineConfig({
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
  },
});