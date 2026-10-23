/**
 * "Plan this" on a proposed hike or city walk, over the real thread, message
 * and tool call repositories on a migrated test db: the proposal comes from
 * the call and card stored in the thread, never from the request, and the
 * change that creates it is held as a card in one transaction, refused while
 * a turn runs, while another change waits, for a proposal the thread does not
 * hold and for one nothing can be created from. A walk is asked again, since
 * the stored answer is the model's shortened copy.
 *
 * Replaced: the trip tools (what the trip reads as), the rate limit, the
 * stream registry and the airports.
 */
import { AssistantMessages } from '../../../../src/db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../../../src/db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../../../src/db/entities/AssistantToolCalls.entity';
import { AirportsService } from '../../../../src/nest/airports/airports.service';
import {
  AssistantProposalsService,
  pendingCardOf,
  storedProposal,
  takeArgsOf,
} from '../../../../src/nest/assistant/assistant-proposals.service';
import { AssistantStreamRegistry } from '../../../../src/nest/assistant/assistant-stream.registry';
import { AssistantToolsService } from '../../../../src/nest/assistant/assistant-tools.service';
import { AssistantCardContext } from '../../../../src/nest/assistant/cards/card-context';
import { RateLimitService } from '../../../../src/nest/common/rate-limit.service';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { tourRouteCard } from '../../../helpers/assistant-tour-cards';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createRow, findRows } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import type { TourRouteCard } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;

const WALK_RESULT = {
  date: '2026-06-12',
  frame: { start_time: '10:00', end_time: '14:00' },
  can_create: true,
  stations: [
    { lat: 48.137, lng: 11.575, name: 'Marienplatz', arrival: '10:00', stay_minutes: 0 },
    { lat: 48.14, lng: 11.58, name: 'Museum', arrival: '10:10', walk_from_previous: { metres: 600, minutes: 10 } },
    { lat: 48.143, lng: 11.58, name: 'Hofgarten', arrival: '11:15', walk_from_previous: { metres: 350, minutes: 5 } },
  ],
  totals: { walk_m: 950, total_minutes: 75, ends_at: '11:15' },
  stations_for_create: [
    { lat: 48.137, lng: 11.575, name: 'Marienplatz', stay_minutes: 0 },
    { lat: 48.14, lng: 11.58, name: 'Museum', stay_minutes: 60 },
    { lat: 48.143, lng: 11.58, name: 'Hofgarten', stay_minutes: null },
  ],
};

/** The walk as the thread stores it: the model's copy, masked and with its lists cut to fit. */
const WALK_STORED = {
  ...WALK_RESULT,
  stations_for_create: [{ lat: 48.137, lng: 11.575, name: '[hidden]', stay_minutes: 0 }],
  truncated: true,
};
const WALK_ARGS = { date: '2026-06-12', day_id: 32, start_time: '10:00' };

/** What the trip tools answer: one day, no places, one category; and the walk asked again. */
const reads: Record<string, unknown> = {
  get_trip_summary: { trip: { title: 'Bavaria' }, days: [{ id: 32, day_number: 2, date: '2026-06-12' }] },
  list_places: { places: [] },
  list_categories: { categories: [{ id: 4, name: 'Sights', icon: 'Landmark' }] },
  propose_city_walk: WALK_RESULT,
};
const answers = async (name: string, _args?: Record<string, unknown>) => ({ ok: true, value: reads[name] });
const session = {
  read: vi.fn(answers),
  close: vi.fn(async () => undefined),
};
const tools = { open: vi.fn(async () => session) };
const rateLimit = { check: vi.fn(async () => true) };
const streams = { claim: vi.fn(async () => true), release: vi.fn(async () => undefined) };

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [MikroOrmModule.forFeature([AssistantThreads, AssistantMessages, AssistantToolCalls])],
    providers: [
      AssistantProposalsService,
      AssistantCardContext,
      { provide: AirportsService, useValue: { findByIata: () => null } },
      { provide: AssistantToolsService, useValue: tools },
      { provide: RateLimitService, useValue: rateLimit },
      { provide: AssistantStreamRegistry, useValue: streams },
    ],
  });
});

beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
});

afterAll(async () => {
  await t.close();
  db.close();
});

const HIKE_ARGS = {
  name: 'Herzogstand',
  waypoints: [
    { lat: 47.6, lng: 11.3, name: 'Car park' },
    { lat: 47.61, lng: 11.3, name: 'Summit', poi_category: 'peak' },
  ],
  max_hiking_difficulty: 3,
  variant_label: 'the short one',
  along: false,
  day_id: 32,
  start_time: '08:00',
};

