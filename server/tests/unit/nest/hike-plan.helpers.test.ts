/**
 * The pure halves of a hike planned over MCP: the points a hike is planned
 * through, the proposal shown from a plan, the write a created hike makes and
 * the words of a change whose way could not be planned.
 */
import {
  alongPlacesOf,
  heightRangeOf,
  highPointOf,
  hikeCreateCommandOf,
  hikePointsOf,
  hikeProposalOf,
  hikeWaypointsOf,
  keptWayOf,
  positionsAlong,
  proposalSacOf,
  repointedWaypoints,
  routeOutcomeOf,
  unplannedChangeMessage,
  unplannedCreateMessage,
  waypointPositionsOf,
  weatherPointOf,
  type HikeProposalContext,
} from '../../../src/nest/tours/hike-plan.helpers';
import type { PlannedHike } from '../../../src/nest/tours/hike-routing.service';
import {
  HIKE_PROPOSAL_SAC_SEGMENTS,
  hikeProposalSchema,
  type GeometryPoint,
  type HikePlan,
  type HikeSacSegment,
  type RoutedHikePlan,
  type TourPoi,
} from '@trek/shared';

import { describe, expect, it } from 'vitest';

// HIKE-PLAN-001 to HIKE-PLAN-014

/** A plan with its line, as the router answers it: without the router's legs and snaps unless given. */
const planned = (
  plan: HikePlan,
  line: GeometryPoint[] | null,
  legs: number[] | null = null,
  snapped: number[] | null = null,
): PlannedHike => ({ plan, line, legs, snapped });

/** A proposal read without a day, places along the way or weather. */
const ALONE: HikeProposalContext = { dayId: null, date: null, along: null, weather: null };

/** A point `k` thousandths of a degree north of 47° N on 11° E, about 111 m a step. */
const at = (k: number): [number, number] => [47 + k / 1000, 11];
const START = { lat: 47, lng: 11, name: 'Car park' };
const SUMMIT = { lat: 47.004, lng: 11, name: 'Summit' };

const ROUTED: RoutedHikePlan = {
  kind: 'routed',
  max_hiking_difficulty: 3,
  hiking_preferences: { avoid_steps: true },
  distance_m: 445,
  ascent_m: 40,
  descent_m: 0,
  duration_minutes: 12,
  duration_basis: 'din33466',
  has_heights: true,
  line: [
    [47, 11, 600],
    [47.004, 11, 640],
  ],
  profile: [
    [0, 600],
    [445, 640],
  ],
  grades: { segments: [{ from_m: 0, to_m: 445, sac: 3 }], highest: 3, unknown_share: 0 },
};
const LINE: GeometryPoint[] = [0, 1, 2, 3, 4].map((k) => [...at(k), 600 + 10 * k]);

