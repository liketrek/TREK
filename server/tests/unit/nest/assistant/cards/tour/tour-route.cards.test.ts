/**
 * ASTCARD-TOUR-001 to ASTCARD-TOUR-013
 *
 * The cards of a proposed hike and of a saved tour, built from the tool's raw
 * answer through the registry's guarded call, so every card asserted here
 * also fits the shared card union and the size cap: the way with its figures,
 * the SAC stretches merged, the points, the places along it and the highest
 * point in the order walked, the day with its weather, a way that was not
 * planned drawn straight, and a saved tour's points placed along its line.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import type { AnswerInput } from '../../../../../../src/nest/assistant/cards/card-types';
import { answerCardOf } from '../../../../../../src/nest/assistant/cards/registry';
import { fitted, hardestStretches } from '../../../../../../src/nest/assistant/cards/tour/tour-card-values';
import { sacStretches } from '../../../../../../src/nest/assistant/cards/tour/tour-route.cards';
import { MAX_CARD_CHARS, trekCardSchema, type TourRouteCard, type TourRouteStretch, type TrekCard } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

const card = buildTripCard(
  1,
  7,
  {
    trip: { title: 'Bavaria' },
    days: [
      { id: 31, day_number: 1, date: '2026-06-11', assignments: [] },
      { id: 32, day_number: 2, date: '2026-06-12', assignments: [] },
    ],
  },
  { places: [] },
  null,
);

/** A point `k` steps of 0.005° north of 47.6° N, about 556 m a step, 40 m higher each. */
const at = (k: number, height: number | null = 800 + 40 * k) => [47.6 + k * 0.005, 11.3, height];

/** What propose_hike answers for a short hike up to a summit on day 2 at eight. */
function proposal(extra: Record<string, unknown> = {}) {
  return {
    name: 'Herzogstand',
    variant_label: 'short and steep',
    route: { planned: true },
    unreachable: null,
    distance_m: 1112,
    ascent_m: 80,
    descent_m: 0,
    duration_minutes: 22,
    duration_basis: 'din33466',
    heights_known: true,
    min_ele_m: 800,
    max_ele_m: 880,
    line_geometry: [at(0, 800.4), at(1), at(2)],
    profile_geometry: [
      [0, 800],
      [1112, 880],
    ],
    sac: {
      segments: [
        { from_m: 0, to_m: 300, sac: 2 },
        { from_m: 300, to_m: 600, sac: 2 },
        { from_m: 600, to_m: 1112, sac: 3 },
      ],
      highest: 3,
      unknown_share: 0.25,
    },
    high_point: { lat: 47.61, lng: 11.3, ele_m: 880, at_m: 1112 },
    waypoints: [
      {
        lat: 47.6,
        lng: 11.3,
        name: 'Car park',
        poi_category: null,
        at_m: 0,
        snapped_m: 3,
        minutes: 0,
        arrival: '08:00',
      },
      {
        lat: 47.61,
        lng: 11.3,
        name: 'Summit of desk@peak.test',
        poi_category: 'peak',
        at_m: 1112,
        snapped_m: 2,
        minutes: 22,
        arrival: '08:22',
      },
    ],
    along: [
      { name: 'Spring', category: 'drinking_water', lat: 47.603, lng: 11.301, at_m: 400, off_m: 80 },
      { name: 'View', category: 'viewpoint', lat: 47.607, lng: 11.299, at_m: 800, off_m: 3000 },
    ],
    max_hiking_difficulty: 3,
    hiking_preferences: null,
    round_trip: false,
    day_id: 32,
    date: '2026-06-12',
    start_time: '08:00',
    schedule: {
      date: '2026-06-12',
      day_id: 32,
      start: '08:00',
      arrive: '08:22',
      next_day: false,
      sunrise: '05:10',
      sunset: '21:15',
      latest_start: null,
      weather: 'forecast',
      hours: [
        { hour: 7, main: 'Clear', temp_c: 12, rain_pct: null, wind_kmh: 8 },
        { hour: 8, main: 'Thunderstorm', temp_c: 14, rain_pct: 70, wind_kmh: 20 },
        { hour: 9, main: '', temp_c: 14, rain_pct: 10, wind_kmh: 5 },
      ],
    },
    warnings: [
      { kind: 'thunder', at: '08:00' },
      { kind: 'locusts', at: null },
    ],
    ...extra,
  };
}

