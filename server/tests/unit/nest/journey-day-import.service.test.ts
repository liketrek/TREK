/**
 * JourneyDayImportService (JRN-02): a recorded day reviewed with its stays and
 * taken into a journey as drafts. The suite takes the service from its module
 * over a snapshot test db; only the caller's Dawarich connection and the
 * visits it answers are replaced, so the stays it refreshes, the journey
 * access, the drafts, the stays they hold and the broadcasts are the real ones.
 *
 * What it pins: the review is about one day of the caller's own stays and
 * says where each stands for this journey; the take-over writes drafts (one
 * per stay, one per merged place, one day report), keeps every stay with its
 * place and times on its entry, marks the stays taken over or left out, and
 * announces the entries after the commit; a second take-over writes nothing
 * twice; a refusal or a failure on the way leaves nothing behind.
 */
import { DawarichVisitSuggestions } from '../../../src/db/entities/DawarichVisitSuggestions.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { JourneyEntryStays } from '../../../src/db/entities/JourneyEntryStays.entity';
import { DomainError } from '../../../src/nest/common/domain-error';
import { DawarichClient, DawarichError, type DawarichVisitRaw } from '../../../src/nest/integrations/dawarich.client';
import { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import { JourneyDayImportService } from '../../../src/nest/journey-recordings/journey-day-import.service';
import { JourneyRecordingsModule } from '../../../src/nest/journey-recordings/journey-recordings.module';
import { JourneyEntryStaysService } from '../../../src/nest/journey/journey-entry-stays.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../../helpers/factories/journeys';
import { countRows, findRow, findRows, insertRow } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const CREDS = { baseUrl: 'https://dawarich.example.com', apiKey: 'key', allowInsecureTls: false };
const listVisits = vi.fn<(...args: unknown[]) => Promise<{ visits: DawarichVisitRaw[]; truncated: boolean }>>();
const getCredentials = vi.fn();
const getConnection = vi.fn();
let t: TestModule;
let orm: TestOrm;
let svc: JourneyDayImportService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyRecordingsModule],
    overrides: [
      { provide: DawarichClient, useValue: { listVisits } },
      { provide: DawarichService, useValue: { getCredentials, getConnection } },
    ],
  });
  svc = t.get(JourneyDayImportService);
  orm = await createTestOrm(db);
});
beforeEach(async () => {
  resetTestDb(db);
  orm.clear();
  t.realtime.reset();
  listVisits.mockReset().mockResolvedValue({ visits: [], truncated: false });
  getCredentials.mockReset().mockResolvedValue(CREDS);
  getConnection.mockReset().mockResolvedValue({ lastSyncAt: '2026-05-14T20:00:00Z' });
  await setAddonEnabled(orm, 'journey', true);
  await setAddonEnabled(orm, 'dawarich', true);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const DAY = '2026-05-14';

function visit(id: number, name: string, from: string, to: string, lat = 45.434, lng = 12.3388): DawarichVisitRaw {
  return {
    id,
    area_id: null,
    started_at: `${DAY}T${from}:00+02:00`,
    ended_at: `${DAY}T${to}:00+02:00`,
    duration: null,
    name,
    status: 'suggested',
    confidence: 80,
    confidence_band: 'high',
    place: { latitude: lat, longitude: lng, id: null },
  };
}

/** A visit on the day after. */
function nextDay(id: number, name: string): DawarichVisitRaw {
  return {
    ...visit(id, name, '09:00', '10:00'),
    started_at: '2026-05-15T09:00:00+02:00',
    ended_at: '2026-05-15T10:00:00+02:00',
  };
}

const MARKUS_1 = visit(101, 'Piazza San Marco', '09:10', '10:05');
const MARKUS_2 = visit(102, 'Piazza San Marco', '10:20', '11:40', 45.4341, 12.3391);
const PARKING = visit(103, 'Parcheggio', '08:30', '08:40', 45.44, 12.31);
const RIALTO = visit(104, 'Rialto', '13:00', '13:30', 45.438, 12.3359);
const GIUDECCA = visit(105, 'Giudecca', '16:00', '17:30', 45.427, 12.325);
const ZATTERE = visit(106, 'Zattere', '18:00', '18:30', 45.4295, 12.3262);

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

/** The suggestion rows the review brought in, by Dawarich visit id. */
async function staysOf(userId: number): Promise<Map<string, number>> {
  const rows = await findRows(orm, DawarichVisitSuggestions, { user: userId });
  return new Map(rows.map((row) => [row.source_visit_id, row.id]));
}

async function reviewed(userId: number, journeyId: number, visits: DawarichVisitRaw[]) {
  listVisits.mockResolvedValue({ visits, truncated: false });
  await svc.review(userId, journeyId, DAY);
  return await staysOf(userId);
}

async function refusal(promise: Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

function id(stays: Map<string, number>, visitId: number): number {
  const found = stays.get(String(visitId));
  if (found === undefined) throw new Error(`no stay for visit ${visitId}`);
  return found;
}

describe('JourneyDayImportService.review', () => {
  it("JRNDAY-SVC-001: reads the day from the caller's Dawarich and lists its stays in order with the day's entries", async () => {
    const f = await fixture();
    await makeJourneyEntry(orm, f.journey.id, f.owner.id, { title: 'Arrival', entry_date: DAY, entry_time: '08:00' });
    await makeJourneyEntry(orm, f.journey.id, f.owner.id, { title: 'Next day', entry_date: '2026-05-15' });
    listVisits.mockResolvedValue({ visits: [RIALTO, MARKUS_1, nextDay(200, 'Lido')], truncated: true });

    const review = await svc.review(f.owner.id, f.journey.id, DAY);

    const [, from, to] = listVisits.mock.calls[0] as [unknown, Date, Date];
    expect(from.toISOString()).toBe('2026-05-13T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-05-16T00:00:00.000Z');
    expect(review).toMatchObject({
      journey: { id: f.journey.id, title: 'Venice' },
      date: DAY,
      fresh: true,
      error: null,
      syncedAt: null,
      truncated: true,
      audience: 2,
      entries: [{ title: 'Arrival', entryTime: '08:00', isDraft: false }],
    });
    expect(review.stays.map((stay) => [stay.name, stay.status])).toEqual([
      ['Piazza San Marco', 'open'],
      ['Rialto', 'open'],
    ]);
    expect(review.stays[0]).toMatchObject({ lat: 45.434, lng: 12.3388, sourceStatus: 'suggested', entry: null });
  });

  it('JRNDAY-SVC-002: says which stays the journey holds, which were left out and which went elsewhere', async () => {
    const f = await fixture();
    const stays = await reviewed(f.owner.id, f.journey.id, [MARKUS_1, MARKUS_2, PARKING, RIALTO]);
    await svc.takeOver(f.owner.id, f.journey.id, DAY, {
      groups: [{ kind: 'single', stays: [{ suggestionId: id(stays, 101) }] }],
      skipSuggestionIds: [id(stays, 103)],
    });
    const handwritten = await insertRow(orm, JourneyEntries, {
      journey: f.journey.id,
      author: f.owner.id,
      type: 'entry',
      entry_date: DAY,
      created_at: 0,
      updated_at: 0,
    });
    // Accepted into another journal: the other journal's entry exists, so it stays accepted.
    const elsewhere = await makeJourney(orm, f.owner.id, { title: 'Italy, the sequel' });
    const theirEntry = await makeJourneyEntry(orm, elsewhere.id, f.owner.id, { entry_date: DAY });
    await orm.repo(DawarichVisitSuggestions).markAccepted(id(stays, 104), {
      target: 'journal',
      placeId: null,
      journalEntryId: theirEntry.id,
      bucketItemId: null,
    });

    const review = await svc.review(f.owner.id, f.journey.id, DAY);

    expect(Object.fromEntries(review.stays.map((stay) => [stay.suggestionId, stay.status]))).toEqual({
      [id(stays, 101)]: 'here',
      [id(stays, 102)]: 'open',
      [id(stays, 103)]: 'skipped',
      [id(stays, 104)]: 'elsewhere',
    });
    expect(review.stays.find((stay) => stay.status === 'here')?.entry).toEqual({
      id: expect.any(Number),
      title: 'Piazza San Marco',
    });
    expect(review.entries.map((entry) => entry.id)).toContain(handwritten);
  });

  it('JRNDAY-SVC-003: when Dawarich does not answer, shows the stays of the last sync and says why', async () => {
    const f = await fixture();
    await reviewed(f.owner.id, f.journey.id, [MARKUS_1]);
    listVisits.mockRejectedValue(new DawarichError('unreachable', 'down'));

    const review = await svc.review(f.owner.id, f.journey.id, DAY);

    expect(review).toMatchObject({ fresh: false, error: 'unreachable', syncedAt: '2026-05-14T20:00:00Z' });
    expect(review.stays.map((stay) => stay.name)).toEqual(['Piazza San Marco']);
  });

  it('JRNDAY-SVC-004: needs the right to edit the journey, the Dawarich addon and a connection', async () => {
    const f = await fixture();
    expect((await refusal(svc.review(f.viewer.id, f.journey.id, DAY))).status).toBe(403);
    expect((await refusal(svc.review(f.outsider.id, f.journey.id, DAY))).status).toBe(404);
    getCredentials.mockResolvedValue(null);
    expect(await refusal(svc.review(f.editor.id, f.journey.id, DAY))).toEqual({
      status: 409,
      body: { error: 'Dawarich is not connected', code: 'not_connected' },
    });
    await setAddonEnabled(orm, 'dawarich', false);
    expect((await refusal(svc.review(f.owner.id, f.journey.id, DAY))).body).toMatchObject({ code: 'addon_disabled' });
    expect(listVisits).not.toHaveBeenCalled();
  });
});

describe('JourneyDayImportService.takeOver', () => {
  it('JRNDAY-SVC-005: writes drafts for a renamed stay, a merged place and a day report, each holding its stays', async () => {
    const f = await fixture();
    const stays = await reviewed(f.owner.id, f.journey.id, [MARKUS_1, MARKUS_2, PARKING, RIALTO, GIUDECCA, ZATTERE]);

    const result = await svc.takeOver(f.owner.id, f.journey.id, DAY, {
      groups: [
        {
          kind: 'merged',
          stays: [{ suggestionId: id(stays, 102) }, { suggestionId: id(stays, 101) }],
          title: 'San Marco',
          anchorSuggestionId: id(stays, 102),
        },
        { kind: 'single', stays: [{ suggestionId: id(stays, 104), name: 'Ponte di Rialto' }] },
        {
          kind: 'report',
          stays: [{ suggestionId: id(stays, 106) }, { suggestionId: id(stays, 105) }],
          title: 'Evening',
          anchorSuggestionId: null,
        },
      ],
      skipSuggestionIds: [id(stays, 103)],
    });

    expect(result.entries.map((entry) => [entry.title, entry.stayCount])).toEqual([
      ['San Marco', 2],
      ['Ponte di Rialto', 1],
      ['Evening', 2],
    ]);
    expect(result).toMatchObject({ alreadyTaken: [], skipped: [id(stays, 103)] });

    const [merged, single, report] = await Promise.all(
      result.entries.map((entry) => findRow(orm, JourneyEntries, { id: entry.id })),
    );
    expect(merged).toMatchObject({
      is_draft: 1,
      entry_date: DAY,
      entry_time: '09:10',
      location_name: 'Piazza San Marco',
      location_lat: 45.4341,
      location_lng: 12.3391,
    });
    expect(single).toMatchObject({ is_draft: 1, title: 'Ponte di Rialto', location_name: 'Ponte di Rialto' });
    expect(report).toMatchObject({
      is_draft: 1,
      entry_time: '16:00',
      location_name: null,
      location_lat: null,
      story: '- 16:00-17:30 Giudecca\n- 18:00-18:30 Zattere',
    });

    const [mergedId = 0] = result.entries.map((entry) => entry.id);
    const kept = await findRows(orm, JourneyEntryStays, { entry: mergedId });
    kept.sort((a, b) => a.sort_order - b.sort_order);
    expect(kept.map((stay) => [stay.source_visit_id, stay.sort_order, stay.started_at])).toEqual([
      ['101', 0, `${DAY}T09:10:00+02:00`],
      ['102', 1, `${DAY}T10:20:00+02:00`],
    ]);
    const states = await findRows(orm, DawarichVisitSuggestions, { user: f.owner.id });
    expect(Object.fromEntries(states.map((row) => [row.source_visit_id, row.state]))).toEqual({
      '101': 'accepted',
      '102': 'accepted',
      '103': 'dismissed',
      '104': 'accepted',
      '105': 'accepted',
      '106': 'accepted',
    });
    const created = t.realtime.broadcastToUserMock.mock.calls.filter(
      ([userId, payload]) => userId === f.owner.id && payload.type === 'journey:entry:created',
    );
    expect(created).toHaveLength(3);
  });

  it('JRNDAY-SVC-006: taking the same day over again writes nothing twice and says what was held', async () => {
    const f = await fixture();
    const stays = await reviewed(f.owner.id, f.journey.id, [MARKUS_1, PARKING]);
    const request = {
      groups: [{ kind: 'single' as const, stays: [{ suggestionId: id(stays, 101) }] }],
      skipSuggestionIds: [id(stays, 103)],
    };
    await svc.takeOver(f.owner.id, f.journey.id, DAY, request);
    t.realtime.reset();

    const again = await svc.takeOver(f.owner.id, f.journey.id, DAY, request);

    expect(again).toEqual({ entries: [], alreadyTaken: [id(stays, 101)], skipped: [] });
    expect(await countRows(orm, JourneyEntries, { journey: f.journey.id })).toBe(1);
    expect(await countRows(orm, JourneyEntryStays, {})).toBe(1);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it("JRNDAY-SVC-007: refuses a stay that is not the caller's or not of that day, writing nothing", async () => {
    const f = await fixture();
    const own = await reviewed(f.owner.id, f.journey.id, [MARKUS_1]);
    const theirs = await reviewed(f.editor.id, f.journey.id, [RIALTO]);
    listVisits.mockResolvedValue({ visits: [nextDay(300, 'Murano')], truncated: false });
    await svc.review(f.owner.id, f.journey.id, '2026-05-15');
    const otherDay = await staysOf(f.owner.id);

    const attempt = (suggestionId: number) =>
      refusal(
        svc.takeOver(f.owner.id, f.journey.id, DAY, {
          groups: [
            { kind: 'single', stays: [{ suggestionId: id(own, 101) }] },
            { kind: 'single', stays: [{ suggestionId }] },
          ],
        }),
      );
    const notOnDay = {
      status: 404,
      body: { error: 'A stay is not one of yours on that day', code: 'stay_not_on_day' },
    };
    expect(await attempt(id(theirs, 104))).toEqual(notOnDay);
    expect(await attempt(id(otherDay, 300))).toEqual(notOnDay);
    expect(await countRows(orm, JourneyEntries, {})).toBe(0);
    expect(await countRows(orm, JourneyEntryStays, {})).toBe(0);
  });

  it('JRNDAY-SVC-008: a take-over the shared contract refuses is refused here too, for callers that spread its shape', async () => {
    const f = await fixture();
    const stays = await reviewed(f.owner.id, f.journey.id, [MARKUS_1, MARKUS_2]);
    const merged = {
      kind: 'merged' as const,
      stays: [{ suggestionId: id(stays, 101) }, { suggestionId: id(stays, 102) }],
    };
    expect(await refusal(svc.takeOver(f.owner.id, f.journey.id, DAY, { groups: [merged] }))).toEqual({
      status: 400,
      body: { error: 'This take-over cannot be written', code: 'group_needs_title' },
    });
    expect(
      (await refusal(svc.takeOver(f.viewer.id, f.journey.id, DAY, { groups: [{ ...merged, title: 'A' }] }))).status,
    ).toBe(403);
  });

  it('JRNDAY-SVC-009: a failure on the way leaves no draft, no stay and no announcement', async () => {
    const f = await fixture();
    const stays = await reviewed(f.owner.id, f.journey.id, [MARKUS_1, RIALTO]);
    const record = vi.spyOn(t.get(JourneyEntryStaysService), 'record').mockRejectedValueOnce(new Error('disk full'));

    await expect(
      svc.takeOver(f.owner.id, f.journey.id, DAY, {
        groups: [
          { kind: 'single', stays: [{ suggestionId: id(stays, 101) }] },
          { kind: 'single', stays: [{ suggestionId: id(stays, 104) }] },
        ],
      }),
    ).rejects.toThrow('disk full');

    record.mockRestore();
    expect(await countRows(orm, JourneyEntries, {})).toBe(0);
    expect(await countRows(orm, JourneyEntryStays, {})).toBe(0);
    expect((await findRows(orm, DawarichVisitSuggestions, { user: f.owner.id })).map((row) => row.state)).toEqual([
      'new',
      'new',
    ]);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('JRNDAY-SVC-010: an editor takes their own stays over, and what the journal held stays as it was', async () => {
    const f = await fixture();
    const written = await makeJourneyEntry(orm, f.journey.id, f.owner.id, {
      title: 'Our day',
      story: 'Written by hand',
      entry_date: DAY,
      location_name: 'Hotel',
    });
    const stays = await reviewed(f.editor.id, f.journey.id, [RIALTO]);

    const result = await svc.takeOver(f.editor.id, f.journey.id, DAY, {
      groups: [{ kind: 'single', stays: [{ suggestionId: id(stays, 104) }] }],
    });

    expect(result.entries).toHaveLength(1);
    expect(await findRow(orm, JourneyEntries, { id: written.id })).toMatchObject({
      title: 'Our day',
      story: 'Written by hand',
      location_name: 'Hotel',
      is_draft: 0,
    });
    const [draftId = 0] = result.entries.map((entry) => entry.id);
    expect(await findRow(orm, JourneyEntries, { id: draftId })).toMatchObject({ author_id: f.editor.id, is_draft: 1 });
  });

  it('JRNDAY-SVC-011: the same place twice without a position is joined without a map position', async () => {
    const f = await fixture();
    const blind = (v: DawarichVisitRaw): DawarichVisitRaw => ({
      ...v,
      place: { latitude: null, longitude: null, id: null },
    });
    const stays = await reviewed(f.owner.id, f.journey.id, [blind(MARKUS_1), blind(MARKUS_2)]);

    const result = await svc.takeOver(f.owner.id, f.journey.id, DAY, {
      groups: [
        {
          kind: 'merged',
          stays: [{ suggestionId: id(stays, 101) }, { suggestionId: id(stays, 102) }],
          title: 'San Marco',
        },
      ],
    });

    const [draftId = 0] = result.entries.map((entry) => entry.id);
    expect(await findRow(orm, JourneyEntries, { id: draftId })).toMatchObject({
      is_draft: 1,
      title: 'San Marco',
      location_name: 'Piazza San Marco',
      location_lat: null,
      location_lng: null,
    });
    expect(await countRows(orm, JourneyEntryStays, { entry: draftId })).toBe(2);
  });
});
