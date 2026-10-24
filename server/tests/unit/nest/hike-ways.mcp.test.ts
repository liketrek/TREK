/**
 * HikeWaysMcp and HikeWaysService: the planner's round hikes of a wished
 * length and its other ways for one leg, over MCP. The search is the shared
 * one, asked of a stubbed RoadtripRouterService that walks straight between
 * the points it is given; each way found is proposed through a stub of
 * HikePlanService.propose (its own suite plans the hike). The trip and a
 * saved hike are seeded through the ORM factories over a snapshot test db.
 */
import type { McpContext } from '../../../src/nest-mcp';
import { RoadtripRouterService, RouteRefusal } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { HikePlanService } from '../../../src/nest/tours/hike-plan.service';
import { HikeWaysMcp } from '../../../src/nest/tours/hike-ways.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace } from '../../helpers/factories/places';
import { makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import type { HikeProposeRequest } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// HIKE-WAYS-MCP-001 to HIKE-WAYS-MCP-009

type Spot = { lat: number; lng: number };

const db = createSnapshotTestDb();
const route = vi.fn<RoadtripRouterService['route']>();
const alternatesOnFoot = vi.fn<RoadtripRouterService['alternatesOnFoot']>();
const propose = vi.fn<HikePlanService['propose']>();
let t: TestModule;
let mcp: HikeWaysMcp;
const orm = () => t.get(MikroORM);

/** The router's answer for points walked straight between, each met where it was asked. */
function straight(points: Spot[]) {
  return {
    leg: {
      line: points.map(({ lat, lng }): [number, number] => [lat, lng]),
      seg: { distance: 0, duration: 0 },
    },
    parts: points.slice(1).map(() => ({ distance: 0, duration: 0 })),
    snapped: points.map(({ lat, lng }) => ({ asked: [lat, lng], at: [lat, lng], meters: 0 })),
    avoidMissed: [],
  } as unknown as Awaited<ReturnType<RoadtripRouterService['route']>>;
}

/** The stub's proposal: the request's points given back, a length and a line. */
async function proposal(_userId: number, _tripId: number, request: HikeProposeRequest) {
  return {
    name: request.name,
    variant_label: request.variant_label ?? null,
    route: { planned: true },
    distance_m: 10_400,
    ascent_m: 420,
    duration_minutes: 190,
    waypoints: request.waypoints,
    round_trip: request.round_trip ?? false,
    line_geometry: request.waypoints.map(({ lat, lng }): [number, number] => [lat, lng]),
  } as unknown as Awaited<ReturnType<HikePlanService['propose']>>;
}

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: RoadtripRouterService, useValue: { route, alternatesOnFoot } },
      { provide: HikePlanService, useValue: { propose } },
    ],
  });
  mcp = t.get(HikeWaysMcp);
});
beforeEach(() => {
  resetTestDb(db);
  route.mockReset().mockImplementation(async (_u, _t, _d, points) => straight(points));
  alternatesOnFoot.mockReset();
  propose.mockReset().mockImplementation(proposal);
});
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

async function tripOf() {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  return { userId: user.id, tripId: trip.id };
}

const START = { lat: 47.5, lng: 11.1, name: 'Car park' };

