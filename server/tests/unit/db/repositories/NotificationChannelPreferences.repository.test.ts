import { NotificationChannelPreferences } from '../../../../src/db/entities/NotificationChannelPreferences.entity';
import type { NotificationChannelPreferencesRepository } from '../../../../src/db/repositories/NotificationChannelPreferences.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, type TestUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: NotificationChannelPreferencesRepository;
let user: TestUser;
let otherUser: TestUser;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(NotificationChannelPreferences);
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

function insertRaw(userId: number, eventType: string, channel: string, enabled: number): void {
  testDb
    .prepare('INSERT INTO notification_channel_preferences (user_id, event_type, channel, enabled) VALUES (?, ?, ?, ?)')
    .run(userId, eventType, channel, enabled);
}

describe('notification_channel_preferences — the (user_id, event_type, channel) composite PK the ON CONFLICT target relies on (R5/§14)', () => {
  it("NCPREPO-SCHEMA-001: PRAGMA table_info('notification_channel_preferences') reports a 3-column PRIMARY KEY over exactly (user_id, event_type, channel), matching the migration DDL", () => {
    const cols = testDb.prepare("PRAGMA table_info('notification_channel_preferences')").all() as {
      name: string;
      pk: number;
    }[];
    const pkCols = cols
      .filter((c) => c.pk > 0)
      .sort((a, b) => a.pk - b.pk)
      .map((c) => c.name);
    expect(pkCols).toEqual(['user_id', 'event_type', 'channel']);
  });

  it('NCPREPO-SCHEMA-002: the entity metadata declares the same 3-property composite PK, naming the RELATION property, not its persist(false) twin', () => {
    const meta = t.orm.getMetadata(NotificationChannelPreferences);
    expect(
      meta
        .getPrimaryProps()
        .map((p) => p.name)
        .sort(),
    ).toEqual(['channel', 'event_type', 'user'].sort());
  });
});

describe('NotificationChannelPreferencesRepository — reads (NP2/NP3 parity)', () => {
  it('NCPREPO-001 — findEnabled matches `SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?`, and is null for an absent row (default-enabled)', async () => {
    insertRaw(user.id, 'trip_invite', 'email', 0);
    const legacy = testDb
      .prepare(
        'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
      )
      .get(user.id, 'trip_invite', 'email') as { enabled: number };
    const converted = await repo.findEnabled(user.id, 'trip_invite', 'email');
    // A plain-object equality against the MikroORM-returned entity would also
    // compare its (identical, but differently-shaped) relation/metadata
    // fields — the field values are the parity contract here, not the
    // wrapper shape (the `AppSettingsRepository.getValue` precedent).
    expect(converted?.enabled).toBe(legacy.enabled);
    expect(await repo.findEnabled(user.id, 'trip_invite', 'webhook')).toBeNull();
  });

  it('NCPREPO-002 — listForUser matches `SELECT event_type, channel, enabled FROM notification_channel_preferences WHERE user_id = ?`, fully seeded across every event×channel combination, and never leaks another user', async () => {
    const combos: Array<[string, string, number]> = [
      ['trip_invite', 'email', 0],
      ['trip_invite', 'webhook', 1],
      ['trip_invite', 'inapp', 0],
      ['booking_change', 'email', 1],
      ['booking_change', 'ntfy', 0],
      ['vacay_invite', 'inapp', 0],
    ];
    for (const [event_type, channel, enabled] of combos) insertRaw(user.id, event_type, channel, enabled);
    insertRaw(otherUser.id, 'trip_invite', 'email', 0); // a different user's row — must not leak in

    const legacy = (
      testDb
        .prepare('SELECT event_type, channel, enabled FROM notification_channel_preferences WHERE user_id = ?')
        .all(user.id) as { event_type: string; channel: string; enabled: number }[]
    )
      .map((r) => ({ event_type: r.event_type, channel: r.channel, enabled: r.enabled }))
      .sort((a, b) => a.event_type.localeCompare(b.event_type) || a.channel.localeCompare(b.channel));
    const converted = (await repo.listForUser(user.id))
      .map((r) => ({ event_type: r.event_type, channel: r.channel, enabled: r.enabled }))
      .sort((a, b) => a.event_type.localeCompare(b.event_type) || a.channel.localeCompare(b.channel));

    expect(converted.length).toBe(combos.length);
    expect(converted).toEqual(legacy);
  });
});

describe('NotificationChannelPreferencesRepository — writes (NP5/NP6, R5)', () => {
  it('NCPREPO-UPSERT-SQL: em.upsert renders `insert into "notification_channel_preferences" ... on conflict (`user_id`, `event_type`, `channel`) do update set ...` — the composite-PK conflict target Task 0\'s R5 worked example pinned, checked directly against the rendered SQL, not assumed from onConflictFields alone', async () => {
    const connection = t.orm.em.getConnection();
    const spy = vi.spyOn(connection, 'execute');
    try {
      // Insert branch: no existing row.
      await repo.upsertPreference(user.id, 'trip_invite', 'email', 0);
      expect(
        testDb
          .prepare(
            'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
          )
          .get(user.id, 'trip_invite', 'email'),
      ).toEqual({ enabled: 0 });

      const insertSql = spy.mock.calls
        .map(([sql]) => sql)
        .find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(insertSql).toContain('on conflict (`user_id`, `event_type`, `channel`)');
      spy.mockClear();

      // Merge branch: an existing row, same call shape — the SAME conflict
      // target both creates and merges, matching `OR REPLACE`'s semantics
      // (there is no other non-key column REPLACE would reset that merge
      // does not also set).
      await repo.upsertPreference(user.id, 'trip_invite', 'email', 1);
      expect(
        testDb
          .prepare(
            'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
          )
          .get(user.id, 'trip_invite', 'email'),
      ).toEqual({ enabled: 1 });
      expect(
        (
          testDb
            .prepare(
              'SELECT COUNT(*) as c FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
            )
            .get(user.id, 'trip_invite', 'email') as { c: number }
        ).c,
      ).toBe(1);

      const mergeSql = spy.mock.calls
        .map(([sql]) => sql)
        .find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(mergeSql).toContain('on conflict (`user_id`, `event_type`, `channel`)');
    } finally {
      spy.mockRestore();
    }
  });

  it('NCPREPO-003 — deletePreference matches `DELETE FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?`, scoped to exactly that triple', async () => {
    insertRaw(user.id, 'trip_invite', 'email', 0);
    insertRaw(user.id, 'trip_invite', 'webhook', 0); // a different channel — must survive
    insertRaw(otherUser.id, 'trip_invite', 'email', 0); // a different user — must survive

    expect(await repo.deletePreference(user.id, 'trip_invite', 'email')).toBe(1);
    expect(
      testDb
        .prepare('SELECT * FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?')
        .get(user.id, 'trip_invite', 'email'),
    ).toBeUndefined();
    expect(
      testDb
        .prepare('SELECT * FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?')
        .get(user.id, 'trip_invite', 'webhook'),
    ).toBeDefined();
    expect(
      testDb
        .prepare('SELECT * FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?')
        .get(otherUser.id, 'trip_invite', 'email'),
    ).toBeDefined();
    expect(await repo.deletePreference(user.id, 'trip_invite', 'email')).toBe(0); // already gone — no-op
  });
});
