import { databaseUrl, TEMPLATE_DATABASE, WORKER_DATABASE_PREFIX, withAdmin } from './databases';

import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Runs once per `npm run test:pg`, before any worker starts: the Postgres
 * counterpart of tests/global-setup.ts's schema snapshot. One template
 * database is created and brought to the current schema the way a first boot
 * does (baseline, migrations after its cut, seeders); every test file then
 * gets a copy of it (tests/postgres/setup.ts), which Postgres makes at the
 * file level, far faster than migrating per file.
 *
 * TREK_TEST_DB_URL is required: a lane that skipped without it would pass
 * having tested nothing.
 */
export async function setup(): Promise<void> {
  const adminUrl = process.env.TREK_TEST_DB_URL;
  if (!adminUrl) {
    throw new Error(
      'The Postgres lane needs TREK_TEST_DB_URL: a database it may create and drop databases from, ' +
        'e.g. postgres://postgres:trek@127.0.0.1:55432/postgres.',
    );
  }

  await checkServerVersion(adminUrl);

  // Left behind by an earlier run that was killed; nothing else uses these names.
  await dropLaneDatabases(adminUrl);
  await withAdmin(adminUrl, (run) => run(`CREATE DATABASE "${TEMPLATE_DATABASE}"`));

  // A child process under tsx, as tests/global-setup.ts does, for the same
  // reason: globalSetup runs outside vitest's transform pipeline.
  execFileSync(process.execPath, ['--import', 'tsx', path.join(__dirname, 'build-template.ts')], {
    cwd: path.join(__dirname, '..', '..'),
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
      LOG_LEVEL: 'error',
      TREK_DB_URL: databaseUrl(adminUrl, TEMPLATE_DATABASE),
    },
  });
}

/**
 * Prints the server's version, so a run says what it tested. CI runs the lane
 * once per supported major and sets TREK_TEST_PG_MAJOR to the one its service
 * was meant to be: a service that came up with another version (an image tag
 * that moved, a typo in the matrix) fails the run instead of passing for it.
 */
async function checkServerVersion(adminUrl: string): Promise<void> {
  const [row] = await withAdmin(adminUrl, (run) =>
    run<{ server_version: string; server_version_num: string }>(
      "select current_setting('server_version') as server_version, " +
        "current_setting('server_version_num') as server_version_num",
    ),
  );
  const major = Math.floor(Number(row.server_version_num) / 10000);
  process.stdout.write(`[postgres lane] PostgreSQL ${row.server_version}\n`);
  const expected = process.env.TREK_TEST_PG_MAJOR;
  if (expected && Number(expected) !== major) {
    throw new Error(`TREK_TEST_PG_MAJOR is ${expected}, but the server at TREK_TEST_DB_URL runs PostgreSQL ${major}.`);
  }
}

/** The template and every worker's copy: names the lane alone uses (a prefix compared as text, not a LIKE pattern). */
async function dropLaneDatabases(adminUrl: string): Promise<void> {
  await withAdmin(adminUrl, async (run) => {
    const lane = await run<{ datname: string }>(
      'select datname from pg_database where datname = ? or left(datname, length(?)) = ?',
      [TEMPLATE_DATABASE, WORKER_DATABASE_PREFIX, WORKER_DATABASE_PREFIX],
    );
    await Promise.all(lane.map((row) => run(`DROP DATABASE IF EXISTS "${row.datname}" WITH (FORCE)`)));
  });
}

/** After the run: the lane leaves no database behind. */
export async function teardown(): Promise<void> {
  const adminUrl = process.env.TREK_TEST_DB_URL;
  if (adminUrl) await dropLaneDatabases(adminUrl);
}