/** A thread whose answer proposed a hike (`h1`) and a city walk (`w1`), each with its card, and searched (`s1`). */
async function conversation(hikeCard: TourRouteCard = tourRouteCard()) {
  const orm = t.get(MikroORM);
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id);
  const thread = await createRow(orm, AssistantThreads, { user: user.id, trip: trip.id, title: 'Hikes' });
  const walkCard = tourRouteCard({ activity: 'walk', name: null, minutesBasis: 'stations' });
  const parts = JSON.stringify([
    { type: 'tool-call', toolCallId: 'h1', toolName: 'propose_hike', args: HIKE_ARGS, result: { name: 'Herzogstand' } },
    { type: 'data-trek-card', data: { toolCallId: 'h1', card: hikeCard } },
    { type: 'tool-call', toolCallId: 'w1', toolName: 'propose_city_walk', args: WALK_ARGS, result: WALK_STORED },
    { type: 'data-trek-card', data: { toolCallId: 'w1', card: walkCard } },
    { type: 'tool-call', toolCallId: 's1', toolName: 'search_place', args: { query: 'huts' }, result: {} },
  ]);
  await createRow(orm, AssistantMessages, { thread: thread.id, role: 'assistant', parts, status: 'complete' });
  return { userId: user.id, tripId: trip.id, threadId: thread.id };
}

function take(c: { userId: number; tripId: number; threadId: number }, toolCallId: string, threadId = c.threadId) {
  return t
    .get(AssistantProposalsService)
    .take(c.userId, c.tripId, threadId, { toolCallId, locale: 'en', timeZone: 'UTC' });
}

function calls(threadId: number) {
  return findRows(t.get(MikroORM), AssistantToolCalls, { thread_id: threadId });
}