describe('propose_round_hike', () => {
  it('HIKE-WAYS-MCP-001: proposes the round asked for as a hike back to its start, with the points to create it', async () => {
    const { userId, tripId } = await tripOf();
    const answer = read(
      await mcp.proposeRoundHike({ tripId, name: 'Round', start: START, distance_km: 10, round: 'b' }, ctx(userId)),
    );
    expect(answer.found).toBe(true);
    expect(answer.round).toMatchObject({ key: 'b', target_m: 10_000, deviation_pct: 4, rounds_found: 3 });
    expect(answer.create_with.round_trip).toBe(true);
    expect(answer.create_with.waypoints).toHaveLength(4);
    expect(answer.create_with.waypoints[0]).toEqual(START);
    const [, , asked] = propose.mock.calls[0] ?? [];
    expect(asked).toMatchObject({ name: 'Round', round_trip: true, along: false });
    // Every loop was asked on foot under the hike's own costing, out of the start and back.
    for (const [, , , points, profile, , options] of route.mock.calls) {
      expect(points[0]).toEqual({ lat: START.lat, lng: START.lng });
      expect(points.at(-1)).toEqual({ lat: START.lat, lng: START.lng });
      expect(profile).toBe('walking');
      expect(options?.costingOptions).toMatchObject({ max_hiking_difficulty: 2 });
    }
  });

  it('HIKE-WAYS-MCP-002: the rounds of one search are asked for one after another without asking the router again', async () => {
    const { userId, tripId } = await tripOf();
    const request = { tripId, name: 'Round', start: START, distance_km: 10 };
    await mcp.proposeRoundHike({ ...request, round: 'a' }, ctx(userId));
    const asked = route.mock.calls.length;
    const c = read(await mcp.proposeRoundHike({ ...request, round: 'c' }, ctx(userId)));
    expect(c.round.key).toBe('c');
    expect(route.mock.calls.length).toBe(asked);
  });

  it('HIKE-WAYS-MCP-003: a router that never answers, or no Valhalla, finds no round and says why', async () => {
    const { userId, tripId } = await tripOf();
    route.mockRejectedValue(new Error('down'));
    const down = read(await mcp.proposeRoundHike({ tripId, name: 'R', start: START, distance_km: 8 }, ctx(userId)));
    expect(down).toEqual({ found: false, way: 'a', ways_found: 0, why: 'router_unavailable' });
    route.mockReset().mockRejectedValue(new RouteRefusal('no_valhalla', 'none'));
    const none = read(await mcp.proposeRoundHike({ tripId, name: 'R', start: START, distance_km: 9 }, ctx(userId)));
    expect(none.why).toBe('no_valhalla');
    // Without a Valhalla the search stops at its first question.
    expect(route).toHaveBeenCalledTimes(1);
    expect(propose).not.toHaveBeenCalled();
  });

  it('HIKE-WAYS-MCP-004: a trip the caller cannot see is not found', async () => {
    const { tripId } = await tripOf();
    const { user: stranger } = await makeUser(orm());
    const answer = read(
      await mcp.proposeRoundHike({ tripId, name: 'R', start: START, distance_km: 8 }, ctx(stranger.id)),
    );
    expect(answer.error).toBeDefined();
    expect(route).not.toHaveBeenCalled();
  });
});

const A = { lat: 47.5, lng: 11.1, name: 'Car park' };
const B = { lat: 47.52, lng: 11.1, name: 'Hut' };
const OWN: Array<[number, number]> = [
  [47.5, 11.1],
  [47.52, 11.1],
];
const OTHER: Array<[number, number]> = [
  [47.5, 11.1],
  [47.51, 11.12],
  [47.52, 11.1],
];

