import { defineConfig } from 'vitest/config';
import base from './vitest.config';

// One slice of the suite, for a Client Tests shard in test.yml
// (`vitest run --config vitest.shard.config.ts --coverage --shard=i/n`). The
// slice hands its coverage on in a blob report, and the Client Coverage job
// merges the blobs and checks the whole against the thresholds in
// vitest.config.ts. A slice alone sits far below them, so it neither checks
// them nor writes a report of its own.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    coverage: { ...base.test?.coverage, thresholds: undefined, reporter: [] },
  },
});
