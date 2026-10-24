/**
 * JourneyRecordingsService (JRN-01): taking a day's recorded route over into a
 * journey. The suite takes the service from its module over a snapshot test
 * db; only the read from Dawarich is replaced, so the journey access, the kept
 * rows and the broadcasts are the real ones.
 *
 * What it pins: a preview writes nothing and says what would be kept, for
 * which journey and day and who would see it; a save keeps exactly the day
 * that was previewed, once, replaces a different version only when asked and
 * never touches an entry; a failed read keeps the version the journey had;
 * reading and removing kept days need no Dawarich at all. The status of
 * preparing the days (JRN-03) is the caller's own and only for editors.
 */
import { DawarichConnections } from '../../../src/db/entities/DawarichConnections.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { JourneyRecordedDays } from '../../../src/db/entities/JourneyRecordedDays.entity';
import { DomainError } from '../../../src/nest/common/domain-error';
import { DawarichTracksService, type RecordedDayFetch } from '../../../src/nest/integrations/dawarich-tracks.service';
import { JourneyRecordingsModule } from '../../../src/nest/journey-recordings/journey-recordings.module';
import { JourneyRecordingsService } from '../../../src/nest/journey-recordings/journey-recordings.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { JourneyRecordedDaysService } from '../../../src/nest/journey/journey-recorded-days.service';
import { JourneyRecordingPrepService } from '../../../src/nest/journey/journey-recording-prep.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import {
  addJourneyContributor,
  linkTripToJourney,
  makeJourney,
  makeJourneyEntry,
} from '../../helpers/factories/journeys';
import { countRows, findRow, upsertRow } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const fetchDay = vi.fn<(...args: unknown[]) => Promise<RecordedDayFetch>>();
let t: TestModule;
let orm: TestOrm;
let svc: JourneyRecordingsService;
let kept: JourneyRecordedDaysService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyRecordingsModule],
    overrides: [{ provide: DawarichTracksService, useValue: { fetchDay } }],
  });
  svc = t.get(JourneyRecordingsService);
  kept = t.get(JourneyRecordedDaysService);
  orm = await createTestOrm(db);
});
beforeEach(async () => {
  resetTestDb(db);
  orm.clear();
  fetchDay.mockReset();
  t.realtime.reset();
  await setAddonEnabled(orm, 'journey', true);
  await setAddonEnabled(orm, 'dawarich', true);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const WALK = {
  points: [
    [45.434, 12.3388],
    [45.4364, 12.3218],
  ] as Array<[number, number]>,
  mode: 'walking',
  startedAt: '2026-05-14T09:00:00+02:00',
  endedAt: '2026-05-14T09:40:00+02:00',
  distanceMeters: 1500,
};

function recorded(over: Partial<RecordedDayFetch> = {}): RecordedDayFetch {
  return {
    segments: [WALK],
    sourceKind: 'tracks',
    utcOffsetMinutes: 120,
    offsetSource: 'source',
    sourceOffsetMinutes: 120,
    window: { from: '2026-05-13T22:00:00.000Z', to: '2026-05-14T22:00:00.000Z' },
    fetchedAt: '2026-05-15T07:00:00.000Z',
    truncated: false,
    ...over,
  };
}

async function fixture() {
  const { user: owner } = await makeUser(orm, { username: 'marta' });
  const { user: editor } = await makeUser(orm, { username: 'jonas' });
  const { user: viewer } = await makeUser(orm);
  const { user: outsider } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Venice' });
  await addJourneyContributor(orm, journey.id, editor.id, 'editor');
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  return { owner, editor, viewer, outsider, journey };
}

const PREVIEW = { date: '2026-05-14', utcOffsetMinutes: 0, useSourceOffset: true };

async function refusal(promise: Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

describe('JourneyRecordingsService.preview', () => {
  it('JRNREC-SVC-001: says which journey, day and recording would be kept, and who would see it, keeping nothing', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded());

    const preview = await svc.preview(f.owner.id, f.journey.id, PREVIEW);

    expect(fetchDay).toHaveBeenCalledWith(f.owner.id, '2026-05-14', { offsetMinutes: 0, useSourceOffset: true });
    expect(preview).toMatchObject({
      journey: { id: f.journey.id, title: 'Venice' },
      date: '2026-05-14',
      utcOffsetMinutes: 120,
      offsetSource: 'source',
      sourceOffsetMinutes: 120,
      sourceKind: 'tracks',
      stats: { distanceMeters: 1500, segmentCount: 1, gapCount: 0, modes: ['walking'] },
      provisional: false,
      stored: null,
      sameAsStored: false,
      audience: 2,
    });
    expect(preview.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(await countRows(orm, JourneyRecordedDays, {})).toBe(0);
  });

  it('JRNREC-SVC-002: a day with nothing recorded has no hash to keep, and a running day is provisional', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded({ segments: [], fetchedAt: '2026-05-14T12:00:00.000Z' }));

    const preview = await svc.preview(f.owner.id, f.journey.id, PREVIEW);

    expect(preview).toMatchObject({ contentHash: null, provisional: true, stats: { segmentCount: 0 } });
  });

  it('JRNREC-SVC-003: refuses a stranger with 404, a viewer with 403 and a switched-off Dawarich, before asking it', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded());

    expect(await refusal(svc.preview(f.outsider.id, f.journey.id, PREVIEW))).toEqual({
      status: 404,
      body: { error: 'Journey not found' },
    });
    expect(await refusal(svc.preview(f.viewer.id, f.journey.id, PREVIEW))).toEqual({
      status: 403,
      body: { error: 'Not allowed' },
    });
    await setAddonEnabled(orm, 'dawarich', false);
    expect(await refusal(svc.preview(f.owner.id, f.journey.id, PREVIEW))).toEqual({
      status: 404,
      body: { error: 'Dawarich is not enabled', code: 'addon_disabled' },
    });
    expect(fetchDay).not.toHaveBeenCalled();
  });

  it('JRNREC-SVC-004: shows the version the journey keeps and whether the live one is the same', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded());
    const first = await svc.preview(f.owner.id, f.journey.id, PREVIEW);
    await svc.save(f.owner.id, f.journey.id, '2026-05-14', {
      utcOffsetMinutes: 120,
      expectedHash: String(first.contentHash),
    });

    const same = await svc.preview(f.editor.id, f.journey.id, PREVIEW);
    expect(same).toMatchObject({ sameAsStored: true, stored: { importedBy: { username: 'marta' } } });

    fetchDay.mockResolvedValue(recorded({ segments: [WALK, { ...WALK, startedAt: '2026-05-14T15:00:00+02:00' }] }));
    const grown = await svc.preview(f.editor.id, f.journey.id, PREVIEW);
    expect(grown.sameAsStored).toBe(false);
    expect(grown.stored?.stats.segmentCount).toBe(1);
  });
});

