/**
 * The hourly demo reset keeps everybody signed in.
 *
 * The reset copies the baseline over the live database file. That baseline
 * was saved at first seed, before anybody logged in, so it holds no
 * `user_sessions` rows, and a session token whose row is gone is refused.
 * Without carrying the active rows across the swap, every demo visitor and
 * the demo admin would get a 401 on the hour.
 *
 * The database port is a stand-in whose `replace()` plays the file swap by
 * emptying `user_sessions`, which is exactly what the baseline brings back.
 * The reads and writes around it run for real against the snapshot schema.
 */
import { UserSessions } from '../../../src/db/entities/UserSessions.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { resetDemoUser } from '../../../src/demo/demo-reset';
import { verifyJwtAndLoadUser } from '../../../src/nest/auth-core/jwt-verify';
import type { DatabaseBackupStrategy } from '../../../src/nest/database/database-backup.interface';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { SessionsService } from '../../../src/nest/sessions/sessions.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, deleteRows, findRows } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import type Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const BASELINE = path.resolve(__dirname, '..', '..', '..', 'data', 'travel-baseline.db');

describe('demo reset and the signed-in sessions', () => {
  let ormDb: Database.Database;
  let t: TestOrm;
  /** What the baseline swap does to the live rows; the default empties user_sessions. */
  let swap: () => Promise<void>;
  let database: DatabaseBackupStrategy;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    ormDb = createSnapshotTestDb();
    t = await createTestOrm(ormDb);
    // After the snapshot DB is built: it locates the migrations through fs.existsSync.
    vi.spyOn(fs, 'existsSync').mockImplementation(((p: fs.PathLike) => String(p) === BASELINE) as typeof fs.existsSync);
    swap = async () => {
      await deleteRows(t, UserSessions);
    };
    database = {
      canSnapshot: () => true,
      checkpoint: vi.fn(async () => undefined),
      replace: vi.fn(async () => {
        await swap();
        return { reopenError: undefined };
      }),
    } as unknown as DatabaseBackupStrategy;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await t.close();
    ormDb.close();
  });

  const verify = (token: string) => verifyJwtAndLoadUser(token, t.repo(Users), t.repo(UserSessions));

  it('DEMORESET-SESS-001: a session signed in before the reset still authenticates after it', async () => {
    const { user } = await makeUser(t, { email: 'demo-visitor@example.test' });
    const sessions = new SessionsService(t.repo(UserSessions));
    const token = await sessions.issue({ id: user.id, pv: 0 }, undefined, { userAgent: 'Visitor' });
    expect((await verify(token))?.id).toBe(user.id);

    await withRequestContext(t.orm, () => resetDemoUser(database));
    t.clear();

    expect(database.replace).toHaveBeenCalled();
    expect((await verify(token))?.id).toBe(user.id);
    const rows = await findRows(t, UserSessions);
    expect(rows.map(({ user_id, user_agent, revoked_at }) => ({ user_id, user_agent, revoked_at }))).toEqual([
      { user_id: user.id, user_agent: 'Visitor', revoked_at: null },
    ]);
  });

  it('DEMORESET-SESS-002: a session that had already ended stays ended', async () => {
    const { user } = await makeUser(t, { email: 'demo-ended@example.test' });
    const sessions = new SessionsService(t.repo(UserSessions));
    const token = await sessions.issue({ id: user.id, pv: 0 });
    await sessions.revokeAll(user.id);

    await withRequestContext(t.orm, () => resetDemoUser(database));
    t.clear();

    expect(await verify(token)).toBeNull();
    expect(await countRows(t, UserSessions)).toBe(0);
  });

  it('DEMORESET-SESS-003: a session whose account the baseline does not hold is not brought back', async () => {
    const { user } = await makeUser(t, { email: 'registered-after-seed@example.test' });
    const sessions = new SessionsService(t.repo(UserSessions));
    const token = await sessions.issue({ id: user.id, pv: 0 });
    swap = async () => {
      await deleteRows(t, UserSessions);
      await deleteRows(t, Users, { id: user.id });
    };

    await withRequestContext(t.orm, () => resetDemoUser(database));
    t.clear();

    expect(await verify(token)).toBeNull();
    expect(await countRows(t, UserSessions)).toBe(0);
  });
});
