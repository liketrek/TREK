import { dayWindow, planDayWindow, roadtripInsertion } from './dayWindow';
import type { RoadtripStop, RoutedLeg } from './planning-types';

import { describe, expect, it } from 'vitest';

const hours = { start: 480, end: 1080 };
const labels = { start: 'Continue', end: 'End of day' };
const stop = (id: number, patch: Partial<RoadtripStop> = {}): RoadtripStop => ({
  assignmentId: id,
  placeId: id,
  ownerDayId: 1,
  ownerIndex: id - 1,
  lat: 0,
  lng: id - 1,
  name: `Stop ${id}`,
  time: null,
  dwellMinutes: 0,
  legMode: null,
  incomingLegMode: null,
  stopType: null,
  ...patch,
});
const day = (number: number, stops: RoadtripStop[] = []) => ({
  dayId: number,
  dayNumber: number,
  date: `2026-09-${String(number + 10).padStart(2, '0')}`,
  title: null,
  stops,
});
const leg = (minutes: number, from: RoadtripStop, to: RoadtripStop): RoutedLeg => ({
  line: [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ],
  vias: [],
  seg: {
    from: [from.lat, from.lng],
    to: [to.lat, to.lng],
    mid: [0, (from.lng + to.lng) / 2],
    distance: minutes * 1000,
    duration: minutes * 60,
    mode: 'driving',
    distanceText: '',
    drivingText: '',
    walkingText: '',
  },
});
const calculate = (stops: RoadtripStop[], minutes: number[] = [720], extra = [day(2)]) =>
  planDayWindow(
    [day(1, stops), ...extra],
    hours,
    (a, b) => leg(minutes[stops.indexOf(a)]! ?? 60, a, b),
    'metric',
    labels,
  );

