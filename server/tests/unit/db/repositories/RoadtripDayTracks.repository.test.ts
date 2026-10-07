/**
 * `RoadtripDayTracksRepository` (Plan 3d Task 1). RT7 (`deleteForDay`), RT8
 * (`upsertTrack`) and RT12 (`listForTrip`).
 *
 * RT8's `onConflictFields: ['day']` targets `RoadtripDayTracks.day` — this
 * table's PRIMARY KEY, a NULLABLE one-to-one relation (Task 0's RULE12/
 * generator finding, ruled NOT a defect). Task 0's review carried a live
 * finding forward to this task: SQLite accepts `INSERT … VALUES (NULL, …)`
 * on an INTEGER PRIMARY KEY column and silently assigns the next free
 * rowid instead of refusing — so an unguarded `day_id` reaching this
 * upsert could silently write to the WRONG day (another trip's). Two
 * things prove this is safe here: (1) `upsertTrack`'s own signature is
 * `day_id: number`, never nullable — TypeScript refuses a `null`/
 * `undefined` call at compile time; (2) `RoadtripService.requireDayId`
 * (the caller) parses every `dayId` with `toRowId` BEFORE it reaches this
 * repository (RT8-GUARD-001 below, at the service level — a repository
 * unit test cannot express a `null` argument a typed signature rejects).
 */
import { RoadtripDayTracks } from '../../../../src/db/entities/RoadtripDayTracks.entity';
import type { RoadtripDayTracksRepository } from '../../../../src/db/repositories/RoadtripDayTracks.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createDay, createPlace, createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tracks: RoadtripDayTracksRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tracks = t.repo(RoadtripDayTracks);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function fixture() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const dayA = createDay(testDb, trip.id);
  const placeA = createPlace(testDb, trip.id, { name: 'Track A' });
  const placeB = createPlace(testDb, trip.id, { name: 'Track B' });
  return { trip, dayA, placeA, placeB };
}

function rawRows(): { day_id: number; place_id: number; stray_km: number | null; created_at: string | null }[] {
  return testDb
    .prepare('SELECT day_id, place_id, stray_km, created_at FROM roadtrip_day_tracks ORDER BY day_id')
    .all() as never[];
}

describe('RoadtripDayTracksRepository', () => {
  it('RT7REPO-001: deleteForDay removes the one row for that day', async () => {
    const { dayA, placeA } = fixture();
    await tracks.upsertTrack(dayA.id, placeA.id, null);
    expect(rawRows()).toHaveLength(1);
    await tracks.deleteForDay(dayA.id);
    expect(rawRows()).toHaveLength(0);
  });

  it('RT7REPO-002: deleteForDay on a day with no track is a silent no-op', async () => {
    const { dayA } = fixture();
    await expect(tracks.deleteForDay(dayA.id)).resolves.toBeUndefined();
    expect(rawRows()).toHaveLength(0);
  });

  it('UPSERTTRACKREPO-001: a fresh day_id inserts one row', async () => {
    const { dayA, placeA } = fixture();
    await tracks.upsertTrack(dayA.id, placeA.id, 1.5);
    const rows = rawRows();
    expect(rows).toEqual([{ day_id: dayA.id, place_id: placeA.id, stray_km: 1.5, created_at: expect.any(String) }]);
  });

  it("UPSERTTRACKREPO-002: re-upserting the SAME day_id updates in place — one row, the second call's place_id/stray_km, created_at untouched", async () => {
    const { dayA, placeA, placeB } = fixture();
    await tracks.upsertTrack(dayA.id, placeA.id, 1.5);
    const before = rawRows()[0]!;

    await tracks.upsertTrack(dayA.id, placeB.id, 9.25);
    const after = rawRows();

    // Exactly one row — if `onConflictFields: ['day']` resolved to anything
    // other than the physical `day_id` PK, the second call would either
    // throw ("ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE
    // constraint") or raise a UNIQUE-constraint violation trying to insert
    // a second row with the same PK. Neither happens here — proof, not
    // assumption, per the Task 0 review carry.
    expect(after).toHaveLength(1);
    expect(after[0]).toEqual({ day_id: dayA.id, place_id: placeB.id, stray_km: 9.25, created_at: before.created_at });
  });

  it("UPSERTTRACKREPO-003: a track for a different day never touches this one's row", async () => {
    const { trip, dayA, placeA } = fixture();
    const dayB = createDay(testDb, trip.id);
    await tracks.upsertTrack(dayA.id, placeA.id, null);
    await tracks.upsertTrack(dayB.id, placeA.id, null);
    expect(rawRows()).toHaveLength(2);
  });

  it('UPSERTTRACKREPO-004: the rendered upsert SQL names the physical day_id column as its conflict target', async () => {
    const { dayA, placeA } = fixture();
    const connection = t.orm.em.getConnection();
    const spy = vi.spyOn(connection, 'execute');
    await tracks.upsertTrack(dayA.id, placeA.id, null);
    // Read `spy.mock.calls` BEFORE `mockRestore()` — vitest's `mockRestore`
    // does everything `mockReset` does (clearing recorded calls) in
    // addition to restoring the original implementation, so a `finally {
    // spy.mockRestore() }` ahead of this read empties `.calls` first.
    const calls = [...spy.mock.calls];
    spy.mockRestore();
    const upsertCall = calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('roadtrip_day_tracks') && /insert/i.test(call[0]),
    );
    expect(upsertCall).toBeDefined();
    const sql = String(upsertCall![0]);
    expect(sql).toMatch(/on conflict\s*\(\s*`?day_id`?\s*\)/i);
  });

  it('RT12REPO-001: listForTrip reads every day-track of the trip, ordered by day, day_id/place_id as bare scalars', async () => {
    const { trip, dayA, placeA } = fixture();
    const dayB = createDay(testDb, trip.id);
    const placeB = createPlace(testDb, trip.id);
    await tracks.upsertTrack(dayB.id, placeB.id, 2);
    await tracks.upsertTrack(dayA.id, placeA.id, null);

    const rows = await tracks.listForTrip(trip.id);
    expect(rows).toEqual([
      { day_id: dayA.id, place_id: placeA.id, stray_km: null },
      { day_id: dayB.id, place_id: placeB.id, stray_km: 2 },
    ]);
  });

  it("RT12REPO-002: listForTrip never returns another trip's tracks", async () => {
    const { dayA, placeA } = fixture();
    const { user: otherUser } = createUser(testDb);
    const otherTrip = createTrip(testDb, otherUser.id);
    const otherDay = createDay(testDb, otherTrip.id);
    const otherPlace = createPlace(testDb, otherTrip.id);
    await tracks.upsertTrack(dayA.id, placeA.id, null);
    await tracks.upsertTrack(otherDay.id, otherPlace.id, null);

    const rows = await tracks.listForTrip(otherTrip.id);
    expect(rows).toEqual([{ day_id: otherDay.id, place_id: otherPlace.id, stray_km: null }]);
  });
});
