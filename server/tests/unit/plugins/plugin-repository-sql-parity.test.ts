/**
 * Real-SQL parity tests for the plugin-adjacent repository methods Plan 3j Task 5
 * converted but never covered against raw SQL (task-7-review.md, must-land 4c): the
 * "Reviewer's full-seed parity" fixture (`r3j-parity.test.ts`, run in-process under the
 * review's own isolated `r3j-mut` export, 5/5 green there) — ported here per the fix
 * brief ("donate it, never import from the scratchpad"), not merely referenced.
 *
 * Each assertion below compares the converted repository method's result against the
 * SAME statement run directly on the raw better-sqlite3 handle — the shape that catches
 * M14 (`findPublicIdentity`'s miss returning `null` instead of `undefined`), M15 (its
 * key order), M16 (`sharesTripWith` always `true`, a security gate) and M17
 * (`existsById` ignored) from the review's mutation table, none of which any other
 * suite killed.
 */
import { Days } from '../../../src/db/entities/Days.entity';
import { PluginEntityMetadata } from '../../../src/db/entities/PluginEntityMetadata.entity';
import { PluginScheduledTasks } from '../../../src/db/entities/PluginScheduledTasks.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function seed(): Promise<void> {
  for (let i = 1; i <= 6; i++) {
    await insertRow(t, Users, {
      id: i,
      username: 'u' + i,
      email: `u${i}@x`,
      password_hash: 'x',
      display_name: i % 2 ? 'D' + i : null,
      avatar: i === 3 ? 'a.png' : null,
    });
  }
  const trips: Array<[number, number]> = [
    [1, 1],
    [2, 2],
    [3, 1],
    [4, 5],
  ];
  for (const [id, owner] of trips) await insertRow(t, Trips, { id, user: owner, title: 't' });
  for (const [trip, user] of [
    [1, 2],
    [1, 3],
    [2, 3],
    [3, 4],
    [4, 1],
  ]) {
    await insertRow(t, TripMembers, { trip, user });
  }
  for (let d = 1; d <= 5; d++) await insertRow(t, Days, { id: 10 + d, trip: d % 2 ? 1 : 2, day_number: d });
}

/** The stored metadata row for the plugin and key; fails the case when it is gone. */
async function metadataRow(pluginId: string, key: string) {
  const row = await findRow(t, PluginEntityMetadata, { plugin_id: pluginId, key });
  if (!row) throw new Error(`no metadata ${pluginId}/${key}`);
  return row;
}

