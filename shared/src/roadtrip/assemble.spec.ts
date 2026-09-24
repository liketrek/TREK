/**
 * ROADTRIP-ASSEMBLE-001..022: what the assembler does with the model's warnings, and
 * what it tells a surface about the drive between connected days. From 017 on: a booked
 * night seated at both ends of its days (`seatNightBookends`) is one spot overnight,
 * driven to and from like any stop and never between.
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
import type { DayWindow } from './dayWindow';
import { seatNightBookends } from './nightBookends';
import type { PlanDay, RoadtripStop, RoutedLeg, SnappedWaypoint } from './planning-types';
import { standsAsDay } from './roadtripModel';

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

function assemble(stops: RoadtripStop[], legs: number[], window: DayWindow | null = null) {
  const day: PlanDay = { dayId: 1, dayNumber: 1, date: '2026-06-01', title: null, stops };
  const allLegs: Record<string, RoutedLeg> = {};
  legs.forEach((km, i) => {
    allLegs[legKey(stops[i]!, stops[i + 1]!)] = leg(km);
  });
  return assembleRoadtrip({
    plan: [day],
    quietDays: [],
    window,
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

  it('ROADTRIP-ASSEMBLE-015: every leg carries the road it is drawn on, beside its figures', () => {
    // The picker of other ways lists the rail's own road as the current one, and it can only
    // do that with the line of THAT leg. The card's geometry is every leg in one line, and
    // cutting it back apart would be a second measurement that can disagree with the first.
    const routes = assembleTwoDays(false);
    const [first, second] = routes.days;

    expect(first!.legLines).toHaveLength(first!.legs.length);
    expect(first!.legLines).toEqual([
      [
        [50, 10],
        [51, 10],
      ],
      [
        [51, 10],
        [52, 10],
      ],
    ]);
    expect(second!.legLines).toEqual([
      [
        [60, 10],
        [61, 10],
      ],
    ]);
  });

  it('ROADTRIP-ASSEMBLE-016: the drive into a connected day carries its line exactly when it carries its band', () => {
    const joined = assembleTwoDays(true).days[1]!;
    expect(joined.arrivingLeg).toBeDefined();
    expect(joined.arrivingLine).toEqual([
      [52, 10],
      [60, 10],
    ]);
    // It is not one of the card's own legs, so it stays out of theirs.
    expect(joined.legLines).toHaveLength(1);

    const apart = assembleTwoDays(false).days[1]!;
    expect(apart.arrivingLeg).toBeUndefined();
    expect(apart.arrivingLine).toBeUndefined();
  });
});

describe('assembleRoadtrip leave times', () => {
  // 90 km at the 40 seconds a kilometre `leg` drives is an hour.
  const hour = 90;

  it('ROADTRIP-ASSEMBLE-010: a stop left at a set time holds the day until then', () => {
    const stops = [
      stop({ ownerIndex: 0, time: '09:00', dwellMinutes: 0 }),
      stop({ ownerIndex: 1, dwellMinutes: 30, leaveAt: '14:00' }),
      stop({ ownerIndex: 2 }),
    ];

    const { schedule } = assemble(stops, [hour, hour]).days[0]!;

    expect(schedule.entries[1]!).toMatchObject({ arrival: '10:00', departure: '14:00' });
    expect(schedule.entries[2]!.arrival).toBe('15:00');
  });

  it('ROADTRIP-ASSEMBLE-011: the plain schedule a conflicting window falls back to still reads it', () => {
    // Leaving at two with an hour to drive cannot make a stop pinned at half past two,
    // which is a conflict for the daily window. The day is then scheduled without it, and
    // that schedule has to keep the departure and report the pin it makes late.
    const stops = [
      stop({ ownerIndex: 0, time: '09:00', dwellMinutes: 0 }),
      stop({ ownerIndex: 1, dwellMinutes: 30, leaveAt: '14:00' }),
      stop({ ownerIndex: 2, time: '14:30' }),
    ];

    const routes = assemble(stops, [hour, hour], { start: 480, end: 1200 });

    expect(routes.dayWindowIssue).toBe('conflict');
    const { schedule } = routes.days[0]!;
    expect(schedule.entries[1]!).toMatchObject({ arrival: '10:00', departure: '14:00' });
    expect(schedule.warnings).toContainEqual({ index: 2, code: 'late', minutes: 30 });
  });
});

describe('assembleRoadtrip booked nights', () => {
  // 90 km at the 40 seconds a kilometre `leg` drives is an hour.
  const hour = 90;

  it('ROADTRIP-ASSEMBLE-012: a day that is only its booked night stands among the days', () => {
    // The arrival day of a trip: nothing but the hotel, entered under Days with its
    // check-in. It used to be filed under the quiet days at the foot of the rail, which
    // reads as the hotel missing from the road trip altogether.
    const routes = assemble([stop({ ownerIndex: 0, night: true, checkInTime: '15:00', stopType: 'hotel' })], []);

    expect(routes.quietDays).toEqual([]);
    expect(routes.days).toHaveLength(1);
    const day = routes.days[0]!;
    expect(day.legs).toEqual([]);
    expect(day.distance).toBe(0);
    expect(day.schedule.entries[0]!).toMatchObject({ arrival: '15:00', anchored: true });
  });

  it('ROADTRIP-ASSEMBLE-013: a lone stop that is no night stays a quiet day', () => {
    const routes = assemble([stop({ ownerIndex: 0 })], []);

    expect(routes.days).toEqual([]);
    expect(routes.quietDays).toHaveLength(1);
  });

  it('ROADTRIP-ASSEMBLE-014: the check-in holds the night and the day lines up behind it', () => {
    // The day from Discord: two stops without an hour and the night booked for ten,
    // which the drive used to reach at a quarter past twelve. Seated first by the
    // server now, and held at ten by the schedule; the stops follow from there.
    const stops = [
      stop({ ownerIndex: 0, night: true, checkInTime: '10:00', dwellMinutes: 60, stopType: 'hotel' }),
      stop({ ownerIndex: 1, dwellMinutes: 30 }),
      stop({ ownerIndex: 2, dwellMinutes: 60 }),
    ];

    const routes = assemble(stops, [hour, hour]);

    const { schedule } = routes.days[0]!;
    expect(schedule.entries.map((e) => e.arrival)).toEqual(['10:00', '12:00', '13:30']);
    expect(schedule.entries[0]!.anchored).toBe(true);
    expect(schedule.warnings).toEqual([]);
  });
});

describe('assembleRoadtrip nights at a booked hotel', () => {
  // Three nights in one hotel from day 1, places on days 1 and 2, the check-out on day 3
  // with nothing of its own.
  const days = [1, 2, 3].map((id) => ({ id, day_number: id }));
  const hotelStay = {
    id: 5,
    place_id: 900,
    start_day_id: 1,
    end_day_id: 3,
    place_lat: 45,
    place_lng: 7,
    place_name: 'Hotel',
    check_out: '10:00',
    reservation_id: null,
  };
  const checkIn = stop({ ownerIndex: 0, lat: 45, lng: 7, night: true, stopType: 'hotel', checkInTime: '15:00' });
  const stored: PlanDay[] = [
    {
      dayId: 1,
      dayNumber: 1,
      date: '2026-06-01',
      title: null,
      stops: [checkIn, stop({ ownerIndex: 1 }), stop({ ownerIndex: 2 })],
    },
    {
      dayId: 2,
      dayNumber: 2,
      date: '2026-06-02',
      title: null,
      stops: [
        stop({ ownerDayId: 2, ownerIndex: 0, assignmentId: 300, placeId: 400, lat: 60 }),
        stop({ ownerDayId: 2, ownerIndex: 1, assignmentId: 301, placeId: 401, lat: 61 }),
      ],
    },
    { dayId: 3, dayNumber: 3, date: '2026-06-03', title: null, stops: [] },
  ];
  const seated = seatNightBookends(stored, days, [hotelStay]);
  const evening = seated[0]!.stops[3]!;
  const morning = seated[1]!.stops[0]!;
  const hotelKey = stopKey(checkIn);

  function assembleNights(
    options: { connectDays?: boolean; window?: DayWindow | null; snaps?: Record<string, SnappedWaypoint> } = {},
  ) {
    const allLegs: Record<string, RoutedLeg> = {};
    for (const day of seated) {
      day.stops.slice(0, -1).forEach((from, i) => {
        allLegs[legKey(from, day.stops[i + 1]!)] = leg(100);
      });
    }
    // A drive fetched for the hotel and itself some other time: the night is none.
    allLegs[legKey(evening, morning)] = leg(172);
    return assembleRoadtrip({
      plan: seated.filter((d) => standsAsDay(d.stops)),
      quietDays: seated.filter((d) => !standsAsDay(d.stops)),
      window: options.window ?? null,
      distanceUnit: 'metric',
      allLegs,
      snapByDay: options.snaps ? { 1: options.snaps } : {},
      missedByDay: {},
      loading: false,
      limits: { rangeKm: null, legMinutes: null, dayMinutes: null },
      vehicleKind: null,
      connectDays: options.connectDays ?? false,
      boundaries: [],
      labels: { start: 'start', end: 'end' },
    });
  }
  const names = (stops: RoadtripStop[]) => stops.map((s) => s.bookend?.phase ?? s.automaticNight?.phase ?? s.name);

  it('ROADTRIP-ASSEMBLE-017: connected days draw no band, no line and no figure across a night at one hotel', () => {
    const routes = assembleNights({ connectDays: true });
    const second = routes.days[1]!;
    expect(second.arrivingLeg).toBeUndefined();
    expect(second.arrivingLine).toBeUndefined();
    expect(second.arrivingFrom).toBeUndefined();
    // Three legs a day, the drive to the hotel and from it included, and nothing between.
    expect(routes.lines).toHaveLength(6);
    expect(routes.lineJoins).toEqual([false, false, false, false, false, false]);
    expect(routes.segments).toHaveLength(6);
  });

  it('ROADTRIP-ASSEMBLE-018: the drives to and from the hotel count, the hotel is no destination', () => {
    const routes = assembleNights({ connectDays: true });
    expect(routes.days.map((d) => d.distance)).toEqual([300_000, 300_000]);
    expect(routes.totalDistance).toBe(600_000);
    // The four places; the stay's own stop and its bookends are the hotel, which is not counted.
    expect(routes.totalStops).toBe(4);
    // The check-out day with nothing of its own is not driven, and holds no hotel either.
    expect(routes.days.map((d) => d.dayId)).toEqual([1, 2]);
    expect(routes.quietDays.flatMap((d) => d.stops)).toEqual([]);
  });

  it('ROADTRIP-ASSEMBLE-019: a quiet day lists no hotel, even one left alone on it', () => {
    // Where every stop after the morning's hotel went on past midnight, the hotel is all
    // that is left on the card: nothing anybody could move to another day.
    const alone: PlanDay = { ...seated[1]!, stops: [morning] };
    const routes = assembleRoadtrip({
      plan: [alone],
      quietDays: [],
      window: null,
      distanceUnit: 'metric',
      allLegs: {},
      snapByDay: {},
      missedByDay: {},
      loading: false,
      limits: { rangeKm: null, legMinutes: null, dayMinutes: null },
      vehicleKind: null,
      connectDays: false,
      boundaries: [],
      labels: { start: 'start', end: 'end' },
    });
    expect(routes.days).toEqual([]);
    expect(routes.quietDays).toEqual([expect.objectContaining({ dayId: 2, stops: [] })]);
  });

  it('ROADTRIP-ASSEMBLE-020: a day window runs the night at the hotel without a gap and ends the day there', () => {
    const routes = assembleNights({ window: { start: 8 * 60, end: 18 * 60 } });
    expect(routes.dayWindowIssue).toBeNull();
    const [first, second] = routes.days;
    // The drive to the hotel is not cut at 18:00: the night is booked there.
    expect(names(first!.stops)).toEqual(['Stop 0', 'Stop 1', 'Stop 2', 'evening', 'end']);
    expect(first!.stops[4]!).toMatchObject({ lat: 45, lng: 7 });
    expect(first!.stops[4]!.bookend).toBeUndefined();
    expect(names(second!.stops)).toEqual(['start', 'morning', 'Stop 0', 'Stop 1', 'evening']);
    expect(second!.schedule.entries.slice(0, 2).map((e) => e.arrival)).toEqual(['08:00', '08:00']);
  });

  it('ROADTRIP-ASSEMBLE-021: a boundary can only be dragged along a drive between two stored stops', () => {
    const path = assembleNights({ window: { start: 8 * 60, end: 18 * 60 } }).boundaryPath ?? [];
    expect(path.map((p) => [p.from.assignmentId, p.to.assignmentId])).toEqual([
      [100, 101],
      [101, 102],
      [300, 301],
    ]);
  });

  it('ROADTRIP-ASSEMBLE-022: the walk from the road to the hotel is drawn once, however often the days stand there', () => {
    const snap: SnappedWaypoint = { asked: [45, 7], at: [45.001, 7], meters: 110 };
    const routes = assembleNights({ connectDays: true, snaps: { [hotelKey]: snap } });
    expect(routes.accessLines.filter((a) => a.stopKey === hotelKey)).toHaveLength(1);
    // Every stop there still says how far the road is.
    expect(routes.days[1]!.stops[0]!.offRoadMeters).toBe(110);
  });
});
