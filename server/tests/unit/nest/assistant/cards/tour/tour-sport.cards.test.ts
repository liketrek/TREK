/**
 * ASTCARD-TOUR-020 to ASTCARD-TOUR-029
 *
 * The cards of a proposed city walk, a paddle plan and a ski plan, and of a
 * trip's tours as a list, built from the tool's raw answer through the
 * registry's guarded call (so each also fits the card union and the cap):
 * the walk's stations with their times and stays, the legs of a plan joined
 * into one route with their stretches placed along the whole, the failed
 * legs counted and a failed leg between planned ones marked as a gap of its
 * straight length, and the list's rows with their days.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import type { AnswerInput } from '../../../../../../src/nest/assistant/cards/card-types';
import { answerCardOf } from '../../../../../../src/nest/assistant/cards/registry';
import { trekCardSchema, type TourListCard, type TourRouteCard, type TrekCard } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

const card = buildTripCard(
  1,
  7,
  { trip: { title: 'Munich' }, days: [{ id: 31, day_number: 3, date: '2026-06-13', assignments: [] }] },
  { places: [] },
  null,
);

function built(tool: string, value: unknown, args: Record<string, unknown> = {}): TrekCard | null {
  return answerCardOf(tool, { toolCallId: 'call_1', args, value, card, today: '2026-06-01' } satisfies AnswerInput);
}

function route(shown: TrekCard | null): TourRouteCard {
  if (shown?.kind !== 'tourRoute') throw new Error(`no route card: ${JSON.stringify(shown)}`);
  expect(trekCardSchema.safeParse(shown).success).toBe(true);
  return shown;
}

/** What propose_city_walk answers for three stations from ten, the museum closed when it is reached. */
function walk(extra: Record<string, unknown> = {}) {
  return {
    date: '2026-06-13',
    frame: { start_time: '10:00', end_time: '14:00' },
    stations: [
      { position: 1, name: 'Marienplatz', lat: 48.137, lng: 11.575, walk_from_previous: null, arrival: '10:00' },
      {
        position: 2,
        name: 'Museum',
        lat: 48.14,
        lng: 11.58,
        walk_from_previous: { metres: 600, minutes: 8 },
        arrival: '10:08',
        stay_minutes: 60,
        conflicts: ['closed_at_arrival', 'late'],
      },
      {
        position: 3,
        name: 'Hofgarten',
        lat: 48.143,
        lng: 11.58,
        walk_from_previous: { metres: 400, minutes: 6 },
        arrival: '11:14',
        stay_minutes: null,
        conflicts: ['after_frame'],
      },
    ],
    totals: { walk_m: 1000, walk_minutes: 14, total_minutes: 74, ends_at: '11:14' },
    estimate: { kind: 'routed', profile: 'walking' },
    line_geometry: [
      [48.137, 11.575],
      [48.14, 11.58],
      [48.143, 11.58],
    ],
    stations_for_create: [],
    ...extra,
  };
}

