/**
 * Boot migration: move the itemized receipt out of budget_items.note (#1658).
 *
 * The costs UI stored the receipt as a `TICKETJSON:` prefix on the note, so the
 * migration lifts it into its own column and clears the note. The match has to
 * be case-SENSITIVE: LIKE is not, which would swallow a hand-written note that
 * happens to start with the same word.
 *
 * The second half covers the databases that ran the LIKE version before it was
 * repaired — a fixed step never replays, so the damage is undone by a migration
 * of its own at the end of the array.
 *
 * Ported off the legacy runner (Task 0 triage: PORT — both migrations) onto the
 * real `Migration20200101030600_free_the_note_column_on_budget_items` (forward)
 * and `Migration20200101031700_give_back_the_notes_the_ticketjson_step`
 * (recovery): migrate to the step immediately before each, seed rows with raw
 * SQL, apply just that one migration, assert.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, it, expect } from 'vitest';

const FORWARD = 'Migration20200101030600_free_the_note_column_on_budget_items';
const RECOVERY = 'Migration20200101031700_give_back_the_notes_the_ticketjson_step';

async function ormBefore(target: string): Promise<{ orm: MikroORM; names: string[]; idx: number }> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(target);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return { orm, names, idx };
}

const readRow = (orm: MikroORM, id: number) =>
  rawQuery<{ note: string | null; ticket_json: string | null }>(
    orm,
    'SELECT note, ticket_json FROM budget_items WHERE id = ?',
    [id],
  ).then((r) => r[0]);

describe('budget_items ticket_json migration', () => {
  async function ormWithNotes(): Promise<MikroORM> {
    const { orm } = await ormBefore(FORWARD);
    // Minimal FK chain: user -> trip -> budget_items rows.
    await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')");
    await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')");
    await rawExec(orm, 'INSERT INTO budget_items (id, trip_id, name, note) VALUES (1, 1, ?, ?), (2, 1, ?, ?)', [
      'Dinner',
      'TICKETJSON:{"items":[]}',
      'Museum',
      'ticketjson: buy at the door',
    ]);
    return orm;
  }

  it('moves a real receipt into ticket_json and clears the note', async () => {
    const orm = await ormWithNotes();
    try {
      await migrateTo(orm, FORWARD);
      expect(await readRow(orm, 1)).toEqual({ note: null, ticket_json: '{"items":[]}' });
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('leaves a lowercase note alone (LIKE would have eaten it)', async () => {
    const orm = await ormWithNotes();
    try {
      await migrateTo(orm, FORWARD);
      expect(await readRow(orm, 2)).toEqual({ note: 'ticketjson: buy at the door', ticket_json: null });
    } finally {
      await orm.close(true);
    }
  }, 30000);
});

describe('recovering what the case-insensitive match destroyed', () => {
  /**
   * A database that already ran the buggy step: migrate to just before the
   * recovery migration, then seed rows in the SHAPE the buggy LIKE-based step
   * would have left behind — exactly what an existing install carries into the
   * recovery step on its next boot.
   */
  async function ormWithDamage(): Promise<MikroORM> {
    const { orm } = await ormBefore(RECOVERY);
    await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')");
    await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')");
    // Row 1: what the LIKE match left behind for "ticketjson: buy at the door".
    // Row 2: an actual receipt. Row 3: a receipt on a row whose owner has since
    // written a note.
    await rawExec(orm, 'INSERT INTO budget_items (id, trip_id, name, note, ticket_json) VALUES (?, ?, ?, ?, ?)', [
      1,
      1,
      'Museum',
      null,
      ' buy at the door',
    ]);
    await rawExec(orm, 'INSERT INTO budget_items (id, trip_id, name, note, ticket_json) VALUES (?, ?, ?, ?, ?)', [
      2,
      1,
      'Dinner',
      null,
      '{"items":[{"name":"Beer","price":"4.50","parts":[1]}]}',
    ]);
    await rawExec(orm, 'INSERT INTO budget_items (id, trip_id, name, note, ticket_json) VALUES (?, ?, ?, ?, ?)', [
      3,
      1,
      'Taxi',
      'split at the hotel',
      '{"items":[]}',
    ]);
    return orm;
  }

  it('puts a chopped note back where it came from', async () => {
    const orm = await ormWithDamage();
    try {
      await migrateTo(orm, RECOVERY);
      expect(await readRow(orm, 1)).toEqual({ note: ' buy at the door', ticket_json: null });
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('leaves a genuine receipt alone', async () => {
    const orm = await ormWithDamage();
    try {
      await migrateTo(orm, RECOVERY);
      expect(await readRow(orm, 2)).toEqual({
        note: null,
        ticket_json: '{"items":[{"name":"Beer","price":"4.50","parts":[1]}]}',
      });
      // A note written since the damage means the row was not chopped, so it is
      // not a candidate at all.
      expect(await readRow(orm, 3)).toEqual({ note: 'split at the hotel', ticket_json: '{"items":[]}' });
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
