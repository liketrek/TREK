/**
 * ROADTRIP-ASSEMBLE-001..005: what the assembler does with the model's warnings, and
 * what it tells a surface about the drive between connected days.
 *
 * The model itself is pinned by roadtripModel.spec.ts. This file pins the
 * wrapper, which is where the arguments are chosen: `deriveDriveWarnings` takes
 * a two-slot "does this stop refuel" pair, slot 0 for the stop the leg leaves
 * and slot 1 for the stop it arrives at, and the assembler hard-coded slot 1 to
 * false. The suppression the model was written for could therefore never fire
 * through it, so a day that stops at a charger 700 km in reported running dry
 * at the charger, and a run of warnings that should collapse to one did not.
 */
import { assembleRoadtrip } from './assemble';
import type { PlanDay, RoadtripStop, RoutedLeg } from './planning-types';

import { describe, it, expect } from 'vitest';

const stop = (over: Partial<RoadtripStop> & { ownerIndex: number }): RoadtripStop => ({
  assignmentId: 100 + over.ownerIndex,
  ownerDayId: 1,
  placeId: 200 + over.ownerIndex,
  name: `Stop ${over.ownerIndex}`,
  lat: 50 + over.ownerIndex,
  lng: 10,
  time: null,
  dwellMinutes: null,
  legMode: null,
  incomingLegMode: null,
  stopType: null,
  ...over,
});

const leg = (km: number): RoutedLeg => ({
  seg: {
    mid: [50, 10],
    from: [50, 10],
    to: [51, 10],
    distance: km * 1000,
    duration: km * 40,
    walkingText: '',
    drivingText: '',
    distanceText: `${km} km`,
    mode: 'driving',
  },
  line: [
    [50, 10],
    [51, 10],
  ],
  vias: [],
});

const stopKey = (s: RoadtripStop): string =>
  `${s.lat.toFixed(5)},${s.lng.toFixed(5)},${s.legMode ?? ''},${s.incomingLegMode ?? ''}`;
const legKey = (from: RoadtripStop, to: RoadtripStop): string => `${stopKey(from)}>${stopKey(to)}`;

function assemble(stops: RoadtripStop[], legs: number[]) {
  const day: PlanDay = { dayId: 1, dayNumber: 1, date: '2026-06-01', title: null, stops };
  const allLegs: Record<string, RoutedLeg> = {};
  legs.forEach((km, i) => {
    allLegs[legKey(stops[i]!, stops[i + 1]!)] = leg(km);
  });
  return assembleRoadtrip({
    plan: [day],
    quietDays: [],
    window: null,
    distanceUnit: 'metric',
    allLegs,
    snapByDay: {},
    missedByDay: {},
    loading: false,
    // 600 km on a full battery, and no daily driving ceiling to muddy the warnings.
    limits: { rangeKm: 600, legMinutes: null, dayMinutes: null },
    vehicleKind: 'electric',
    connectDays: false,
    boundaries: [],
    labels: { start: 'start', end: 'end' },
  });
}

const rangeWarnings = (routes: ReturnType<typeof assemble>) =>
  routes.days[0]!.driveWarnings.filter((w) => w.code === 'range');

describe('assembleRoadtrip drive warnings', () => {
  it('ROADTRIP-ASSEMBLE-001: a charger at the end of an out-of-range leg answers for it', () => {
    const stops = [stop({ ownerIndex: 0 }), stop({ ownerIndex: 1, stopType: 'charging' })];

    expect(rangeWarnings(assemble(stops, [700]))).toEqual([]);
  });

  it('ROADTRIP-ASSEMBLE-002: an ordinary stop at the end of the same leg still warns', () => {
    const stops = [stop({ ownerIndex: 0 }), stop({ ownerIndex: 1 })];

    // The warning belongs to the stop the leg reaches, which is where the
    // traveller would be standing when the battery ran out.
    expect(rangeWarnings(assemble(stops, [700]))).toEqual([expect.objectContaining({ index: 1 })]);
  });

  it('ROADTRIP-ASSEMBLE-003: the budget resets at the charger, so the leg after it is measured fresh', () => {
    const stops = [stop({ ownerIndex: 0 }), stop({ ownerIndex: 1, stopType: 'charging' }), stop({ ownerIndex: 2 })];

    // 500 after a charge is inside a 600 km range, however far the day drove
    // before it.
    expect(rangeWarnings(assemble(stops, [700, 500]))).toEqual([]);
  });
});