describe('JourneyRecordingsService.save', () => {
  async function previewed(userId: number, journeyId: number) {
    const preview = await svc.preview(userId, journeyId, PREVIEW);
    return { utcOffsetMinutes: preview.utcOffsetMinutes, expectedHash: String(preview.contentHash) };
  }

  it('JRNREC-SVC-005: keeps the previewed day in the zone it was cut in and tells everyone on the journey', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded());
    const body = await previewed(f.editor.id, f.journey.id);

    const result = await svc.save(f.editor.id, f.journey.id, '2026-05-14', body, 'sock-1');

    expect(fetchDay).toHaveBeenLastCalledWith(f.editor.id, '2026-05-14', {
      offsetMinutes: 120,
      useSourceOffset: false,
    });
    expect(result.outcome).toBe('created');
    expect(result.day).toMatchObject({
      date: '2026-05-14',
      source: 'dawarich',
      sourceKind: 'tracks',
      utcOffsetMinutes: 120,
      window: { from: '2026-05-13T22:00:00.000Z', to: '2026-05-14T22:00:00.000Z' },
      segments: [WALK],
      truncated: false,
      provisional: false,
      importedBy: { id: f.editor.id, username: 'jonas' },
    });
    const recipients = t.realtime.broadcastToUserMock.mock.calls.map(([userId]) => userId).sort();
    expect(recipients).toEqual([f.owner.id, f.editor.id, f.viewer.id].sort());
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledWith(
      f.owner.id,
      { type: 'journey:recording:updated', journeyId: f.journey.id, date: '2026-05-14' },
      'sock-1',
    );
  });

  it('JRNREC-SVC-006: the same day taken over again keeps one version and announces nothing', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded());
    const body = await previewed(f.owner.id, f.journey.id);
    await svc.save(f.owner.id, f.journey.id, '2026-05-14', body);
    t.realtime.reset();

    const again = await svc.save(f.owner.id, f.journey.id, '2026-05-14', body);

    expect(again.outcome).toBe('unchanged');
    expect(await countRows(orm, JourneyRecordedDays, {})).toBe(1);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('JRNREC-SVC-007: a different version replaces the kept one only when asked, and no entry is touched', async () => {
    const f = await fixture();
    const entry = await makeJourneyEntry(orm, f.journey.id, f.owner.id, {
      entry_date: '2026-05-14',
      title: 'Rialto',
      story: 'Coffee by the bridge',
    });
    fetchDay.mockResolvedValue(recorded());
    await svc.save(f.owner.id, f.journey.id, '2026-05-14', await previewed(f.owner.id, f.journey.id));

    fetchDay.mockResolvedValue(recorded({ segments: [WALK, { ...WALK, startedAt: '2026-05-14T15:00:00+02:00' }] }));
    const body = await previewed(f.owner.id, f.journey.id);
    expect(await refusal(svc.save(f.owner.id, f.journey.id, '2026-05-14', body))).toEqual({
      status: 409,
      body: { error: 'The journey already keeps another recording of that day', code: 'recording_exists' },
    });
    expect((await kept.find(f.journey.id, '2026-05-14'))?.stats.segmentCount).toBe(1);

    const replaced = await svc.save(f.owner.id, f.journey.id, '2026-05-14', { ...body, replace: true });
    expect(replaced.outcome).toBe('replaced');
    expect(replaced.day.stats.segmentCount).toBe(2);
    expect(await countRows(orm, JourneyRecordedDays, {})).toBe(1);
    expect(await findRow(orm, JourneyEntries, { id: entry.id })).toMatchObject({
      title: 'Rialto',
      story: 'Coffee by the bridge',
    });
  });

  it('JRNREC-SVC-013: of two editors saving the day at once without Replace, the second is refused, not silently kept', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded());
    await svc.save(f.editor.id, f.journey.id, '2026-05-14', await previewed(f.editor.id, f.journey.id));
    t.realtime.reset();

    fetchDay.mockResolvedValue(recorded({ segments: [WALK, { ...WALK, startedAt: '2026-05-14T15:00:00+02:00' }] }));
    const body = await previewed(f.owner.id, f.journey.id);
    // The owner read the day before the editor's write landed.
    const staleRead = vi.spyOn(kept, 'find').mockResolvedValueOnce(null);

    expect(await refusal(svc.save(f.owner.id, f.journey.id, '2026-05-14', body))).toEqual({
      status: 409,
      body: { error: 'The journey already keeps another recording of that day', code: 'recording_exists' },
    });
    staleRead.mockRestore();
    expect(await kept.find(f.journey.id, '2026-05-14')).toMatchObject({
      importedBy: { id: f.editor.id, username: 'jonas' },
      stats: { segmentCount: 1 },
    });
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('JRNREC-SVC-008: a recording that changed since the preview is not kept, and the kept version stays', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded());
    const body = await previewed(f.owner.id, f.journey.id);
    await svc.save(f.owner.id, f.journey.id, '2026-05-14', body);

    fetchDay.mockResolvedValue(recorded({ segments: [{ ...WALK, distanceMeters: 1800 }] }));
    expect(await refusal(svc.save(f.owner.id, f.journey.id, '2026-05-14', { ...body, replace: true }))).toEqual({
      status: 409,
      body: { error: 'The recording changed since the preview', code: 'recording_changed' },
    });
    expect((await kept.find(f.journey.id, '2026-05-14'))?.stats.distanceMeters).toBe(1500);
  });

  it('JRNREC-SVC-009: a failed read throws before anything is written, so the kept version stays as it was', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded());
    const body = await previewed(f.owner.id, f.journey.id);
    await svc.save(f.owner.id, f.journey.id, '2026-05-14', body);
    t.realtime.reset();

    fetchDay.mockRejectedValue(
      new DomainError(502, 'Dawarich answered HTTP 500', { details: { code: 'server_error' } }),
    );
    expect(await refusal(svc.save(f.owner.id, f.journey.id, '2026-05-14', { ...body, replace: true }))).toEqual({
      status: 502,
      body: { error: 'Dawarich answered HTTP 500', code: 'server_error' },
    });
    expect((await kept.find(f.journey.id, '2026-05-14'))?.contentHash).toBe(body.expectedHash);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('JRNREC-SVC-010: a day with nothing recorded is refused, and a viewer may not keep one', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(recorded({ segments: [] }));
    const body = { utcOffsetMinutes: 120, expectedHash: 'a'.repeat(64) };

    expect(await refusal(svc.save(f.owner.id, f.journey.id, '2026-05-14', body))).toEqual({
      status: 422,
      body: { error: 'Dawarich recorded nothing on that day', code: 'recording_empty' },
    });
    expect((await refusal(svc.save(f.viewer.id, f.journey.id, '2026-05-14', body))).status).toBe(403);
    expect(await countRows(orm, JourneyRecordedDays, {})).toBe(0);
  });
});