describe('the points and the write of a hike', () => {
  it('HIKE-PLAN-001: a round trip comes back to its start; a hike one way ends where it was asked to', () => {
    expect(hikePointsOf([START, SUMMIT], true)).toEqual([START, SUMMIT, START]);
    expect(hikePointsOf([START, SUMMIT], false)).toEqual([START, SUMMIT]);
    expect(hikePointsOf([START, SUMMIT], undefined)).toEqual([START, SUMMIT]);
    expect(hikeWaypointsOf([START, { lat: 47.002, lng: 11, name: '' }, SUMMIT])).toEqual([
      { lat: 47, lng: 11, name: 'Car park', role: 'start', sequence: 0 },
      { lat: 47.002, lng: 11, role: 'via', sequence: 1 },
      { lat: 47.004, lng: 11, name: 'Summit', role: 'end', sequence: 2 },
    ]);
  });

  it('HIKE-PLAN-002: a created hike keeps the whole line, the walking time and the limit; without a way its points only', () => {
    const kept = planned(ROUTED, LINE);
    const request = { name: 'Summit', waypoints: [START, SUMMIT], hiking_preferences: { avoid_steps: true } };
    expect(hikeCreateCommandOf(request, [START, SUMMIT], keptWayOf(kept), 3)).toEqual({
      name: 'Summit',
      description: undefined,
      tour_type: 'hike',
      route_geometry: LINE,
      duration_seconds: 720,
      max_hiking_difficulty: 3,
      hiking_preferences: { avoid_steps: true },
      waypoints: hikeWaypointsOf([START, SUMMIT]),
    });
    const unplanned = planned(
      { kind: 'unrouted', max_hiking_difficulty: 2, why: 'no_way', position: null, snapped_m: null },
      null,
    );
    expect(
      hikeCreateCommandOf(
        { ...request, planned_duration_minutes: 300, hiking_preferences: null },
        [START, SUMMIT],
        keptWayOf(unplanned),
        2,
      ),
    ).toMatchObject({
      route_geometry: null,
      duration_seconds: null,
      max_hiking_difficulty: 2,
      hiking_preferences: null,
      planned_duration_minutes: 300,
    });
    expect(routeOutcomeOf(unplanned.plan)).toEqual({ planned: false, why: 'no_way', position: null });
    expect(routeOutcomeOf(ROUTED)).toEqual({ planned: true });
  });

  it('HIKE-PLAN-009: keeps a way only with the height of every point, and reads one without as a router that did not answer', () => {
    expect(keptWayOf(planned(ROUTED, LINE))).toEqual({ line: LINE, seconds: 720, route: { planned: true } });
    const flat = planned({ ...ROUTED, has_heights: false, ascent_m: null, descent_m: null, duration_basis: 'router' }, [
      at(0),
      at(4),
    ]);
    const none = { line: null, seconds: null, route: { planned: false, why: 'router_unavailable', position: null } };
    expect(keptWayOf(flat)).toEqual(none);
    // A plan that says it has heights but came without its line keeps none either.
    expect(keptWayOf(planned(ROUTED, null))).toEqual(none);
    const off = planned(
      { kind: 'unrouted', max_hiking_difficulty: 2, why: 'point_off_the_way', position: 2, snapped_m: 400 },
      null,
    );
    expect(keptWayOf(off)).toEqual({
      line: null,
      seconds: null,
      route: { planned: false, why: 'point_off_the_way', position: 2 },
    });
  });

  it('HIKE-PLAN-010: new points keep the link and the name of a saved point they stand on, and only of that one', () => {
    const saved = [
      { lat: 47, lng: 11, role: 'start' as const, sequence: 0, name: 'Car park', linked_place_id: 7 },
      { lat: 47.002, lng: 11, role: 'via' as const, sequence: 1, name: 'Hut', linked_place_id: 8 },
      { lat: 47.004, lng: 11, role: 'end' as const, sequence: 2, linked_place_id: null },
    ];
    const repointed = repointedWaypoints(
      [
        // 11 m from the car park, a little further from nothing else.
        { lat: 47.0001, lng: 11 },
        // 33 m from the hut: another point.
        { lat: 47.0023, lng: 11 },
        { lat: 47.004, lng: 11, name: 'Summit' },
        { lat: 47.002, lng: 11, name: 'Hut terrace' },
      ],
      saved,
    );
    expect(repointed).toEqual([
      { lat: 47.0001, lng: 11, name: 'Car park', linked_place_id: 7, role: 'start', sequence: 0 },
      { lat: 47.0023, lng: 11, role: 'via', sequence: 1 },
      { lat: 47.004, lng: 11, name: 'Summit', role: 'via', sequence: 2 },
      { lat: 47.002, lng: 11, name: 'Hut terrace', linked_place_id: 8, role: 'end', sequence: 3 },
    ]);
    expect(repointedWaypoints([START, SUMMIT], [])).toEqual(hikeWaypointsOf([START, SUMMIT]));
  });
});