describe('AssistantProposalsService', () => {
  it('ASTPROP-001: a proposed hike is held as create_hike with its own arguments and the card the answer showed', async () => {
    const c = await conversation();
    const transactional = vi.spyOn(t.get(UnitOfWork), 'transactional');

    const { message } = await take(c, 'h1');

    expect(transactional).toHaveBeenCalledOnce();
    const [call] = await calls(c.threadId);
    expect(call).toMatchObject({ tool_name: 'take_proposal', state: 'approval_requested' });
    expect(JSON.parse(call?.args ?? '{}')).toEqual({
      via: 'create_hike',
      name: 'Herzogstand',
      waypoints: HIKE_ARGS.waypoints,
      max_hiking_difficulty: 3,
      day_id: 32,
      start_time: '08:00',
    });
    const preview = JSON.parse(call?.preview ?? '{}') as Record<string, unknown>;
    // It names the proposal it was taken from, so the chat tells which card was taken.
    expect(preview).toMatchObject({
      verbKey: 'addTour',
      subject: 'Herzogstand',
      dayId: 32,
      undoable: true,
      takenFrom: 'h1',
    });
    // The card the answer showed, waiting, under the name the change saves.
    expect(preview.card).toEqual({ ...tourRouteCard(), source: 'pending', name: 'Herzogstand' });
    expect(message.parts).toContainEqual(
      expect.objectContaining({ type: 'tool-call', toolCallId: call?.id, toolName: 'take_proposal' }),
    );
    expect(streams.release).toHaveBeenCalledOnce();
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('ASTPROP-002: a proposed city walk is held as create_city_walk with the stations it answered, named by its ends', async () => {
    const c = await conversation();
    await take(c, 'w1');
    expect(session.read).toHaveBeenCalledWith('propose_city_walk', WALK_ARGS);
    const [call] = await calls(c.threadId);
    expect(JSON.parse(call?.args ?? '{}')).toEqual({
      via: 'create_city_walk',
      name: 'Marienplatz → Hofgarten',
      stations: WALK_RESULT.stations_for_create,
    });
    const preview = JSON.parse(call?.preview ?? '{}') as Record<string, unknown>;
    expect(preview).toMatchObject({ verbKey: 'addTour', subject: 'Marienplatz → Hofgarten', takenFrom: 'w1' });
  });

  it('ASTPROP-003: a call the thread does not hold, or one that proposed nothing, is not found', async () => {
    const c = await conversation();
    const notFound = { status: 404, code: 'not_found' };
    await expect(take(c, 'nope')).rejects.toMatchObject(notFound);
    await expect(take(c, 's1')).rejects.toMatchObject(notFound);
    await expect(take(c, 'h1', c.threadId + 1000)).rejects.toMatchObject(notFound);
    expect(await calls(c.threadId)).toHaveLength(0);
  });

  it('ASTPROP-004: a hike whose way was not planned cannot be taken; nothing is held', async () => {
    const problem = { why: 'no_way' as const, position: null, snappedM: null };
    const c = await conversation(tourRouteCard({ routed: false, problem }));
    await expect(take(c, 'h1')).rejects.toMatchObject({ status: 400, code: 'generic' });
    expect(await calls(c.threadId)).toHaveLength(0);
    expect(streams.release).toHaveBeenCalledOnce();
  });

  it('ASTPROP-005: refused while another change waits, while a turn runs, and past the per-minute limit', async () => {
    const c = await conversation();
    await take(c, 'h1');
    await expect(take(c, 'w1')).rejects.toMatchObject({ status: 409, code: 'decide_first' });
    streams.claim.mockResolvedValueOnce(false);
    await expect(take(c, 'w1')).rejects.toMatchObject({ status: 409, code: 'busy' });
    rateLimit.check.mockResolvedValueOnce(false);
    await expect(take(c, 'w1')).rejects.toMatchObject({ status: 429, code: 'too_many_requests' });
    expect(await calls(c.threadId)).toHaveLength(1);
  });

  it('ASTPROP-008: a walk stored cut down and masked is created from the tool asked again, named and on no day', async () => {
    const c = await conversation();
    await take(c, 'w1');
    const [call] = await calls(c.threadId);
    const args = JSON.parse(call?.args ?? '{}') as Record<string, unknown>;
    // Never the stored copy: all three stations, none of them masked.
    expect(args.stations).toEqual(WALK_RESULT.stations_for_create);
    expect(JSON.stringify(args)).not.toContain('[hidden]');
    const card = (JSON.parse(call?.preview ?? '{}') as { card: TourRouteCard }).card;
    expect(card).toMatchObject({ source: 'pending', activity: 'walk', name: 'Marienplatz → Hofgarten' });
    expect(card.stops.map((stop) => stop.name)).toEqual(['Marienplatz', 'Museum', 'Hofgarten']);
    // create_city_walk puts the walk on no day, so the card names none.
    expect(card.schedule).toMatchObject({ date: '2026-06-12', dayId: null, dayNumber: null });
  });

  it('ASTPROP-009: a walk the tool cannot answer now cannot be taken; nothing is held', async () => {
    const c = await conversation();
    session.read.mockImplementation(async (name: string) =>
      name === 'propose_city_walk' ? { ok: false, value: 'Tours are off' } : { ok: true, value: reads[name] },
    );
    try {
      await expect(take(c, 'w1')).rejects.toMatchObject({ status: 400, code: 'generic' });
    } finally {
      session.read.mockImplementation(answers);
    }
    expect(await calls(c.threadId)).toHaveLength(0);
    expect(session.close).toHaveBeenCalledOnce();
  });
});

describe('what a proposal can be taken as', () => {
  const card = tourRouteCard();

  it('ASTPROP-006: a walk without stations to create, or one its answer says cannot be, gives nothing', () => {
    const walk = { toolName: 'propose_city_walk', args: {}, card };
    expect(takeArgsOf({ ...walk, result: { ...WALK_RESULT, can_create: false } })).toBeNull();
    expect(takeArgsOf({ ...walk, result: { stations_for_create: [WALK_RESULT.stations_for_create[0]] } })).toBeNull();
    // Stations without names are named by the day and the start.
    const nameless = WALK_RESULT.stations_for_create.map(({ name: _name, ...station }) => station);
    expect(takeArgsOf({ ...walk, result: { ...WALK_RESULT, stations_for_create: nameless } })).toMatchObject({
      name: '2026-06-12 10:00',
    });
  });

  it('ASTPROP-010: a hike asked by date alone is created on no day, and its waiting card names none', () => {
    const schedule = {
      date: '2026-06-12',
      dayId: 32,
      dayNumber: 2,
      start: '08:00',
      arrive: '08:22',
      nextDay: false,
      sunrise: null,
      sunset: null,
      latestStart: null,
      weather: null,
      hours: [],
    };
    const { day_id: _day, ...undated } = HIKE_ARGS;
    const args = takeArgsOf({ toolName: 'propose_hike', args: { ...undated, date: '2026-06-12' }, result: {}, card });
    expect(args).not.toHaveProperty('day_id');
    expect(args).not.toHaveProperty('date');
    const waiting = pendingCardOf(tourRouteCard({ label: 'the short one', schedule }), args ?? {});
    expect(waiting).toMatchObject({ source: 'pending', name: 'Herzogstand', label: null });
    expect(waiting.schedule).toEqual({ ...schedule, dayId: null, dayNumber: null });
    // On the day the change puts it on, the day stays.
    expect(pendingCardOf(tourRouteCard({ schedule }), { day_id: 32 }).schedule).toEqual(schedule);
  });

  it('ASTPROP-007: the newest row holding the call wins; a card of another kind is no proposal', () => {
    const row = (id: number, card: unknown) => ({
      id,
      parts: JSON.stringify([
        { type: 'tool-call', toolCallId: 'h1', toolName: 'propose_hike', args: { name: `Hike ${id}` } },
        { type: 'data-trek-card', data: { toolCallId: 'h1', card } },
      ]),
    });
    const rows = [row(1, card), row(2, { ...card, name: 'Newer' })] as unknown as Parameters<typeof storedProposal>[0];
    expect(storedProposal(rows, 'h1')).toMatchObject({ toolName: 'propose_hike', args: { name: 'Hike 2' } });
    const list = [row(3, { kind: 'tourList', dayId: null, more: 0, rows: [] })] as unknown as typeof rows;
    expect(storedProposal(list, 'h1')).toBeNull();
  });
});