describe('JourneyRecordingsService.list and remove', () => {
  async function keptDay(f: Awaited<ReturnType<typeof fixture>>) {
    fetchDay.mockResolvedValue(recorded());
    const preview = await svc.preview(f.owner.id, f.journey.id, PREVIEW);
    await svc.save(f.owner.id, f.journey.id, '2026-05-14', {
      utcOffsetMinutes: preview.utcOffsetMinutes,
      expectedHash: String(preview.contentHash),
    });
    t.realtime.reset();
  }

  it('JRNREC-SVC-011: anyone who can open the journey reads its kept days, also with Dawarich switched off', async () => {
    const f = await fixture();
    await keptDay(f);
    await setAddonEnabled(orm, 'dawarich', false);
    fetchDay.mockReset();

    const days = await svc.list(f.viewer.id, f.journey.id);

    expect(days.map((day) => day.date)).toEqual(['2026-05-14']);
    expect(days[0]?.segments).toEqual([WALK]);
    expect(fetchDay).not.toHaveBeenCalled();
    expect((await refusal(svc.list(f.outsider.id, f.journey.id))).status).toBe(404);
  });

  it('JRNREC-SVC-012: an editor removes a kept day without Dawarich and everyone is told; a missing one is a 404', async () => {
    const f = await fixture();
    await keptDay(f);
    await setAddonEnabled(orm, 'dawarich', false);

    expect((await refusal(svc.remove(f.viewer.id, f.journey.id, '2026-05-14'))).status).toBe(403);
    await svc.remove(f.editor.id, f.journey.id, '2026-05-14', 'sock-2');

    expect(await countRows(orm, JourneyRecordedDays, {})).toBe(0);
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledWith(
      f.viewer.id,
      { type: 'journey:recording:updated', journeyId: f.journey.id, date: '2026-05-14' },
      'sock-2',
    );
    expect(await refusal(svc.remove(f.editor.id, f.journey.id, '2026-05-14'))).toEqual({
      status: 404,
      body: { error: 'No recording kept for that day' },
    });
  });
});

