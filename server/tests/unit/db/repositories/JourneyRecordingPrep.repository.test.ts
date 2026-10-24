/**
 * `JourneyRecordingPrepRepository` (JRN-03): the linked trips of the journeys
 * a person prepares, only while the journey asks for it and the person may
 * edit it, within the sync's reach; and the status row of one journey and
 * person, where a success clears an earlier failure and a failure keeps the
 * last success.
 */
import { JourneyRecordingPrep } from '../../../../src/db/entities/JourneyRecordingPrep.entity';
import { Journeys } from '../../../../src/db/entities/Journeys.entity';
import type { JourneyRecordingPrepRepository } from '../../../../src/db/repositories/JourneyRecordingPrep.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addJourneyContributor, linkTripToJourney, makeJourney } from '../../../helpers/factories/journeys';
import { countRows, deleteRows, updateRows } from '../../../helpers/factories/rows';
import { makeTrip, type TripOverrides } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let prep: JourneyRecordingPrepRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  prep = t.repo(JourneyRecordingPrep);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const REACH = { endedAfter: '2025-09-01', startedBy: '2026-10-22' };

async function preparedJourney() {
  const { user: owner } = await makeUser(t);
  const journey = await makeJourney(t, owner.id, { auto_prepare_recordings: 1 });
  const trip = await makeTrip(t, owner.id, { start_date: '2026-05-12', end_date: '2026-05-18' });
  await linkTripToJourney(t, journey.id, trip.id);
  return { owner, journey, trip };
}

describe('JourneyRecordingPrepRepository.listPreparedTrips', () => {
  it('JRNPREP-REPO-001: lists the linked trips of a prepared journey for its owner and its editors, not its readers', async () => {
    const { owner, journey, trip } = await preparedJourney();
    const { user: editor } = await makeUser(t);
    const { user: viewer } = await makeUser(t);
    await addJourneyContributor(t, journey.id, editor.id, 'editor');
    await addJourneyContributor(t, journey.id, viewer.id, 'viewer');
    const row = { journey_id: journey.id, trip_id: trip.id, start_date: '2026-05-12', end_date: '2026-05-18' };

    expect(await prep.listPreparedTrips(owner.id, REACH)).toEqual([row]);
    expect(await prep.listPreparedTrips(editor.id, REACH)).toEqual([row]);
    expect(await prep.listPreparedTrips(viewer.id, REACH)).toEqual([]);
  });

  it('JRNPREP-REPO-002: a journey with the switch off, and an undated, archived or out-of-reach trip, give nothing', async () => {
    const { owner, journey } = await preparedJourney();
    const link = async (overrides: TripOverrides) =>
      linkTripToJourney(t, journey.id, (await makeTrip(t, owner.id, overrides)).id);
    await link({ start_date: null, end_date: null });
    await link({ start_date: '2026-06-01', end_date: '2026-06-05', is_archived: 1 });
    await link({ start_date: '2024-05-01', end_date: '2024-05-10' });
    await link({ start_date: '2026-12-01', end_date: '2026-12-10' });
    await link({ start_date: '2026-10-01', end_date: null });

    expect((await prep.listPreparedTrips(owner.id, REACH)).map((row) => row.start_date)).toEqual([
      '2026-05-12',
      '2026-10-01',
    ]);

    await updateRows(t, Journeys, { id: journey.id }, { auto_prepare_recordings: 0 });
    expect(await prep.listPreparedTrips(owner.id, REACH)).toEqual([]);
  });
});

describe('JourneyRecordingPrepRepository status', () => {
  it('JRNPREP-REPO-003: reads nothing before the first run, then one row per journey and person', async () => {
    const { owner, journey } = await preparedJourney();
    expect(await prep.findStatus(journey.id, owner.id)).toBeUndefined();

    await prep.recordAttempt(journey.id, owner.id, '2026-05-14T08:00:00.000Z', null);
    await prep.recordAttempt(journey.id, owner.id, '2026-05-14T09:00:00.000Z', null);

    expect(await prep.findStatus(journey.id, owner.id)).toEqual({
      last_attempt_at: '2026-05-14T09:00:00.000Z',
      last_success_at: '2026-05-14T09:00:00.000Z',
      last_error: null,
    });
    expect(await countRows(t, JourneyRecordingPrep, {})).toBe(1);
  });

  it('JRNPREP-REPO-004: a failure keeps the last success, the next success clears the failure', async () => {
    const { owner, journey } = await preparedJourney();
    await prep.recordAttempt(journey.id, owner.id, '2026-05-14T08:00:00.000Z', null);
    await prep.recordAttempt(journey.id, owner.id, '2026-05-14T09:00:00.000Z', 'unreachable');

    expect(await prep.findStatus(journey.id, owner.id)).toEqual({
      last_attempt_at: '2026-05-14T09:00:00.000Z',
      last_success_at: '2026-05-14T08:00:00.000Z',
      last_error: 'unreachable',
    });

    await prep.recordAttempt(journey.id, owner.id, '2026-05-14T10:00:00.000Z', null);
    expect(await prep.findStatus(journey.id, owner.id)).toMatchObject({
      last_success_at: '2026-05-14T10:00:00.000Z',
      last_error: null,
    });
  });

  it('JRNPREP-REPO-005: a first run that fails has no success yet, and the row goes with its journey', async () => {
    const { owner, journey } = await preparedJourney();
    await prep.recordAttempt(journey.id, owner.id, '2026-05-14T08:00:00.000Z', 'unauthorized');

    expect(await prep.findStatus(journey.id, owner.id)).toEqual({
      last_attempt_at: '2026-05-14T08:00:00.000Z',
      last_success_at: null,
      last_error: 'unauthorized',
    });

    await deleteRows(t, Journeys, { id: journey.id });
    expect(await countRows(t, JourneyRecordingPrep, {})).toBe(0);
  });
});
