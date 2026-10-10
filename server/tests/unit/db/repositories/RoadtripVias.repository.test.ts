/**
 * `RoadtripViasRepository` (Plan 3d Task 1). RT2 (`listForDay`, the ONE copy
 * — `AccommodationsService`/`AssignmentsService` both consume it now), RT3
 * (`listForTrip`), RT4/RT10 (`nextSequence`), RT5/RT11 (`insertVia`), RT9
 * (`deleteLeg`), RT14 (`existsInDay`), RT15/RT16 (`moveCoordinates`/
 * `moveCoordinatesAndAnchor`), RT18 (`listAnchors`), RT19/RT23
 * (`deleteInDay`/`deleteInDayCounted`), RT20 (`setAnchor`), RT21
 * (`listLegs`), RT22 (`setSequence`), RT24 (`findById`), AS20
 * (`listForReanchor`).
 */
import { RoadtripVias } from '../../../../src/db/entities/RoadtripVias.entity';
import type { RoadtripViasRepository } from '../../../../src/db/repositories/RoadtripVias.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createDay, createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let vias: RoadtripViasRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  vias = t.repo(RoadtripVias);
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
  const tripA = createTrip(testDb, user.id);
  const tripB = createTrip(testDb, user.id);
  const dayA1 = createDay(testDb, tripA.id);
  const dayA2 = createDay(testDb, tripA.id);
  const dayB1 = createDay(testDb, tripB.id);
  return { tripA, tripB, dayA1, dayA2, dayB1 };
}