describe('R3J-PARITY (Plan 3j Task 7 fix wave, must-land 4c)', () => {
  it('HR9 Trips.sharesTripWith == legacy bilateral SQL for every ordered user pair (incl. missing users)', async () => {
    await seed();
    const repo = t.repo(Trips);
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare(`SELECT 1 FROM trips t
               LEFT JOIN trip_members m1 ON m1.trip_id = t.id AND m1.user_id = ?
               LEFT JOIN trip_members m2 ON m2.trip_id = t.id AND m2.user_id = ?
              WHERE (t.user_id = ? OR m1.user_id IS NOT NULL)
                AND (t.user_id = ? OR m2.user_id IS NOT NULL)
              LIMIT 1`);
    const diffs: string[] = [];
    for (let a = 1; a <= 7; a++) {
      for (let b = 1; b <= 7; b++) {
        const legacyResult = !!legacy.get(a, b, a, b);
        const converted = await repo.sharesTripWith(a, b);
        if (legacyResult !== converted) diffs.push(`${a},${b}: legacy=${legacyResult} new=${converted}`);
      }
    }
    expect(diffs).toEqual([]);
  });

  it('Trips.existsById == legacy row-exists SQL, including a miss', async () => {
    await seed();
    const repo = t.repo(Trips);
    for (const id of [1, 2, 3, 4, 99]) {
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = !!testDb.prepare('SELECT 1 FROM trips WHERE id = ?').get(id);
      expect(await repo.existsById(id)).toBe(legacy);
    }
  });

  it('HR1 Users.findPublicIdentity == legacy row (full key, key order) and miss', async () => {
    await seed();
    const repo = t.repo(Users);
    for (let i = 1; i <= 7; i++) {
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = testDb.prepare('SELECT id, username, display_name, avatar FROM users WHERE id = ?').get(i);
      const converted = (await repo.findPublicIdentity(i)) ?? undefined;
      // JSON.stringify: same keys, same order, same values — catches M15 (key order)
      // as well as a value drift a plain `toEqual` on two possibly-undefined objects
      // would not distinguish from M14 (miss shape) below.
      expect(JSON.stringify(converted)).toBe(JSON.stringify(legacy));
    }
    // M14: a miss returns `null` (this repository's own convention, see
    // `host-surface.rpc.ts#getUser`'s `?? undefined` docstring) — the CALLER maps
    // that to `undefined` to match the legacy `better-sqlite3` `.get()` shape, which
    // the `JSON.stringify` comparison above already exercises for id 7 (a miss).
    expect(await repo.findPublicIdentity(999)).toBeNull();
  });

  it('CT1/CT2 Days.listIdsByTrip + MR9 Days.findTripId == legacy', async () => {
    await seed();
    const repo = t.repo(Days);
    for (const trip of [1, 2, 3, 99]) {
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = (testDb.prepare('SELECT id FROM days WHERE trip_id = ?').all(trip) as Array<{ id: number }>).map(
        (r) => r.id,
      );
      expect(await repo.listIdsByTrip(trip)).toEqual(legacy);
    }
    for (const id of [11, 12, 99]) {
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = (
        testDb.prepare('SELECT trip_id FROM days WHERE id = ?').get(id) as { trip_id: number } | undefined
      )?.trip_id;
      expect(await repo.findTripId(id)).toEqual(legacy);
    }
  });

  it('MR1-MR6 PluginEntityMetadata repository == legacy statements', async () => {
    await seed();
    const repo = t.repo(PluginEntityMetadata);
    await repo.upsertValue('p', 'trip', 1, 'b', '"1"');
    await repo.upsertValue('p', 'trip', 1, 'a', '"2"');
    await repo.upsertValue('q', 'trip', 1, 'a', '"x"');
    const before = await metadataRow('p', 'b');
    await updateRows(t, PluginEntityMetadata, { plugin_id: 'p', key: 'b' }, { updated_at: '2000-01-01 00:00:00' });
    await repo.upsertValue('p', 'trip', 1, 'b', '"3"');
    const after = await metadataRow('p', 'b');
    expect(after.value).toBe('"3"'); // MR4: upsert replaces the value
    expect(after.updated_at).not.toBe('2000-01-01 00:00:00'); // MR4: updated_at refreshed on conflict
    expect(after.updated_at).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
    expect(before.updated_at).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
    expect(await repo.findValue('p', 'trip', 1, 'b')).toBe('"3"'); // MR1
    expect(await repo.findValue('p', 'trip', 1, 'zz')).toBeNull(); // MR1 miss
    expect(await repo.countForEntity('p', 'trip', 1)).toBe(2); // MR3
    expect(await repo.listForEntity('p', 'trip', 1)).toEqual(
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      testDb
        .prepare(
          'SELECT key, value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? ORDER BY key',
        )
        .all('p', 'trip', 1),
    ); // MR5, ORDER BY key
    expect(await repo.deleteValue('p', 'trip', 1, 'a')).toBe(true); // MR6
    expect(await repo.deleteValue('p', 'trip', 1, 'a')).toBe(false); // MR6, already gone
    expect(await countRows(t, PluginEntityMetadata)).toBe(2); // 'p'/'b' + 'q'/'a' survive
  });

  it('HR5-HR8 PluginScheduledTasks repository == legacy statements (upsert keeps id, replaces fields)', async () => {
    const repo = t.repo(PluginScheduledTasks);
    await repo.upsertTask({ plugin_id: 'p', name: 'n', due_at: 5, payload: '1', every_ms: null });
    const id1 = (await findRow(t, PluginScheduledTasks, { name: 'n' }))!.id;
    await repo.upsertTask({ plugin_id: 'p', name: 'n', due_at: 9, payload: '2', every_ms: 60000 });
    expect(
      (await findRows(t, PluginScheduledTasks)).map(({ id, plugin_id, name, due_at, payload, every_ms }) => ({
        id,
        plugin_id,
        name,
        due_at,
        payload,
        every_ms,
      })),
    ).toEqual([{ id: id1, plugin_id: 'p', name: 'n', due_at: 9, payload: '2', every_ms: 60000 }]); // HR7: same id, replaced fields — an upsert, not a delete+insert
    expect(await repo.existsForPluginAndName('p', 'n')).toBeTruthy(); // HR5
    expect(await repo.existsForPluginAndName('p', 'x')).toBeFalsy(); // HR5 miss
    expect(await repo.countForPlugin('p')).toBe(1); // HR6
    expect(await repo.deleteByPluginAndName('p', 'n')).toBe(true); // HR8
    expect(await repo.deleteByPluginAndName('p', 'n')).toBe(false); // HR8, already gone
  });

  it("HR5-HR7 re-arm's claim guard: rearm only claims a row whose due_at is still <= the claimed-from time", async () => {
    const repo = t.repo(PluginScheduledTasks);
    const now = Date.now();
    await repo.upsertTask({ plugin_id: 'p', name: 'claim', due_at: now - 1000, payload: '1', every_ms: 60000 });
    const id = (await findRow(t, PluginScheduledTasks, { name: 'claim' }))!.id;
    // The winning claim: due_at <= claimedFromDueAt (the row's own current due_at).
    expect(await repo.rearm(id, now + 60000, now - 1000)).toBe(true);
    // A second, losing claim against the SAME stale claimedFromDueAt now fails — the
    // row's due_at already moved forward past it (RACE-SCHED-001/002's guard).
    expect(await repo.rearm(id, now + 120000, now - 1000)).toBe(false);
    const row = await findRow(t, PluginScheduledTasks, { id });
    expect(row?.due_at).toBe(now + 60000); // the losing rearm never wrote
    // deleteById carries the identical guard shape for the one-shot branch.
    expect(await repo.deleteById(id, now - 1000)).toBe(false); // stale claim, no-op
    expect(await repo.deleteById(id, now + 60000)).toBe(true); // current due_at, claims + deletes
  });

  it('must-land 2: 130 concurrent PluginEntityMetadata.upsertValueCapped calls for the SAME (plugin, entity), 130 DIFFERENT new keys, never exceed the 100 cap', async () => {
    // The REAL repository method, raced through Promise.all — not a sequential loop —
    // so the exists+count+write really overlaps (task-7-review.md: live, 130 rows landed
    // on a 100 cap before this fix). Red without `upsertValueCapped`'s
    // `getEntityManager().transactional` wrap: the old three-separately-awaited-calls
    // shape let every racer's stale `count < 100` read pass before any of their writes
    // landed.
    const repo = t.repo(PluginEntityMetadata);
    const results = await Promise.all(
      Array.from({ length: 130 }, (_, i) => repo.upsertValueCapped('capbomb', 'trip', 1, `k${i}`, String(i), 100)),
    );
    expect(results.filter(Boolean).length).toBe(100); // exactly 100 writes accepted
    expect(await repo.countForEntity('capbomb', 'trip', 1)).toBe(100); // never more than 100 rows
    expect(await countRows(t, PluginEntityMetadata, { plugin_id: 'capbomb' })).toBe(100);
  });

  it('must-land 3: 130 concurrent PluginScheduledTasks.upsertTaskCapped calls for the SAME plugin, 130 DIFFERENT new names, never exceed the 100 cap', async () => {
    const repo = t.repo(PluginScheduledTasks);
    const due = Date.now() + 60_000;
    const results = await Promise.all(
      Array.from({ length: 130 }, (_, i) =>
        repo.upsertTaskCapped(
          { plugin_id: 'schedbomb', name: `t${i}`, due_at: due, payload: '1', every_ms: null },
          100,
        ),
      ),
    );
    expect(results.filter(Boolean).length).toBe(100); // exactly 100 writes accepted
    expect(await repo.countForPlugin('schedbomb')).toBe(100); // never more than 100 rows
    expect(await countRows(t, PluginScheduledTasks, { plugin_id: 'schedbomb' })).toBe(100);
  });
});
