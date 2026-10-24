/**
 * TourActivityStatsMcp (STA-02): the user's own tour activities and leaving
 * one out, over MCP, through the same service as the Atlas: the sums of a
 * period and a type, the tours they are made of and what they rest on. Today
 * is pinned, so a tour's day is over or not whenever the suite runs.
 */
import { TourActivityExclusions } from '../../../src/db/entities/TourActivityExclusions.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { TourActivityStatsMcp } from '../../../src/nest/tours/tour-activity-stats.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows } from '../../helpers/factories/rows';
import { makeTour } from '../../helpers/factories/tours';
import { addTripMember, makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let mcp: TourActivityStatsMcp;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  mcp = t.get(TourActivityStatsMcp);
});
beforeEach(() => {
  resetTestDb(db);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-07-10T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

/** A tour of the trip on a day of its own, with 500 m up and down; answers its place. */
async function tourOnDay(tripId: number, name: string, type: 'hike' | 'kayak', distance: number, date: string) {
  const day = await makeDay(orm(), tripId, { date });
  const place = await makePlace(orm(), tripId, { name });
  await makeTour(orm(), place.id, { tourTypeRef: type, distance, elevation_gain: 500, elevation_loss: 500 });
  await makeDayAssignment(orm(), day.id, place.id);
  return place.id;
}

/** A hike and a paddle tour done in July, a hike still ahead, and a trip somebody else owns. */
async function fixture() {
  const { user } = await makeUser(orm());
  const { user: stranger } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id, { title: 'Alps' });
  const tours: Record<string, number> = {};
  tours.Ridge = await tourOnDay(trip.id, 'Ridge', 'hike', 12, '2026-07-02');
  tours.Lake = await tourOnDay(trip.id, 'Lake', 'kayak', 9, '2026-07-04');
  tours.Summit = await tourOnDay(trip.id, 'Summit', 'hike', 15, '2026-07-20');
  const closed = await makeTrip(orm(), stranger.id);
  const hidden = await makePlace(orm(), closed.id, { name: 'Hidden' });
  await makeTour(orm(), hidden.id);
  return { user, trip, tours, hidden };
}

describe('TourActivityStatsMcp', () => {
  it('STA2-MCP-001: get_tour_activity_stats sums the done tours, by type, and says what is still ahead', async () => {
    const { user, tours } = await fixture();
    const result = read(await mcp.getTourActivityStats({}, ctx(user.id)));
    expect(result.today).toBe('2026-07-10');
    expect(result.totals).toEqual({
      count: 2,
      distanceKm: { value: 21, known: 2, of: 2 },
      ascentM: { value: 500, known: 1, of: 1 },
      descentM: { value: 500, known: 1, of: 1 },
      byBasis: { plan: 2, track: 0 },
    });
    expect(result.by_type.map((type: { type: string }) => type.type)).toEqual(['hike', 'kayak']);
    expect(result.tours.map((tour: { place_id: number; basis: string }) => [tour.place_id, tour.basis])).toEqual([
      [tours.Lake, 'plan'],
      [tours.Ridge, 'plan'],
    ]);
    expect(result.upcoming).toBe(1);
    expect(result.uncounted).toEqual({ unassigned: 0, undated: 0 });
  });

  it('STA2-MCP-002: narrows by period and type', async () => {
    const { user, tours } = await fixture();
    const paddled = read(await mcp.getTourActivityStats({ type: 'kayak' }, ctx(user.id)));
    expect(paddled.tours.map((tour: { place_id: number }) => tour.place_id)).toEqual([tours.Lake]);
    const early = read(await mcp.getTourActivityStats({ from: '2026-07-01', to: '2026-07-03' }, ctx(user.id)));
    expect(early.totals.count).toBe(1);
    expect(early.upcoming).toBe(0);
  });

  it('STA2-MCP-003: set_tour_activity_excluded leaves a tour out and counts it again', async () => {
    const { user, tours } = await fixture();
    const left = read(await mcp.setTourActivityExcluded({ place_id: tours.Ridge, excluded: true }, ctx(user.id)));
    expect(left.totals.count).toBe(1);
    expect(left.tours.find((tour: { place_id: number }) => tour.place_id === tours.Ridge)?.excluded).toBe(true);
    const back = read(await mcp.setTourActivityExcluded({ place_id: tours.Ridge, excluded: false }, ctx(user.id)));
    expect(back.totals.count).toBe(2);
    expect(await countRows(orm(), TourActivityExclusions)).toBe(0);
  });

  it('STA2-MCP-004: a tour of a trip the user cannot open is not found, as over REST', async () => {
    const { user, hidden } = await fixture();
    expect(read(await mcp.setTourActivityExcluded({ place_id: hidden.id, excluded: true }, ctx(user.id)))).toEqual({
      error: 'Tour not found.',
    });
    expect(await countRows(orm(), TourActivityExclusions)).toBe(0);
  });

  it('STA2-MCP-005: a member counts the days naming nobody, which are everyone’s, as over REST', async () => {
    const { trip, tours } = await fixture();
    const { user: member } = await makeUser(orm());
    await addTripMember(orm(), trip.id, member.id);
    const result = read(await mcp.getTourActivityStats({}, ctx(member.id)));
    expect(result.tours.map((tour: { place_id: number }) => tour.place_id)).toEqual([tours.Lake, tours.Ridge]);
    expect(result.upcoming).toBe(1);
  });
});
