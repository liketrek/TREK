/**
 * ToursMcp (P2D-MCP-01): the saved tours of a trip, read only, over the same
 * service the REST list and detail use. The suite takes its subject from the
 * container over a snapshot test db; the addon gate of the tools is the
 * registry's and is covered with the other addon-gated tools.
 */
import type { McpContext } from '../../../src/nest-mcp';
import { ToursMcp } from '../../../src/nest/tours/tours.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import {
  addTripMember,
  createDay,
  createDayAssignment,
  createPlace,
  createTrip,
  createUser,
} from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTour } from '../../helpers/tours-repos';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let mcp: ToursMcp;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  mcp = t.get(ToursMcp);
});
beforeEach(() => resetTestDb(db));
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

/** The JSON a tool answered, or the error text it refused with. */
function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

function fixture() {
  const { user } = createUser(db);
  const { user: outsider } = createUser(db);
  const { user: member } = createUser(db);
  const trip = createTrip(db, user.id);
  addTripMember(db, trip.id, member.id);
  const day1 = createDay(db, trip.id, { day_number: 1, date: '2026-07-10', title: 'Arrive' });
  const day2 = createDay(db, trip.id, { day_number: 2, date: '2026-07-11' });
  const ridge = createPlace(db, trip.id, { name: 'Ridge' });
  createTour(db, ridge.id, { distance: 8.2, max_hiking_difficulty: 3 });
  const gorge = createPlace(db, trip.id, { name: 'Gorge' });
  createTour(db, gorge.id);
  const cafe = createPlace(db, trip.id, { name: 'Cafe' });
  createDayAssignment(db, day2.id, ridge.id);
  createDayAssignment(db, day1.id, ridge.id);
  createDayAssignment(db, day1.id, cafe.id);
  return { user, outsider, member, trip, day1, day2, ridge, gorge };
}

describe('ToursMcp', () => {
  it('TOURS-MCP-001: list_tours lists the tours of the trip with their days in day order, no other place', async () => {
    const { user, trip, day1, day2, ridge, gorge } = fixture();
    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    expect(tours.map((tour: { place_id: number }) => tour.place_id).sort()).toEqual([ridge.id, gorge.id].sort());
    const listedRidge = tours.find((tour: { place_id: number }) => tour.place_id === ridge.id);
    expect(listedRidge).toMatchObject({ name: 'Ridge', origin: expect.any(String), max_hiking_difficulty: 3 });
    expect(listedRidge.days).toEqual([
      { day_id: day1.id, day_number: 1, date: '2026-07-10', title: 'Arrive' },
      { day_id: day2.id, day_number: 2, date: '2026-07-11', title: null },
    ]);
    expect(tours.find((tour: { place_id: number }) => tour.place_id === gorge.id).days).toEqual([]);
  });

  it('TOURS-MCP-002: get_tour_plan reads one tour with its control points, provenance and days, without the track', async () => {
    const { member, trip, ridge } = fixture();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(member.id)));
    expect(plan.tour).toMatchObject({ place_id: ridge.id, name: 'Ridge' });
    expect(plan.tour.days).toHaveLength(2);
    expect(Array.isArray(plan.waypoints)).toBe(true);
    expect(plan.provenance).toMatchObject({ origin: expect.any(String), source: { kind: expect.any(String) } });
    expect(JSON.stringify(plan)).not.toContain('route_geometry');
  });

  it('TOURS-MCP-003: find_tours_for_day lists only the tours on that day', async () => {
    const { user, trip, day1, day2, ridge } = fixture();
    expect(
      read(await mcp.findToursForDay({ tripId: trip.id, dayId: day1.id }, ctx(user.id))).tours.map(
        (tour: { place_id: number }) => tour.place_id,
      ),
    ).toEqual([ridge.id]);
    expect(read(await mcp.findToursForDay({ tripId: trip.id, dayId: day2.id + 1000 }, ctx(user.id))).tours).toEqual([]);
  });

  it('TOURS-MCP-004: someone outside the trip learns nothing, and a place that is no tour is not found', async () => {
    const { user, outsider, trip, ridge } = fixture();
    for (const result of [
      await mcp.listTours({ tripId: trip.id }, ctx(outsider.id)),
      await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(outsider.id)),
      await mcp.findToursForDay({ tripId: trip.id, dayId: 1 }, ctx(outsider.id)),
    ]) {
      expect(read(result)).toEqual({ error: 'Trip not found or access denied.' });
    }
    const cafe = createPlace(db, trip.id, { name: 'Plain' });
    expect(read(await mcp.getTourPlan({ tripId: trip.id, placeId: cafe.id }, ctx(user.id)))).toEqual({
      error: 'Tour not found.',
    });
  });

  it('TOURS-MCP-005: a failure other than a missing tour is not passed off as not found', async () => {
    const { user, trip, ridge } = fixture();
    const failure = new Error('database gone');
    const getTour = vi.spyOn(t.get(ToursService), 'getTour').mockRejectedValueOnce(failure);
    try {
      await expect(mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(user.id))).rejects.toBe(failure);
    } finally {
      getTour.mockRestore();
    }
  });
});