describe('RoadtripViasRepository', () => {
  it('RT5REPO-001: insertVia writes every column and returns the new id', async () => {
    const { dayA1 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 53.1, lng: 10.2 });
    const row = await vias.findById(id);
    expect(row).toEqual({
      id,
      day_id: dayA1.id,
      after_order_index: 0,
      sequence: 0,
      lat: 53.1,
      lng: 10.2,
      created_at: expect.any(String),
    });
  });

  it('RT24REPO-001: findById on a missing id is null', async () => {
    expect(await vias.findById(999999)).toBeNull();
  });

  it('RT2REPO-001: listForDay orders by after_order_index, sequence, id and is scoped to the day', async () => {
    const { dayA1, dayA2 } = fixture();
    const b = await vias.insertVia({ day_id: dayA1.id, after_order_index: 1, sequence: 0, lat: 1, lng: 1 });
    const a1 = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 1, lat: 1, lng: 1 });
    const a0 = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });
    await vias.insertVia({ day_id: dayA2.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });

    const rows = await vias.listForDay(dayA1.id);
    expect(rows.map((v) => v.id)).toEqual([a0, a1, b]);
  });

  it('RT3REPO-001: listForTrip spans every day of the trip, ordered by day/after_order_index/sequence/id, and never crosses trips', async () => {
    const { tripA, tripB, dayA1, dayA2, dayB1 } = fixture();
    const v2 = await vias.insertVia({ day_id: dayA2.id, after_order_index: 0, sequence: 0, lat: 2, lng: 2 });
    const v1 = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });
    await vias.insertVia({ day_id: dayB1.id, after_order_index: 0, sequence: 0, lat: 3, lng: 3 });

    const rows = await vias.listForTrip(tripA.id);
    expect(rows).toEqual([
      { id: v1, day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1, created_at: expect.any(String) },
      { id: v2, day_id: dayA2.id, after_order_index: 0, sequence: 0, lat: 2, lng: 2, created_at: expect.any(String) },
    ]);
    expect((await vias.listForTrip(tripB.id)).length).toBe(1);
  });

  it('RT4REPO-001: nextSequence is 0 for an empty leg, and MAX+1 for a populated one', async () => {
    const { dayA1 } = fixture();
    expect(await vias.nextSequence(dayA1.id, 0)).toBe(0);
    await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });
    await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 3, lat: 1, lng: 1 });
    expect(await vias.nextSequence(dayA1.id, 0)).toBe(4);
    // A different leg on the same day starts fresh.
    expect(await vias.nextSequence(dayA1.id, 1)).toBe(0);
  });

  it('RT9REPO-001: deleteLeg removes only the named leg’s vias', async () => {
    const { dayA1 } = fixture();
    const keep = await vias.insertVia({ day_id: dayA1.id, after_order_index: 1, sequence: 0, lat: 1, lng: 1 });
    await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });

    await vias.deleteLeg(dayA1.id, 0);

    const rows = await vias.listForDay(dayA1.id);
    expect(rows.map((v) => v.id)).toEqual([keep]);
  });

  it('RT14REPO-001: existsInDay is true only for the exact (id, day) pair', async () => {
    const { dayA1, dayA2 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });
    expect(await vias.existsInDay(id, dayA1.id)).toBe(true);
    expect(await vias.existsInDay(id, dayA2.id)).toBe(false);
    expect(await vias.existsInDay(999999, dayA1.id)).toBe(false);
  });

  it('RT15REPO-001: moveCoordinates writes lat/lng only, unscoped by day (matches the legacy statement exactly)', async () => {
    const { dayA1, dayA2 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 3, sequence: 0, lat: 1, lng: 1 });
    await vias.moveCoordinates(id, 9, 9);
    const row = await vias.findById(id);
    expect(row).toMatchObject({ lat: 9, lng: 9, after_order_index: 3, day_id: dayA1.id });
    expect(dayA2.id).not.toBe(dayA1.id);
  });

  it('RT16REPO-001: moveCoordinatesAndAnchor writes lat/lng/after_order_index, unscoped by day', async () => {
    const { dayA1 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });
    await vias.moveCoordinatesAndAnchor(id, 9, 9, 5);
    expect(await vias.findById(id)).toMatchObject({ lat: 9, lng: 9, after_order_index: 5 });
  });

  it('RT18REPO-001: listAnchors returns id/after_order_index/sequence for the day only', async () => {
    const { dayA1, dayA2 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 2, sequence: 1, lat: 1, lng: 1 });
    await vias.insertVia({ day_id: dayA2.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });

    const rows = await vias.listAnchors(dayA1.id);
    expect(rows).toEqual([{ id, after_order_index: 2, sequence: 1 }]);
  });

  it('RT21REPO-001: listLegs returns id/after_order_index only, for the day', async () => {
    const { dayA1 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 2, sequence: 1, lat: 1, lng: 1 });
    expect(await vias.listLegs(dayA1.id)).toEqual([{ id, after_order_index: 2 }]);
  });

  it('RT19REPO-001/RT23REPO-001: deleteInDay is silent, deleteInDayCounted reports the row count (0 on a miss)', async () => {
    const { dayA1, dayA2 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });

    // A foreign day scope never deletes.
    expect(await vias.deleteInDayCounted(id, dayA2.id)).toBe(0);
    expect(await vias.findById(id)).not.toBeNull();

    await expect(vias.deleteInDay(999999, dayA1.id)).resolves.toBeUndefined();

    expect(await vias.deleteInDayCounted(id, dayA1.id)).toBe(1);
    expect(await vias.findById(id)).toBeNull();
    expect(await vias.deleteInDayCounted(id, dayA1.id)).toBe(0);
  });

  it('RT20REPO-001: setAnchor writes after_order_index only, scoped to (id, day)', async () => {
    const { dayA1, dayA2 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });
    await vias.setAnchor(id, dayA2.id, 9);
    expect((await vias.findById(id))?.after_order_index).toBe(0);
    await vias.setAnchor(id, dayA1.id, 9);
    expect((await vias.findById(id))?.after_order_index).toBe(9);
  });

  it('RT22REPO-001: setSequence writes sequence only, scoped to (id, day)', async () => {
    const { dayA1 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 0, sequence: 0, lat: 1, lng: 1 });
    await vias.setSequence(id, dayA1.id, 7);
    expect((await vias.findById(id))?.sequence).toBe(7);
  });

  it('AS20REPO-001: listForReanchor returns id/after_order_index/lat/lng, the AnchoredVia shape', async () => {
    const { dayA1 } = fixture();
    const id = await vias.insertVia({ day_id: dayA1.id, after_order_index: 1, sequence: 0, lat: 12.5, lng: -3.2 });
    expect(await vias.listForReanchor(dayA1.id)).toEqual([{ id, after_order_index: 1, lat: 12.5, lng: -3.2 }]);
  });
});
