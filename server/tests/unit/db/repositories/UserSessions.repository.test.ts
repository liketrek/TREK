import { UserSessions } from '../../../../src/db/entities/UserSessions.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { UserSessionsRepository } from '../../../../src/db/repositories/UserSessions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { deleteRows, findRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let sessions: UserSessionsRepository;

const NOW = '2026-10-08 12:00:00';
const LATER = '2026-11-07 12:00:00';
const EARLIER = '2026-10-01 12:00:00';

beforeAll(async () => {
  t = await createTestOrm(testDb);
  sessions = t.repo(UserSessions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function row(id: string) {
  return findRow(t, UserSessions, { id });
}

function revoke(ids: string[], at: string) {
  return updateRows(t, UserSessions, { id: { $in: ids } }, { revoked_at: at });
}

async function add(
  id: string,
  userId: number,
  overrides: { created_at?: string; expires_at?: string; user_agent?: string | null } = {},
) {
  await sessions.insertSession({
    id,
    user_id: userId,
    created_at: overrides.created_at ?? EARLIER,
    expires_at: overrides.expires_at ?? LATER,
    user_agent: overrides.user_agent ?? null,
  });
}

describe('UserSessionsRepository', () => {
  it('SESSREPO-001: insert writes the row, last_seen_at starting at created_at', async () => {
    const { user } = createUser(testDb);
    await add('s1', user.id, { user_agent: 'Firefox' });
    expect(await row('s1')).toStrictEqual({
      id: 's1',
      user_id: user.id,
      created_at: EARLIER,
      last_seen_at: EARLIER,
      expires_at: LATER,
      revoked_at: null,
      user_agent: 'Firefox',
    });
  });

  it('SESSREPO-002: findActive matches only an unrevoked, unexpired session of that user', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await add('live', user.id);
    await add('expired', user.id, { expires_at: NOW });
    await add('revoked', user.id);
    await revoke(['revoked'], EARLIER);

    expect(await sessions.findActive('live', user.id, NOW)).toEqual({ id: 'live', last_seen_at: EARLIER });
    expect(await sessions.findActive('live', other.id, NOW)).toBeNull();
    expect(await sessions.findActive('expired', user.id, NOW)).toBeNull();
    expect(await sessions.findActive('revoked', user.id, NOW)).toBeNull();
    expect(await sessions.findActive('missing', user.id, NOW)).toBeNull();
  });

  it('SESSREPO-003: touchLastSeen moves last_seen_at only', async () => {
    const { user } = createUser(testDb);
    await add('s1', user.id);
    await sessions.touchLastSeen('s1', NOW);
    expect(await row('s1')).toEqual(
      expect.objectContaining({ last_seen_at: NOW, created_at: EARLIER, expires_at: LATER }),
    );
  });

  it('SESSREPO-004: extendActive moves the expiry of an active session and refuses an ended one', async () => {
    const { user } = createUser(testDb);
    await add('live', user.id);
    await add('revoked', user.id);
    await revoke(['revoked'], EARLIER);

    expect(await sessions.extendActive('live', user.id, NOW, '2026-12-01 00:00:00')).toBe(true);
    expect(await row('live')).toEqual(
      expect.objectContaining({ expires_at: '2026-12-01 00:00:00', last_seen_at: NOW }),
    );
    expect(await sessions.extendActive('revoked', user.id, NOW, '2026-12-01 00:00:00')).toBe(false);
    expect(await row('revoked')).toEqual(expect.objectContaining({ expires_at: LATER }));
  });

  it('SESSREPO-005: listActiveForUser lists the active sessions, most recently seen first', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await add('older', user.id, { user_agent: 'A' });
    await add('newer', user.id, { user_agent: 'B' });
    await add('ended', user.id);
    await add('theirs', other.id);
    await sessions.touchLastSeen('newer', NOW);
    await revoke(['ended'], EARLIER);

    expect(await sessions.listActiveForUser(user.id, NOW)).toEqual([
      { id: 'newer', created_at: EARLIER, last_seen_at: NOW, expires_at: LATER, user_agent: 'B' },
      { id: 'older', created_at: EARLIER, last_seen_at: EARLIER, expires_at: LATER, user_agent: 'A' },
    ]);
  });

  it('SESSREPO-006: revokeForUser ends one session of that user, once', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await add('s1', user.id);

    expect(await sessions.revokeForUser('s1', other.id, NOW)).toBe(false);
    expect(await row('s1')).toEqual(expect.objectContaining({ revoked_at: null }));
    expect(await sessions.revokeForUser('s1', user.id, NOW)).toBe(true);
    expect(await row('s1')).toEqual(expect.objectContaining({ revoked_at: NOW }));
    expect(await sessions.revokeForUser('s1', user.id, NOW)).toBe(false);
  });

  it('SESSREPO-007: revokeAllForUser ends every session of the user, or all but one', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await add('a', user.id);
    await add('b', user.id);
    await add('c', user.id);
    await add('theirs', other.id);

    expect(await sessions.revokeAllForUser(user.id, NOW, 'b')).toBe(2);
    expect(await row('b')).toEqual(expect.objectContaining({ revoked_at: null }));
    expect(await sessions.revokeAllForUser(user.id, NOW)).toBe(1);
    expect(await row('a')).toEqual(expect.objectContaining({ revoked_at: NOW }));
    expect(await row('theirs')).toEqual(expect.objectContaining({ revoked_at: null }));
  });

  it('SESSREPO-008: deleteInactive removes the expired rows, revoked or not, and keeps the rest', async () => {
    const { user } = createUser(testDb);
    await add('live', user.id);
    await add('expired', user.id, { expires_at: NOW });
    await add('revoked', user.id);
    await add('revoked-expired', user.id, { expires_at: EARLIER });
    await revoke(['revoked', 'revoked-expired'], EARLIER);

    expect(await sessions.deleteInactive(NOW)).toBe(2);
    expect(await row('live')).not.toBeNull();
    expect(await row('expired')).toBeNull();
    expect(await row('revoked-expired')).toBeNull();
    // Revoked but not yet expired: kept, it still refuses the token it was derived from.
    expect(await row('revoked')).toEqual(expect.objectContaining({ revoked_at: EARLIER }));
  });

  it('SESSREPO-009: the rows go with their user', async () => {
    const { user } = createUser(testDb);
    await add('s1', user.id);
    await deleteRows(t, Users, { id: user.id });
    expect(await row('s1')).toBeNull();
  });

  it('SESSREPO-010: listActiveToCarry reads every active session with the email of its owner', async () => {
    const { user } = createUser(testDb, { email: 'carry-a@example.test' });
    const { user: other } = createUser(testDb, { email: 'carry-b@example.test' });
    await add('a1', user.id, { user_agent: 'A' });
    await add('b1', other.id);
    await add('expired', user.id, { expires_at: NOW });
    await add('revoked', other.id);
    await revoke(['revoked'], EARLIER);

    expect(await sessions.listActiveToCarry(NOW)).toEqual([
      {
        id: 'a1',
        user_id: user.id,
        email: 'carry-a@example.test',
        created_at: EARLIER,
        last_seen_at: EARLIER,
        expires_at: LATER,
        user_agent: 'A',
      },
      {
        id: 'b1',
        user_id: other.id,
        email: 'carry-b@example.test',
        created_at: EARLIER,
        last_seen_at: EARLIER,
        expires_at: LATER,
        user_agent: null,
      },
    ]);
    expect(await sessions.listActiveToCarry(LATER)).toEqual([]);
  });

  it('SESSREPO-011: restoreCarried puts the rows back for the same account only, and keeps a row already there', async () => {
    const { user } = createUser(testDb, { email: 'kept@example.test' });
    const { user: renamed } = createUser(testDb, { email: 'renamed@example.test' });
    await add('kept', user.id, { user_agent: 'Kept' });
    await add('present', user.id);
    await add('elsewhere', renamed.id);
    const carried = await sessions.listActiveToCarry(NOW);

    // What a swap does: the rows are gone (or ended), and one id now names somebody else.
    await deleteRows(t, UserSessions, { id: { $in: ['kept', 'elsewhere'] } });
    await revoke(['present'], EARLIER);
    await updateRows(t, Users, { id: renamed.id }, { email: 'someone-else@example.test' });
    t.clear();

    expect(await sessions.restoreCarried(carried)).toBe(2);
    expect(await row('kept')).toStrictEqual({
      id: 'kept',
      user_id: user.id,
      created_at: EARLIER,
      last_seen_at: EARLIER,
      expires_at: LATER,
      revoked_at: null,
      user_agent: 'Kept',
    });
    // The swapped-in file's own row wins, ended or not.
    expect(await row('present')).toEqual(expect.objectContaining({ revoked_at: EARLIER }));
    expect(await row('elsewhere')).toBeNull();
  });

  it('SESSREPO-012: restoreCarried drops a session whose user is gone, and does nothing for none', async () => {
    const { user } = createUser(testDb, { email: 'gone@example.test' });
    await add('orphan', user.id);
    const carried = await sessions.listActiveToCarry(NOW);
    await deleteRows(t, Users, { id: user.id });
    t.clear();

    expect(await sessions.restoreCarried(carried)).toBe(0);
    expect(await row('orphan')).toBeNull();
    expect(await sessions.restoreCarried([])).toBe(0);
  });

  it('SESSREPO-013: insertSessionIfAbsent writes a new row and leaves an existing one alone', async () => {
    const { user } = createUser(testDb);
    await sessions.insertSessionIfAbsent({
      id: 'derived',
      user_id: user.id,
      created_at: EARLIER,
      expires_at: LATER,
      user_agent: 'First',
    });
    await revoke(['derived'], NOW);
    t.clear();

    await sessions.insertSessionIfAbsent({
      id: 'derived',
      user_id: user.id,
      created_at: NOW,
      expires_at: '2026-12-01 00:00:00',
      user_agent: 'Second',
    });

    expect(await row('derived')).toStrictEqual({
      id: 'derived',
      user_id: user.id,
      created_at: EARLIER,
      last_seen_at: EARLIER,
      expires_at: LATER,
      revoked_at: NOW,
      user_agent: 'First',
    });
  });
});
