import { Days } from '../../../src/db/entities/Days.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { RoadtripDayTracks } from '../../../src/db/entities/RoadtripDayTracks.entity';
import { RoadtripVias } from '../../../src/db/entities/RoadtripVias.entity';
import { RoadtripService } from '../../../src/nest/roadtrip/roadtrip.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createDay, createPlace, createTrip, createUser } from '../../helpers/factories';
import { updateRows } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { createTestUnitOfWork } from '../../helpers/test-uow';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Via points and tracks, against real rows through
 * `RoadtripViasRepository`/`RoadtripDayTracksRepository`/`DaysRepository`/
 * `PlacesRepository` (Plan 3d Task 1) — moved off the hand-DDL, raw
 * `DatabaseService`-shaped facade (§15a/§15c test risk 2) onto real schema.
 */
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

async function makeService() {
  return new RoadtripService(
    { broadcast: () => {} } as never,
    await createTestUnitOfWork(testDb),
    t.repo(Days),
    t.repo(Places),
    t.repo(RoadtripVias),
    t.repo(RoadtripDayTracks),
  );
}

async function fixture() {
  const { user } = createUser(testDb);
  const tripA = createTrip(testDb, user.id);
  const tripB = createTrip(testDb, user.id);
  const dayA1 = createDay(testDb, tripA.id);
  const dayA2 = createDay(testDb, tripA.id);
  const dayB1 = createDay(testDb, tripB.id);
  const track = createPlace(testDb, tripA.id, { name: 'Atlantic Road' });
  const hotel = createPlace(testDb, tripA.id, { name: 'A hotel' });
  const otherTrack = createPlace(testDb, tripB.id, { name: 'Somebody else’s track' });
  await updateRows(t, Places, { id: track.id }, { route_geometry: '[[52,13],[52,14]]' });
  await updateRows(t, Places, { id: otherTrack.id }, { route_geometry: '[[40,2],[40,3]]' });
  return { tripA, tripB, dayA1, dayA2, dayB1, track, hotel, otherTrack };
}