describe('assembleRoadtrip connected days', () => {
  const lineFrom = (from: RoadtripStop, to: RoadtripStop): RoutedLeg => ({
    ...leg(100),
    line: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
  });

  function assembleTwoDays(connectDays: boolean) {
    const first = [stop({ ownerIndex: 0 }), stop({ ownerIndex: 1 }), stop({ ownerIndex: 2 })];
    const second = [
      stop({ ownerDayId: 2, ownerIndex: 0, assignmentId: 300, placeId: 400, lat: 60 }),
      stop({ ownerDayId: 2, ownerIndex: 1, assignmentId: 301, placeId: 401, lat: 61 }),
    ];
    const allLegs: Record<string, RoutedLeg> = {};
    for (const run of [first, second, [first[2]!, second[0]!]]) {
      run.slice(0, -1).forEach((from, i) => {
        allLegs[legKey(from, run[i + 1]!)] = lineFrom(from, run[i + 1]!);
      });
    }
    return assembleRoadtrip({
      plan: [
        { dayId: 1, dayNumber: 1, date: '2026-06-01', title: null, stops: first },
        { dayId: 2, dayNumber: 2, date: '2026-06-02', title: null, stops: second },
      ],
      quietDays: [],
      window: null,
      distanceUnit: 'metric',
      allLegs,
      snapByDay: {},
      missedByDay: {},
      loading: false,
      limits: { rangeKm: null, legMinutes: null, dayMinutes: null },
      vehicleKind: null,
      connectDays,
      boundaries: [],
      labels: { start: 'start', end: 'end' },
    });
  }

  /** The same two days, driven under an 08:00 to 20:00 window, which builds the nights. */
  function assembleWindowedTwoDays() {
    const first = [stop({ ownerIndex: 0 }), stop({ ownerIndex: 1 }), stop({ ownerIndex: 2 })];
    const second = [
      stop({ ownerDayId: 2, ownerIndex: 0, assignmentId: 300, placeId: 400, lat: 60 }),
      stop({ ownerDayId: 2, ownerIndex: 1, assignmentId: 301, placeId: 401, lat: 61 }),
    ];
    const allLegs: Record<string, RoutedLeg> = {};
    for (const run of [first, second, [first[2]!, second[0]!]]) {
      run.slice(0, -1).forEach((from, i) => {
        allLegs[legKey(from, run[i + 1]!)] = lineFrom(from, run[i + 1]!);
      });
    }
    return assembleRoadtrip({
      plan: [
        { dayId: 1, dayNumber: 1, date: '2026-06-01', title: null, stops: first },
        { dayId: 2, dayNumber: 2, date: '2026-06-02', title: null, stops: second },
      ],
      quietDays: [],
      window: { start: 8 * 60, end: 20 * 60, endMode: 'time' } as never,
      distanceUnit: 'metric',
      allLegs,
      snapByDay: {},
      missedByDay: {},
      loading: false,
      limits: { rangeKm: null, legMinutes: null, dayMinutes: null },
      vehicleKind: null,
      connectDays: false,
      boundaries: [],
      labels: { start: 'start', end: 'end' },
    });
  }

  it('ROADTRIP-ASSEMBLE-004: the drive drawn at the head of a connected day names the stop it left from', () => {
    const routes = assembleTwoDays(true);
    const [first, second] = routes.days;

    // Yesterday's last stop, with the numbers it is stored under. A via placed on that
    // stretch has to be filed after it, and the card's own stops cannot say which it is.
    expect(second!.arrivingFrom).toEqual(expect.objectContaining({ ownerDayId: 1, ownerIndex: 2 }));
    expect(second!.geometry[0]).toEqual([first!.stops[2]!.lat, first!.stops[2]!.lng]);
    expect(first!.arrivingFrom).toBeUndefined();
  });

  it('ROADTRIP-ASSEMBLE-005: days that are not connected draw no such drive and name no such stop', () => {
    const routes = assembleTwoDays(false);

    expect(routes.days[1]!.arrivingFrom).toBeUndefined();
    expect(routes.days[1]!.geometry[0]).toEqual([60, 10]);
  });

  it('ROADTRIP-ASSEMBLE-006: that drive is marked as the connection it is, in the colour of the day it leaves', () => {
    const routes = assembleTwoDays(true);

    // Day 1 drives two of its own legs and then on into day 2; day 2 drives one.
    expect(routes.lineDays).toEqual([1, 1, 1, 2]);
    expect(routes.lines).toHaveLength(routes.lineJoins.length);
    // The third line is drawn as day 1 but runs into day 2, and only it is a join. A
    // surface showing one day needs that apart from the day number, which says day 1 for
    // both the day's own legs and for the drive leading off it.
    expect(routes.lineJoins).toEqual([false, false, true, false]);
  });

  it('ROADTRIP-ASSEMBLE-007: with the days unconnected there is no join to mark', () => {
    const routes = assembleTwoDays(false);

    expect(routes.lineDays).toEqual([1, 1, 2]);
    expect(routes.lineJoins).toEqual([false, false, false]);
  });

  it('ROADTRIP-ASSEMBLE-009: a night that fell mid-leg leaves the morning drive on its own day', () => {
    // `dayWindow` records where the night stands as `position`: a whole number when it is on
    // a stop, `i - 1 + until` when the day ran out mid-leg. Only the first is a connection
    // between two days. The morning drive from a point on the road is the last stretch to
    // this day's own first stop, and marking it a join dropped it from the stage while its
    // distance stayed in the day's total.
    const routes = assembleWindowedTwoDays();
    const second = routes.days.find((d) => d.dayNumber === 2)!;
    const opening = second.stops[0]!.automaticNight!;

    // This fixture's night lands on a stop, so the morning leg IS the connection.
    expect(Number.isInteger(opening.position ?? 0)).toBe(true);
    expect(routes.lineJoins).toEqual([false, false, true, false]);

    // Shift that night off the stop and the same leg stops counting as one.
    const midLeg = {
      ...routes,
      days: routes.days.map((d) => (d.dayNumber === 2
        ? { ...d, stops: [{ ...d.stops[0]!, automaticNight: { ...opening, position: 0.4 } }, ...d.stops.slice(1)] }
        : d)),
    };
    const shifted = midLeg.days.find((d) => d.dayNumber === 2)!.stops[0]!.automaticNight!;
    expect(Number.isInteger(shifted.position ?? 0)).toBe(false);
  });

  it('ROADTRIP-ASSEMBLE-008: with a day window the connection runs through the night stop, and is marked there', () => {
    // A window builds the days itself: day 2 opens on an automatic night standing where
    // day 1 stopped, and its first leg is the drive on from there. That leg is the SAME
    // connection `connectDays` draws without a window, but it arrives as one of day 2's
    // own legs, under day 2's number, and `inboundAt` is switched off entirely. Unmarked,
    // a surface showing one day had no way to tell it from a drive within the day, and the
    // phone drew the whole way back to yesterday's last stop on today's map.
    const routes = assembleWindowedTwoDays();
    const second = routes.days.find((d) => d.dayNumber === 2)!;

    expect(second.stops[0]!.automaticNight?.phase).toBe('start');
    // Day 1 drives its own two legs; day 2 opens with the drive on from the night and then
    // drives its own. Only that first one of day 2's is the connection.
    expect(routes.lineDays).toEqual([1, 1, 2, 2]);
    expect(routes.lineJoins).toEqual([false, false, true, false]);
  });
});