const ARGS = {
  name: 'Herzogstand',
  waypoints: [
    { lat: 47.6, lng: 11.3, name: 'Car park' },
    { lat: 47.61, lng: 11.3, name: 'Summit', poi_category: 'peak' },
  ],
};

function input(tool: string, value: unknown, args: Record<string, unknown> = ARGS): [string, AnswerInput] {
  return [tool, { toolCallId: 'call_1', args, value, card, today: '2026-06-01' }];
}

function route(built: TrekCard | null): TourRouteCard {
  if (built?.kind !== 'tourRoute') throw new Error(`no route card: ${JSON.stringify(built)}`);
  expect(trekCardSchema.safeParse(built).success).toBe(true);
  return built;
}

describe('the card of a proposed hike', () => {
  it('ASTCARD-TOUR-001: shows the way with its figures, grades, merged stretches and the day', () => {
    const shown = route(answerCardOf(...input('propose_hike', proposal())));
    expect(shown).toMatchObject({
      source: 'proposal',
      activity: 'hike',
      name: 'Herzogstand',
      label: 'short and steep',
      distanceM: 1112,
      ascentM: 80,
      descentM: 0,
      minEleM: 800,
      maxEleM: 880,
      minutes: 22,
      minutesBasis: 'din33466',
      limit: 3,
      grades: { highest: 3, unknownShare: 0.25 },
      routed: true,
      problem: null,
    });
    expect(shown.line).toEqual([
      [47.6, 11.3, 800],
      [47.605, 11.3, 840],
      [47.61, 11.3, 880],
    ]);
    expect(shown.stretches).toEqual([
      { facet: 'sac', fromM: 0, toM: 600, step: 2 },
      { facet: 'sac', fromM: 600, toM: 1112, step: 3 },
    ]);
    expect(shown.schedule).toMatchObject({ date: '2026-06-12', dayId: 32, dayNumber: 2, start: '08:00' });
    expect(shown.schedule?.hours).toEqual([
      { hour: 7, main: 'Clear', tempC: 12, rainPct: null, windKmh: 8 },
      { hour: 8, main: 'Thunderstorm', tempC: 14, rainPct: 70, windKmh: 20 },
    ]);
    expect(shown.warnings).toEqual([{ kind: 'thunder', at: '08:00', count: null }]);
  });

  it('ASTCARD-TOUR-002: lists the points and the places along the way in the order walked, timed between', () => {
    const shown = route(answerCardOf(...input('propose_hike', proposal())));
    expect(shown.stops.map((stop) => [stop.role, stop.kind, stop.atM, stop.minutes, stop.clock])).toEqual([
      ['start', null, 0, 0, '08:00'],
      ['along', 'drinking_water', 400, 8, '08:08'],
      ['along', 'viewpoint', 800, 16, '08:16'],
      ['end', 'peak', 1112, 22, '08:22'],
    ]);
    // A place far off the way is capped at what a card shows; a name from the answer is masked.
    expect(shown.stops[2]?.offM).toBe(2000);
    expect(shown.stops[3]?.name).toBe('Summit of [hidden]');
    expect(JSON.stringify(shown)).not.toContain('desk@peak.test');
  });

  it('ASTCARD-TOUR-003: adds the highest point as a stop of its own when no summit stands there', () => {
    const plain = proposal({
      waypoints: [
        { lat: 47.6, lng: 11.3, name: 'Car park', poi_category: null, at_m: 0, minutes: 0, arrival: null },
        { lat: 47.6, lng: 11.31, name: 'Lake', poi_category: null, at_m: 2000, minutes: 40, arrival: null },
      ],
      along: null,
      start_time: null,
    });
    const shown = route(answerCardOf(...input('propose_hike', plain)));
    expect(shown.stops.map((stop) => [stop.role, stop.kind, stop.atM, stop.minutes, stop.clock])).toEqual([
      ['start', null, 0, 0, null],
      ['along', 'highest', 1112, 22, null],
      ['end', null, 2000, 40, null],
    ]);
  });

  it('ASTCARD-TOUR-004: a line with one height missing keeps none, so no profile is drawn from it', () => {
    const gap = proposal({ line_geometry: [at(0), at(1, null), at(2)] });
    const shown = route(answerCardOf(...input('propose_hike', gap)));
    expect(shown.line.every(([, , height]) => height === null)).toBe(true);
  });

  it('ASTCARD-TOUR-005: a proposal without its line for drawing, or a broken answer, has no card', () => {
    const { line_geometry: _line, ...flagOff } = proposal();
    expect(answerCardOf(...input('propose_hike', flagOff))).toBeNull();
    expect(answerCardOf(...input('propose_hike', 'not a proposal', {}))).toBeNull();
  });

  it('ASTCARD-TOUR-006: a way that was not planned is drawn straight through its points, with why', () => {
    const unrouted = {
      name: 'Herzogstand',
      variant_label: null,
      route: { planned: false, why: 'point_off_the_way', position: 2 },
      unreachable: { position: 2, snapped_m: 340 },
      waypoints: [
        { lat: 47.6, lng: 11.3, name: 'Car park', poi_category: null, at_m: null },
        { lat: 47.61, lng: 11.3, name: 'Summit', poi_category: 'peak', at_m: null },
      ],
      max_hiking_difficulty: 2,
      warnings: [],
    };
    const shown = route(answerCardOf(...input('propose_hike', unrouted)));
    expect(shown).toMatchObject({
      routed: false,
      problem: { why: 'point_off_the_way', position: 2, snappedM: 340 },
      distanceM: null,
      minutes: null,
      limit: 2,
      line: [
        [47.6, 11.3, null],
        [47.61, 11.3, null],
      ],
    });
    expect(shown.stops.map((stop) => [stop.role, stop.atM])).toEqual([
      ['start', 0],
      ['end', 1112],
    ]);
    // An answer naming no points falls back to the call's own; a reason this build does not know reads as unplanned.
    const bare = route(answerCardOf(...input('propose_hike', { route: { planned: false, why: 'gremlins' } })));
    expect(bare.problem?.why).toBe('not_planned');
    expect(bare.stops).toHaveLength(2);
  });

  it('ASTCARD-TOUR-007: stretches past the card share keep the hardest, in the order they lie', () => {
    const segments = Array.from({ length: 120 }, (_, i) => ({
      from_m: i * 10,
      to_m: i * 10 + 5,
      sac: i % 3 === 0 ? 4 : 1,
    }));
    const kept = sacStretches(segments);
    expect(kept).toHaveLength(80);
    expect(kept.filter((stretch) => stretch.facet === 'sac' && stretch.step === 4)).toHaveLength(40);
    const starts = kept.map((stretch) => stretch.fromM);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(sacStretches([{ from_m: 50, to_m: 10, sac: 2 }, { sac: 9 }, 'odd'])).toEqual([]);
  });

  it('ASTCARD-TOUR-008: the heaviest proposal still goes out, lightened until it fits the cap', () => {
    const long = 'Hut '.repeat(30);
    const heavy = proposal({
      line_geometry: Array.from({ length: 300 }, (_, k) => [47.123456 + k / 10000, 11.123456, 1234]),
      waypoints: Array.from({ length: 26 }, (_, i) => ({
        lat: 47.1 + i / 100,
        lng: 11.1,
        name: `${long}${i}`,
        poi_category: 'shelter',
        at_m: i * 1000,
        minutes: i * 20,
        arrival: '09:00',
      })),
      along: Array.from({ length: 12 }, (_, i) => ({
        name: `${long}${i}`,
        category: 'viewpoint',
        lat: 47.2,
        lng: 11.2,
        at_m: i * 900 + 50,
        off_m: 100,
      })),
      sac: {
        segments: Array.from({ length: 80 }, (_, i) => ({ from_m: i * 100, to_m: i * 100 + 50, sac: (i % 6) + 1 })),
        highest: 6,
        unknown_share: 0.1,
      },
    });
    const shown = route(answerCardOf(...input('propose_hike', heavy)));
    expect(JSON.stringify(shown).length).toBeLessThanOrEqual(MAX_CARD_CHARS);
    expect(shown.stops.filter((stop) => stop.role !== 'along')).toHaveLength(26);
    // With a full line and the way it replaces beside it, the card is too heavy: both lines are thinned first.
    const fine = (k: number): [number, number] => [47.1234567891 + k / 1e7, 11.1234567891];
    const previous = {
      line: Array.from({ length: 200 }, (_, k) => fine(k)),
      distanceM: 9000,
      ascentM: null,
      minutes: null,
    };
    const line = Array.from({ length: 300 }, (_, k): [number, number, number] => [...fine(k), 1234]);
    const inflated: TourRouteCard = { ...shown, line, previous };
    expect(JSON.stringify(inflated).length).toBeGreaterThan(MAX_CARD_CHARS);
    const light = fitted(inflated);
    expect(JSON.stringify(light).length).toBeLessThanOrEqual(MAX_CARD_CHARS);
    expect(light.line.length).toBeLessThanOrEqual(200);
    expect(light.previous?.line).toHaveLength(100);
    // A card light enough goes out as it is.
    const small = route(answerCardOf(...input('propose_hike', proposal())));
    expect(fitted(small)).toBe(small);
  });

  it('ASTCARD-TOUR-013: lightened to its last step, a route keeps its hardest grades, the end of the way too', () => {
    const sac = (fromM: number, step: number): TourRouteStretch => ({ facet: 'sac', fromM, toM: fromM + 5, step });
    const easy = Array.from({ length: 60 }, (_, i) => sac(i * 10, 1));
    const hard = Array.from({ length: 20 }, (_, i) => sac(600 + i * 10, 5));
    const kept = hardestStretches([...easy, ...hard], 40);
    expect(kept).toHaveLength(40);
    expect(kept.filter((stretch) => stretch.facet === 'sac' && stretch.step === 5)).toHaveLength(20);
    // The easy ones kept are the first, and all of them lie in their order along the way.
    expect(kept.slice(0, 20)).toEqual(easy.slice(0, 20));
    const starts = kept.map((stretch) => stretch.fromM);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(hardestStretches(easy.slice(0, 3), 40)).toEqual(easy.slice(0, 3));
  });
});