describe('a proposal from a plan', () => {
  it('HIKE-PLAN-003: places each point along the line in order, a way back to the start at its end', () => {
    const outAndBack: GeometryPoint[] = [...LINE, ...LINE.slice(0, -1).reverse()];
    expect(positionsAlong(outAndBack, [START, SUMMIT, START])).toEqual([0, 445, 890]);
    // A point a little off the line lies where the line passes it first.
    expect(positionsAlong(LINE, [START, { lat: 47.002, lng: 11.0001 }, SUMMIT])).toEqual([0, 222, 445]);
  });

  it('HIKE-PLAN-004: reads the lowest and highest point only where every point has a height', () => {
    expect(heightRangeOf(LINE)).toEqual({ min: 600, max: 640 });
    expect(heightRangeOf([at(0), at(1)])).toBeNull();
    expect(heightRangeOf([[...at(0), 600], at(1)])).toBeNull();
    expect(heightRangeOf([])).toBeNull();
  });

  it('HIKE-PLAN-005: keeps the grades as they are, neighbours of one grade joined, where they fit', () => {
    expect(proposalSacOf(null)).toBeNull();
    const segments: HikeSacSegment[] = [
      { from_m: 0, to_m: 100, sac: 2 },
      { from_m: 100, to_m: 200, sac: 2 },
      { from_m: 250, to_m: 300, sac: 2 },
      { from_m: 300, to_m: 400, sac: 4 },
    ];
    expect(proposalSacOf({ segments, highest: 4, unknown_share: 0.125 })).toEqual({
      highest: 4,
      segments: [
        { from_m: 0, to_m: 200, sac: 2 },
        { from_m: 250, to_m: 300, sac: 2 },
        { from_m: 300, to_m: 400, sac: 4 },
      ],
      unknown_share: 0.125,
    });
  });

  it('HIKE-PLAN-011: joins only stretches that touch while that is enough, the unknown ones between kept unknown', () => {
    // Pairs of touching stretches with a gap of unknown grade after each pair.
    const pairs = Array.from({ length: HIKE_PROPOSAL_SAC_SEGMENTS }, (_, index) => [
      { from_m: index * 30, to_m: index * 30 + 10, sac: 1 },
      { from_m: index * 30 + 10, to_m: index * 30 + 20, sac: 4 },
    ]).flat();
    const sac = proposalSacOf({ segments: pairs, highest: 4, unknown_share: 0.33 });
    expect(sac?.segments).toHaveLength(HIKE_PROPOSAL_SAC_SEGMENTS);
    expect(sac?.segments.slice(0, 2)).toEqual([
      { from_m: 0, to_m: 20, sac: 4 },
      { from_m: 30, to_m: 50, sac: 4 },
    ]);
    expect(sac?.unknown_share).toBe(0.33);

    // Stretches each apart from the next leave no other way than to join them over the gaps.
    const apart = Array.from({ length: HIKE_PROPOSAL_SAC_SEGMENTS + 1 }, (_, index) => ({
      from_m: index * 20,
      to_m: index * 20 + 10,
      sac: index === 1 ? 5 : 2,
    }));
    const joined = proposalSacOf({ segments: apart, highest: 5, unknown_share: 0.5 })?.segments;
    expect(joined?.length).toBeLessThanOrEqual(HIKE_PROPOSAL_SAC_SEGMENTS);
    expect(joined?.[0]).toEqual({ from_m: 0, to_m: 30, sac: 5 });
  });

  it('HIKE-PLAN-006: joins too many stretches in pairs, each the harder of its grades, until they fit', () => {
    const count = 2 * HIKE_PROPOSAL_SAC_SEGMENTS + 1;
    const segments = Array.from({ length: count }, (_, index) => ({
      from_m: index * 10,
      to_m: index * 10 + 10,
      sac: index % 2 === 0 ? 1 : 3,
    }));
    const sac = proposalSacOf({ segments, highest: 3, unknown_share: 0 });
    expect(sac?.segments.length).toBeLessThanOrEqual(HIKE_PROPOSAL_SAC_SEGMENTS);
    expect(sac?.segments[0]).toEqual({ from_m: 0, to_m: (count - 1) * 10, sac: 3 });
    expect(sac?.segments.at(-1)).toEqual({ from_m: (count - 1) * 10, to_m: count * 10, sac: 1 });
    expect(sac?.segments.every((segment) => segment.sac >= 1)).toBe(true);
  });

  it('HIKE-PLAN-007: a proposal gives the way and the request back; one without a way names why and keeps its points', () => {
    const request = {
      name: 'Summit',
      waypoints: [START, { lat: 47.002, lng: 11 }, SUMMIT],
      variant_label: 'direct',
      date: '2027-07-10',
      start_time: '08:00',
      hiking_preferences: { avoid_steps: true },
    };
    const points = hikePointsOf(request.waypoints, false);
    const routed = hikeProposalOf(request, points, planned(ROUTED, LINE), { ...ALONE, date: request.date });
    expect(hikeProposalSchema.parse(routed)).toEqual(routed);
    expect(routed).toMatchObject({
      name: 'Summit',
      variant_label: 'direct',
      heights_known: true,
      min_ele_m: 600,
      max_ele_m: 640,
      hiking_preferences: { avoid_steps: true },
      round_trip: false,
      date: '2027-07-10',
      start_time: '08:00',
    });
    expect(routed.waypoints.map((point) => [point.name, point.at_m])).toEqual([
      ['Car park', 0],
      [null, 222],
      ['Summit', 445],
    ]);

    const flat = hikeProposalOf(
      { name: 'Flat', waypoints: request.waypoints },
      points,
      planned({ ...ROUTED, has_heights: false, ascent_m: null, descent_m: null, grades: null }, [at(0), at(2), at(4)]),
      ALONE,
    );
    expect(flat).toMatchObject({ heights_known: false, min_ele_m: null, sac: null, name: 'Flat', date: null });

    const off = hikeProposalOf(
      { name: 'Off', waypoints: request.waypoints, hiking_preferences: { avoid_climbs: true } },
      points,
      planned(
        { kind: 'unrouted', max_hiking_difficulty: 2, why: 'point_off_the_way', position: 3, snapped_m: 512 },
        null,
      ),
      ALONE,
    );
    expect(hikeProposalSchema.parse(off)).toEqual(off);
    expect(off).toMatchObject({
      route: { planned: false, why: 'point_off_the_way', position: 3 },
      unreachable: { position: 3, snapped_m: 512 },
      distance_m: null,
      high_point: null,
      along: null,
      hiking_preferences: { avoid_climbs: true },
    });
    expect(off).not.toHaveProperty('line_geometry');
    expect(off.waypoints.map((point) => point.at_m)).toEqual([null, null, null]);
    // A refusal without a point, and one whose distance is not known, names none.
    for (const plan of [
      { kind: 'unrouted' as const, max_hiking_difficulty: 2, why: 'no_way' as const, position: null, snapped_m: null },
      {
        kind: 'unrouted' as const,
        max_hiking_difficulty: 2,
        why: 'point_off_the_way' as const,
        position: 2,
        snapped_m: null,
      },
    ]) {
      expect(
        hikeProposalOf({ name: 'X', waypoints: request.waypoints }, points, planned(plan, null), ALONE).unreachable,
      ).toBeNull();
    }
  });

  it('HIKE-PLAN-008: a hike or a change whose way cannot be planned says why, and that nothing was saved', () => {
    const kept = 'Nothing was saved and the hike keeps its way.';
    expect(unplannedChangeMessage({ why: 'no_valhalla', position: null })).toContain('no Valhalla router');
    expect(unplannedChangeMessage({ why: 'router_unavailable', position: null })).toContain('did not answer');
    expect(unplannedChangeMessage({ why: 'no_way', position: null })).toContain('raise the limit');
    expect(unplannedChangeMessage({ why: 'too_long', position: null })).toBe(
      `The way is too long to plan as one hike: split it into shorter hikes. ${kept}`,
    );
    expect(unplannedCreateMessage({ why: 'no_way', position: null })).toBe(
      'No way within the hiking limit joins these points: raise the limit or move the points. Nothing was saved.',
    );
    expect(unplannedChangeMessage({ why: 'point_off_the_way', position: 2 })).toBe(
      `Point 2 is further than 300 m from any way: move it onto a path. ${kept}`,
    );
    expect(unplannedChangeMessage({ why: 'point_off_the_way', position: null })).toContain('Point  is further');
    for (const why of ['no_valhalla', 'router_unavailable', 'no_way'] as const) {
      expect(unplannedChangeMessage({ why, position: null }).endsWith(kept)).toBe(true);
    }
  });
});

