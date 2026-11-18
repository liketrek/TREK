import { postgresLane } from './tests/postgres/lane';
import base from './vitest.config';

import { defineConfig } from 'vitest/config';

/**
 * The Postgres lane (`npm run test:pg`): every suite that boots the app on the
 * real database module, each file on a database of its own copied from one
 * migrated template, plus the Postgres-only suites under tests/postgres/.
 * TREK_TEST_DB_URL names a database the lane may create and drop databases
 * from (`postgres://…/postgres`); without it the lane fails.
 *
 * The suites are not listed here: tests/postgres/lane.ts finds them by what
 * they import, and names the few that stay on SQLite by design with their
 * reason. tests/unit/postgres-lane.test.ts, in the SQLite lane, fails when a
 * suite boots the app some way the discovery does not see, when an exclusion
 * goes stale, or when a new suite boots the app over the SQLite snapshot mock
 * instead of the real database module.
 *
 * CI runs the lane once per supported Postgres major (the server-postgres job
 * in test.yml), each in two slices (`--shard=i/2`) like the SQLite suite;
 * every slice builds its own template in global setup.
 */
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: postgresLane(),
    exclude: [],
    globalSetup: ['tests/postgres/global-setup.ts'],
    setupFiles: [...(base.test?.setupFiles as string[]), 'tests/postgres/setup.ts'],
    // Every file boots the app on a database of its own; the lane is about
    // the engine, so coverage stays the SQLite lane's measure.
    coverage: { ...base.test?.coverage, enabled: false, thresholds: undefined },
  },
});
