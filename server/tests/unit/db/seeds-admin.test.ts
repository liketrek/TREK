/**
 * First-run admin seeding — the live MikroORM `AdminSeeder` (`db/seeders/AdminSeeder.ts`),
 * not the retired `db/seeds.ts::seedAdminAccount` this file used to test (that function
 * has no production caller any more — `db/orm.ts`'s own comment says it "replaces
 * createTables() → runMigrations() → runSeeds()"). Same behavior, same env reads
 * (`readEnv().adminBootstrap`), redirected to the seeder that actually runs at boot.
 *
 * Covers the #1339 fix: ADMIN_EMAIL/ADMIN_PASSWORD only take effect on first run
 * (empty database). Setting them once a user exists must no longer be silent — it
 * has to warn — and a partial config (only one of the two) must warn too instead
 * of quietly falling back to a generated password.
 */
import { Users } from '../../../src/db/entities/Users.entity';
import { AdminSeeder } from '../../../src/db/seeders/AdminSeeder';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow } from '../../helpers/factories/rows';
import { makeAdmin } from '../../helpers/factories/users';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import type Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ENV_KEYS = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'DEMO_MODE', 'OIDC_ONLY', 'OIDC_ISSUER', 'OIDC_CLIENT_ID'];

function countUsers(orm: TestOrm): Promise<number> {
  return countRows(orm, Users);
}

async function insertExistingUser(orm: TestOrm): Promise<void> {
  await makeAdmin(orm, { username: 'admin', email: 'admin@trek.local' });
}

function userByEmail(orm: TestOrm, email: string) {
  return findRow(orm, Users, { email });
}

describe('AdminSeeder — first-run admin', () => {
  let db: Database.Database;
  let t: TestOrm;
  let saved: Record<string, string | undefined>;

  beforeEach(async () => {
    db = createSnapshotTestDb();
    t = await createTestOrm(db);
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(async () => {
    await t.close();
    db.close();
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.restoreAllMocks();
  });

  it('creates the admin from ADMIN_EMAIL/ADMIN_PASSWORD on an empty database', async () => {
    process.env.ADMIN_EMAIL = 'me@example.com';
    process.env.ADMIN_PASSWORD = 'S3cret-pw';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await new AdminSeeder().run(t.em);

    const user = await userByEmail(t, 'me@example.com');
    expect(user).not.toBeNull();
    expect(user!.role).toBe('admin');
    expect(user!.must_change_password).toBe(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and creates nothing when ADMIN_* is set but a user already exists', async () => {
    await insertExistingUser(t);
    process.env.ADMIN_EMAIL = 'new@example.com';
    process.env.ADMIN_PASSWORD = 'whatever';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await new AdminSeeder().run(t.em);

    expect(await countUsers(t)).toBe(1);
    expect(await userByEmail(t, 'new@example.com')).toBeNull();
    const msg = warn.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(msg).toContain('only apply on first run');
  });

  it('stays silent when no admin env is set and a user already exists', async () => {
    await insertExistingUser(t);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await new AdminSeeder().run(t.em);

    expect(await countUsers(t)).toBe(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns about a partial config and falls back to a generated password', async () => {
    process.env.ADMIN_EMAIL = 'me@example.com'; // ADMIN_PASSWORD intentionally missing
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await new AdminSeeder().run(t.em);

    // Falls back to the default local admin, NOT the provided email.
    expect(await userByEmail(t, 'admin@trek.local')).not.toBeNull();
    expect(await userByEmail(t, 'me@example.com')).toBeNull();
    const msg = warn.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(msg).toContain('Only one of ADMIN_EMAIL/ADMIN_PASSWORD');
  });
});