/** What get_tour_plan answers for a saved hike up to a hut that ends a stage. */
function savedPlan(extra: Record<string, unknown> = {}) {
  return {
    tour: {
      place_id: 61,
      name: 'Hut walk',
      tour_type: 'hike',
      distance: 1.112,
      elevation_gain: 80,
      elevation_loss: 0,
      duration: 25,
      planned_duration_minutes: null,
      max_hiking_difficulty: 2,
      stage_count: 2,
      website: 'https://example.com/hut',
    },
    waypoints: [
      { lat: 47.6, lng: 11.3, role: 'start', sequence: 0, name: 'Car park' },
      { lat: 47.605, lng: 11.3, role: 'via', sequence: 1, shaping: true },
      {
        lat: 47.61,
        lng: 11.3,
        role: 'end',
        sequence: 2,
        linked_place_id: 12,
        linked_place_name: 'Hut',
        stage_end: true,
      },
    ],
    line: { point_count: 900, has_heights: true, preview: [at(0), at(1), at(2)] },
    ...extra,
  };
}

describe('the card of a saved tour', () => {
  it('ASTCARD-TOUR-009: draws the saved line in brief with its points placed and timed along it', () => {
    const shown = route(answerCardOf(...input('get_tour_plan', savedPlan(), { placeId: 61 })));
    expect(shown).toMatchObject({
      source: 'saved',
      activity: 'hike',
      placeId: 61,
      name: 'Hut walk',
      distanceM: 1112,
      ascentM: 80,
      minEleM: 800,
      maxEleM: 880,
      minutes: 25,
      minutesBasis: 'planned',
      limit: 2,
      routed: true,
      stages: 2,
      schedule: null,
      grades: null,
    });
    expect(shown.stops.map((stop) => [stop.role, stop.name, stop.atM, stop.minutes, stop.stageEnd])).toEqual([
      ['start', 'Car park', 0, 0, false],
      ['end', 'Hut', 1112, 25, true],
    ]);
    expect(JSON.stringify(shown)).not.toContain('http');
  });

  it('ASTCARD-TOUR-010: a loop ends at the end of its line, not at its first pass', () => {
    const loop = savedPlan({
      waypoints: [
        { lat: 47.6, lng: 11.3, role: 'start', name: 'Car park' },
        { lat: 47.61, lng: 11.3, role: 'via', name: 'Top' },
        { lat: 47.6, lng: 11.3, role: 'end', name: 'Car park' },
      ],
      line: { preview: [at(0), at(1), at(2), at(1), at(0)] },
    });
    const shown = route(answerCardOf(...input('get_tour_plan', loop, { placeId: 61 })));
    expect(shown.stops.map((stop) => [stop.role, stop.atM])).toEqual([
      ['start', 0],
      ['via', 1112],
      ['end', 2224],
    ]);
  });

  it('ASTCARD-TOUR-011: a city walk still waiting for its way shows its stations straight, placed and masked', () => {
    const walk = savedPlan({
      tour: { place_id: 62, name: 'Old town', tour_type: 'walk', distance: null, duration: null },
      waypoints: [
        { lat: 48.137, lng: 11.575, role: 'start', key: 'a', name: 'Marienplatz', stay_minutes: 0 },
        { lat: 48.14, lng: 11.58, role: 'end', key: 'b', name: 'Hofgarten, ask desk@hof.test', stay_minutes: 30 },
      ],
      line: null,
    });
    const shown = route(answerCardOf(...input('get_tour_plan', walk, { placeId: 62 })));
    expect(shown).toMatchObject({
      activity: 'walk',
      routed: false,
      problem: { why: 'not_planned' },
      minutes: null,
      minutesBasis: null,
    });
    // Placed along the straight line between them (about 499 m), not all at its start.
    expect(shown.stops.map((stop) => [stop.kind, stop.stayMinutes, stop.minutes, stop.atM])).toEqual([
      ['station', 0, null, 0],
      ['station', 30, null, 499],
    ]);
    expect(shown.stops[1]?.name).toBe('Hofgarten, ask [hidden]');
    expect(JSON.stringify(shown)).not.toContain('desk@hof.test');
  });

  it('ASTCARD-TOUR-012: a tour of a type this build does not know, or without its place, has no card', () => {
    const canoe = savedPlan({ tour: { place_id: 61, tour_type: 'canoe' } });
    expect(answerCardOf(...input('get_tour_plan', canoe))).toBeNull();
    expect(answerCardOf(...input('get_tour_plan', savedPlan({ tour: { tour_type: 'hike' } })))).toBeNull();
    expect(answerCardOf(...input('get_tour_plan', savedPlan({ line: null, waypoints: [] })))).toBeNull();
  });
});