describe('the card of a proposed city walk', () => {
  it('ASTCARD-TOUR-020: shows the stations in order with walking minutes, arrivals, stays and flags', () => {
    const shown = route(built('propose_city_walk', walk(), { day_id: 31 }));
    expect(shown).toMatchObject({
      source: 'proposal',
      activity: 'walk',
      name: null,
      distanceM: 1000,
      minutes: 74,
      minutesBasis: 'stations',
      routed: true,
      problem: null,
      schedule: { date: '2026-06-13', dayId: 31, dayNumber: 3, start: '10:00', arrive: '11:14', hours: [] },
    });
    expect(shown.line[0]).toEqual([48.137, 11.575, null]);
    expect(shown.stops.map((stop) => [stop.role, stop.kind, stop.atM, stop.minutes, stop.clock, stop.flag])).toEqual([
      ['start', 'station', 0, 0, '10:00', null],
      ['via', 'station', 600, 8, '10:08', 'closed'],
      ['end', 'station', 1000, 14, '11:14', 'after_frame'],
    ]);
    expect(shown.stops[1]?.stayMinutes).toBe(60);
  });

  it('ASTCARD-TOUR-021: without a routed way the stations are joined straight, with why', () => {
    const { line_geometry: _line, ...estimated } = walk({
      estimate: { kind: 'straight_line', why: 'station_off_the_way', position: 3 },
      date: null,
    });
    const shown = route(built('propose_city_walk', estimated));
    expect(shown).toMatchObject({
      routed: false,
      problem: { why: 'point_off_the_way', position: 3, snappedM: null },
      schedule: null,
    });
    expect(shown.line).toHaveLength(3);
    const ferry = route(built('propose_city_walk', { ...estimated, estimate: { why: 'ferry_only', position: 2 } }));
    expect(ferry.problem?.why).toBe('ferry_only');
    const down = route(built('propose_city_walk', { ...estimated, estimate: { why: 'router_unavailable' } }));
    expect(down.problem?.why).toBe('router_unavailable');
    expect(built('propose_city_walk', walk({ stations: [walk().stations[0]] }))).toBeNull();
  });
});

/** A planned leg along the line given, with its stretches. */
function leg(line: number[][], distance: number, segments: object[], extra: Record<string, unknown> = {}) {
  return { status: 'ok', distance_m: distance, line_geometry: line, segments, ...extra };
}

describe('the card of a paddle plan', () => {
  const args = {
    legs: [
      { from: { lat: 47.6, lng: 11.3 }, to: { lat: 47.61, lng: 11.3 } },
      { from: { lat: 47.61, lng: 11.3 }, to: { lat: 47.62, lng: 11.3 } },
      { from: { lat: 47.62, lng: 11.3 }, to: { lat: 47.63, lng: 11.3 } },
    ],
  };

  it('ASTCARD-TOUR-022: joins the legs into one route, marks portages and rapids, counts the failed leg', () => {
    const value = {
      legs: [
        leg(
          [
            [47.6, 11.3],
            [47.61, 11.3],
          ],
          1100,
          [
            { kind: 'water', from_m: 0, to_m: 800 },
            { kind: 'portage', from_m: 800, to_m: 1100 },
          ],
        ),
        leg(
          [
            [47.61, 11.3],
            [47.62, 11.3],
          ],
          1200,
          [
            { kind: 'rapids', from_m: 100, to_m: 400 },
            { kind: 'lock', from_m: 500, to_m: 600 },
          ],
        ),
        { status: 'failed', reason: 'no_water_path' },
      ],
      graph_rev: 'r1',
    };
    const shown = route(built('plan_paddle_route', value, args));
    expect(shown).toMatchObject({ source: 'plan', activity: 'kayak', distanceM: 2300, routed: true, minutes: null });
    expect(shown.line).toHaveLength(4);
    expect(shown.line.every(([, , height]) => height === null)).toBe(true);
    expect(shown.stretches).toEqual([
      { facet: 'mark', fromM: 800, toM: 1100, kind: 'portage' },
      { facet: 'mark', fromM: 1200, toM: 1500, kind: 'rapids' },
    ]);
    expect(shown.stops.map((stop) => [stop.role, stop.atM])).toEqual([
      ['start', 0],
      ['via', 1100],
      ['via', 2300],
      ['end', 2300],
    ]);
    expect(shown.warnings).toEqual([{ kind: 'legs_failed', at: null, count: 1 }]);
  });

  it('ASTCARD-TOUR-028: a failed leg between planned ones is a gap as long as the straight jump, and what follows moves on', () => {
    const value = {
      legs: [
        leg(
          [
            [47.6, 11.3],
            [47.605, 11.3],
          ],
          556,
          [{ kind: 'portage', from_m: 0, to_m: 100 }],
        ),
        { status: 'failed', reason: 'no_water_path' },
        leg(
          [
            [47.615, 11.3],
            [47.62, 11.3],
          ],
          556,
          [{ kind: 'rapids', from_m: 100, to_m: 300 }],
        ),
      ],
    };
    const gapped = {
      legs: [
        { from: { lat: 47.6, lng: 11.3 }, to: { lat: 47.605, lng: 11.3 } },
        { from: { lat: 47.605, lng: 11.3 }, to: { lat: 47.615, lng: 11.3 } },
        { from: { lat: 47.615, lng: 11.3 }, to: { lat: 47.62, lng: 11.3 } },
      ],
    };
    const shown = route(built('plan_paddle_route', value, gapped));
    // 0.01 degrees north is 1112 m straight: the line runs on by that much.
    expect(shown.distanceM).toBe(2224);
    expect(shown.stretches).toEqual([
      { facet: 'mark', fromM: 0, toM: 100, kind: 'portage' },
      { facet: 'mark', fromM: 556, toM: 1668, kind: 'gap' },
      { facet: 'mark', fromM: 1768, toM: 1968, kind: 'rapids' },
    ]);
    expect(shown.stops.map((stop) => [stop.role, stop.atM])).toEqual([
      ['start', 0],
      ['via', 556],
      ['via', 1668],
      ['end', 2224],
    ]);
    expect(shown.warnings).toEqual([{ kind: 'legs_failed', at: null, count: 1 }]);
  });

  it('ASTCARD-TOUR-023: a plan without a planned leg or without lines for drawing has no card', () => {
    expect(built('plan_paddle_route', { legs: [{ status: 'failed' }] }, args)).toBeNull();
    expect(built('plan_paddle_route', { legs: [{ status: 'ok', distance_m: 900, segments: [] }] }, args)).toBeNull();
  });
});

