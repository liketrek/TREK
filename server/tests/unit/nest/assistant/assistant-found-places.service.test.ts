/**
 * "+ Day N" on a place a search found, over the real thread, message and tool
 * call repositories on a migrated test db: the place comes from the search
 * results stored in the thread, the day must be one of the trip's, and the
 * suggestion is held as a change card in one transaction, refused while a turn
 * runs, while another change waits, or past the per-minute limit.
 *
 * Replaced: the trip tools (what the trip reads as), the rate limit, the
 * stream registry and the airports.
 */
import { AssistantMessages } from '../../../../src/db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../../../src/db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../../../src/db/entities/AssistantToolCalls.entity';
import { AirportsService } from '../../../../src/nest/airports/airports.service';
import { AssistantFoundPlacesService } from '../../../../src/nest/assistant/assistant-found-places.service';
import { AssistantStreamRegistry } from '../../../../src/nest/assistant/assistant-stream.registry';
import { AssistantToolsService } from '../../../../src/nest/assistant/assistant-tools.service';
import { AssistantCardContext } from '../../../../src/nest/assistant/cards/card-context';
import { RateLimitService } from '../../../../src/nest/common/rate-limit.service';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createRow, findRows } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import type { AssistantFoundPlace } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;

const DAY = 31;

/** What the trip tools answer: one day, one place of the trip, one category. */
const reads: Record<string, unknown> = {
  get_trip_summary: { trip: { title: 'Rome' }, days: [{ id: DAY, day_number: 1, assignments: [] }] },
  list_places: { places: [{ id: 8, name: 'Pantheon', lat: 41.9, lng: 12.48, google_place_id: 'g-pantheon' }] },
  list_categories: { categories: [{ id: 4, name: 'Food', icon: 'Utensils' }] },
};
const session = {
  read: vi.fn(async (name: string) => ({ ok: true, value: reads[name] })),
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
      AssistantFoundPlacesService,
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

function found(ref: string, extra: Partial<AssistantFoundPlace> = {}): AssistantFoundPlace {
  return {
    ref,
    name: `Place ${ref}`,
    address: null,
    lat: 41.89,
    lng: 12.47,
    kind: 'food',
    rating: null,
    openNow: null,
    googlePlaceId: null,
    osmId: null,
    photoKey: null,
    inTripPlaceId: null,
    ...extra,
  };
}

/** A user's thread on a trip whose answer holds a search that found a new place and the trip's Pantheon. */
async function conversation() {
  const orm = t.get(MikroORM);
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id);
  const thread = await createRow(orm, AssistantThreads, { user: user.id, trip: trip.id, title: 'June' });
  const places = [found('s1:0'), found('s1:1', { name: 'Pantheon', googlePlaceId: 'g-pantheon', lat: 41.9 })];
  const parts = JSON.stringify([{ type: 'data-trek-places', data: { toolCallId: 's1', places, more: 0 } }]);
  await createRow(orm, AssistantMessages, { thread: thread.id, role: 'assistant', parts, status: 'complete' });
  return { userId: user.id, tripId: trip.id, threadId: thread.id };
}

function add(c: { userId: number; tripId: number; threadId: number }, ref: string, dayId = DAY) {
  return t
    .get(AssistantFoundPlacesService)
    .add(c.userId, c.tripId, c.threadId, { ref, dayId, locale: 'en', timeZone: 'UTC' });
}

function calls(threadId: number) {
  return findRows(t.get(MikroORM), AssistantToolCalls, { thread_id: threadId });
}

describe('AssistantFoundPlacesService', () => {
  it('ASTFND-001: a new place is proposed for the day as a card, in one transaction, and the answer comes back', async () => {
    const c = await conversation();
    const transactional = vi.spyOn(t.get(UnitOfWork), 'transactional');

    const { message } = await add(c, 's1:0');

    expect(transactional).toHaveBeenCalledOnce();
    const [call] = await calls(c.threadId);
    expect(call).toMatchObject({ tool_name: 'add_found_place', state: 'approval_requested' });
    expect(JSON.parse(call?.args ?? '{}')).toMatchObject({
      via: 'create_and_assign_place',
      dayId: DAY,
      name: 'Place s1:0',
      category_id: 4,
    });
    expect(message.role).toBe('assistant');
    expect(message.parts).toContainEqual(
      expect.objectContaining({ type: 'tool-call', toolCallId: call?.id, toolName: 'add_found_place' }),
    );
    expect(streams.release).toHaveBeenCalledOnce();
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('ASTFND-002: a place the trip already has is put on the day, not made again', async () => {
    const c = await conversation();
    await add(c, 's1:1');
    const [call] = await calls(c.threadId);
    expect(JSON.parse(call?.args ?? '{}')).toEqual({
      via: 'assign_place_to_day',
      dayId: DAY,
      placeId: 8,
      name: 'Pantheon',
    });
  });

  it('ASTFND-003: a thread of another user or trip is not found', async () => {
    const c = await conversation();
    const other = await conversation();
    const notFound = { status: 404, code: 'not_found' };
    await expect(add({ ...c, userId: other.userId }, 's1:0')).rejects.toMatchObject(notFound);
    await expect(add({ ...c, tripId: other.tripId }, 's1:0')).rejects.toMatchObject(notFound);
    expect(streams.claim).not.toHaveBeenCalled();
  });

  it("ASTFND-004: TREK's own limit refuses with its own code, before anything is claimed", async () => {
    const c = await conversation();
    rateLimit.check.mockResolvedValueOnce(false);
    await expect(add(c, 's1:0')).rejects.toMatchObject({ status: 429, code: 'too_many_requests' });
    expect(streams.claim).not.toHaveBeenCalled();
  });

  it('ASTFND-005: refused while a turn of the user runs', async () => {
    const c = await conversation();
    streams.claim.mockResolvedValueOnce(false);
    await expect(add(c, 's1:0')).rejects.toMatchObject({ status: 409, code: 'busy' });
    expect(streams.release).not.toHaveBeenCalled();
    expect(await calls(c.threadId)).toHaveLength(0);
  });

  it('ASTFND-006: refused while another change waits, and the claim is released all the same', async () => {
    const c = await conversation();
    await add(c, 's1:0');
    await expect(add(c, 's1:1')).rejects.toMatchObject({ status: 409, code: 'decide_first' });
    expect(streams.release).toHaveBeenCalledTimes(2);
    expect(await calls(c.threadId)).toHaveLength(1);
  });

  it('ASTFND-007: a ref outside the search results or a day of another trip proposes nothing', async () => {
    const c = await conversation();
    await expect(add(c, 's9:0')).rejects.toMatchObject({ status: 400, code: 'generic' });
    await expect(add(c, 's1:0', DAY + 1)).rejects.toMatchObject({ status: 400, code: 'generic' });
    expect(streams.release).toHaveBeenCalledTimes(2);
    expect(await calls(c.threadId)).toHaveLength(0);
  });
});