describe('where and when a proposed hike reaches its points', () => {
  const routedTo = (line: GeometryPoint[]) => ({ ...ROUTED, line });

  it("HIKE-PLAN-012: lays the router's legs onto the line, and takes the nearest pass where it gave none for each", () => {
    const points = [START, { lat: 47.002, lng: 11 }, SUMMIT];
    // The router measured 200 m and 300 m; the line is 444.8 m long.
    expect(waypointPositionsOf(planned(routedTo(LINE), LINE, [200, 300]), points)).toEqual([0, 178, 445]);
    expect(waypointPositionsOf(planned(routedTo(LINE), LINE, [200]), points)).toEqual(positionsAlong(LINE, points));
    expect(waypointPositionsOf(planned(routedTo(LINE), LINE, null), points)).toEqual([0, 222, 445]);
    expect(waypointPositionsOf(planned(routedTo(LINE), LINE, [0, 0]), points)).toEqual([0, 0, 0]);
    expect(waypointPositionsOf(planned(routedTo(LINE), null, [200, 300]), points)).toBeNull();
  });

  it('HIKE-PLAN-013: finds the highest point, the first of two as high, and reads the weather there or at the start', () => {
    const ridge: GeometryPoint[] = [
      [...at(0), 600],
      [...at(1), 700],
      [...at(2), 700],
      [...at(3), 650],
    ];
    expect(highPointOf(ridge)).toEqual({ lat: 47.001, lng: 11, ele_m: 700, at_m: 111 });
    expect(highPointOf([at(0), at(1)])).toBeNull();
    expect(highPointOf(null)).toBeNull();
    expect(weatherPointOf([START, SUMMIT], planned(routedTo(ridge), ridge))).toMatchObject({ lat: 47.001, lng: 11 });
    expect(weatherPointOf([START, SUMMIT], planned(routedTo([at(0), at(4)]), [at(0), at(4)]))).toEqual({
      lat: 47,
      lng: 11,
    });
  });

  it('HIKE-PLAN-014: names the nearest places along the way in the order passed, each placed on the whole line', () => {
    const place = (name: string, k: number, off: number): TourPoi => ({
      id: `node:${name}`,
      name,
      lat: at(k)[0],
      lng: 11.0001,
      category: 'shelter',
      kind: 'amenity=shelter',
      source: 'openstreetmap',
      address: null,
      website: null,
      phone: null,
      opening_hours: null,
      distance_m: off,
      along_m: 0,
    });
    const along = alongPlacesOf([place('Far', 1, 240), place('Top', 4, 8.4), place('Hut', 2, 7.6)], LINE);
    expect(along.map(({ name, at_m, off_m }) => [name, at_m, off_m])).toEqual([
      ['Far', 111, 240],
      ['Hut', 222, 8],
      ['Top', 445, 8],
    ]);
    expect(alongPlacesOf([], LINE)).toEqual([]);
  });
});