describe('daily travel window', () => {
  it('pulls an unpinned visit back into day one and ends after its full stay', () => {
    const stops = [stop(1, { time: '07:00' }), stop(2, { dwellMinutes: 90 }), stop(3)];
    const lookup = (a: RoadtripStop, b: RoadtripStop) => leg(720, a, b);
    const automatic = planDayWindow([day(1, stops)], hours, lookup, 'metric', labels);
    expect(automatic.chains[0]!.stops).not.toContain(stops[1]!);
    const manual = planDayWindow([day(1, stops)], hours, lookup, 'metric', labels, [
      { day_number: 1, from_assignment_id: 2, to_assignment_id: null, fraction: 1 },
    ]);
    expect(manual.issue).toBeNull();
    expect(manual.chains[0]!.stops).toContain(stops[1]!);
    expect(manual.chains[0]!.schedule.entries.map((e) => e.arrival)).toEqual(['07:00', '19:00', '20:30']);
    expect(manual.chains[1]!.schedule.entries[0]!.arrival).toBe('08:00');
    expect(stops[0]!.time).toBe('07:00');
  });

  it.each([0.25, 0.9])('moves the cut in either direction and preserves the whole drive (%s)', (fraction) => {
    const stops = [stop(1), stop(2)];
    const manual = planDayWindow([day(1, stops)], hours, (a, b) => leg(720, a, b), 'metric', labels, [
      { day_number: 1, from_assignment_id: 1, to_assignment_id: 2, fraction },
    ]);
    expect(manual.issue).toBeNull();
    const end = manual.chains[0]!.stops[1]!;
    expect(end.lng).toBeCloseTo(fraction);
    expect(end.automaticNight).toMatchObject({ manual: true, position: fraction });
    const start = manual.chains[1]!.stops[0]!;
    expect(manual.legFor(stops[0]!, end)!.seg.duration + manual.legFor(start, stops[1]!)!.seg.duration).toBeCloseTo(
      720 * 60,
    );
  });

  it('does not pull a visit with a fixed time out of its stored day', () => {
    const pinned = stop(2, { ownerDayId: 2, time: '12:00' });
    const manual = planDayWindow(
      [day(1, [stop(1)]), day(2, [pinned])],
      hours,
      (a, b) => leg(60, a, b),
      'metric',
      labels,
      [{ day_number: 1, from_assignment_id: 2, to_assignment_id: null, fraction: 1 }],
    );
    expect(manual.issue).toBe('conflict');
    expect(pinned.time).toBe('12:00');
  });

  it('rejects crossed or disconnected manual boundaries', () => {
    const stops = [stop(1), stop(2), stop(3)];
    for (const boundaries of [
      [{ day_number: 1, from_assignment_id: 1, to_assignment_id: 3, fraction: 0.5 }],
      [
        { day_number: 1, from_assignment_id: 3, to_assignment_id: null, fraction: 1 },
        { day_number: 2, from_assignment_id: 2, to_assignment_id: null, fraction: 1 },
      ],
    ])
      expect(planDayWindow([day(1, stops)], hours, (a, b) => leg(60, a, b), 'metric', labels, boundaries).issue).toBe(
        'conflict',
      );
  });

  it('mixes an explicit stop end with automatic cuts on later drives', () => {
    const visited = stop(2, { endDay: true, dwellMinutes: 60 });
    const planned = calculate([stop(1), visited, stop(3)], [120, 720], []);
    expect(planned.issue).toBeNull();
    expect(planned.chains.map((d) => d.schedule.entries.map((e) => e.arrival))).toEqual([
      ['08:00', '10:00', '11:00'],
      ['08:00', '18:00'],
      ['08:00', '10:00'],
    ]);
    expect(planned.chains[0]!.stops[2]!).toMatchObject({ lat: visited.lat, lng: visited.lng });
    expect(visited.endDay).toBe(true);
  });

  it('removing an explicit end restores the automatic schedule without adding a final night', () => {
    const planned = calculate([stop(1), stop(2, { endDay: false }), stop(3, { endDay: true })], [120, 60], []);
    expect(planned.chains).toHaveLength(1);
    expect(planned.chains[0]!.schedule.entries.map((e) => e.arrival)).toEqual(['08:00', '10:00', '11:00']);
  });

  it('keeps manual times when an explicit end would move their day', () => {
    const pinned = stop(2, { time: '12:00' });
    const planned = calculate([stop(1, { endDay: true }), pinned], [60], []);
    expect(planned.issue).toBe('conflict');
    expect(pinned.time).toBe('12:00');
  });

  it('honors an earlier manual arrival on the following stored day', () => {
    const first = stop(1, { endDay: true });
    const next = stop(2, { time: '07:00', ownerDayId: 2 });
    const planned = planDayWindow([day(1, [first]), day(2, [next])], hours, (a, b) => leg(60, a, b), 'metric', labels);
    expect(planned.issue).toBeNull();
    expect(planned.chains[1]!.schedule.entries.map((e) => e.arrival)).toEqual(['06:00', '07:00']);
    expect(next.time).toBe('07:00');
  });

  it('requires two valid increasing HH:mm values', () => {
    expect(dayWindow('08:00', '18:00')).toEqual(hours);
    expect(dayWindow('00:00', '00:01')).toEqual({ start: 0, end: 1 });
    for (const pair of [
      [null, '18:00'],
      ['08:00', ''],
      ['8:00', '18:00'],
      ['24:00', '25:00'],
      ['18:00', '08:00'],
      ['08:00', '08:00'],
      [800, 1800],
    ]) {
      expect(dayWindow(...(pair as [unknown, unknown]))).toBeNull();
    }
  });

  it('splits the drive at day end and resumes at the same point next morning', () => {
    const first = stop(1);
    const last = stop(2, { lng: 12 });
    const planned = calculate([first, last]);
    expect(planned.issue).toBeNull();
    const today = planned.chains[0]!;
    const tomorrow = planned.chains[1]!;
    const end = today.stops[1]!;
    const start = tomorrow.stops[0]!;
    expect(today.schedule.entries[0]!.arrival).toBe('08:00');
    expect(today.schedule.entries[1]!.arrival).toBe('18:00');
    expect(end.lng).toBeCloseTo(10);
    expect([start.lat, start.lng]).toEqual([end.lat, end.lng]);
    expect(tomorrow.schedule.entries.map((e) => e.arrival)).toEqual(['08:00', '10:00']);
    expect(tomorrow.stops[1]!).toBe(last);
    expect(tomorrow.spills[0]!).toMatchObject({ automatic: true, fromDayNumber: 1, at: 1 });
    const before = planned.legFor(first, end)!;
    const after = planned.legFor(start, last)!;
    expect(before.seg.duration + after.seg.duration).toBe(720 * 60);
    expect(before.seg.distance + after.seg.distance).toBe(720000);
    expect(before.line[before.line.length - 1]!).toEqual(after.line[0]!);
    expect(first.time).toBeNull();
    expect(last.ownerDayId).toBe(1);
  });

  it('ends at the last visited place after its stay when the next drive will not fit', () => {
    const first = stop(1);
    const visited = stop(2, { dwellMinutes: 60 });
    const next = stop(3);
    const route = [first, visited, next];
    const lookup = (a: RoadtripStop, b: RoadtripStop) => leg(a === first ? 480 : 120, a, b);
    const planned = planDayWindow([day(1, route)], { ...hours, endMode: 'stop' }, lookup, 'metric', labels);
    expect(planned.issue).toBeNull();
    expect(planned.chains[0]!.schedule.entries.map((e) => e.arrival)).toEqual(['08:00', '16:00', '17:00']);
    expect(planned.chains[0]!.stops[2]!).toMatchObject({ lat: visited.lat, lng: visited.lng });
    expect(planned.chains[1]!.schedule.entries.map((e) => e.arrival)).toEqual(['08:00', '10:00']);
    expect(planned.legFor(planned.chains[1]!.stops[0]!, next)?.seg.duration).toBe(7200);
    expect(visited.dwellMinutes).toBe(60);
    expect(next.ownerDayId).toBe(1);
    const alongRoute = planDayWindow([day(1, route)], hours, lookup, 'metric', labels);
    expect(alongRoute.chains[0]!.schedule.entries[2]!.arrival).toBe('18:00');
    expect(alongRoute.chains[1]!.schedule.entries[1]!.arrival).toBe('09:00');
  });

  it('reaches a last place exactly at the cutoff and still respects manual times', () => {
    const first = stop(1, { time: '07:00' });
    const next = stop(2);
    const calculateAtStop = (minutes: number) =>
      planDayWindow(
        [day(1, [first, next])],
        { ...hours, endMode: 'stop' },
        (a, b) => leg(minutes, a, b),
        'metric',
        labels,
      );
    expect(calculateAtStop(660).chains[0]!.schedule.entries.map((e) => e.arrival)).toEqual(['07:00', '18:00']);
    next.time = '19:00';
    expect(calculateAtStop(720).chains[0]!.schedule.entries.map((e) => e.arrival)).toEqual(['07:00', '19:00']);
    expect(first.time).toBe('07:00');
  });

  it('reports an indivisible drive that cannot fit rather than adding endless empty days', () => {
    const planned = planDayWindow(
      [day(1, [stop(1), stop(2)])],
      { ...hours, endMode: 'stop' },
      (a, b) => leg(720, a, b),
      'metric',
      labels,
    );
    expect(planned.issue).toBe('legTooLong');
    expect(planned.chains).toEqual([]);
    expect(dayWindow('08:00', '18:00', 'stop')).toEqual({ ...hours, endMode: 'stop' });
    expect(dayWindow('08:00', '18:00', 'unknown')).toEqual(hours);
  });

  it('starts at a manually pinned 07:00 despite an automatic 08:00 start', () => {
    const first = stop(1, { time: '07:00' });
    const planned = calculate([first, stop(2, { lng: 12 })]);
    expect(planned.chains[0]!.schedule.entries[0]!).toMatchObject({ arrival: '07:00', anchored: true });
    expect(planned.chains[0]!.stops[1]!.lng).toBeCloseTo(11);
    expect(planned.chains[1]!.schedule.entries[1]!.arrival).toBe('09:00');
    expect(first.time).toBe('07:00');
  });

  it('accounts for stays and recalculates the pause position without mutating places', () => {
    const first = stop(1, { dwellMinutes: 120 });
    const destination = stop(2, { lng: 12 });
    const planned = calculate([first, destination]);
    expect(planned.chains[0]!.stops[1]!.lng).toBeCloseTo(8);
    expect(planned.chains[1]!.schedule.entries[1]!.arrival).toBe('12:00');
    const shortened = calculate([{ ...first, dwellMinutes: 0 }, destination]);
    expect(shortened.chains[0]!.stops[1]!.lng).toBeCloseTo(10);
    const shortDrive = calculate([first, destination], [120]);
    expect(shortDrive.chains.flatMap((d) => d.stops).some((s) => s.automaticNight)).toBe(false);
    expect(first.dwellMinutes).toBe(120);
  });

  it('does not move an arrival exactly at day end to tomorrow', () => {
    const last = stop(2);
    const planned = calculate([stop(1), last], [600]);
    expect(planned.chains[0]!.stops).toHaveLength(2);
    expect(planned.chains[0]!.schedule.entries[1]!.arrival).toBe('18:00');
    expect(planned.chains[1]!.stops).toEqual([]);
  });

  it('continues across multiple nights and creates preview dates beyond the trip', () => {
    const planned = calculate([stop(1), stop(2, { lng: 30 })], [1800], []);
    expect(planned.chains.map((d) => d.date)).toEqual(['2026-09-11', '2026-09-12', '2026-09-13']);
    expect(planned.chains[2]!.schedule.entries[1]!.arrival).toBe('18:00');
    expect(planned.chains[2]!.dayId).toBeLessThan(0);
    expect(planned.chains.flatMap((d) => d.stops).filter((s) => !s.automaticNight)).toHaveLength(2);
  });

  it('keeps fixed appointments and reports an impossible schedule without partial relocation', () => {
    const fixed = stop(2, { time: '10:00' });
    const impossible = calculate([stop(1), fixed], [180]);
    expect(impossible.issue).toBe('conflict');
    expect(impossible.chains).toEqual([]);
    expect(fixed.time).toBe('10:00');
    const possible = calculate([stop(1), fixed], [60]);
    expect(possible.chains[0]!.schedule.entries[1]!).toMatchObject({ arrival: '10:00', anchored: true });
  });

  it('allows a manual late appointment to override the automatic end', () => {
    const fixed = stop(2, { time: '19:00' });
    const planned = calculate([stop(1), fixed], [660]);
    expect(planned.issue).toBeNull();
    expect(planned.chains[0]!.schedule.entries[1]!.arrival).toBe('19:00');
    expect(planned.chains[0]!.stops).toHaveLength(2);
  });

  it('keeps a pinned next-day start at 07:00 and leaves the pause point early enough', () => {
    const a = stop(1);
    const b = stop(2, { ownerDayId: 2, ownerIndex: 0, time: '07:00' });
    const planned = planDayWindow([day(1, [a]), day(2, [b])], hours, (from, to) => leg(60, from, to), 'metric', labels);
    expect(planned.issue).toBeNull();
    expect(planned.chains[1]!.schedule.entries.map((e) => e.arrival)).toEqual(['06:00', '07:00']);
  });

  it('does not silently move a fixed appointment onto a later date after a previous spill', () => {
    const planned = calculate([stop(1), stop(2), stop(3, { time: '17:00' })], [720, 60]);
    expect(planned.issue).toBe('conflict');
  });

  it('pauses a long visit at its location and carries the remaining stay into tomorrow', () => {
    const first = stop(1, { dwellMinutes: 660 });
    const planned = calculate([first, stop(2)], [60]);
    expect(planned.chains[0]!.stops[1]!).toMatchObject({ lat: first.lat, lng: first.lng });
    expect(planned.chains[0]!.schedule.entries[0]!.departure).toBe('18:00');
    expect(planned.chains[1]!.schedule.entries[0]!.departure).toBe('09:00');
    expect(planned.chains[1]!.schedule.entries[1]!.arrival).toBe('10:00');
    expect(first.dwellMinutes).toBe(660);
  });

  it('does not place a night pause halfway through a ferry crossing', () => {
    const a = stop(1);
    const b = stop(2);
    const ferry = leg(720, a, b);
    ferry.seg.mode = 'ferry';
    const planned = planDayWindow([day(1, [a, b])], hours, () => ferry, 'metric', labels);
    expect(planned.chains[0]!.stops).toHaveLength(2);
    expect(planned.chains[0]!.schedule.entries[1]!.arrival).toBe('20:00');
  });

  it('does not invent times or points for missing routes', () => {
    const planned = planDayWindow([day(1, [stop(1), stop(2)])], hours, () => undefined, 'metric', labels);
    expect(planned.issue).toBe('incomplete');
    expect(planned.chains).toEqual([]);
    expect(planDayWindow([], hours, () => undefined, 'metric', labels).chains).toEqual([]);
  });

  it('bounds extreme driving and stay durations', () => {
    expect(calculate([stop(1), stop(2)], [600 * 367]).issue).toBe('tooLong');
    expect(calculate([stop(1, { dwellMinutes: 600 * 367 }), stop(2)], [1]).issue).toBe('tooLong');
  });

  it('maps insertions on generated days back to real stored stops', () => {
    const planned = calculate([stop(1), stop(2)]);
    expect(roadtripInsertion(planned.chains[1]!, 0)).toEqual({ dayId: 1, position: 1 });
    expect(roadtripInsertion(planned.chains[1]!, 1)).toEqual({ dayId: 1, position: 1 });
    expect(roadtripInsertion({ stops: [] }, 0)).toBeNull();
    expect(roadtripInsertion(planned.chains[1]!, 2)).toEqual({ dayId: 1, position: 2 });
  });

  it('rounds fractional route minutes across the hour boundary', () => {
    const planned = calculate([stop(1), stop(2)], [59.8]);
    expect(planned.chains[0]!.schedule.entries[1]!.arrival).toBe('09:00');
  });

  it('keeps a zero-distance timed leg at its location when split', () => {
    const a = stop(1);
    const b = stop(2, { lng: a.lng });
    const timed = leg(720, a, b);
    timed.seg.distance = 0;
    timed.line = [];
    const planned = planDayWindow([day(1, [a, b])], hours, () => timed, 'metric', labels);
    expect(planned.issue).toBeNull();
    expect(planned.chains[1]!.stops[0]!).toMatchObject({ lat: a.lat, lng: a.lng });
    expect(planned.chains[1]!.schedule.entries[1]!.arrival).toBe('10:00');
  });
});

