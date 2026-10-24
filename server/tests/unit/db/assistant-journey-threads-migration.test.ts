/**
 * `Migration20200101046250_an_assistant_conversation_can_be_about_a_journey`:
 * `assistant_threads` is rebuilt so a thread can be about a journey instead of
 * a trip, with `assistant_messages` and `assistant_tool_calls` rebuilt beside
 * it, without losing a row of any of the three; every thread is about exactly
 * one of the two, and each goes with what it is about.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046250_an_assistant_conversation_can_be_about_a_journey';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

async function seedOwner(orm: MikroORM): Promise<void> {
  await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')");
  await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Kyoto')");
  await rawExec(
    orm,
    "INSERT INTO journeys (id, user_id, title, created_at, updated_at) VALUES (20, 1, 'Portugal', 0, 0)",
  );
}

async function seedTripConversation(orm: MikroORM): Promise<void> {
  await rawExec(
    orm,
    `INSERT INTO assistant_threads (id, user_id, trip_id, title, created_at, last_message_at)
     VALUES (1, 1, 10, 'Kyoto day', '2026-10-20 10:00:00', '2026-10-20 11:00:00')`,
  );
  await rawExec(
    orm,
    `INSERT INTO assistant_messages (id, thread_id, role, parts, provider_state, status, model, created_at)
     VALUES (5, 1, 'assistant', '[]', '{"items":[]}', 'awaiting_approval', 'claude', '2026-10-20 10:00:00')`,
  );
  await rawExec(
    orm,
    `INSERT INTO assistant_tool_calls (id, thread_id, message_id, provider_call_id, tool_name, args, preview, state,
       result, undo_until, created_at, decided_at)
     VALUES ('c1', 1, 5, 'toolu_1', 'create_place', '{"name":"A"}', '{}', 'executed', '{"place":{"id":3}}',
       '2026-10-20 10:15:00', '2026-10-20 10:00:00', '2026-10-20 10:01:00')`,
  );
}

describe('Assistant journey threads migration', () => {
  it('JTHRMIG-001: keeps every thread, message and proposed change as it was', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedOwner(orm);
      await seedTripConversation(orm);

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, 'SELECT * FROM assistant_threads')).toEqual([
        {
          id: 1,
          user_id: 1,
          trip_id: 10,
          journey_id: null,
          title: 'Kyoto day',
          created_at: '2026-10-20 10:00:00',
          last_message_at: '2026-10-20 11:00:00',
        },
      ]);
      expect(await rawQuery(orm, 'SELECT * FROM assistant_messages')).toEqual([
        {
          id: 5,
          thread_id: 1,
          role: 'assistant',
          parts: '[]',
          provider_state: '{"items":[]}',
          status: 'awaiting_approval',
          model: 'claude',
          created_at: '2026-10-20 10:00:00',
        },
      ]);
      expect(await rawQuery(orm, 'SELECT * FROM assistant_tool_calls')).toEqual([
        {
          id: 'c1',
          thread_id: 1,
          message_id: 5,
          provider_call_id: 'toolu_1',
          tool_name: 'create_place',
          args: '{"name":"A"}',
          preview: '{}',
          state: 'executed',
          result: '{"place":{"id":3}}',
          undo_until: '2026-10-20 10:15:00',
          created_at: '2026-10-20 10:00:00',
          decided_at: '2026-10-20 10:01:00',
        },
      ]);
      expect(await rawQuery(orm, 'SELECT * FROM pragma_foreign_key_check')).toEqual([]);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('JTHRMIG-002: a thread is about a trip or a journey, never both and never neither', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedOwner(orm);
      await migrateTo(orm, TARGET);

      await rawExec(orm, "INSERT INTO assistant_threads (id, user_id, journey_id, title) VALUES (2, 1, 20, 'Book')");
      expect(await rawQuery(orm, 'SELECT trip_id, journey_id FROM assistant_threads WHERE id = 2')).toEqual([
        { trip_id: null, journey_id: 20 },
      ]);
      await expect(
        rawExec(orm, "INSERT INTO assistant_threads (user_id, trip_id, journey_id, title) VALUES (1, 10, 20, 'Both')"),
      ).rejects.toThrow(/CHECK/);
      await expect(
        rawExec(orm, "INSERT INTO assistant_threads (user_id, title) VALUES (1, 'Neither')"),
      ).rejects.toThrow(/CHECK/);
      await expect(
        rawExec(orm, "INSERT INTO assistant_threads (user_id, journey_id, title) VALUES (1, 999, 'Nowhere')"),
      ).rejects.toThrow(/FOREIGN KEY/);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('JTHRMIG-003: each goes with its journey or its trip, children included, and the keys point at the new tables', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedOwner(orm);
      await seedTripConversation(orm);
      await migrateTo(orm, TARGET);
      await rawExec(orm, "INSERT INTO assistant_threads (id, user_id, journey_id, title) VALUES (2, 1, 20, 'Book')");

      const parents = await rawQuery<{ table: string }>(
        orm,
        `SELECT "table" FROM pragma_foreign_key_list('assistant_tool_calls') ORDER BY "table"`,
      );
      expect(parents.map((row) => row.table)).toEqual(['assistant_messages', 'assistant_threads']);
      const indexes = await rawQuery<{ name: string }>(
        orm,
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'assistant_threads' AND sql IS NOT NULL ORDER BY name",
      );
      expect(indexes.map((row) => row.name)).toEqual([
        'idx_assistant_threads_journey',
        'idx_assistant_threads_trip',
        'idx_assistant_threads_user_journey',
        'idx_assistant_threads_user_trip',
      ]);

      await rawExec(orm, 'DELETE FROM journeys WHERE id = 20');
      expect(await rawQuery(orm, 'SELECT id FROM assistant_threads')).toEqual([{ id: 1 }]);
      await rawExec(orm, 'DELETE FROM trips WHERE id = 10');
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM assistant_threads')).toEqual([{ n: 0 }]);
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM assistant_messages')).toEqual([{ n: 0 }]);
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM assistant_tool_calls')).toEqual([{ n: 0 }]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