describe('propose_hike_leg_way', () => {
  it('HIKE-WAYS-MCP-005: the other way of a leg is the whole hike with the way held by a pin, beside the hike as it runs', async () => {
    const { userId, tripId } = await tripOf();
    alternatesOnFoot.mockResolvedValue([OWN, OTHER]);
    const answer = read(
      await mcp.proposeHikeLegWay(
        { tripId, name: 'Hike', waypoints: [A, B], leg: 1, include_geometry: true },
        ctx(userId),
      ),
    );
    expect(answer.found).toBe(true);
    expect(answer.leg_way).toEqual({ key: 'a', leg: 1, ways_found: 1, tour_id: null });
    expect(answer.create_with).toEqual({ waypoints: [A, { lat: 47.51, lng: 11.12 }, B], round_trip: false });
    expect(answer.current).toEqual({ distance_m: 10_400, ascent_m: 420, duration_minutes: 190 });
    expect(answer.current_geometry).toHaveLength(2);
    const [, from, to, costing, count] = alternatesOnFoot.mock.calls[0] ?? [];
    expect([from, to, count]).toEqual([{ lat: A.lat, lng: A.lng }, { lat: B.lat, lng: B.lng }, 3]);
    expect(costing).toMatchObject({ max_hiking_difficulty: 2 });
  });

  it('HIKE-WAYS-MCP-006: a router that knows only its own way, or a way it does not keep to, offers none', async () => {
    const { userId, tripId } = await tripOf();
    alternatesOnFoot.mockResolvedValue([OWN, OWN]);
    const same = read(await mcp.proposeHikeLegWay({ tripId, name: 'H', waypoints: [A, B], leg: 1 }, ctx(userId)));
    expect(same).toEqual({ found: false, way: 'a', ways_found: 0, why: 'none_found' });
    alternatesOnFoot.mockResolvedValue([OWN, OTHER]);
    route.mockRejectedValue(new Error('down'));
    const held = read(
      await mcp.proposeHikeLegWay(
        { tripId, name: 'H', waypoints: [A, B], leg: 1, max_hiking_difficulty: 3 },
        ctx(userId),
      ),
    );
    expect(held.found).toBe(false);
    alternatesOnFoot.mockRejectedValue(new RouteRefusal('no_way', 'none'));
    const none = read(
      await mcp.proposeHikeLegWay(
        { tripId, name: 'H', waypoints: [A, B], leg: 1, max_hiking_difficulty: 4 },
        ctx(userId),
      ),
    );
    expect(none.why).toBe('no_way');
  });

  it('HIKE-WAYS-MCP-007: a leg the hike does not have is refused', async () => {
    const { userId, tripId } = await tripOf();
    const answer = read(await mcp.proposeHikeLegWay({ tripId, name: 'H', waypoints: [A, B], leg: 2 }, ctx(userId)));
    expect(answer.error).toContain('no such leg');
    expect(alternatesOnFoot).not.toHaveBeenCalled();
  });

  it('HIKE-WAYS-MCP-008: the way of a saved hike names that hike', async () => {
    const { userId, tripId } = await tripOf();
    const place = await makePlace(orm(), tripId, { name: 'Saved hike', lat: A.lat, lng: A.lng });
    await makeTour(orm(), place.id);
    alternatesOnFoot.mockResolvedValue([OWN, OTHER]);
    const answer = read(
      await mcp.proposeHikeLegWay({ tripId, name: 'H', waypoints: [A, B], leg: 1, tour_id: place.id }, ctx(userId)),
    );
    expect(answer.leg_way.tour_id).toBe(place.id);
  });

  it('HIKE-WAYS-MCP-009: a later call over the same spots asks the router nothing new, and its way follows its own points', async () => {
    const { userId, tripId } = await tripOf();
    // The way back of a round trip, B to A.
    alternatesOnFoot.mockResolvedValue([[...OWN].reverse(), [...OTHER].reverse()]);
    const pin = { lat: 47.51, lng: 11.12 };
    const round = read(
      await mcp.proposeHikeLegWay({ tripId, name: 'H', waypoints: [A, B], round_trip: true, leg: 2 }, ctx(userId)),
    );
    expect(round.create_with).toEqual({ waypoints: [A, B, pin], round_trip: true });
    const asked = route.mock.calls.length;
    // The same hike as get_tour_plan reads it: the way back given as its last point, and a night at the hut.
    const hut = { ...B, stage_end: true };
    const saved = read(await mcp.proposeHikeLegWay({ tripId, name: 'H', waypoints: [A, hut, A], leg: 2 }, ctx(userId)));
    expect(alternatesOnFoot).toHaveBeenCalledTimes(1);
    expect(route.mock.calls.length).toBe(asked);
    expect(saved.leg_way).toMatchObject({ key: 'a', leg: 2, ways_found: 1 });
    expect(saved.create_with).toEqual({ waypoints: [A, hut, pin, A], round_trip: false });
    expect(propose.mock.calls.at(-1)?.[2]).toMatchObject({ waypoints: [A, hut, pin, A], round_trip: false });
  });
});
