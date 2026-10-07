import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { AuditLog } from '../../../../src/db/entities/AuditLog.entity';
import type { AuditLogRepository } from '../../../../src/db/repositories/AuditLog.repository';
import { DB_TIMESTAMP_RE } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let auditLog: AuditLogRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  auditLog = t.repo(AuditLog);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('AuditLogRepository', () => {
  it('AUDITREPO-001: insert writes the legacy column set, matching the SELECT * row exactly', async () => {
    const { user } = createUser(testDb);
    await auditLog.insertEntry({
      user_id: user.id,
      action: 'trip.create',
      resource: 'trip',
      details: '{"title":"Rome"}',
      ip: '1.2.3.4',
    });
    const row = testDb.prepare('SELECT * FROM audit_log').get() as { id: number; created_at: string };
    expect(row).toStrictEqual({
      id: expect.any(Number),
      created_at: expect.stringMatching(DB_TIMESTAMP_RE),
      user_id: user.id,
      action: 'trip.create',
      resource: 'trip',
      details: '{"title":"Rome"}',
      ip: '1.2.3.4',
    });
  });

  it('AUDITREPO-002: created_at is left to the column default, as text, in the YYYY-MM-DD HH:MM:SS shape', async () => {
    const { user } = createUser(testDb);
    await auditLog.insertEntry({ user_id: user.id, action: 'user.login', resource: null, details: null, ip: null });
    const stored = testDb.prepare('SELECT created_at, typeof(created_at) AS kind FROM audit_log').get() as {
      created_at: string;
      kind: string;
    };
    expect(stored.kind).toBe('text');
    expect(stored.created_at).toMatch(DB_TIMESTAMP_RE);
  });

  it('AUDITREPO-003: a null user writes a null user_id twin, not a foreign-key value', async () => {
    await auditLog.insertEntry({ user_id: null, action: 'user.login', resource: null, details: null, ip: null });
    const row = testDb.prepare('SELECT user_id FROM audit_log').get() as { user_id: number | null };
    expect(row.user_id).toBeNull();
  });

  it('AUDITREPO-004: null resource/details/ip are stored as NULL, not the string "null"', async () => {
    const { user } = createUser(testDb);
    await auditLog.insertEntry({ user_id: user.id, action: 'user.login', resource: null, details: null, ip: null });
    const row = testDb.prepare('SELECT resource, details, ip FROM audit_log').get();
    expect(row).toEqual({ resource: null, details: null, ip: null });
  });

  it('AUDITREPO-005: resolves without returning a value — no id or row is read back', async () => {
    const { user } = createUser(testDb);
    await expect(
      auditLog.insertEntry({ user_id: user.id, action: 'user.login', resource: null, details: null, ip: null }),
    ).resolves.toBeUndefined();
  });

  it('AUDITREPO-006: a native insert, not a unit-of-work flush — another pending entity on the same EM stays unwritten', async () => {
    const { user } = createUser(testDb);
    // Left pending on purpose: `t.em.create` stages a change without flushing it.
    t.em.create(AppSettings, { key: 'pending-during-audit-insert', value: 'should-not-be-written' });
    await auditLog.insertEntry({ user_id: user.id, action: 'trip.create', resource: 'trip', details: null, ip: null });

    const pendingCount = (
      testDb.prepare('SELECT COUNT(*) AS n FROM app_settings WHERE key = ?').get('pending-during-audit-insert') as {
        n: number;
      }
    ).n;
    expect(pendingCount).toBe(0);

    const auditRow = testDb.prepare('SELECT action FROM audit_log').get() as { action: string };
    expect(auditRow.action).toBe('trip.create');
  });

  // ── Plan 3i Task 0 — listPage/count (AD22/AD23) ────────────────────────────

  /** Byte-for-byte AD22 (`admin.service.ts#getAuditLog`). */
  const LEGACY_PAGE_SQL = `
    SELECT a.id, a.created_at, a.user_id, u.username, u.email as user_email, a.action, a.resource, a.details, a.ip
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `;

  it('AUDITREPO-007: listPage matches the legacy joined SELECT exactly for a known user, a deleted (FK SET NULL) user, and a null user_id row', async () => {
    const { user: alice } = createUser(testDb, { username: 'alice', email: 'alice@test.example.com' });
    const { user: bob } = createUser(testDb, { username: 'bob', email: 'bob@test.example.com' });

    await auditLog.insertEntry({
      user_id: alice.id,
      action: 'trip.create',
      resource: 'trip',
      details: '{"title":"Rome"}',
      ip: '1.1.1.1',
    });
    await auditLog.insertEntry({
      user_id: bob.id,
      action: 'trip.update',
      resource: 'trip',
      details: null,
      ip: '2.2.2.2',
    });
    await auditLog.insertEntry({ user_id: null, action: 'user.login', resource: null, details: null, ip: null });

    // bob is deleted after the fact; `audit_log.user_id REFERENCES users(id)
    // ON DELETE SET NULL` fires — this row's own user_id becomes NULL, the
    // same shape a NULL-user_id row has, reached a different way.
    testDb.prepare('DELETE FROM users WHERE id = ?').run(bob.id);

    const legacy = testDb.prepare(LEGACY_PAGE_SQL).all(10, 0);
    const result = await auditLog.listPage(10, 0);
    expect(result).toEqual(legacy);
    // The deleted user's row and the originally-null row both keep their
    // place — a LEFT JOIN never drops the row.
    expect(result).toHaveLength(3);
    expect(result.filter((r) => r.username === null && r.user_email === null)).toHaveLength(2);
    // The known user's row still carries its username/email.
    const aliceRow = result.find((r) => r.user_id === alice.id);
    expect(aliceRow?.username).toBe('alice');
    expect(aliceRow?.user_email).toBe('alice@test.example.com');
  });

  it('AUDITREPO-008: listPage honors LIMIT/OFFSET and ORDER BY a.id DESC, matching the legacy statement', async () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < 5; i++) {
      await auditLog.insertEntry({ user_id: user.id, action: `action.${i}`, resource: null, details: null, ip: null });
    }
    const legacyPage = testDb.prepare(LEGACY_PAGE_SQL).all(2, 1);
    const result = await auditLog.listPage(2, 1);
    expect(result).toEqual(legacyPage);
    expect(result).toHaveLength(2);
  });

  it('AUDITREPO-009: count matches the legacy COUNT(*) over the whole table', async () => {
    const { user } = createUser(testDb);
    await auditLog.insertEntry({ user_id: user.id, action: 'a', resource: null, details: null, ip: null });
    await auditLog.insertEntry({ user_id: null, action: 'b', resource: null, details: null, ip: null });

    const legacyCount = (testDb.prepare('SELECT COUNT(*) as c FROM audit_log').get() as { c: number }).c;
    const result = await auditLog.count();
    expect(result).toBe(legacyCount);
    expect(result).toBe(2);
  });
});
