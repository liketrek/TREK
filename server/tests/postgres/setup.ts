// The Postgres lane's per-file setup (vitest.pg.config.ts), after tests/setup.ts:
// every test file runs on a fresh copy of the migrated template, under a name of
// its worker's own, so files never see each other's rows and workers never share
// a database. TREK_DB_URL is set here, before the test file imports anything
// that reads it (src/mikro-orm.config.ts reads it on import); the copy itself is
// made in a beforeAll, which runs before the test file's own (where the app
// connects).
import { databaseUrl, TEMPLATE_DATABASE, WORKER_DATABASE_PREFIX, withAdmin } from './databases';

import { beforeAll } from 'vitest';

/** Copies of the template are made one at a time: Postgres refuses to copy a template another copy is reading. */
const COPY_LOCK = 0x54524b54;
const COPY_ATTEMPTS = 3;
const COPY_RETRY_MS = 500;
const COPY_TIMEOUT_MS = 60_000;

const adminUrl = process.env.TREK_TEST_DB_URL as string;
const poolId = process.env.VITEST_POOL_ID ?? '0';
if (!/^\d+$/.test(poolId)) throw new Error(`unexpected VITEST_POOL_ID ${poolId}`);
const database = `${WORKER_DATABASE_PREFIX}${poolId}`;

process.env.TREK_DB_URL = databaseUrl(adminUrl, database);

async function copyTemplate(attempt = 1): Promise<void> {
  try {
    await withAdmin(adminUrl, async (run) => {
      // One connection (withAdmin's pool holds one), so the session lock covers both statements.
      await run('select pg_advisory_lock(?)', [COPY_LOCK]);
      try {
        await run(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
        await run(`CREATE DATABASE "${database}" TEMPLATE "${TEMPLATE_DATABASE}"`);
      } finally {
        await run('select pg_advisory_unlock(?)', [COPY_LOCK]);
      }
    });
  } catch (err) {
    if (attempt >= COPY_ATTEMPTS) throw err;
    await new Promise((resolve) => setTimeout(resolve, COPY_RETRY_MS * attempt));
    await copyTemplate(attempt + 1);
  }
}

beforeAll(() => copyTemplate(), COPY_TIMEOUT_MS);
