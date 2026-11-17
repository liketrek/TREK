/**
 * `Migration20200101046370_a_deleted_chat_message_keeps_no_text`: a message deleted
 * before the release loses its text; a live message keeps its own.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046370_a_deleted_chat_message_keeps_no_text';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

describe('a deleted chat message keeps no text', () => {
  it('CHAT-DELETED-TEXT-001: blanks the text of deleted messages and leaves live ones alone', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Kyoto')");
      await rawExec(
        orm,
        "INSERT INTO collab_messages (id, trip_id, user_id, text, deleted) VALUES (1, 10, 1, 'meet at 8', 0), (2, 10, 1, 'my door code is 4711', 1)",
      );

      await migrateTo(orm, TARGET);

      const rows = await rawQuery<{ id: number; text: string; deleted: number }>(
        orm,
        'SELECT id, text, deleted FROM collab_messages ORDER BY id',
      );
      expect(rows).toEqual([
        { id: 1, text: 'meet at 8', deleted: 0 },
        { id: 2, text: '', deleted: 1 },
      ]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
