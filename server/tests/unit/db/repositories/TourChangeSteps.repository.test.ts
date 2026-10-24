/**
 * `TourChangeStepsRepository` (MCP-T03): a step saved from a confirmed
 * proposal recorded whole with its id answered, one step per revision of a
 * tour, its revision the next after the one it was prepared on, and the steps
 * going with their tour. MCP-T04: the steps of a tour read back, the latest
 * first and only the tour's own, and a step marked taken back once.
 */
import { TourChangeSteps } from '../../../../src/db/entities/TourChangeSteps.entity';
import { Tours } from '../../../../src/db/entities/Tours.entity';
import type {
  TourChangeStepsRepository,
  TourChangeStepWrite,
} from '../../../../src/db/repositories/TourChangeSteps.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { countRows, deleteRows, findRow } from '../../../helpers/factories/rows';
import { makeTour } from '../../../helpers/factories/tours';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let steps: TourChangeStepsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  steps = t.repo(TourChangeSteps);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function walk() {
  const { user } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  const place = await makePlace(t, trip.id, { name: 'Old town' });
  await makeTour(t, place.id, { tourTypeRef: 'walk', revision: 4 });
  return { user, place };
}

function step(placeId: number, overrides: Partial<TourChangeStepWrite> = {}): TourChangeStepWrite {
  return {
    place_id: placeId,
    proposal_id: '0123456789abcdef0123456789abcdef',
    base_revision: 3,
    revision: 4,
    changes: '[{"op":"remove","key":"stop-park"}]',
    before_state: '{"route_geometry":null,"waypoints":[]}',
    saved_by: null,
    ...overrides,
  };
}

describe('TourChangeStepsRepository', () => {
  it('TCSTEP-001: records a step whole and answers its id, the time it was saved filled in', async () => {
    const { user, place } = await walk();
    const id = await steps.record(step(place.id, { saved_by: user.id }));

    const row = await findRow(t, TourChangeSteps, { id });
    expect(row).toMatchObject({
      proposal_id: '0123456789abcdef0123456789abcdef',
      base_revision: 3,
      revision: 4,
      changes: '[{"op":"remove","key":"stop-park"}]',
      before_state: '{"route_geometry":null,"waypoints":[]}',
      saved_by: user.id,
    });
    expect(row?.saved_at).toEqual(expect.any(String));
    expect(await steps.record(step(place.id, { base_revision: 4, revision: 5 }))).toBeGreaterThan(id);
  });

  it('TCSTEP-002: one step per revision of a tour, always the revision after the one it was prepared on', async () => {
    const { place } = await walk();
    await steps.record(step(place.id));

    await expect(steps.record(step(place.id, { proposal_id: 'fedcba9876543210fedcba9876543210' }))).rejects.toThrow();
    await expect(steps.record(step(place.id, { base_revision: 4, revision: 6 }))).rejects.toThrow();
    await expect(steps.record(step(place.id, { base_revision: 0, revision: 1 }))).rejects.toThrow();
    expect(await countRows(t, TourChangeSteps, {})).toBe(1);
  });

  it('TCSTEP-003: the steps go with their tour', async () => {
    const { place } = await walk();
    await steps.record(step(place.id));
    await deleteRows(t, Tours, { place: place.id });
    expect(await countRows(t, TourChangeSteps, {})).toBe(0);
  });

  it('TCSTEP-004: lists the steps of a tour the latest first, at most as many as asked, and finds only its own', async () => {
    const { place } = await walk();
    const { place: other } = await walk();
    const first = await steps.record(step(place.id));
    const second = await steps.record(step(place.id, { base_revision: 4, revision: 5 }));
    const elsewhere = await steps.record(step(other.id));

    const listed = await steps.listForPlace(place.id, 20);
    expect(listed.map((row) => [row.id, row.revision])).toEqual([
      [second, 5],
      [first, 4],
    ]);
    expect(listed[1]).toMatchObject({
      base_revision: 3,
      changes: '[{"op":"remove","key":"stop-park"}]',
      before_state: '{"route_geometry":null,"waypoints":[]}',
      saved_at: expect.any(String),
      undone_revision: null,
      undone_at: null,
    });
    expect((await steps.listForPlace(place.id, 1)).map((row) => row.id)).toEqual([second]);
    expect((await steps.findForPlace(place.id, first))?.id).toBe(first);
    expect(await steps.findForPlace(place.id, elsewhere)).toBeUndefined();
  });

  it('TCSTEP-005: marks a step taken back once, with the revision that raised the tour to, who and when', async () => {
    const { user, place } = await walk();
    const id = await steps.record(step(place.id));

    expect(await steps.markUndone(id, { undone_revision: 5, undone_by: user.id })).toBe(true);
    expect(await steps.markUndone(id, { undone_revision: 6, undone_by: null })).toBe(false);

    const row = await findRow(t, TourChangeSteps, { id });
    expect([row?.undone_revision, row?.undone_by]).toEqual([5, user.id]);
    expect(row?.undone_at).toEqual(expect.any(String));
    expect((await steps.findForPlace(place.id, id))?.undone_revision).toBe(5);
  });

  it('TCSTEP-006: taking a step back always raises the tour past the revision the step saved', async () => {
    const { place } = await walk();
    const id = await steps.record(step(place.id));
    await expect(steps.markUndone(id, { undone_revision: 4, undone_by: null })).rejects.toThrow();
    expect((await findRow(t, TourChangeSteps, { id }))?.undone_revision).toBeNull();
  });
});
