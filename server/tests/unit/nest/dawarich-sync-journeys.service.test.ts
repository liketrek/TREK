/**
 * DawarichSyncService preparing the recorded days of journeys (JRN-03). The
 * suite takes the sync from its module over a snapshot test db; only the
 * Dawarich instance and the connection store are replaced, so the journey
 * access, the switch, the stays and the status rows are the real ones.
 *
 * What it pins: nothing is prepared while a journey's switch is off; with it
 * on, the linked trip periods are read with the person's own connection, a
 * period their own trip sync read already is not asked twice, and a period
 * of a trip they are not on files its stays under no trip; repeated runs
 * write no second stay and leave a taken-over one as it was; a failure keeps
 * the last success apart from its reason; a reader, a disconnected person or
 * the Journey addon switched off prepare nothing.
 */
import { DawarichVisitSuggestions } from '../../../src/db/entities/DawarichVisitSuggestions.entity';
import { JourneyRecordingPrep } from '../../../src/db/entities/JourneyRecordingPrep.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { DawarichSyncService } from '../../../src/nest/integrations/dawarich-sync.service';
import { DawarichClient, DawarichError, type DawarichVisitRaw } from '../../../src/nest/integrations/dawarich.client';
import { DawarichModule } from '../../../src/nest/integrations/dawarich.module';
import { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { JourneyRecordingPrepService } from '../../../src/nest/journey/journey-recording-prep.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, linkTripToJourney, makeJourney } from '../../helpers/factories/journeys';
import { countRows, findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const CREDS = { baseUrl: 'https://dawarich.example.com', apiKey: 'key', allowInsecureTls: false };
const listVisits = vi.fn<(...args: unknown[]) => Promise<{ visits: DawarichVisitRaw[]; truncated: boolean }>>();
const getCredentials = vi.fn();
const recordSyncResult = vi.fn();
const storeCapabilities = vi.fn();
const probeCapabilities = vi.fn();
let t: TestModule;
let orm: TestOrm;
let sync: DawarichSyncService;
let prep: JourneyRecordingPrepService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [DawarichModule],
    overrides: [
      { provide: DawarichClient, useValue: { listVisits } },
      {
        provide: DawarichService,
        useValue: { getCredentials, recordSyncResult, storeCapabilities, probeCapabilities },
      },
    ],
  });
  sync = t.get(DawarichSyncService);
  prep = t.get(JourneyRecordingPrepService);
  orm = await createTestOrm(db);
});
beforeEach(async () => {
  resetTestDb(db);
  orm.clear();
  listVisits.mockReset().mockResolvedValue({ visits: [], truncated: false });
  getCredentials.mockReset().mockResolvedValue(CREDS);
  recordSyncResult.mockReset();
  storeCapabilities.mockReset();
  probeCapabilities.mockReset().mockResolvedValue(null);
  await setAddonEnabled(orm, 'journey', true);
  await setAddonEnabled(orm, 'dawarich', true);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const DAY_MS = 86_400_000;

/** A calendar date relative to today, so a fixture never ages out of the sync's reach. */
function dayOffset(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
}

const TRIP_START = dayOffset(-6);
const TRIP_END = dayOffset(-2);
const VISIT_DAY = dayOffset(-4);

function visit(id: number, name: string): DawarichVisitRaw {
  return {
    id,
    area_id: null,
    started_at: `${VISIT_DAY}T09:00:00Z`,
    ended_at: `${VISIT_DAY}T10:30:00Z`,
    duration: null,
    name,
    status: 'suggested',
    confidence: 80,
    confidence_band: 'high',
    place: { latitude: 45.434, longitude: 12.3388, id: null },
  };
}

/** Marta's trip behind a journey that prepares its days, with Jonas writing in it but not on the trip. */
async function fixture(autoPrepare = 1) {
  const { user: owner } = await makeUser(orm, { username: 'marta' });
  const { user: editor } = await makeUser(orm, { username: 'jonas' });
  const { user: viewer } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Venice', auto_prepare_recordings: autoPrepare });
  await addJourneyContributor(orm, journey.id, editor.id, 'editor');
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  const trip = await makeTrip(orm, owner.id, { start_date: TRIP_START, end_date: TRIP_END });
  await linkTripToJourney(orm, journey.id, trip.id);
  return { owner, editor, viewer, journey, trip };
}

function staysOf(userId: number) {
  return findRows(orm, DawarichVisitSuggestions, { user: userId }, { id: 'asc' });
}

async function onlyStayOf(userId: number) {
  const [stay, ...rest] = await staysOf(userId);
  expect(rest).toEqual([]);
  if (!stay) throw new Error(`no stay for user ${userId}`);
  return stay;
}

describe('DawarichSyncService preparing journeys', () => {
  it('JRNPREP-SYNC-001: an editor not on the trip gets its stays prepared under no trip, and the journey records the run', async () => {
    const f = await fixture();
    listVisits.mockResolvedValue({ visits: [visit(701, 'Piazza San Marco')], truncated: false });

    const outcome = await sync.syncUser(f.editor.id);

    expect(outcome).toMatchObject({ state: 'ok', created: 1 });
    expect(listVisits).toHaveBeenCalledTimes(1);
    expect((await staysOf(f.editor.id)).map((row) => [row.name, row.trip_id, row.state])).toEqual([
      ['Piazza San Marco', null, 'new'],
    ]);
    const status = await prep.status(f.journey.id, f.editor.id);
    expect(status.lastError).toBeNull();
    expect(status.lastSuccessAt).toBe(status.lastAttemptAt);
    expect(status.lastSuccessAt).not.toBeNull();
  });

  it('JRNPREP-SYNC-002: the owner on the trip is asked once for the period, and the journey takes that answer', async () => {
    const f = await fixture();
    listVisits.mockResolvedValue({ visits: [visit(702, 'Rialto')], truncated: false });

    await sync.syncUser(f.owner.id);

    expect(listVisits).toHaveBeenCalledTimes(1);
    expect((await staysOf(f.owner.id)).map((row) => row.trip_id)).toEqual([f.trip.id]);
    expect((await prep.status(f.journey.id, f.owner.id)).lastError).toBeNull();
  });

  it('JRNPREP-SYNC-003: with the switch off nothing is asked for the journey and no status is written', async () => {
    const f = await fixture(0);

    expect(await sync.syncUser(f.editor.id)).toMatchObject({ state: 'ok', created: 0 });

    expect(listVisits).not.toHaveBeenCalled();
    expect(await countRows(orm, JourneyRecordingPrep, {})).toBe(0);
  });

  it('JRNPREP-SYNC-004: repeated runs write no second stay and leave a taken-over one as it was', async () => {
    const f = await fixture();
    listVisits.mockResolvedValue({ visits: [visit(703, 'Giudecca')], truncated: false });
    await sync.syncUser(f.editor.id);
    const stay = await onlyStayOf(f.editor.id);
    await updateRows(
      orm,
      DawarichVisitSuggestions,
      { id: stay.id },
      { state: 'accepted', accepted_hash: stay.source_hash },
    );

    listVisits.mockResolvedValue({ visits: [visit(703, 'Giudecca, renamed')], truncated: false });
    expect(await sync.syncUser(f.editor.id)).toMatchObject({ created: 0, updated: 1 });

    const after = await onlyStayOf(f.editor.id);
    expect(after).toMatchObject({ name: 'Giudecca', state: 'accepted' });
    expect(after.source_hash).not.toBe(stay.source_hash);
  });

  it('JRNPREP-SYNC-005: a failed run keeps the stays and the last success, says why, and the next success clears it', async () => {
    const f = await fixture();
    listVisits.mockResolvedValue({ visits: [visit(704, 'Zattere')], truncated: false });
    await sync.syncUser(f.editor.id);
    const before = await prep.status(f.journey.id, f.editor.id);

    listVisits.mockRejectedValue(new DawarichError('unreachable', 'down'));
    expect(await sync.syncUser(f.editor.id)).toMatchObject({ state: 'failed' });

    expect(recordSyncResult).toHaveBeenLastCalledWith(f.editor.id, 'failed', 'unreachable');
    expect(await staysOf(f.editor.id)).toHaveLength(1);
    const failed = await prep.status(f.journey.id, f.editor.id);
    expect(failed).toMatchObject({ lastSuccessAt: before.lastSuccessAt, lastError: 'unreachable' });

    listVisits.mockResolvedValue({ visits: [], truncated: false });
    await sync.syncUser(f.editor.id);
    expect((await prep.status(f.journey.id, f.editor.id)).lastError).toBeNull();
  });

  it('JRNPREP-SYNC-006: a reader, the Journey addon off or a trip still days ahead prepare nothing', async () => {
    const f = await fixture();

    await sync.syncUser(f.viewer.id);
    expect(listVisits).not.toHaveBeenCalled();

    await setAddonEnabled(orm, 'journey', false);
    await sync.syncUser(f.editor.id);
    expect(listVisits).not.toHaveBeenCalled();

    await setAddonEnabled(orm, 'journey', true);
    const later = await makeJourney(orm, f.owner.id, { auto_prepare_recordings: 1 });
    await addJourneyContributor(orm, later.id, f.editor.id, 'editor');
    const ahead = await makeTrip(orm, f.owner.id, { start_date: dayOffset(5), end_date: dayOffset(8) });
    await linkTripToJourney(orm, later.id, ahead.id);
    await sync.syncUser(f.editor.id);
    expect(await findRow(orm, JourneyRecordingPrep, { journey: later.id })).toBeNull();
    expect(await findRow(orm, JourneyRecordingPrep, { journey: f.journey.id })).not.toBeNull();
  });

  it('JRNPREP-SYNC-007: without a connection nothing is asked and nothing recorded', async () => {
    const f = await fixture();
    getCredentials.mockResolvedValue(null);

    expect(await sync.syncUser(f.editor.id)).toMatchObject({ state: 'failed' });

    expect(listVisits).not.toHaveBeenCalled();
    expect(await countRows(orm, JourneyRecordingPrep, {})).toBe(0);
  });
});

describe('JourneyRecordingPrepService', () => {
  it('JRNPREP-SVC-001: groups the linked trips by journey and reads no status before the first run', async () => {
    const f = await fixture();
    const second = await makeTrip(orm, f.owner.id, { start_date: dayOffset(-1), end_date: dayOffset(2) });
    await linkTripToJourney(orm, f.journey.id, second.id);

    expect(await prep.listFor(f.editor.id)).toEqual([
      {
        journeyId: f.journey.id,
        trips: [
          { id: f.trip.id, start_date: TRIP_START, end_date: TRIP_END },
          { id: second.id, start_date: dayOffset(-1), end_date: dayOffset(2) },
        ],
      },
    ]);
    expect(await prep.status(f.journey.id, f.editor.id)).toEqual({
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
    });
  });

  it('JRNPREP-SVC-002: the owner switches it on and off through the journey, an editor cannot', async () => {
    const f = await fixture(0);
    const journeys = t.get(JourneyDomainService);

    expect(await journeys.updateJourney(f.journey.id, f.editor.id, { auto_prepare_recordings: true })).toBeNull();
    await journeys.updateJourney(f.journey.id, f.owner.id, { auto_prepare_recordings: true });
    expect((await findRow(orm, Journeys, { id: f.journey.id }))?.auto_prepare_recordings).toBe(1);
    expect(await prep.listFor(f.owner.id)).toHaveLength(1);

    await journeys.updateJourney(f.journey.id, f.owner.id, { auto_prepare_recordings: false });
    expect(await prep.listFor(f.owner.id)).toEqual([]);
  });

  it('JRNPREP-SVC-003: the periods of a journey are the trips a run reads, an open one included and one out of reach left out', async () => {
    const f = await fixture();
    const old = await makeTrip(orm, f.owner.id, { start_date: dayOffset(-420), end_date: dayOffset(-410) });
    const open = await makeTrip(orm, f.owner.id, { start_date: dayOffset(-1), end_date: null });
    await linkTripToJourney(orm, f.journey.id, old.id);
    await linkTripToJourney(orm, f.journey.id, open.id);

    expect(await prep.periodsOf(f.journey.id, f.editor.id)).toEqual([
      { start: TRIP_START, end: TRIP_END },
      { start: dayOffset(-1), end: null },
    ]);
    expect(await prep.periodsOf(f.journey.id, f.viewer.id)).toEqual([]);
  });

  it('JRNPREP-SVC-004: a journey whose only trip ended out of reach has no period, and a run records nothing for it', async () => {
    const { user: owner } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id, { title: 'Lisbon', auto_prepare_recordings: 1 });
    const old = await makeTrip(orm, owner.id, { start_date: dayOffset(-430), end_date: dayOffset(-420) });
    await linkTripToJourney(orm, journey.id, old.id);

    expect(await prep.periodsOf(journey.id, owner.id)).toEqual([]);
    await sync.syncUser(owner.id);
    expect(await findRow(orm, JourneyRecordingPrep, { journey: journey.id })).toBeNull();
  });
});
