import { UserNoticeDismissals } from '../../../../src/db/entities/UserNoticeDismissals.entity';
import type { UserNoticeDismissalsRepository } from '../../../../src/db/repositories/UserNoticeDismissals.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, type TestUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: UserNoticeDismissalsRepository;
let user: TestUser;
let otherUser: TestUser;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(UserNoticeDismissals);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  user = createUser(testDb).user;
  otherUser = createUser(testDb).user;
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function insertRaw(userId: number, noticeId: string, dismissedAt: number, dismissedAppVersion: string | null): void {
  testDb
    .prepare(
      'INSERT INTO user_notice_dismissals (user_id, notice_id, dismissed_at, dismissed_app_version) VALUES (?, ?, ?, ?)',
    )
    .run(userId, noticeId, dismissedAt, dismissedAppVersion);
}

describe('user_notice_dismissals — the (user_id, notice_id) composite PK the ON CONFLICT target relies on (Plan 3f Task 0 R5/§14, Task 6)', () => {
  it("UNDREPO-SCHEMA-001: PRAGMA table_info('user_notice_dismissals') reports a 2-column PRIMARY KEY over exactly (user_id, notice_id), matching the migration DDL", () => {
    const cols = testDb.prepare("PRAGMA table_info('user_notice_dismissals')").all() as { name: string; pk: number }[];
    const pkCols = cols
      .filter((c) => c.pk > 0)
      .sort((a, b) => a.pk - b.pk)
      .map((c) => c.name);
    expect(pkCols).toEqual(['user_id', 'notice_id']);
  });

  it('UNDREPO-SCHEMA-002: the entity metadata declares the same 2-property composite PK, naming the RELATION property, not its persist(false) twin', () => {
    const meta = t.orm.getMetadata(UserNoticeDismissals);
    expect(
      meta
        .getPrimaryProps()
        .map((p) => p.name)
        .sort(),
    ).toEqual(['notice_id', 'user'].sort());
  });
});

describe('UserNoticeDismissalsRepository — reads (SN4 parity)', () => {
  it('UNDREPO-001 — listForUser matches `SELECT notice_id, dismissed_app_version FROM user_notice_dismissals WHERE user_id = ?`, fully seeded across several notices/versions, and never leaks another user', async () => {
    insertRaw(user.id, 'welcome-v1', 1_700_000_000_000, null);
    insertRaw(user.id, 'release-notes', 1_700_000_001_000, '4.2.1');
    insertRaw(user.id, 'v3014-whitespace-collision', 1_700_000_002_000, '3.0.14');
    insertRaw(otherUser.id, 'welcome-v1', 1_700_000_003_000, '4.3.0'); // a different user's row — must not leak in

    const legacy = (
      testDb
        .prepare('SELECT notice_id, dismissed_app_version FROM user_notice_dismissals WHERE user_id = ?')
        .all(user.id) as { notice_id: string; dismissed_app_version: string | null }[]
    ).sort((a, b) => a.notice_id.localeCompare(b.notice_id));
    const converted = (await repo.listForUser(user.id))
      .map((r) => ({ notice_id: r.notice_id, dismissed_app_version: r.dismissed_app_version }))
      .sort((a, b) => a.notice_id.localeCompare(b.notice_id));

    expect(converted.length).toBe(3);
    expect(converted).toEqual(legacy);
    // Rule 16: a NULL `dismissed_app_version` stays `null` on the row, never `undefined`.
    expect(converted.find((r) => r.notice_id === 'welcome-v1')?.dismissed_app_version).toBeNull();
  });

  it('UNDREPO-002 — listForUser is empty for a user with no dismissals', async () => {
    expect(await repo.listForUser(user.id)).toEqual([]);
  });
});

describe('UserNoticeDismissalsRepository — writes (SN5, R5)', () => {
  it('UNDREPO-UPSERT-SQL: em.upsert renders `insert into "user_notice_dismissals" ... on conflict (`user_id`, `notice_id`) do update set ...` — the composite-PK conflict target Task 0\'s R5 worked example pinned (re-checked against Task 3\'s `NotificationChannelPreferences.repository.test.ts` NCPREPO-UPSERT-SQL pin, not re-derived), checked directly against the rendered SQL, not assumed from onConflictFields alone', async () => {
    const connection = t.orm.em.getConnection();
    const spy = vi.spyOn(connection, 'execute');
    try {
      // Insert branch: no existing row.
      await repo.upsertDismissal(user.id, 'release-notes', 1_700_000_000_000, '4.2.1');
      expect(
        testDb
          .prepare(
            'SELECT dismissed_at, dismissed_app_version FROM user_notice_dismissals WHERE user_id = ? AND notice_id = ?',
          )
          .get(user.id, 'release-notes'),
      ).toEqual({ dismissed_at: 1_700_000_000_000, dismissed_app_version: '4.2.1' });

      const insertSql = spy.mock.calls
        .map(([sql]) => sql)
        .find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(insertSql).toContain('on conflict (`user_id`, `notice_id`)');
      spy.mockClear();

      // Merge branch: re-dismissing after a version bump — SAME conflict target, updates
      // the existing row in place rather than inserting a second one (the composite PK
      // is what makes this an UPDATE, not an INSERT, on the second call).
      await repo.upsertDismissal(user.id, 'release-notes', 1_700_000_050_000, '4.3.0');
      expect(
        testDb
          .prepare(
            'SELECT dismissed_at, dismissed_app_version FROM user_notice_dismissals WHERE user_id = ? AND notice_id = ?',
          )
          .get(user.id, 'release-notes'),
      ).toEqual({ dismissed_at: 1_700_000_050_000, dismissed_app_version: '4.3.0' });
      expect(
        (
          testDb
            .prepare('SELECT COUNT(*) as c FROM user_notice_dismissals WHERE user_id = ? AND notice_id = ?')
            .get(user.id, 'release-notes') as { c: number }
        ).c,
      ).toBe(1);

      const mergeSql = spy.mock.calls
        .map(([sql]) => sql)
        .find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(mergeSql).toContain('on conflict (`user_id`, `notice_id`)');
    } finally {
      spy.mockRestore();
    }
  });

  it('UNDREPO-003 — upsertDismissal scopes to exactly (user, notice) — a different user or a different notice for the same user is untouched', async () => {
    await repo.upsertDismissal(user.id, 'release-notes', 1_700_000_000_000, '4.2.1');
    await repo.upsertDismissal(user.id, 'welcome-v1', 1_700_000_001_000, '4.0.0');
    await repo.upsertDismissal(otherUser.id, 'release-notes', 1_700_000_002_000, '4.1.0');

    expect((testDb.prepare('SELECT COUNT(*) as c FROM user_notice_dismissals').get() as { c: number }).c).toBe(3);
    expect(
      testDb
        .prepare('SELECT dismissed_app_version FROM user_notice_dismissals WHERE user_id = ? AND notice_id = ?')
        .get(user.id, 'release-notes'),
    ).toEqual({ dismissed_app_version: '4.2.1' });
    expect(
      testDb
        .prepare('SELECT dismissed_app_version FROM user_notice_dismissals WHERE user_id = ? AND notice_id = ?')
        .get(otherUser.id, 'release-notes'),
    ).toEqual({ dismissed_app_version: '4.1.0' });
  });
});
