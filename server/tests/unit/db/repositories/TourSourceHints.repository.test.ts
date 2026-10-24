/**
 * `TourSourceHintsRepository` (WAN-02): what the background watch over a
 * user's own wanderer snapshots found, and which snapshots it may look at.
 * Seeded through the ORM factories over the migrated snapshot schema.
 */
import { TourSourceHints } from '../../../../src/db/entities/TourSourceHints.entity';
import { TripMembers } from '../../../../src/db/entities/TripMembers.entity';
import { WandererConnections } from '../../../../src/db/entities/WandererConnections.entity';
import type { TourSourceHintsRepository } from '../../../../src/db/repositories/TourSourceHints.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { deleteRows, findRow, insertRow, updateRows } from '../../../helpers/factories/rows';
import { makeTour, makeTourSource } from '../../../helpers/factories/tours';
import { addTripMember, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const INSTANCE = 'https://wanderer.example.org';
const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TourSourceHintsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TourSourceHints);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/** A wanderer snapshot in the trip, imported by `importedBy`. */
async function snapshot(tripId: number, importedBy: number | null, externalId: string, instance = INSTANCE) {
  const place = await makePlace(t, tripId, { name: `Trail ${externalId}` });
  await makeTour(t, place.id, { origin: 'wanderer' });
  await makeTourSource(t, place.id, importedBy, { external_id: externalId, instance, external_updated: '2026-10-01' });
  return place.id;
}

async function connect(userId: number, url = INSTANCE) {
  await insertRow(t, WandererConnections, { user: userId, url, token: 'enc' });
}

const look = (placeId: number, userId: number, checkedAt: string, state: 'possible_change' | null = null) => ({
  place_id: placeId,
  user_id: userId,
  state,
  changes: null,
  reason: null,
  external_updated: '2026-10-02',
  checked_at: checkedAt,
});

