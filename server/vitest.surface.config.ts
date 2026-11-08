import { defineConfig } from 'vitest/config';
import base from './vitest.config';

// The tools/list measurement behind `npm run lint:mcp-surface`
// (scripts/mcp-surface.mjs): the base config's transform and setup, with only
// the measuring file picked up and no coverage.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['tests/surface/**/*.measure.ts'],
    coverage: { ...base.test?.coverage, enabled: false, thresholds: undefined },
  },
});
