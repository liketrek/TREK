import { storedTrekCardSchema, trekCardSchema } from './index';
import { TOUR_LIST_ROWS, tourListCardSchema } from './tour-list.card';
import { TOUR_ROUTE_LIMITS, tourRouteCardSchema, type TourRouteCard, type TourRouteStop } from './tour-route.card';

import { describe, expect, it } from 'vitest';

function stop(atM: number, extra: Partial<TourRouteStop> = {}): TourRouteStop {
  return {
    role: 'via',
    kind: null,
    name: null,
    lat: 47.6,
    lng: 11.3,
    atM,
    offM: null,
    minutes: null,
    clock: null,
    stayMinutes: null,
    stageEnd: false,
    flag: null,
    ...extra,
  };
}

/** A routed hike with every part filled once. */
function hike(extra: Partial<TourRouteCard> = {}): TourRouteCard {
  return {
    kind: 'tourRoute',
    source: 'proposal',
    activity: 'hike',
    placeId: null,
    name: 'Hochfelln from Bergen',
    label: 'short and steep',
    distanceM: 8200,
    ascentM: 640,
    descentM: 640,
    minEleM: 560,
    maxEleM: 1670,
    minutes: 200,
    minutesBasis: 'din33466',
    limit: 3,
    grades: { highest: 3, unknownShare: 0.2 },
    routed: true,
    problem: null,
    line: [
      [47.6, 11.3, 560],
      [47.61, 11.31, 1670],
    ],
    stretches: [{ facet: 'sac', fromM: 0, toM: 4000, step: 3 }],
    stops: [stop(0, { role: 'start', clock: '08:00' }), stop(4100, { role: 'end', kind: 'peak', name: 'Hochfelln' })],
    stages: null,
    skiScheme: null,
    schedule: {
      date: '2026-10-14',
      dayId: 31,
      dayNumber: 2,
      start: '08:00',
      arrive: '11:20',
      nextDay: false,
      sunrise: '06:58',
      sunset: '18:41',
      latestStart: null,
      weather: 'forecast',
      hours: [{ hour: 8, main: 'Clear', tempC: 12, rainPct: null, windKmh: 10 }],
    },
    warnings: [{ kind: 'thunder', at: '11:00', count: null }],
    previous: null,
    ...extra,
  };
}