describe('TourSourceHintsRepository', () => {
  it('THREPO-001: lists only the user own imports of the instance, in trips they can still open', async () => {
    const { user } = await makeUser(t);
    const { user: other } = await makeUser(t);
    const own = await makeTrip(t, user.id, { title: 'Alps' });
    const shared = await makeTrip(t, other.id, { title: 'Shared' });
    await addTripMember(t, shared.id, user.id);
    const left = await makeTrip(t, other.id, { title: 'Left' });

    const mine = await snapshot(own.id, user.id, 'a');
    const inShared = await snapshot(shared.id, user.id, 'b');
    await snapshot(own.id, other.id, 'c');
    await snapshot(own.id, user.id, 'd', 'https://elsewhere.example');
    await snapshot(left.id, user.id, 'e');

    const due = await repo.listDue(user.id, INSTANCE, '2026-10-20 00:00:00', 10);
    expect(due.map((row) => row.place_id).sort()).toEqual([mine, inShared].sort());
    expect(due[0]).toMatchObject({
      content_hash: 'n.d.r',
      external_updated: '2026-10-01',
      seen_hash: null,
      state: null,
    });
  });

  it('THREPO-002: never looked at first, then the longest waiting, within the cutoff and the limit', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const fresh = await snapshot(trip.id, user.id, 'a');
    const old = await snapshot(trip.id, user.id, 'b');
    const older = await snapshot(trip.id, user.id, 'c');
    const recent = await snapshot(trip.id, user.id, 'd');
    await repo.record([
      look(old, user.id, '2026-10-18 10:00:00'),
      look(older, user.id, '2026-10-17 10:00:00'),
      look(recent, user.id, '2026-10-19 12:00:00'),
    ]);

    const due = await repo.listDue(user.id, INSTANCE, '2026-10-19 00:00:00', 10);
    expect(due.map((row) => row.place_id)).toEqual([fresh, older, old]);
    expect((await repo.listDue(user.id, INSTANCE, '2026-10-19 00:00:00', 2)).map((row) => row.place_id)).toEqual([
      fresh,
      older,
    ]);
  });

  it('THREPO-003: a look writes its finding and keeps what the user last saw', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const placeId = await snapshot(trip.id, user.id, 'a');
    await repo.markSeen(placeId, user.id, {
      contentHash: 'seen.hash.now',
      externalUpdated: '2026-10-05',
      checkedAt: '2026-10-05 08:00:00',
    });
    await repo.record([{ ...look(placeId, user.id, '2026-10-19 08:00:00', 'possible_change'), changes: '["name"]' }]);

    expect(await findRow(t, TourSourceHints, { place: placeId })).toMatchObject({
      state: 'possible_change',
      changes: '["name"]',
      external_updated: '2026-10-02',
      seen_hash: 'seen.hash.now',
      seen_updated: '2026-10-05',
      checked_at: '2026-10-19 08:00:00',
    });
    await repo.record([]);
  });

  it('THREPO-004: a manual check clears the hint for the importer only, and starts a row when there was none', async () => {
    const { user } = await makeUser(t);
    const { user: member } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const placeId = await snapshot(trip.id, user.id, 'a');
    const seen = { contentHash: 'x.y.z', externalUpdated: '2026-10-10', checkedAt: '2026-10-10 09:00:00' };

    await repo.markSeen(placeId, member.id, seen);
    expect(await findRow(t, TourSourceHints, { place: placeId })).toBeNull();

    await repo.markSeen(placeId, user.id, seen);
    expect(await findRow(t, TourSourceHints, { place: placeId })).toMatchObject({ state: null, seen_hash: 'x.y.z' });

    await repo.record([look(placeId, user.id, '2026-10-19 08:00:00', 'possible_change')]);
    await repo.markSeen(placeId, user.id, { ...seen, contentHash: 'x.y.w', externalUpdated: null });
    expect(await findRow(t, TourSourceHints, { place: placeId })).toMatchObject({
      state: null,
      changes: null,
      seen_hash: 'x.y.w',
      seen_updated: null,
    });
    await repo.markSeen(999_999, user.id, seen);
  });

  it('THREPO-005: open hints show while the connection points at their instance, newest look first', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id, { title: 'Alps' });
    const first = await snapshot(trip.id, user.id, 'a');
    const second = await snapshot(trip.id, user.id, 'b');
    const quiet = await snapshot(trip.id, user.id, 'c');
    await repo.record([
      look(first, user.id, '2026-10-18 08:00:00', 'possible_change'),
      look(second, user.id, '2026-10-19 08:00:00', 'possible_change'),
      look(quiet, user.id, '2026-10-19 09:00:00'),
    ]);

    expect(await repo.listOpen(user.id)).toEqual([]);
    await connect(user.id);
    const open = await repo.listOpen(user.id);
    expect(open.map((row) => row.place_id)).toEqual([second, first]);
    expect(open[0]).toMatchObject({
      trip_id: trip.id,
      trip_title: 'Alps',
      tour_name: 'Trail b',
      state: 'possible_change',
    });

    expect(await repo.findOpen(user.id, trip.id, first)).toMatchObject({ place_id: first });
    expect(await repo.findOpen(user.id, trip.id, quiet)).toBeUndefined();
    expect(await repo.findOpen(user.id, trip.id + 1, first)).toBeUndefined();
  });

  it('THREPO-006: a connection to another instance, or a trip the user left, hides the hint', async () => {
    const { user } = await makeUser(t);
    const { user: owner } = await makeUser(t);
    const trip = await makeTrip(t, owner.id);
    await addTripMember(t, trip.id, user.id);
    const placeId = await snapshot(trip.id, user.id, 'a');
    await repo.record([look(placeId, user.id, '2026-10-19 08:00:00', 'possible_change')]);
    await connect(user.id, 'https://elsewhere.example');
    expect(await repo.listOpen(user.id)).toEqual([]);

    await updateRows(t, WandererConnections, { user: user.id }, { url: INSTANCE });
    expect(await repo.listOpen(user.id)).toHaveLength(1);
    await deleteRows(t, TripMembers, { trip: trip.id, user: user.id });
    expect(await repo.listOpen(user.id)).toEqual([]);
    expect(await repo.listDue(user.id, INSTANCE, '2026-10-20 00:00:00', 10)).toEqual([]);
  });
});