describe('RoadtripService', () => {
  let service: RoadtripService;
  let f: Awaited<ReturnType<typeof fixture>>;
  beforeEach(async () => {
    service = await makeService();
    f = await fixture();
  });

  it('ROADTRIP-SVC-001: a day of another trip is not this trip’s day', async () => {
    expect(await service.dayExists(f.dayA1.id, f.tripA.id)).toBe(true);
    expect(await service.dayExists(f.dayB1.id, f.tripA.id)).toBe(false);
  });

  it('ROADTRIP-SVC-002: vias appended after the same stop keep the order they were added in', async () => {
    const first = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });
    const second = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53.5, lng: 10.5 });

    expect(first.sequence).toBe(0);
    expect(second.sequence).toBe(1);
    expect((await service.listForDay(f.dayA1.id)).map((v) => v.id)).toEqual([first.id, second.id]);
  });

  it('ROADTRIP-SVC-003: the list is ordered by stop first, then by sequence', async () => {
    const late = await service.create(f.dayA1.id, { after_order_index: 2, lat: 51, lng: 12 });
    const early = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });

    expect((await service.listForDay(f.dayA1.id)).map((v) => v.id)).toEqual([early.id, late.id]);
  });

  it('ROADTRIP-SVC-004: the trip listing spans its days and stops at the trip boundary', async () => {
    await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });
    await service.create(f.dayA2.id, { after_order_index: 0, lat: 52, lng: 11 });
    await service.create(f.dayB1.id, { after_order_index: 0, lat: 50, lng: 14 });

    // dayB1 belongs to tripB and must not appear in tripA's listing.
    expect((await service.listForTrip(f.tripA.id)).map((v) => v.day_id).sort((a, b) => a - b)).toEqual(
      [f.dayA1.id, f.dayA2.id].sort((a, b) => a - b),
    );
  });

  it('ROADTRIP-SVC-005: a move with no new anchor leaves the chain alone', async () => {
    const via = await service.create(f.dayA1.id, { after_order_index: 1, lat: 53, lng: 10 });

    const moved = await service.move(via.id, f.dayA1.id, 52.5, 11.5);

    expect(moved).toMatchObject({ lat: 52.5, lng: 11.5, after_order_index: 1, sequence: via.sequence });
  });

  it('ROADTRIP-SVC-007: a via dragged past a stop is re-pinned to the leg it landed on', async () => {
    const via = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53.87, lng: 10.7 });

    const moved = await service.move(via.id, f.dayA1.id, 53.87, 11.53, 1);

    expect(moved).toMatchObject({ lat: 53.87, lng: 11.53, after_order_index: 1 });
  });

  it('ROADTRIP-SVC-008: a re-pin through the wrong day changes nothing at all', async () => {
    const via = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });

    expect(await service.move(via.id, f.dayA2.id, 51, 12, 3)).toBeNull();
    expect((await service.listForDay(f.dayA1.id))[0]).toMatchObject({ lat: 53, lng: 10, after_order_index: 0 });
  });

  it('ROADTRIP-SVC-006: a via cannot be moved or removed through the wrong day', async () => {
    const via = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });

    expect(await service.move(via.id, f.dayA2.id, 0, 0)).toBeNull();
    expect(await service.remove(via.id, f.dayA2.id)).toBe(false);
    expect(await service.listForDay(f.dayA1.id)).toHaveLength(1);
  });

  it('ROADTRIP-SVC-008b: re-anchoring moves the vias it names and leaves the rest alone', async () => {
    const a = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });
    const b = await service.create(f.dayA1.id, { after_order_index: 1, lat: 54, lng: 11 });
    const c = await service.create(f.dayA1.id, { after_order_index: 2, lat: 55, lng: 12 });

    const after = await service.reanchor(f.dayA1.id, {
      vias: [
        { id: b.id, after_order_index: 2 },
        { id: c.id, after_order_index: 3 },
      ],
    });

    const byId = new Map(after.map((v) => [v.id, v.after_order_index]));
    expect(byId.get(a.id)).toBe(0);
    expect(byId.get(b.id)).toBe(2);
    expect(byId.get(c.id)).toBe(3);
    expect(after.find((v) => v.id === b.id)?.lat).toBe(54);
  });

  it('ROADTRIP-SVC-009: re-anchoring deletes the vias whose leg stopped existing', async () => {
    const gone = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });
    const kept = await service.create(f.dayA1.id, { after_order_index: 2, lat: 54, lng: 11 });

    const after = await service.reanchor(f.dayA1.id, {
      vias: [{ id: kept.id, after_order_index: 1 }],
      remove: [gone.id],
    });

    expect(after.map((v) => v.id)).toEqual([kept.id]);
    expect(after[0]!.after_order_index).toBe(1);
  });

  it('ROADTRIP-SVC-010: a via of another day cannot be renumbered through this one', async () => {
    const other = await service.create(f.dayA2.id, { after_order_index: 0, lat: 53, lng: 10 });

    await service.reanchor(f.dayA1.id, { vias: [{ id: other.id, after_order_index: 9 }], remove: [other.id] });

    const untouched = await service.listForDay(f.dayA2.id);
    expect(untouched.map((v) => v.id)).toEqual([other.id]);
    expect(untouched[0]!.after_order_index).toBe(0);
  });

  it('ROADTRIP-SVC-011: an id that is gone does not fail the rest of the batch', async () => {
    const kept = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });

    const after = await service.reanchor(f.dayA1.id, {
      vias: [
        { id: 9999, after_order_index: 4 },
        { id: kept.id, after_order_index: 1 },
      ],
    });

    expect(after.map((v) => v.after_order_index)).toEqual([1]);
  });

  it('ROADTRIP-SVC-016: merging two populated legs keeps the drive going one way', async () => {
    const a0 = await service.create(f.dayA1.id, { after_order_index: 1, lat: 50.0, lng: 10 });
    const a1 = await service.create(f.dayA1.id, { after_order_index: 1, lat: 50.1, lng: 10 });
    const b0 = await service.create(f.dayA1.id, { after_order_index: 2, lat: 50.2, lng: 10 });
    const b1 = await service.create(f.dayA1.id, { after_order_index: 2, lat: 50.3, lng: 10 });
    expect([a0.sequence, a1.sequence, b0.sequence, b1.sequence]).toEqual([0, 1, 0, 1]);

    const after = await service.reanchor(f.dayA1.id, {
      vias: [
        { id: b0.id, after_order_index: 1 },
        { id: b1.id, after_order_index: 1 },
      ],
    });

    const onLeg = after.filter((v) => v.after_order_index === 1).sort((x, y) => x.sequence - y.sequence);
    expect(onLeg.map((v) => v.id)).toEqual([a0.id, a1.id, b0.id, b1.id]);
    expect(onLeg.map((v) => v.sequence)).toEqual([0, 1, 2, 3]);
    expect(onLeg.map((v) => v.lat)).toEqual([50.0, 50.1, 50.2, 50.3]);
  });

  it('ROADTRIP-SVC-017: a leg nothing merged into keeps the order it had', async () => {
    const first = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });
    const second = await service.create(f.dayA1.id, { after_order_index: 0, lat: 54, lng: 11 });
    const elsewhere = await service.create(f.dayA1.id, { after_order_index: 3, lat: 55, lng: 12 });

    const after = await service.reanchor(f.dayA1.id, { vias: [{ id: elsewhere.id, after_order_index: 2 }] });

    const leg0 = after.filter((v) => v.after_order_index === 0).sort((x, y) => x.sequence - y.sequence);
    expect(leg0.map((v) => v.id)).toEqual([first.id, second.id]);
    expect(leg0.map((v) => v.sequence)).toEqual([0, 1]);
    expect(after.find((v) => v.id === elsewhere.id)?.sequence).toBe(0);
  });

  it('ROADTRIP-SVC-012: a chain lands in the order it was sent, per leg', async () => {
    const vias = await service.createMany(f.dayA1.id, {
      vias: [
        { after_order_index: 0, lat: 53.0, lng: 10.0 },
        { after_order_index: 0, lat: 53.1, lng: 10.1 },
        { after_order_index: 1, lat: 53.2, lng: 10.2 },
      ],
    });

    expect(vias.map((v) => [v.after_order_index, v.sequence])).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
    ]);
    expect(vias.map((v) => v.lat)).toEqual([53.0, 53.1, 53.2]);
  });

  it('ROADTRIP-SVC-013: a chain appends to what a leg already has', async () => {
    await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });
    const vias = await service.createMany(f.dayA1.id, { vias: [{ after_order_index: 0, lat: 54, lng: 11 }] });

    expect(vias.map((v) => v.sequence)).toEqual([0, 1]);
  });

  it('ROADTRIP-SVC-014: replace_legs clears only the legs it names', async () => {
    const keep = await service.create(f.dayA1.id, { after_order_index: 5, lat: 50, lng: 8 });
    await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });

    const vias = await service.createMany(f.dayA1.id, {
      vias: [{ after_order_index: 0, lat: 54, lng: 11 }],
      replace_legs: [0],
    });

    expect(vias.map((v) => v.id)).toEqual([vias[0]!.id, keep.id]);
    expect(vias.find((v) => v.after_order_index === 0)?.lat).toBe(54);
  });

  it('ROADTRIP-SVC-015: clearing a leg without adding anything is a legal batch', async () => {
    await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });

    expect(await service.createMany(f.dayA1.id, { vias: [], replace_legs: [0] })).toEqual([]);
  });

  it('ROADTRIP-SVC-016b: a chain cannot be laid on a day it was not addressed to', async () => {
    await service.createMany(f.dayA2.id, { vias: [{ after_order_index: 0, lat: 53, lng: 10 }] });

    expect(await service.listForDay(f.dayA1.id)).toEqual([]);
    expect(await service.listForDay(f.dayA2.id)).toHaveLength(1);
  });

  it('ROADTRIP-SVC-017b: the chain and the track it came from land in one write', async () => {
    await service.createMany(f.dayA1.id, {
      vias: [{ after_order_index: 0, lat: 53, lng: 10 }],
      track: { place_id: f.track.id, stray_km: 0.8 },
    });

    expect(await service.tracksForTrip(f.tripA.id)).toEqual([
      { day_id: f.dayA1.id, place_id: f.track.id, stray_km: 0.8 },
    ]);
  });

  it('ROADTRIP-SVC-018: laying a second track on a day replaces the first, never doubles it', async () => {
    await service.createMany(f.dayA1.id, { vias: [], track: { place_id: f.track.id, stray_km: 2 } });
    await service.createMany(f.dayA1.id, { vias: [], track: { place_id: f.hotel.id, stray_km: null } });

    expect(await service.tracksForTrip(f.tripA.id)).toEqual([
      { day_id: f.dayA1.id, place_id: f.hotel.id, stray_km: null },
    ]);
  });

  it('ROADTRIP-SVC-019: three states, not two — absent keeps, null clears', async () => {
    await service.createMany(f.dayA1.id, { vias: [], track: { place_id: f.track.id, stray_km: 1 } });

    await service.createMany(f.dayA1.id, { vias: [{ after_order_index: 0, lat: 53, lng: 10 }] });
    expect(await service.tracksForTrip(f.tripA.id)).toHaveLength(1);

    await service.createMany(f.dayA1.id, { vias: [], replace_legs: [0], track: null });
    expect(await service.tracksForTrip(f.tripA.id)).toEqual([]);
  });

  it('ROADTRIP-SVC-020: the tracks of one trip are not the tracks of another', async () => {
    await service.createMany(f.dayA1.id, { vias: [], track: { place_id: f.track.id, stray_km: null } });
    await service.createMany(f.dayB1.id, { vias: [], track: { place_id: f.otherTrack.id, stray_km: null } });

    expect((await service.tracksForTrip(f.tripA.id)).map((tr) => tr.day_id)).toEqual([f.dayA1.id]);
    expect((await service.tracksForTrip(f.tripB.id)).map((tr) => tr.day_id)).toEqual([f.dayB1.id]);
  });

  it('ROADTRIP-SVC-021: only a track of this trip can become a day’s label', async () => {
    expect(await service.trackExists(f.track.id, f.tripA.id)).toBe(true);
    expect(await service.trackExists(f.hotel.id, f.tripA.id)).toBe(false);
    expect(await service.trackExists(f.otherTrack.id, f.tripA.id)).toBe(false);
    expect(await service.trackExists(999999, f.tripA.id)).toBe(false);
  });

  // L1 (Plan 3d Task 7 whole-plan review): `listForDay`/`listForTrip`/
  // `tracksForTrip`/`trackExists` used to bind `Number(id)` directly — a
  // hex-spelled id coerces to a real row under `Number()`, where the legacy
  // raw-bind statement's affinity never converts a hex string, so it always
  // matched nothing. `toRowId` now answers that legacy empty/false shape.
  it("L1: a hex-spelled day/trip id answers the legacy empty shape on every read path, not the real trip's rows", async () => {
    await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });
    await service.createMany(f.dayA1.id, { vias: [], track: { place_id: f.track.id, stray_km: null } });

    const hexDayId = '0x' + f.dayA1.id.toString(16);
    const hexTripId = '0x' + f.tripA.id.toString(16);

    expect(await service.listForDay(hexDayId)).toEqual([]);
    expect(await service.listForTrip(hexTripId)).toEqual([]);
    expect(await service.tracksForTrip(hexTripId)).toEqual([]);
    expect(await service.trackExists(f.track.id, hexTripId)).toBe(false);

    // Sanity: the canonical id still sees the real rows.
    expect(await service.listForDay(f.dayA1.id)).toHaveLength(1);
    expect(await service.tracksForTrip(f.tripA.id)).toHaveLength(1);
  });

  it('ROADTRIP-SVC-007b: removing one reports whether there was anything to remove', async () => {
    const via = await service.create(f.dayA1.id, { after_order_index: 0, lat: 53, lng: 10 });

    expect(await service.remove(via.id, f.dayA1.id)).toBe(true);
    expect(await service.remove(via.id, f.dayA1.id)).toBe(false);
    expect(await service.listForDay(f.dayA1.id)).toEqual([]);
  });

  it('RT8-GUARD-001: a non-canonical dayId is refused before any write — `createMany` never reaches the track upsert with an invalid day', async () => {
    // The Task 0 review carry (RT8): `RoadtripDayTracksRepository.upsertTrack`'s
    // `day_id` is that table's PRIMARY KEY column, and SQLite silently accepts
    // `INSERT … VALUES (NULL, …)` on an INTEGER PK by auto-assigning a rowid —
    // possibly colliding with a real, unrelated day. `requireDayId` (the
    // service's own gate, `toRowId`-based) refuses `'abc'`/`'3 '`/`'0x10'`
    // BEFORE the transaction opens, so `upsertTrack` can never be reached with
    // anything but a real, parsed integer.
    for (const badDayId of ['abc', '3 ', '0x10', '', '1.5']) {
      await expect(
        service.createMany(badDayId, { vias: [], track: { place_id: f.track.id, stray_km: null } }),
      ).rejects.toMatchObject({ response: { error: 'Day not found' }, status: 404 });
    }
    expect(await service.tracksForTrip(f.tripA.id)).toEqual([]);
  });

  // R7: `create`'s `nextSequence` (MAX(sequence)+1) read and its `insertVia`
  // write run in one transaction, which holds the connection, so two concurrent
  // creates (`Promise.allSettled`, no mocks) take one sequence each. Before,
  // both landed on sequence 0.
  it('R7: two concurrent creates on the same leg both succeed and take consecutive sequences', async () => {
    const results = await Promise.allSettled([
      service.create(f.dayA1.id, { after_order_index: 0, lat: 1, lng: 1 }),
      service.create(f.dayA1.id, { after_order_index: 0, lat: 2, lng: 2 }),
    ]);
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    const rows = await service.listForDay(f.dayA1.id);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.after_order_index)).toEqual([0, 0]);
    expect(rows.map((r) => r.sequence).sort((a, b) => a - b)).toEqual([0, 1]);
  });
});
