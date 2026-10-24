import { defineConfig } from 'vitest/config';
import base from './vitest.config';

// One slice of the suite, for a Server Tests shard in test.yml
// (`vitest run --config vitest.shard.config.ts --coverage --shard=i/n`). The
// slice hands its coverage on in a blob report, and the Server Coverage job
// merges the blobs and checks the whole against the per-domain thresholds in
// vitest.config.ts. A slice alone sits far below them, so it neither checks
// them nor writes a report of its own. tests/unit/coverage-thresholds.test.ts
// reads vitest.config.ts itself, so it still sees every entry.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    coverage: { ...base.test?.coverage, thresholds: undefined, reporter: [] },
  },
});
