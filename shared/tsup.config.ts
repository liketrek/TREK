import { defineConfig } from 'tsup'

export default defineConfig({
  // Root barrel + i18n metadata barrel + one entry per locale (lazy-load chunks)
  entry: ['src/index.ts', 'src/i18n/index.ts', 'src/i18n/*/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['zod'],
})