describe('JourneyRecordingsService.prepStatus', () => {
  it('JRNREC-SVC-014: says whether the journey prepares its days and what the connection of the caller allows', async () => {
    const f = await fixture();
    expect(await svc.prepStatus(f.editor.id, f.journey.id)).toEqual({
      enabled: false,
      connection: 'not_connected',
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
    });

    await t
      .get(JourneyRecordingPrepService)
      .record(f.journey.id, f.editor.id, 'unreachable', new Date('2026-05-14T08:00:00Z'));
    await upsertRow(orm, DawarichConnections, {
      user: f.editor.id,
      url: 'https://dawarich.test',
      api_key: 'k',
      sync_enabled: 0,
    });
    expect(await svc.prepStatus(f.editor.id, f.journey.id)).toEqual({
      enabled: false,
      connection: 'sync_off',
      lastAttemptAt: '2026-05-14T08:00:00.000Z',
      lastSuccessAt: null,
      lastError: 'unreachable',
    });
  });

  it('JRNREC-SVC-015: the switch of the owner and a connection with its background sync on read as ready', async () => {
    const f = await fixture();
    await t.get(JourneyDomainService).updateJourney(f.journey.id, f.owner.id, { auto_prepare_recordings: true });
    await upsertRow(orm, DawarichConnections, {
      user: f.owner.id,
      url: 'https://dawarich.test',
      api_key: 'k',
      sync_enabled: 1,
    });

    expect(await svc.prepStatus(f.owner.id, f.journey.id)).toMatchObject({
      enabled: true,
      connection: 'ready',
      periods: [],
    });
  });

  it('JRNREC-SVC-017: while on, it names the linked trips the runs reach and leaves out one that ended too long ago', async () => {
    const f = await fixture();
    const start = new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10);
    const longAgo = new Date(Date.now() - 500 * 86_400_000).toISOString().slice(0, 10);
    const recent = await makeTrip(orm, f.owner.id, { start_date: start, end_date: null });
    const old = await makeTrip(orm, f.owner.id, { start_date: longAgo, end_date: longAgo });
    await linkTripToJourney(orm, f.journey.id, recent.id);
    await linkTripToJourney(orm, f.journey.id, old.id);
    await t.get(JourneyDomainService).updateJourney(f.journey.id, f.owner.id, { auto_prepare_recordings: true });

    expect((await svc.prepStatus(f.editor.id, f.journey.id)).periods).toEqual([{ start, end: null }]);
  });

  it('JRNREC-SVC-016: a reader, a stranger and a switched off Dawarich are refused as the other routes refuse them', async () => {
    const f = await fixture();

    expect((await refusal(svc.prepStatus(f.viewer.id, f.journey.id))).status).toBe(403);
    expect((await refusal(svc.prepStatus(f.outsider.id, f.journey.id))).status).toBe(404);
    await setAddonEnabled(orm, 'dawarich', false);
    expect(await refusal(svc.prepStatus(f.owner.id, f.journey.id))).toMatchObject({
      status: 404,
      body: { code: 'addon_disabled' },
    });
  });
});
