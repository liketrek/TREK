import base from './vitest.config';

import { defineConfig } from 'vitest/config';

/**
 * The Postgres lane (`npm run test:pg`): the suites that boot the whole app
 * through `buildApp()` on the real database module, each file on a database
 * of its own copied from one migrated template, plus the Postgres-only suites
 * under tests/postgres/. TREK_TEST_DB_URL names a database the lane may create
 * and drop databases from (`postgres://…/postgres`); without it the lane fails.
 *
 * The other suites stay on SQLite: they mock `db/database` with an in-memory
 * snapshot, seed it with raw SQLite, or are about the SQLite file itself. Two
 * that boot the app stay there too: tours-hike and tours-plan-types move a
 * faked setTimeout on by a tenth of a second per turn of the event loop until
 * a tool call ends, which a synchronous SQLite answers within a few turns and
 * a database over the network does not (the MCP request times out on the
 * faked clock).
 */
const POSTGRES_LANE = [
  'tests/postgres/**/*.test.ts',
  'tests/e2e/ai-own-server.e2e.test.ts',
  'tests/e2e/assistant-attachments.e2e.test.ts',
  'tests/e2e/assistant-book-cards.e2e.test.ts',
  'tests/e2e/assistant-book-design.e2e.test.ts',
  'tests/e2e/assistant-collections.e2e.test.ts',
  'tests/e2e/assistant-home.e2e.test.ts',
  'tests/e2e/assistant-journey.e2e.test.ts',
  'tests/e2e/assistant-page-images.e2e.test.ts',
  'tests/e2e/assistant-renders.e2e.test.ts',
  'tests/e2e/assistant-roadtrip.e2e.test.ts',
  'tests/e2e/assistant-tour-files.e2e.test.ts',
  'tests/e2e/assistant-tours.e2e.test.ts',
  'tests/e2e/assistant.e2e.test.ts',
  'tests/e2e/collab-mcp.e2e.test.ts',
  'tests/e2e/journey-book-design.e2e.test.ts',
  'tests/e2e/journey-book.e2e.test.ts',
  'tests/e2e/packing-mcp.e2e.test.ts',
  'tests/e2e/reservations-read.e2e.test.ts',
  'tests/e2e/storage-reclaim.e2e.test.ts',
  'tests/integration/book-body-size.test.ts',
  'tests/integration/storage-reclaim-sources.test.ts',
  'tests/integration/storage-release.test.ts',
  'tests/integration/trip-invite-removal.test.ts',
  'tests/integration/trip-journal-link.test.ts',
  'tests/unit/nest/validate-body-contracts.test.ts',
  'tests/unit/nest/validate-managed-routes.test.ts',
];

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: POSTGRES_LANE,
    exclude: [],
    globalSetup: ['tests/postgres/global-setup.ts'],
    setupFiles: [...(base.test?.setupFiles as string[]), 'tests/postgres/setup.ts'],
    // Every file boots the app on a database of its own; the lane is about
    // the engine, so coverage stays the SQLite lane's measure.
    coverage: { ...base.test?.coverage, enabled: false, thresholds: undefined },
  },
});
