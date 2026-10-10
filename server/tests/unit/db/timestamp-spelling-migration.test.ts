/**
 * `Migration20200101042700_timestamps_stored_in_one_spelling`: the four
 * DATETIME columns the app also wrote with `toISOString()` end up in the
 * canonical `YYYY-MM-DD HH:MM:SS` text; canonical values, NULLs and anything
 * not in the full ISO shape stay as they are, and a second run changes nothing.
 */
import { Migration20200101042700_timestamps_stored_in_one_spelling } from '../../../src/db/migrations/Migration20200101042700_timestamps_stored_in_one_spelling';
import {
  createMigrationOrm,
  migrateTo,
  pendingNames,
  rawExec,
  rawQuery,
  runMigrationDirect,
} from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101042700_timestamps_stored_in_one_spelling';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function seed(orm: MikroORM): Promise<void> {
  await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')");
  await rawExec(
    orm,
    "INSERT INTO collections (id, owner_id, name, updated_at) VALUES (1, 1, 'iso', '2026-03-04T05:06:07.890Z')",
  );
  await rawExec(
    orm,
    "INSERT INTO collections (id, owner_id, name, updated_at) VALUES (2, 1, 'canonical', '2026-03-04 05:06:07')",
  );
  await rawExec(orm, "INSERT INTO collections (id, owner_id, name, updated_at) VALUES (3, 1, 'null', NULL)");
  await rawExec(
    orm,
    "INSERT INTO collections (id, owner_id, name, updated_at) VALUES (4, 1, 'offset', '2026-03-04T05:06:07+02:00')",
  );
  await rawExec(
    orm,
    "INSERT INTO collections (id, owner_id, name, updated_at) VALUES (5, 1, 'no-millis', '2026-03-04T05:06:07Z')",
  );
  await rawExec(
    orm,
    "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (1, 1, 'h1', '2026-05-06T07:08:09.123Z'), (2, 1, 'h2', '2026-05-06 07:08:09')",
  );
  await rawExec(
    orm,
    "INSERT INTO oauth_clients (id, name, client_id, client_secret_hash) VALUES ('c', 'Client', 'cid', 'x')",
  );
  await rawExec(
    orm,
    `INSERT INTO oauth_tokens (id, client_id, user_id, access_token_hash, refresh_token_hash, access_token_expires_at, refresh_token_expires_at)
     VALUES (1, 'cid', 1, 'a1', 'r1', '2026-07-08T09:10:11.000Z', '2026-08-08T09:10:11.999Z'),
            (2, 'cid', 1, 'a2', 'r2', '2026-07-08 09:10:11', '2026-08-08 09:10:11')`,
  );
}

const read = async (orm: MikroORM) => ({
  collections: await rawQuery(orm, 'SELECT id, updated_at FROM collections ORDER BY id'),
  resets: await rawQuery(orm, 'SELECT id, expires_at FROM password_reset_tokens ORDER BY id'),
  tokens: await rawQuery(
    orm,
    'SELECT id, access_token_expires_at, refresh_token_expires_at FROM oauth_tokens ORDER BY id',
  ),
});

const EXPECTED = {
  collections: [
    { id: 1, updated_at: '2026-03-04 05:06:07' },
    { id: 2, updated_at: '2026-03-04 05:06:07' },
    { id: 3, updated_at: null },
    { id: 4, updated_at: '2026-03-04T05:06:07+02:00' },
    { id: 5, updated_at: '2026-03-04 05:06:07' },
  ],
  resets: [
    { id: 1, expires_at: '2026-05-06 07:08:09' },
    { id: 2, expires_at: '2026-05-06 07:08:09' },
  ],
  tokens: [
    { id: 1, access_token_expires_at: '2026-07-08 09:10:11', refresh_token_expires_at: '2026-08-08 09:10:11' },
    { id: 2, access_token_expires_at: '2026-07-08 09:10:11', refresh_token_expires_at: '2026-08-08 09:10:11' },
  ],
};

describe('timestamp spelling migration', () => {
  it('TSSPELLMIG-001: ISO values become the canonical text, everything else stays', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seed(orm);
      await migrateTo(orm, TARGET);
      expect(await read(orm)).toEqual(EXPECTED);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TSSPELLMIG-002: running it again changes nothing', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seed(orm);
      await migrateTo(orm, TARGET);
      await runMigrationDirect(orm, Migration20200101042700_timestamps_stored_in_one_spelling);
      expect(await read(orm)).toEqual(EXPECTED);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