describe('the card of a ski plan', () => {
  it('ASTCARD-TOUR-024: sums the legs, keeps the heights, colours runs by difficulty and dots the lifts', () => {
    const value = {
      legs: [
        leg(
          [
            [47.4, 11.0, 1800],
            [47.41, 11.0, 1500],
          ],
          1500,
          [
            { kind: 'run', difficulty: 'intermediate', from_m: 0, to_m: 700 },
            { kind: 'run', difficulty: 'intermediate', from_m: 700, to_m: 1000 },
            { kind: 'lift', difficulty: null, from_m: 1000, to_m: 1500 },
            { kind: 'teleport', from_m: 0, to_m: 1 },
          ],
          { climb_m: 300, descent_m: 300, seconds: { ski: 300, lift: 240, wait: 60, walk: 0 } },
        ),
      ],
      colour_scheme: 'north_america',
    };
    const args = { legs: [{ from: { lat: 47.4, lng: 11.0 }, to: { lat: 47.41, lng: 11.0 } }] };
    const shown = route(built('plan_ski_route', value, args));
    expect(shown).toMatchObject({
      source: 'plan',
      activity: 'ski',
      distanceM: 1500,
      ascentM: 300,
      descentM: 300,
      minEleM: 1500,
      maxEleM: 1800,
      minutes: 10,
      minutesBasis: 'piste',
      skiScheme: 'north_america',
      warnings: [],
    });
    expect(shown.stretches).toEqual([
      { facet: 'ski', fromM: 0, toM: 1000, kind: 'run', difficulty: 'intermediate' },
      { facet: 'mark', fromM: 1000, toM: 1500, kind: 'lift' },
    ]);
    expect(built('plan_ski_route', { legs: [] }, args)).toBeNull();
  });
});

