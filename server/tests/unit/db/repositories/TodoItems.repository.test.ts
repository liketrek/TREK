/**
 * TodoItemsRepository.listDueForReminder — RJ4 parity (L2, task-7-review.md).
 *
 * `due_date` is an unconstrained `z.string()` on the wire, not always
 * canonical `YYYY-MM-DD` text. Legacy wrapped the column in `date(...)`
 * before comparing it to the cutoff, which normalizes a time-bearing value
 * down to its date part; the converted repository compared the raw string
 * against a bare `YYYY-MM-DD` cutoff instead, which sorts a due date on the
 * cutoff day itself (`2026-07-14T09:00`) AFTER the cutoff and drops it a day
 * early. One seeded world, mixed `due_date` shapes, id set compared against
 * the legacy SQL statement (`sn-cycle`/`rj4` reviewer probe, ported per the
 * fix-wave brief rather than imported from the reviewer's scratchpad).
 */
import { TodoItems } from '../../../../src/db/entities/TodoItems.entity';
import type { TodoItemsRepository } from '../../../../src/db/repositories/TodoItems.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, createTrip } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TodoItemsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TodoItems);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('listDueForReminder', () => {
  it('RJ4 parity: mixed due_date shapes on the last day of the window match the legacy date()-wrapped SQL, id for id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const now = new Date();
    const t0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const plus = (n: number) => {
      const d = new Date(t0);
      d.setUTCDate(d.getUTCDate() + n);
      return d;
    };
    const LEAD = 3;
    const shapes = [
      iso(t0),
      iso(plus(LEAD)),
      iso(plus(LEAD)) + 'T09:00',
      iso(plus(LEAD)) + ' 09:00:00',
      iso(t0) + 'T00:00:00Z',
      iso(plus(-1)),
      iso(plus(LEAD + 1)),
      'soon',
      '',
    ];
    for (const s of shapes) {
      testDb
        .prepare('INSERT INTO todo_items (trip_id, name, due_date, checked) VALUES (?, ?, ?, 0)')
        .run(trip.id, 'n:' + s, s);
    }

    const legacy = (
      testDb
        .prepare(
          `SELECT ti.id FROM todo_items ti JOIN trips t ON t.id = ti.trip_id
           WHERE ti.checked = 0 AND ti.due_date IS NOT NULL AND ti.due_date <> ''
             AND date(ti.due_date) <= date('now', '+' || ? || ' days')
             AND date(ti.due_date) >= date('now')
             AND (ti.reminded_at IS NULL OR ti.reminded_at <= datetime('now', '-20 hours'))
           ORDER BY ti.id`,
        )
        .all(LEAD) as { id: number }[]
    ).map((r) => r.id);

    const head = (await repo.listDueForReminder(iso(t0), iso(plus(LEAD)))).map((r) => r.id).sort((a, b) => a - b);
    const names = (ids: number[]) =>
      ids.map((i) => (testDb.prepare('SELECT name FROM todo_items WHERE id=?').get(i) as { name: string }).name);

    expect(names(head)).toEqual(names(legacy));
    expect(head.length).toBeGreaterThan(0);
  });
});