describe('tourRouteCardSchema', () => {
  it('TOURCARD-001: a routed hike parses and joins the card union', () => {
    expect(tourRouteCardSchema.safeParse(hike()).success).toBe(true);
    expect(trekCardSchema.safeParse(hike()).success).toBe(true);
  });

  it('TOURCARD-002: refuses a line, stops or stretches past their bounds', () => {
    const point: [number, number, number | null] = [47.6, 11.3, null];
    const line = Array.from({ length: TOUR_ROUTE_LIMITS.line + 1 }, () => point);
    expect(tourRouteCardSchema.safeParse(hike({ line })).success).toBe(false);
    const stops = Array.from({ length: TOUR_ROUTE_LIMITS.stops + TOUR_ROUTE_LIMITS.along + 1 }, (_, i) => stop(i));
    expect(tourRouteCardSchema.safeParse(hike({ stops })).success).toBe(false);
    const stretches = Array.from({ length: TOUR_ROUTE_LIMITS.stretches + 1 }, (_, i) => ({
      facet: 'sac' as const,
      fromM: i,
      toM: i + 1,
      step: 2,
    }));
    expect(tourRouteCardSchema.safeParse(hike({ stretches })).success).toBe(false);
    // At the bounds it still parses.
    expect(tourRouteCardSchema.safeParse(hike({ line: line.slice(1), stops: stops.slice(1) })).success).toBe(true);
  });

  it('TOURCARD-003: an unknown facet, problem or stop kind fails, a height with decimals too', () => {
    const odd = { facet: 'colour', fromM: 0, toM: 1 } as unknown as TourRouteCard['stretches'][number];
    expect(tourRouteCardSchema.safeParse(hike({ stretches: [odd] })).success).toBe(false);
    const why = { why: 'weird', position: null, snappedM: null } as unknown as TourRouteCard['problem'];
    expect(tourRouteCardSchema.safeParse(hike({ problem: why })).success).toBe(false);
    const kind = stop(0, { kind: 'castle' as unknown as TourRouteStop['kind'] });
    expect(tourRouteCardSchema.safeParse(hike({ stops: [kind] })).success).toBe(false);
    expect(tourRouteCardSchema.safeParse(hike({ line: [[47.6, 11.3, 560.5]] })).success).toBe(false);
  });

  it('TOURCARD-004: a straight card without figures parses, as a held change planned on apply', () => {
    const straight = hike({
      source: 'pending',
      label: null,
      distanceM: null,
      ascentM: null,
      descentM: null,
      minEleM: null,
      maxEleM: null,
      minutes: null,
      minutesBasis: null,
      grades: null,
      routed: false,
      problem: { why: 'not_planned', position: null, snappedM: null },
      line: [
        [47.6, 11.3, null],
        [47.61, 11.31, null],
      ],
      stretches: [],
      schedule: null,
      warnings: [],
    });
    expect(tourRouteCardSchema.safeParse(straight).success).toBe(true);
  });

  it('TOURCARD-005: ski stretches, marks, a failed-legs warning and the line before a change parse', () => {
    const ski = hike({
      activity: 'ski',
      source: 'plan',
      skiScheme: 'north_america',
      stretches: [
        { facet: 'ski', fromM: 0, toM: 900, kind: 'run', difficulty: 'intermediate' },
        { facet: 'mark', fromM: 900, toM: 1500, kind: 'lift' },
      ],
      warnings: [{ kind: 'legs_failed', at: null, count: 2 }],
      previous: {
        line: [
          [47.6, 11.3],
          [47.62, 11.32],
        ],
        distanceM: 9000,
        ascentM: null,
        minutes: 210,
      },
    });
    expect(tourRouteCardSchema.safeParse(ski).success).toBe(true);
  });

  it('TOURCARD-006: extra keys are dropped on read, a broken card reads as null', () => {
    const parsed = storedTrekCardSchema.parse({ ...hike(), later: 'field' });
    expect(parsed).not.toHaveProperty('later');
    expect(storedTrekCardSchema.parse({ ...hike(), routed: 'yes' })).toBeNull();
  });
});

describe('tourRouteCardSchema: bike tours and runs', () => {
  it('TOURCARD-008: a bike tour or a run names its profile, a run its pace; a card drawn before reads without both', () => {
    const bike = hike({
      activity: 'bike',
      routingProfile: 'gravel',
      minutesBasis: 'router',
      limit: null,
      grades: null,
    });
    expect(tourRouteCardSchema.parse(bike).routingProfile).toBe('gravel');
    const run = hike({ activity: 'run', routingProfile: 'trail', minutesBasis: 'pace', paceSecondsPerKm: 330 });
    expect(tourRouteCardSchema.parse(run).paceSecondsPerKm).toBe(330);
    expect(tourRouteCardSchema.parse(hike()).routingProfile).toBeUndefined();
    expect(tourRouteCardSchema.safeParse(hike({ routingProfile: 'tandem' as never })).success).toBe(false);
    expect(tourRouteCardSchema.safeParse(hike({ paceSecondsPerKm: 5 })).success).toBe(false);
  });
});

describe('tourListCardSchema', () => {
  const row = {
    placeId: 61,
    name: 'Herzogstand',
    activity: 'hike' as const,
    limit: 2,
    distanceM: 9800,
    ascentM: 520,
    minutes: 225,
    stages: null,
    days: [2],
  };

  it('TOURCARD-007: a list parses with one to twelve rows, not none and not more', () => {
    expect(tourListCardSchema.safeParse({ kind: 'tourList', dayId: null, more: 0, rows: [row] }).success).toBe(true);
    expect(tourListCardSchema.safeParse({ kind: 'tourList', dayId: 31, more: 0, rows: [] }).success).toBe(false);
    const rows = Array.from({ length: TOUR_LIST_ROWS + 1 }, () => row);
    expect(tourListCardSchema.safeParse({ kind: 'tourList', dayId: null, more: 0, rows }).success).toBe(false);
  });
});
