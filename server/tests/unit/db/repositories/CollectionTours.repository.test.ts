/**
 * `CollectionToursRepository` (LIB-03): the whole tours a collection keeps.
 * A kept tour is written whole (CT3), listed newest first (CT1), read only
 * within its collection (CT2) and removed only from it (CT4); the trips one
 * could go into come with their owner (CT5).
 */
import { CollectionTours } from '../../../../src/db/entities/CollectionTours.entity';
import { Collections } from '../../../../src/db/entities/Collections.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type {
  CollectionTourInsert,
  CollectionToursRepository,
} from '../../../../src/db/repositories/CollectionTours.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeCollection } from '../../../helpers/factories/collections';
import { deleteRows, findRow, updateRows } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: CollectionToursRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(CollectionTours);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const POINTS = [
  { lat: 47, lng: 11, role: 'start', sequence: 0 },
  { lat: 47.01, lng: 11.01, role: 'via', sequence: 1, name: 'Hut', key: 'stop-hut-1' },
  { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
];

/** A kept hike with a line and three points, the middle one named, its points encoded as the service writes them. */
function snapshot(collectionId: number, savedBy: number | null, overrides: Partial<CollectionTourInsert> = {}) {
  const row: CollectionTourInsert = {
    collection_id: collectionId,
    saved_by: savedBy,
    name: 'Ridge',
    description: 'Up high',
    website: null,
    route_geometry: '[[47,11,600],[47.01,11.01,650],[47.02,11.02,630]]',
    waypoints: JSON.stringify(POINTS),
    tour_type: 'hike',
    distance: 4.2,
    elevation_gain: 300,
    elevation_loss: null,
    duration: 90,
    planned_duration_minutes: null,
    break_additional_minutes: 20,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: 3,
    bike_profile: null,
    run_profile: null,
    run_pace_seconds_per_km: null,
    ski_discipline: null,
    ski_technique: null,
    ski_options: null,
    boat_type: null,
    water_context: null,
    paddle_speed_kmh: null,
    portage_speed_kmh: null,
    paddle_lake_style: null,
    track_marks: null,
    hiking_preferences: null,
    origin: 'trek',
    origin_file_name: null,
    track_started_at: null,
    track_ended_at: null,
    source_trip_title: 'Alps',
    source_tour_name: 'Ridge',
    ...overrides,
  };
  return row;
}

async function fixture() {
  const { user } = await makeUser(t, { username: 'keeper' });
  const mine = await makeCollection(t, user.id, { name: 'Hikes' });
  const other = await makeCollection(t, user.id, { name: 'Other' });
  return { user, mine, other };
}

describe('CollectionToursRepository', () => {
  it('CT3/CT2: keeps a snapshot whole and reads it back with its points decoded and who saved it', async () => {
    const { user, mine, other } = await fixture();
    const id = await repo.insertSnapshot(snapshot(mine.id, user.id));
    const row = await repo.findInCollection(mine.id, id);
    expect(row).toMatchObject({
      id,
      collection_id: mine.id,
      saved_by: user.id,
      saved_by_name: 'keeper',
      name: 'Ridge',
      tour_type: 'hike',
      distance: 4.2,
      elevation_loss: null,
      source_trip_title: 'Alps',
    });
    expect(row?.waypoints).toEqual(POINTS);
    expect(typeof row?.created_at).toBe('string');
    // Only within its own collection.
    expect(await repo.findInCollection(other.id, id)).toBeUndefined();
  });

  it('CT1: lists a collection’s tours newest first, the id breaking ties, and nothing of another', async () => {
    const { user, mine, other } = await fixture();
    const first = await repo.insertSnapshot(snapshot(mine.id, user.id, { name: 'First' }));
    const second = await repo.insertSnapshot(snapshot(mine.id, user.id, { name: 'Second' }));
    const older = await repo.insertSnapshot(snapshot(mine.id, user.id, { name: 'Older' }));
    await repo.insertSnapshot(snapshot(other.id, user.id, { name: 'Elsewhere' }));
    await updateRows(t, CollectionTours, { id: older }, { created_at: '2020-01-01 00:00:00' });
    await updateRows(t, CollectionTours, { id: { $in: [first, second] } }, { created_at: '2026-10-20 10:00:00' });
    const rows = await repo.listForCollection(mine.id);
    expect(rows.map((row) => row.name)).toEqual(['Second', 'First', 'Older']);
  });

  it('CT1/CT2: an account that is gone leaves the kept tour with nobody named', async () => {
    const { mine } = await fixture();
    const { user: gone } = await makeUser(t, { username: 'gone' });
    const id = await repo.insertSnapshot(snapshot(mine.id, gone.id));
    await deleteRows(t, Users, { id: gone.id });
    expect(await repo.findInCollection(mine.id, id)).toMatchObject({ saved_by: null, saved_by_name: null });
  });

  it('CT2: a broken point list, or one of another shape, reads as no points, the line kept as it is', async () => {
    const { user, mine } = await fixture();
    const id = await repo.insertSnapshot(snapshot(mine.id, user.id));
    await updateRows(t, CollectionTours, { id }, { waypoints: 'not json' });
    const row = await repo.findInCollection(mine.id, id);
    expect(row?.waypoints).toEqual([]);
    expect(row?.route_geometry).toContain('47.01');
    await updateRows(t, CollectionTours, { id }, { waypoints: JSON.stringify([{ lat: 147, lng: 11 }]) });
    expect((await repo.listForCollection(mine.id))[0]?.waypoints).toEqual([]);
  });

  it('CT4: removes a kept tour only from its own collection', async () => {
    const { user, mine, other } = await fixture();
    const id = await repo.insertSnapshot(snapshot(mine.id, user.id));
    expect(await repo.deleteInCollection(other.id, id)).toBe(false);
    expect(await findRow(t, CollectionTours, { id })).not.toBeNull();
    expect(await repo.deleteInCollection(mine.id, id)).toBe(true);
    expect(await repo.findInCollection(mine.id, id)).toBeUndefined();
  });

  it('CT5: names the trips asked for with their owner and dates, and none for no ids', async () => {
    const { user } = await fixture();
    const alps = await makeTrip(t, user.id, { title: 'Alps', start_date: '2026-07-01', end_date: '2026-07-08' });
    const coast = await makeTrip(t, user.id, { title: 'Coast', start_date: null, end_date: null });
    await makeTrip(t, user.id, { title: 'Not asked' });
    const rows = await repo.targetTrips([coast.id, alps.id]);
    expect([...rows].sort((a, b) => a.id - b.id)).toEqual([
      { id: alps.id, user_id: user.id, title: 'Alps', start_date: '2026-07-01', end_date: '2026-07-08' },
      { id: coast.id, user_id: user.id, title: 'Coast', start_date: null, end_date: null },
    ]);
    expect(await repo.targetTrips([])).toEqual([]);
  });

  it('goes with its collection', async () => {
    const { user, mine } = await fixture();
    const id = await repo.insertSnapshot(snapshot(mine.id, user.id));
    await deleteRows(t, Collections, { id: mine.id });
    expect(await findRow(t, CollectionTours, { id })).toBeNull();
  });
});