describe('booked checkout', () => {
  it('waits at the hotel until noon on the checkout day', () => {
    const hotel = stop(2, { checkoutAt: 2 * 1440 + 720, dwellMinutes: 30 });
    const stops = [stop(1), hotel, stop(3)];
    const plan = calculate(stops, [60, 60]);
    expect(plan.issue).toBeNull();
    expect(plan.chains[0]!.schedule.entries[1]!.arrival).toBe('09:00');
    expect(plan.chains[0]!.schedule.entries[1]!.departure).toBe('12:00');
    expect(plan.chains[1]!.schedule.entries[0]!.arrival).toBe('12:00');
    expect(plan.chains[1]!.schedule.entries[1]!.arrival).toBe('13:00');
  });
  it('honours an early checkout and multiple nights', () => {
    const stops = [stop(1, { checkoutAt: 3 * 1440 + 420 }), stop(2)];
    const plan = calculate(stops, [60], [day(2), day(3)]);
    expect(plan.issue).toBeNull();
    expect(plan.chains[2]!.schedule.entries[0]!.arrival).toBe('07:00');
    expect(plan.chains[2]!.schedule.entries[1]!.arrival).toBe('08:00');
  });
  it('does not move time backwards when arrival is after checkout', () => {
    const stops = [stop(1, { time: '13:00', checkoutAt: 1440 + 720 }), stop(2)];
    const plan = calculate(stops, [60]);
    expect(plan.chains[0]!.schedule.entries[1]!.arrival).toBe('14:00');
  });
});

it('keeps checkout when the drive arrives after suggested check-in', () => {
  const stops = [
    stop(1, { time: '07:00', dwellMinutes: 60 }),
    stop(2, { checkInTime: '09:11', checkoutAt: 2 * 1440 + 600 }),
    stop(3),
  ];
  const plan = calculate(stops, [72.5, 29]);
  expect(plan.issue).toBeNull();
  expect(plan.chains[0]!.schedule.entries[1]!.arrival).toBe('09:13');
  expect(plan.chains[1]!.stops.at(-1)!.placeId).toBe(3);
  expect(plan.chains[1]!.schedule.entries.at(-1)!.arrival).toBe('10:29');
});

it('waits for check-in without treating it as a fixed appointment', () => {
  const plan = calculate([stop(1), stop(2, { checkInTime: '15:00', checkoutAt: 2 * 1440 + 600 }), stop(3)], [60, 29]);
  expect(plan.issue).toBeNull();
  expect(plan.chains[0]!.schedule.entries[1]!.arrival).toBe('15:00');
  expect(plan.chains[1]!.schedule.entries.at(-1)!.arrival).toBe('10:29');
});