describe('the card of a ski plan with a leg that failed', () => {
  it('ASTCARD-TOUR-029: the runs after a failed leg sit past the gap it leaves, the heights kept', () => {
    const value = {
      legs: [
        leg(
          [
            [47.4, 11.0, 1800],
            [47.405, 11.0, 1600],
          ],
          600,
          [{ kind: 'run', difficulty: 'intermediate', from_m: 0, to_m: 600 }],
        ),
        { status: 'failed', reason: 'no_way' },
        leg(
          [
            [47.415, 11.0, 1700],
            [47.42, 11.0, 1500],
          ],
          600,
          [{ kind: 'run', difficulty: 'freeride', from_m: 0, to_m: 600 }],
        ),
      ],
    };
    const args = {
      legs: [
        { from: { lat: 47.4, lng: 11.0 }, to: { lat: 47.405, lng: 11.0 } },
        { from: { lat: 47.405, lng: 11.0 }, to: { lat: 47.415, lng: 11.0 } },
        { from: { lat: 47.415, lng: 11.0 }, to: { lat: 47.42, lng: 11.0 } },
      ],
    };
    const shown = route(built('plan_ski_route', value, args));
    expect(shown).toMatchObject({ distanceM: 2312, minEleM: 1500, maxEleM: 1800 });
    expect(shown.stretches).toEqual([
      { facet: 'ski', fromM: 0, toM: 600, kind: 'run', difficulty: 'intermediate' },
      { facet: 'mark', fromM: 600, toM: 1712, kind: 'gap' },
      { facet: 'ski', fromM: 1712, toM: 2312, kind: 'run', difficulty: 'freeride' },
    ]);
    expect(shown.stops.map((stop) => stop.atM)).toEqual([0, 600, 1712, 2312]);
    expect(shown.warnings).toEqual([{ kind: 'legs_failed', at: null, count: 1 }]);
  });
});

describe('the card of a list of tours', () => {
  const tour = (id: number, extra: Record<string, unknown> = {}) => ({
    place_id: id,
    name: `Tour ${id}`,
    tour_type: 'hike',
    distance: 9.8,
    elevation_gain: 520,
    duration: 225,
    max_hiking_difficulty: 2,
    days: [{ day_id: 32, day_number: 2 }],
    ...extra,
  });

  function list(shown: TrekCard | null): TourListCard {
    if (shown?.kind !== 'tourList') throw new Error(`no list card: ${JSON.stringify(shown)}`);
    expect(trekCardSchema.safeParse(shown).success).toBe(true);
    return shown;
  }

  it('ASTCARD-TOUR-025: lists each tour with its figures, stages and days, the planned time first', () => {
    const value = {
      tours: [
        tour(61, { planned_duration_minutes: 300, stage_count: 2, days: [{ day_number: 3 }, { day_number: 2 }] }),
        tour(62, { tour_type: 'walk', duration: null, time_estimate: { minutes: 95 }, distance: null }),
      ],
    };
    const shown = list(built('list_tours', value));
    expect(shown).toMatchObject({ dayId: null, more: 0 });
    expect(shown.rows).toEqual([
      {
        placeId: 61,
        name: 'Tour 61',
        activity: 'hike',
        limit: 2,
        distanceM: 9800,
        ascentM: 520,
        minutes: 300,
        stages: 2,
        days: [2, 3],
      },
      {
        placeId: 62,
        name: 'Tour 62',
        activity: 'walk',
        limit: 2,
        distanceM: null,
        ascentM: 520,
        minutes: 95,
        stages: null,
        days: [2],
      },
    ]);
  });

  it('ASTCARD-TOUR-026: shows twelve rows and counts the rest; the day asked for is kept', () => {
    const tours = Array.from({ length: 15 }, (_, i) => tour(70 + i));
    const shown = list(built('find_tours_for_day', { tours }, { dayId: 32 }));
    expect(shown.rows).toHaveLength(12);
    expect(shown).toMatchObject({ dayId: 32, more: 3 });
  });

  it('ASTCARD-TOUR-027: a tour without a name or of an unknown type is left out; an empty list has no card', () => {
    const tours = [tour(1, { name: '' }), tour(2, { tour_type: 'canoe' }), tour(3)];
    const shown = list(built('list_tours', { tours }));
    expect(shown.rows.map((row) => row.placeId)).toEqual([3]);
    expect(built('list_tours', { tours: [] })).toBeNull();
    expect(built('find_tours_for_day', null, { dayId: 32 })).toBeNull();
  });
});
