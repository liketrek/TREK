/**
 * ROADTRIP-CARRIERS-001..035: a booking the traveller rides becomes a seam in the drive,
 * and a hire car puts its desks on it.
 *
 * The road ends at the terminal the ride leaves from and starts again at the one it
 * lands at (#2428). Pinned here: which bookings count, where their terminals are seated
 * among the day's stops, what the ride between them is worth to the chain, that
 * nothing about a terminal reads as a stored stop, and that a hire car's pick-up and
 * return are points the road runs through rather than a seam in it. From 022 on: a ride
 * on no day is named rather than dropped, and a ride within one day is seated where it
 * adds the least road, as far as the clock leaves a choice (#2461). From 028 on: a ride
 * that lands on a later day is not seated there by the slot seeded on the day it left.
 * From 030 on: a booked night at a day's edge takes no via, and a terminal says which
 * edge of the day it holds. From 032 on: tonight's stay at the far end of a ride within
 * one day waits behind its landing.
 */
import { assembleRoadtrip } from './assemble';
import {
  CHECK_IN_MINUTES,
  carrierClock,
  carrierLeg,
  carrierLegsFor,
  carrierReservationIds,
  carrierSeam,
  carriesTheCar,
  closesTheDay,
  isCarrierMode,
  isPickupStop,
  isUndatedRide,
  opensTheDay,
  rideSeatAfter,
  sameDayRide,
  seatCarrierStops,
  terminalAssignmentId,
  undatedRides,
  viasLeaving,
  viasOnLeg,
  type CarrierBooking,
  type SeatItem,
} from './carriers';
import { planDayWindow } from './dayWindow';
import type { PlanDay, RoadtripStop, RoutedLeg } from './planning-types';
import { roadtripLegKey } from './routeRun';

import { describe, expect, it } from 'vitest';

const stop = (over: Partial<RoadtripStop> & { ownerIndex: number; ownerDayId?: number }): RoadtripStop => ({
  assignmentId: 100 + over.ownerIndex,
  ownerDayId: 1,
  placeId: 200 + over.ownerIndex,
  name: `Stop ${over.ownerIndex}`,
  lat: 50 + over.ownerIndex * 0.1,
  lng: 10,
  time: null,
  dwellMinutes: 30,
  legMode: null,
  incomingLegMode: null,
  stopType: null,
  ...over,
});

const flight = (over: Partial<CarrierBooking> = {}): CarrierBooking => ({
  id: 7,
  type: 'flight',
  title: 'LH 2020 MUC → HAM',
  day_id: 1,
  end_day_id: 1,
  reservation_time: '2026-06-01T13:20',
  reservation_end_time: '2026-06-01T14:30',
  endpoints: [
    { role: 'from', sequence: 0, name: 'Munich Airport', code: 'MUC', lat: 48.35, lng: 11.78 },
    { role: 'to', sequence: 1, name: 'Hamburg Airport', code: 'HAM', lat: 53.63, lng: 9.99 },
  ],
  ...over,
});

const road = (km: number): RoutedLeg => ({
  seg: {
    mid: [50, 10],
    from: [50, 10],
    to: [51, 10],
    distance: km * 1000,
    duration: km * 60,
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

describe('carrierSeam', () => {
  it('ROADTRIP-CARRIERS-001: a flight with two located terminals is a seam with the timetable on both ends', () => {
    const seam = carrierSeam(flight());
    expect(seam).not.toBeNull();
    expect(seam!.departure).toMatchObject({ dayId: 1, clock: '13:20', code: 'MUC', lat: 48.35 });
    expect(seam!.arrival).toMatchObject({ dayId: 1, clock: '14:30', code: 'HAM', lng: 9.99 });
    expect(seam!.departure.position).toBeNull();
  });

  it('ROADTRIP-CARRIERS-002: a taxi and a hop on transit are not seams, and neither is a ride nobody put on a day', () => {
    expect(carrierSeam(flight({ type: 'taxi' }))).toBeNull();
    expect(carrierSeam(flight({ type: 'transit' }))).toBeNull();
    expect(carrierSeam(flight({ day_id: null }))).toBeNull();
  });

  it('ROADTRIP-CARRIERS-003: a terminal without coordinates leaves no seam, because the drive cannot resume from nowhere', () => {
    const half = flight({
      endpoints: [
        { role: 'from', sequence: 0, name: 'Munich Airport', code: 'MUC', lat: 48.35, lng: 11.78 },
        { role: 'to', sequence: 1, name: 'Somewhere', code: null, lat: null, lng: null },
      ],
    });
    expect(carrierSeam(half)).toBeNull();
  });

  it('ROADTRIP-CARRIERS-004: a booking with a stopover is one seam from its first departure to its last arrival, on the legs’ own days and clocks', () => {
    const legs = JSON.stringify({
      legs: [
        { from: 'MUC', to: 'FRA', dep_day_id: 1, dep_time: '18:00', arr_day_id: 1, arr_time: '19:00' },
        {
          from: 'FRA',
          to: 'JFK',
          dep_day_id: 1,
          dep_time: '22:00',
          arr_day_id: 2,
          arr_time: '01:30',
          day_positions: { '2': 0 },
        },
      ],
    });
    const seam = carrierSeam(
      flight({
        reservation_time: null,
        reservation_end_time: null,
        metadata: legs,
        endpoints: [
          { role: 'from', sequence: 0, name: 'Munich', code: 'MUC', lat: 48.35, lng: 11.78 },
          { role: 'stop', sequence: 1, name: 'Frankfurt', code: 'FRA', lat: 50.03, lng: 8.56 },
          { role: 'to', sequence: 2, name: 'New York', code: 'JFK', lat: 40.64, lng: -73.78 },
        ],
      }),
    );
    expect(seam!.departure).toMatchObject({ dayId: 1, clock: '18:00', code: 'MUC' });
    expect(seam!.arrival).toMatchObject({ dayId: 2, clock: '01:30', code: 'JFK', position: 0 });
  });

  it('ROADTRIP-CARRIERS-005: a position somebody dragged the booking to is read per day, the booking’s own slot as the fallback', () => {
    const seam = carrierSeam(flight({ day_positions: { '1': 2 }, day_plan_position: 5 }));
    expect(seam!.departure.position).toBe(2);
    const legacy = carrierSeam(flight({ day_plan_position: 5 }));
    expect(legacy!.departure.position).toBe(5);
  });

  it('ROADTRIP-CARRIERS-006: clocks come out as HH:mm whichever way the column spells them', () => {
    expect(carrierClock('2026-06-01T13:20')).toBe('13:20');
    expect(carrierClock('7:05')).toBe('07:05');
    expect(carrierClock('13:20:00')).toBe('13:20');
    expect(carrierClock(null)).toBeNull();
    expect(carrierClock('noon')).toBeNull();
  });
});

describe('a hire car', () => {
  const rental = (over: Partial<CarrierBooking> = {}): CarrierBooking =>
    flight({
      id: 9,
      type: 'car',
      title: 'Sixt Hamburg',
      day_id: 1,
      end_day_id: 3,
      reservation_time: '2026-06-01T09:00',
      reservation_end_time: '2026-06-03T11:30',
      endpoints: [
        { role: 'from', sequence: 0, name: 'Sixt Hauptbahnhof', code: null, lat: 53.55, lng: 10.0 },
        { role: 'to', sequence: 1, name: 'Sixt Airport', code: 'HAM', lat: 53.63, lng: 9.99 },
      ],
      ...over,
    });

  it('ROADTRIP-CARRIERS-016: a hire car is a rental, not a ride: its desks are its ends, and the same desk twice is fine', () => {
    const seam = carrierSeam(rental())!;
    expect(seam.kind).toBe('rental');
    expect(seam.departure).toMatchObject({ dayId: 1, clock: '09:00', name: 'Sixt Hauptbahnhof' });
    expect(seam.arrival).toMatchObject({ dayId: 3, clock: '11:30', code: 'HAM' });
    const sameDesk = carrierSeam(
      rental({
        endpoints: [
          { role: 'from', sequence: 0, name: 'Europcar MUC', code: 'MUC', lat: 48.35, lng: 11.78 },
          { role: 'to', sequence: 1, name: 'Europcar MUC', code: 'MUC', lat: 48.35, lng: 11.78 },
        ],
      }),
    )!;
    expect(sameDesk.arrival).toMatchObject({ name: 'Europcar MUC' });
  });

  it('ROADTRIP-CARRIERS-017: a hire car without a return day or a return desk stands on the road at its pick-up only, nothing is guessed', () => {
    const noDay = carrierSeam(rental({ end_day_id: null }))!;
    expect(noDay.arrival).toBeNull();
    const noDesk = carrierSeam(
      rental({
        endpoints: [{ role: 'from', sequence: 0, name: 'Sixt Hauptbahnhof', code: null, lat: 53.55, lng: 10.0 }],
      }),
    )!;
    expect(noDesk.arrival).toBeNull();
    expect(carrierSeam(rental({ endpoints: [] }))).toBeNull();
    const seated = seatCarrierStops(1, [stop({ ownerIndex: 0, time: '10:00' })], [0], [noDay]);
    expect(seated.map((s) => s.carrier?.role ?? s.name)).toEqual(['pickup', 'Stop 0']);
    expect(seatCarrierStops(3, [stop({ ownerIndex: 0 })], [0], [noDay]).map((s) => s.carrier?.role ?? s.name)).toEqual([
      'Stop 0',
    ]);
  });

  it('ROADTRIP-CARRIERS-018: the pick-up opens its day when nothing timed comes first, the return closes its day, and the road runs through both', () => {
    const seam = carrierSeam(rental())!;
    const first = seatCarrierStops(
      1,
      [stop({ ownerIndex: 0, time: '10:00' }), stop({ ownerIndex: 1 })],
      [0, 1],
      [seam],
    );
    expect(first.map((s) => s.carrier?.role ?? s.name)).toEqual(['pickup', 'Stop 0', 'Stop 1']);
    const pickup = first[0]!;
    expect(pickup).toMatchObject({
      time: '09:00',
      leaveAt: null,
      dwellMinutes: 0,
      legMode: null,
      incomingLegMode: null,
    });
    expect(pickup.assignmentId).toBe(terminalAssignmentId(9, 'pickup'));
    expect(isPickupStop(pickup)).toBe(true);
    // No ride leaves a pick-up desk: the leg out of it is a road like any other.
    expect(carrierLegsFor([pickup, first[1]!], 'driving', () => 0, roadtripLegKey)).toBeNull();

    const last = seatCarrierStops(
      3,
      [stop({ ownerIndex: 0, ownerDayId: 3, time: '09:30' }), stop({ ownerIndex: 1, ownerDayId: 3, time: '10:30' })],
      [0, 1],
      [seam],
    );
    expect(last.map((s) => s.carrier?.role ?? s.name)).toEqual(['Stop 0', 'Stop 1', 'return']);
    expect(last[2]).toMatchObject({ time: '11:30', dwellMinutes: 0, legMode: null, incomingLegMode: null });
    expect(last[2]!.assignmentId).toBe(terminalAssignmentId(9, 'return'));
    expect(isPickupStop(last[2])).toBe(false);
    // Nothing of it on the day in between, and no arc on the map: its line is the road.
    expect(seatCarrierStops(2, [stop({ ownerIndex: 0, ownerDayId: 2 })], [0], [seam])).toHaveLength(1);
    expect(carrierReservationIds([{ stops: first }, { stops: last }])).toEqual([]);
  });

  it('ROADTRIP-CARRIERS-019: a car picked up and handed back on the same day seats both desks on their own, and the tank is full at the pick-up', () => {
    const oneDay = carrierSeam(rental({ end_day_id: 1, reservation_end_time: '2026-06-01T18:00' }))!;
    const seated = seatCarrierStops(
      1,
      [stop({ ownerIndex: 0, time: '10:00' }), stop({ ownerIndex: 1, time: '15:00' })],
      [0, 1],
      [oneDay],
    );
    expect(seated.map((s) => s.carrier?.role ?? s.name)).toEqual(['pickup', 'Stop 0', 'Stop 1', 'return']);

    const [pickup, a, b, back] = seated as [RoadtripStop, RoadtripStop, RoadtripStop, RoadtripStop];
    const before = stop({ ownerIndex: 5, lat: 49, time: '07:00' });
    const stops = [before, pickup, a, b, back];
    const legs: Record<string, RoutedLeg> = {
      [roadtripLegKey(before, pickup)]: road(40),
      [roadtripLegKey(pickup, a)]: road(30),
      [roadtripLegKey(a, b)]: road(30),
      [roadtripLegKey(b, back)]: road(30),
    };
    const routes = assembleRoadtrip({
      plan: [{ dayId: 1, dayNumber: 1, date: '2026-06-01', title: null, stops }],
      quietDays: [],
      window: null,
      distanceUnit: 'metric',
      allLegs: legs,
      snapByDay: {},
      missedByDay: {},
      loading: false,
      limits: { legMinutes: null, dayMinutes: null, rangeKm: 100 },
      vehicleKind: 'combustion',
      connectDays: false,
      boundaries: [],
      labels: { start: 'go', end: 'stop' },
    });
    const day = routes.days[0]!;
    // 130 km of road on a 100 km range, but the 40 km before the desk were another
    // car's: the hire car runs 90 km from a full tank and never runs dry.
    expect(day.distance).toBe(130_000);
    expect(day.driveWarnings.some((w) => w.code === 'range')).toBe(false);
    expect(routes.totalStops).toBe(3);
  });

  it('ROADTRIP-CARRIERS-021: a hire car whose pick-up desk is not located stands nowhere, the return desk alone is no pick-up', () => {
    // The form and the booking import both drop an endpoint that did not geocode, so a
    // one-way hire can arrive with its return desk only. Reading that desk as the pick-up
    // started the drive in the city the car is handed back in.
    const returnOnly = rental({
      endpoints: [{ role: 'to', sequence: 1, name: 'Sixt Airport', code: 'HAM', lat: 53.63, lng: 9.99 }],
    });
    expect(carrierSeam(returnOnly)).toBeNull();
    const plannedStopOnly = rental({
      endpoints: [
        { role: 'stop', sequence: 1, name: 'Luebeck', code: null, lat: 53.87, lng: 10.69 },
        { role: 'to', sequence: 2, name: 'Sixt Airport', code: 'HAM', lat: 53.63, lng: 9.99 },
      ],
    });
    expect(carrierSeam(plannedStopOnly)).toBeNull();
    // A ride still takes the first located stop for its departure when none is marked.
    const unmarked = flight({
      endpoints: [
        { role: 'stop', sequence: 0, name: 'Munich Airport', code: 'MUC', lat: 48.35, lng: 11.78 },
        { role: 'to', sequence: 1, name: 'Hamburg Airport', code: 'HAM', lat: 53.63, lng: 9.99 },
      ],
    });
    expect(carrierSeam(unmarked)!.departure.code).toBe('MUC');
  });
});

describe('the minutes of a ride', () => {
  const rideOf = (booking: CarrierBooking, dayDelta: number): RoutedLeg => {
    const seam = carrierSeam(booking)!;
    const [dep] = seatCarrierStops(seam.departure.dayId, [], [], [seam]) as [RoadtripStop];
    const arr = seatCarrierStops(seam.arrival!.dayId, [], [], [seam]).find((s) => s.carrier?.role === 'arrival')!;
    return carrierLegsFor([dep, arr], 'flight', () => dayDelta, roadtripLegKey)![roadtripLegKey(dep, arr)]!;
  };

  it('ROADTRIP-CARRIERS-007: the ride is what the clocks say, across the days the booking spans, and never negative', () => {
    expect(rideOf(flight(), 0).seg.duration).toBe(70 * 60);
    const overnight = flight({ reservation_time: '22:00', reservation_end_time: '07:00', end_day_id: 2 });
    expect(rideOf(overnight, 1).seg.duration).toBe(540 * 60);
    // Westward across the date line the clock lands before it left; the chain cannot
    // run backwards, so the ride counts as none rather than as a day.
    expect(rideOf(flight({ reservation_time: '10:00', reservation_end_time: '06:00' }), 0).seg.duration).toBe(0);
    // Without an arrival clock there are no minutes to give, and the leg says so.
    const unclocked = rideOf(flight({ reservation_end_time: null }), 0);
    expect(unclocked.seg.duration).toBe(0);
    expect(unclocked.seg.durationText).toBe('');
  });
});

describe('seatCarrierStops', () => {
  const day = [
    stop({ ownerIndex: 0, time: '09:00' }),
    stop({ ownerIndex: 1, time: '10:00' }),
    stop({ ownerIndex: 2 }),
    stop({ ownerIndex: 3, time: '17:00' }),
  ];

  it('ROADTRIP-CARRIERS-008: a same-day ride is seated behind the last timed stop at or before its departure, arrival right behind departure', () => {
    const seam = carrierSeam(flight())!;
    const seated = seatCarrierStops(1, day, [0, 1, 2, 3], [seam]);
    // Behind Stop 1 (10:00), and the untimed Stop 2 follows the ride: the day plan reads
    // an untimed item as standing behind the timed one before it.
    expect(seated.map((s) => s.carrier?.role ?? s.name)).toEqual([
      'Stop 0',
      'Stop 1',
      'departure',
      'arrival',
      'Stop 2',
      'Stop 3',
    ]);
    const dep = seated[2]!;
    const arr = seated[3]!;
    // Pinned a check-in ahead of the timetable and left at the timetable's minute.
    expect(dep.time).toBe('12:20');
    expect(dep.leaveAt).toBe('13:20');
    expect(dep.dwellMinutes).toBe(CHECK_IN_MINUTES.flight);
    expect(arr.time).toBe('14:30');
    expect(arr.dwellMinutes).toBe(0);
    // The ride is the leg's mode, on the departure's way out and the arrival's way in.
    expect(dep.legMode).toBe('flight');
    expect(arr.incomingLegMode).toBe('flight');
    // Neither is a stored stop: ids below every assignment and every automatic night,
    // a negative place, and the index of the stop that follows them in the stored list.
    expect(dep.assignmentId).toBe(terminalAssignmentId(7, 'departure'));
    expect(arr.assignmentId).toBe(terminalAssignmentId(7, 'arrival'));
    expect(dep.assignmentId).toBeLessThan(-2_000_000_000);
    expect(dep.placeId).toBeLessThan(0);
    expect(dep.ownerIndex).toBe(2);
    expect(arr.ownerIndex).toBe(2);
  });

  it('ROADTRIP-CARRIERS-009: a dragged position decides among untimed stops, and a ride before every timed stop opens the day', () => {
    // Three stops without a clock: the ride would close the day, but somebody dragged
    // the booking behind the first stop in the day plan, and that is where it sits.
    const untimedDay = [stop({ ownerIndex: 0 }), stop({ ownerIndex: 1 }), stop({ ownerIndex: 2 })];
    const dragged = carrierSeam(flight({ day_positions: { '1': 0 } }))!;
    expect(seatCarrierStops(1, untimedDay, [0, 1, 2], [dragged]).map((s) => s.carrier?.role ?? s.name)).toEqual([
      'Stop 0',
      'departure',
      'arrival',
      'Stop 1',
      'Stop 2',
    ]);
    // Among timed stops the clock has the last word, as it has in the day plan: a booking
    // dragged to the top of the day still reads after the stops that come before it in time.
    expect(seatCarrierStops(1, day, [0, 1, 2, 3], [dragged]).map((s) => s.carrier?.role ?? s.name)).toEqual([
      'Stop 0',
      'Stop 1',
      'Stop 2',
      'departure',
      'arrival',
      'Stop 3',
    ]);
    const early = carrierSeam(flight({ reservation_time: '06:00', reservation_end_time: '07:10' }))!;
    expect(seatCarrierStops(1, day, [0, 1, 2, 3], [early]).map((s) => s.carrier?.role ?? s.name)).toEqual([
      'departure',
      'arrival',
      'Stop 0',
      'Stop 1',
      'Stop 2',
      'Stop 3',
    ]);
  });

  it('ROADTRIP-CARRIERS-010: a ride without a clock and without a position goes to the end of the day, as the day plan shows it', () => {
    const untimed = carrierSeam(flight({ reservation_time: null, reservation_end_time: null }))!;
    const seated = seatCarrierStops(1, day, [0, 1, 2, 3], [untimed]);
    expect(seated.map((s) => s.carrier?.role ?? s.name)).toEqual([
      'Stop 0',
      'Stop 1',
      'Stop 2',
      'Stop 3',
      'departure',
      'arrival',
    ]);
    expect(seated[4]!.time).toBeNull();
    expect(seated[4]!.dwellMinutes).toBe(0);
  });

  it('ROADTRIP-CARRIERS-011: a ride landing on a later day seats its arrival on that day, and only there', () => {
    const overnight = carrierSeam(flight({ reservation_time: '22:00', reservation_end_time: '07:00', end_day_id: 2 }))!;
    const first = seatCarrierStops(1, day, [0, 1, 2, 3], [overnight]);
    expect(first.map((s) => s.carrier?.role ?? s.name)).toEqual(['Stop 0', 'Stop 1', 'Stop 2', 'Stop 3', 'departure']);
    // The arrival opens its day even when nothing on that day has a clock.
    const next = [stop({ ownerIndex: 0, ownerDayId: 2 })];
    const second = seatCarrierStops(2, next, [0], [overnight]);
    expect(second.map((s) => s.carrier?.role ?? s.name)).toEqual(['arrival', 'Stop 0']);
    expect(second[0]!.ownerDayId).toBe(2);
    expect(second[0]!.ownerIndex).toBe(0);
    expect(seatCarrierStops(3, [], [], [overnight])).toEqual([]);
  });
});

describe('the ride as a leg', () => {
  it('ROADTRIP-CARRIERS-012: a ride is a leg with minutes, no road and no distance, in the booking’s mode', () => {
    const seam = carrierSeam(flight())!;
    const [dep, arr] = seatCarrierStops(1, [], [], [seam]);
    const legs = carrierLegsFor([dep!, arr!], 'flight', () => 0, roadtripLegKey)!;
    const ride = legs[roadtripLegKey(dep!, arr!)]!;
    expect(ride.seg.mode).toBe('flight');
    expect(ride.seg.duration).toBe(70 * 60);
    expect(ride.seg.distance).toBe(0);
    expect(ride.line).toEqual([]);
    expect(ride.seg.durationText).toBe('1 h 10 min');
    expect(isCarrierMode(ride.seg.mode)).toBe(true);
    expect(carrierLegsFor([dep!, arr!], 'driving', () => 0, roadtripLegKey)).toBeNull();
    expect(carrierLeg(dep!, arr!, null).seg.durationText).toBe('');
    expect(carriesTheCar('ferry')).toBe(true);
    expect(carriesTheCar('flight')).toBe(false);
  });

  it('ROADTRIP-CARRIERS-013: no via leaves a terminal, however many are filed at the index it stands in for', () => {
    const vias = [{ day_id: 1, after_order_index: 2, sequence: 0, lat: 1, lng: 1 }];
    const seam = carrierSeam(flight())!;
    const seated = seatCarrierStops(
      1,
      [
        stop({ ownerIndex: 0, time: '09:00' }),
        stop({ ownerIndex: 1, time: '10:00' }),
        stop({ ownerIndex: 2, time: '17:00' }),
      ],
      [0, 1, 2],
      [seam],
    );
    const arrival = seated.find((s) => s.carrier?.role === 'arrival')!;
    expect(arrival.ownerIndex).toBe(2);
    expect(viasLeaving(arrival, vias)).toEqual([]);
    expect(viasLeaving(seated[4]!, vias)).toHaveLength(1);
    expect(carrierReservationIds([{ stops: seated }])).toEqual([7]);
  });
});

describe('the ride in the drive', () => {
  const seam = carrierSeam(flight({ reservation_time: '13:20', reservation_end_time: '14:30' }))!;
  const stops = seatCarrierStops(
    1,
    [stop({ ownerIndex: 0, time: '09:00', dwellMinutes: 0 }), stop({ ownerIndex: 1, time: '10:00', dwellMinutes: 0 })],
    [0, 1],
    [seam],
  );
  const [a, b, dep, arr] = stops as [RoadtripStop, RoadtripStop, RoadtripStop, RoadtripStop];
  const allLegs: Record<string, RoutedLeg> = {
    [roadtripLegKey(a, b)]: road(60),
    [roadtripLegKey(b, dep)]: road(30),
    ...carrierLegsFor([dep, arr], 'flight', () => 0, roadtripLegKey)!,
  };
  const plan: PlanDay[] = [{ dayId: 1, dayNumber: 1, date: '2026-06-01', title: null, stops }];

  it('ROADTRIP-CARRIERS-014: the day counts its road and not its ride, and the terminals are not destinations', () => {
    const routes = assembleRoadtrip({
      plan,
      quietDays: [],
      window: null,
      distanceUnit: 'metric',
      allLegs,
      snapByDay: {},
      missedByDay: {},
      loading: false,
      limits: { legMinutes: null, dayMinutes: null, rangeKm: 50 },
      vehicleKind: 'combustion',
      connectDays: false,
      boundaries: [],
      labels: { start: 'go', end: 'stop' },
    });
    const day = routes.days[0]!;
    expect(day.distance).toBe(90_000);
    expect(day.duration).toBe(90 * 60);
    expect(routes.totalStops).toBe(2);
    // The ride is no line on the map and no labelled segment; the arc is the booking's.
    expect(routes.lines).toHaveLength(2);
    expect(routes.segments.map((s) => s.mode)).toEqual(['driving', 'driving']);
    // The chain still runs through it: the terminal is reached a check-in ahead of the
    // flight, the flight leaves on the timetable, the far end lands on the timetable.
    expect(day.schedule.entries.map((e) => [e.arrival, e.departure])).toEqual([
      ['09:00', '09:00'],
      ['10:00', '10:00'],
      ['12:20', '13:20'],
      ['14:30', '14:30'],
    ]);
    // A 50 km range and 90 km of road before the flight: the warning belongs to the
    // drive, and after the flight the tank is another car's, so nothing carries over.
    expect(day.driveWarnings.some((w) => w.code === 'range')).toBe(true);
    expect(day.dryPoints?.every((p) => p.legIndex < 2)).toBe(true);
  });

  it('ROADTRIP-CARRIERS-015: with a daily window, an overnight ride carries the clock to the day it lands on without a night marker on the flight', () => {
    const overnight = carrierSeam(flight({ reservation_time: '22:00', reservation_end_time: '07:00', end_day_id: 2 }))!;
    const dayOne = seatCarrierStops(1, [stop({ ownerIndex: 0, time: '18:00', dwellMinutes: 0 })], [0], [overnight]);
    const dayTwo = seatCarrierStops(
      2,
      [stop({ ownerIndex: 0, ownerDayId: 2, dwellMinutes: 0, lat: 53.7, lng: 10.1 })],
      [0],
      [overnight],
    );
    const [origin, departure] = dayOne as [RoadtripStop, RoadtripStop];
    const [arrival, hotel] = dayTwo as [RoadtripStop, RoadtripStop];
    const legs: Record<string, RoutedLeg> = {
      [roadtripLegKey(origin, departure)]: road(30),
      [roadtripLegKey(arrival, hotel)]: road(20),
      ...carrierLegsFor([departure, arrival], 'flight', () => 1, roadtripLegKey)!,
    };
    const days: PlanDay[] = [
      { dayId: 1, dayNumber: 1, date: '2026-06-01', title: null, stops: dayOne },
      { dayId: 2, dayNumber: 2, date: '2026-06-02', title: null, stops: dayTwo },
    ];
    const timed = planDayWindow(days, { start: 8 * 60, end: 20 * 60 }, (f, t) => legs[roadtripLegKey(f, t)], 'metric', {
      start: 'go',
      end: 'stop',
    });
    expect(timed.issue).toBeNull();
    const chainOne = timed.chains.find((c) => c.dayNumber === 1)!;
    const chainTwo = timed.chains.find((c) => c.dayNumber === 2)!;
    expect(chainOne.stops.map((s) => s.carrier?.role ?? s.name)).toEqual(['Stop 0', 'departure']);
    expect(chainOne.schedule.entries[1]).toMatchObject({ arrival: '21:00', departure: '22:00' });
    expect(chainTwo.stops.map((s) => s.carrier?.role ?? s.name)).toEqual(['arrival', 'Stop 0']);
    expect(chainTwo.schedule.entries[0]).toMatchObject({ arrival: '07:00' });
    expect(chainTwo.stops.some((s) => s.automaticNight)).toBe(false);
  });

  it('ROADTRIP-CARRIERS-020: a red-eye inside its check-in allowance is pinned at midnight on its own day, and the day stays on one card', () => {
    // 00:30 less an hour is 23:30, which the clock wraps onto the evening before: the
    // chain then read the flight as leaving the next day and filed the arrival and every
    // stop after it on the next card, with a spill mark on a day nothing spilled from.
    const redEye = carrierSeam(flight({ reservation_time: '00:30', reservation_end_time: '02:30' }))!;
    const seated = seatCarrierStops(
      1,
      [
        stop({ ownerIndex: 0, time: '09:00', dwellMinutes: 0 }),
        stop({ ownerIndex: 1, time: '14:00', dwellMinutes: 0 }),
      ],
      [0, 1],
      [redEye],
    );
    expect(seated.map((s) => s.carrier?.role ?? s.name)).toEqual(['departure', 'arrival', 'Stop 0', 'Stop 1']);
    const [dep, arr, first, second] = seated as [RoadtripStop, RoadtripStop, RoadtripStop, RoadtripStop];
    expect(dep).toMatchObject({ time: '00:00', leaveAt: '00:30', dwellMinutes: 30 });
    expect(arr.time).toBe('02:30');

    const nextDay = [
      stop({ ownerIndex: 0, ownerDayId: 2, time: '10:00', dwellMinutes: 0, lat: 53.7 }),
      stop({ ownerIndex: 1, ownerDayId: 2, time: '12:00', dwellMinutes: 0, lat: 53.9 }),
    ];
    const legs: Record<string, RoutedLeg> = {
      [roadtripLegKey(arr, first)]: road(30),
      [roadtripLegKey(first, second)]: road(30),
      [roadtripLegKey(nextDay[0]!, nextDay[1]!)]: road(30),
      ...carrierLegsFor([dep, arr], 'flight', () => 0, roadtripLegKey)!,
    };
    const routes = assembleRoadtrip({
      plan: [
        { dayId: 1, dayNumber: 1, date: '2026-06-01', title: null, stops: seated },
        { dayId: 2, dayNumber: 2, date: '2026-06-02', title: null, stops: nextDay },
      ],
      quietDays: [],
      window: null,
      distanceUnit: 'metric',
      allLegs: legs,
      snapByDay: {},
      missedByDay: {},
      loading: false,
      limits: { legMinutes: null, dayMinutes: null, rangeKm: null },
      vehicleKind: 'combustion',
      connectDays: false,
      boundaries: [],
      labels: { start: 'go', end: 'stop' },
    });
    expect(routes.days.map((d) => d.stops.map((s) => s.carrier?.role ?? s.name))).toEqual([
      ['departure', 'arrival', 'Stop 0', 'Stop 1'],
      ['Stop 0', 'Stop 1'],
    ]);
    expect(routes.days[0]!.schedule.entries.map((e) => [e.arrival, e.departure])).toEqual([
      ['00:00', '00:30'],
      ['02:30', '02:30'],
      ['09:00', '09:00'],
      ['14:00', '14:00'],
    ]);
    expect(routes.days.some((d) => d.spills?.length)).toBe(false);
  });
});

/**
 * The crossing from the report behind #2461: Amsterdam and Newcastle on one day, neither
 * with a clock, and the ferry from IJmuiden to the Port of Tyne between them.
 */
const AMSTERDAM = { lat: 52.3731, lng: 4.8926 };
const NEWCASTLE = { lat: 54.9783, lng: -1.6178 };
const IJMUIDEN = { lat: 52.4581, lng: 4.5879 };
const PORT_OF_TYNE = { lat: 54.9925, lng: -1.4522 };

const ferry = (over: Partial<CarrierBooking> = {}): CarrierBooking => ({
  id: 69,
  type: 'ferry',
  title: 'IJmuiden to Newcastle',
  day_id: 1,
  end_day_id: 1,
  reservation_time: '2026-10-06T17:30',
  reservation_end_time: '2026-10-06T23:00',
  endpoints: [
    { role: 'from', sequence: 0, name: 'IJmuiden', code: null, ...IJMUIDEN },
    { role: 'to', sequence: 1, name: 'Port of Tyne', code: null, ...PORT_OF_TYNE },
  ],
  ...over,
});

const crossingDay = (newcastleAt: string | null = null): RoadtripStop[] => [
  stop({ ownerIndex: 0, name: 'Amsterdam', ...AMSTERDAM }),
  stop({ ownerIndex: 1, name: 'Newcastle', ...NEWCASTLE, time: newcastleAt }),
];

const order = (stops: RoadtripStop[]): string[] => stops.map((s) => s.carrier?.role ?? s.name);

describe('a ride on no day (#2461)', () => {
  it('ROADTRIP-CARRIERS-022: a located ride without a day is named, one on a day or without both terminals is not', () => {
    const undated = ferry({ id: 71, day_id: null, end_day_id: null });
    expect(isUndatedRide(undated)).toBe(true);
    // No seam either: that is the silence the name is for.
    expect(carrierSeam(undated)).toBeNull();
    expect(isUndatedRide(ferry())).toBe(false);
    expect(isUndatedRide(ferry({ day_id: null, endpoints: [] }))).toBe(false);
    expect(isUndatedRide(ferry({ day_id: null, endpoints: [ferry().endpoints![0]!] }))).toBe(false);
    // A hire car is no ride, and a leg that names its day puts the booking on that day.
    expect(isUndatedRide(ferry({ day_id: null, type: 'car' }))).toBe(false);
    const legs = JSON.stringify({ legs: [{ dep_day_id: 2, dep_time: '10:00', arr_day_id: 2, arr_time: '11:00' }] });
    expect(isUndatedRide(flight({ day_id: null, metadata: legs }))).toBe(false);
    // Listed by id, whatever order the bookings come in.
    const listed = undatedRides([ferry({ id: 9, day_id: null }), ferry(), ferry({ id: 3, day_id: null })]);
    expect(listed.map((b) => b.id)).toEqual([3, 9]);
  });
});

describe('a ride within one day, seated by where it goes (#2461)', () => {
  it('ROADTRIP-CARRIERS-023: only a ride that lands on the day it left, located at both ends and without a change, has a seat of its own', () => {
    expect(sameDayRide(ferry())).toEqual({ minutes: 17 * 60 + 30, from: IJMUIDEN, to: PORT_OF_TYNE });
    expect(sameDayRide(ferry({ reservation_time: null }))!.minutes).toBeNull();
    expect(sameDayRide(ferry({ end_day_id: 2 }))).toBeNull();
    expect(sameDayRide(ferry({ endpoints: [] }))).toBeNull();
    expect(sameDayRide(ferry({ type: 'car' }))).toBeNull();
    const stopover = flight({
      metadata: JSON.stringify({
        legs: [
          { dep_day_id: 1, dep_time: '08:00', arr_day_id: 1, arr_time: '09:00' },
          { dep_day_id: 1, dep_time: '10:00', arr_day_id: 1, arr_time: '11:00' },
        ],
      }),
    });
    expect(carrierSeam(stopover)!.stopover).toBe(true);
    expect(carrierSeam(flight())!.stopover).toBe(false);
    expect(sameDayRide(stopover)).toBeNull();
  });

  it('ROADTRIP-CARRIERS-024: a ferry between two untimed stops on its two shores sits between them, not at the end of the day', () => {
    const seated = seatCarrierStops(1, crossingDay(), [0, 1], [carrierSeam(ferry())!]);
    expect(order(seated)).toEqual(['Amsterdam', 'departure', 'arrival', 'Newcastle']);
    // The terminals still stand for the stop that follows them, the way they always have.
    expect(seated[1]!.ownerIndex).toBe(1);
    // Newcastle alone on the day: the crossing opens it, and the drive starts at the far pier.
    const newcastleOnly = [stop({ ownerIndex: 0, name: 'Newcastle', ...NEWCASTLE })];
    expect(order(seatCarrierStops(1, newcastleOnly, [0], [carrierSeam(ferry())!]))).toEqual([
      'departure',
      'arrival',
      'Newcastle',
    ]);
    // Without a clock it goes there too: nothing timed binds it from above.
    const unclocked = carrierSeam(ferry({ reservation_time: null, reservation_end_time: null }))!;
    expect(order(seatCarrierStops(1, crossingDay(), [0, 1], [unclocked]))).toEqual([
      'Amsterdam',
      'departure',
      'arrival',
      'Newcastle',
    ]);
  });

  it('ROADTRIP-CARRIERS-025: a clock still binds: a stop timed before the departure keeps the ride behind it, and a dragged slot wins', () => {
    const timed = seatCarrierStops(1, crossingDay('10:00'), [0, 1], [carrierSeam(ferry())!]);
    expect(order(timed)).toEqual(['Amsterdam', 'Newcastle', 'departure', 'arrival']);
    const dragged = carrierSeam(ferry({ day_positions: { '1': 5 } }))!;
    expect(order(seatCarrierStops(1, crossingDay(), [0, 1], [dragged]))).toEqual([
      'Amsterdam',
      'Newcastle',
      'departure',
      'arrival',
    ]);
  });

  it('ROADTRIP-CARRIERS-026: between the clocks, the seat that adds the fewest kilometres, the start of the day among them', () => {
    const ride = { minutes: 17 * 60 + 30, from: IJMUIDEN, to: PORT_OF_TYNE };
    const item = (key: number, point: SeatItem['point']): SeatItem => ({ key, minutes: null, point });
    expect(rideSeatAfter([item(0, AMSTERDAM), item(1, NEWCASTLE)], ride)).toBe(0);
    // Newcastle alone: the ride opens the day and lands next door. Amsterdam alone: the
    // clock's seat at the end of the day is already the short drive to the pier.
    expect(rideSeatAfter([item(0, NEWCASTLE)], ride)).toBe(-Infinity);
    expect(rideSeatAfter([item(0, AMSTERDAM)], ride)).toBeNull();
    // An item without a point is passed over: the kilometres are measured between the
    // located ones around it, and of two equal seats the earlier one is taken.
    expect(rideSeatAfter([item(0, AMSTERDAM), item(1, null), item(2, NEWCASTLE)], ride)).toBe(0);
    // Keys, not the order the items come in.
    expect(rideSeatAfter([item(7, NEWCASTLE), item(3, AMSTERDAM)], ride)).toBe(3);
    // Nothing located, or no choice the clock leaves open: the clock's own seat.
    expect(rideSeatAfter([item(0, null), item(1, null)], ride)).toBeNull();
    expect(rideSeatAfter([{ key: 0, minutes: 10 * 60, point: AMSTERDAM }], ride)).toBeNull();
    expect(rideSeatAfter([], ride)).toBeNull();
  });

  it('ROADTRIP-CARRIERS-027: the first item timed after the departure is a wall, and a seat has to beat the clock by a margin', () => {
    // A ride north along one meridian. By the kilometres it belongs behind the last stop,
    // where it starts next door, but the 20:00 stop comes after a 17:30 departure and
    // holds it in front: of the seats left, the start of the day is the shorter drive.
    const north = { minutes: 17 * 60 + 30, from: { lat: 10.1, lng: 0 }, to: { lat: 20, lng: 0 } };
    const walled: SeatItem[] = [
      { key: 0, minutes: null, point: { lat: 0, lng: 0 } },
      { key: 1, minutes: 20 * 60, point: { lat: 1, lng: 0 } },
      { key: 2, minutes: null, point: { lat: 10, lng: 0 } },
    ];
    expect(rideSeatAfter(walled, north)).toBe(-Infinity);
    // Without the wall the ride closes the day, which is where the clock puts it anyway.
    const unwalled = walled.map((w) => ({ ...w, minutes: null }));
    expect(rideSeatAfter(unwalled, north)).toBeNull();
    // Two seats a couple of kilometres apart on a crossing of six hundred: straight lines
    // cannot tell them apart, so the clock's seat stands. The flight of 008 shows the same
    // in the drive, where Stop 2 stays behind the ride.
    const close: SeatItem[] = [
      { key: 0, minutes: 10 * 60, point: { lat: 50.1, lng: 10 } },
      { key: 1, minutes: null, point: { lat: 50.2, lng: 10 } },
      { key: 2, minutes: 17 * 60, point: { lat: 50.3, lng: 10 } },
    ];
    const muc = { minutes: 13 * 60 + 20, from: { lat: 48.35, lng: 11.78 }, to: { lat: 53.63, lng: 9.99 } };
    expect(rideSeatAfter(close, muc)).toBeNull();
  });
});

describe('a ride that lands on a later day (#2461)', () => {
  const overnight = (over: Partial<CarrierBooking> = {}): CarrierBooking =>
    ferry({ end_day_id: 2, reservation_end_time: '2026-10-07T09:00', ...over });
  const newcastleOnDay2 = [stop({ ownerIndex: 0, ownerDayId: 2, name: 'Newcastle', ...NEWCASTLE })];

  it('ROADTRIP-CARRIERS-028: the booking’s own slot seats its departure only, and the arrival opens the day it lands on', () => {
    // Seeded on the evening of the crossing behind both of its stops, the slot sat behind
    // the morning's stop across the water too, and the drive ran from it back to the pier.
    const seeded = carrierSeam(overnight({ day_plan_position: 1.5 }))!;
    expect(seeded.departure.position).toBe(1.5);
    expect(seeded.arrival!.position).toBeNull();
    expect(order(seatCarrierStops(2, newcastleOnDay2, [0], [seeded]))).toEqual(['arrival', 'Newcastle']);
    // A slot somebody gave it on the day it lands still wins, and so does a leg's own.
    const dragged = carrierSeam(overnight({ day_plan_position: 1.5, day_positions: { '2': 0.5 } }))!;
    expect(dragged.arrival!.position).toBe(0.5);
    expect(order(seatCarrierStops(2, newcastleOnDay2, [0], [dragged]))).toEqual(['Newcastle', 'arrival']);
    // On the day it leaves, and for a ride within one day, nothing changes.
    expect(carrierSeam(ferry({ day_plan_position: 1.5 }))!.arrival!.position).toBe(1.5);
  });

  it('ROADTRIP-CARRIERS-029: a hire car handed back on a later day keeps reading the booking’s slot', () => {
    const car = carrierSeam({
      id: 5,
      type: 'car',
      title: 'Hire car',
      day_id: 1,
      end_day_id: 2,
      reservation_time: '10:00',
      reservation_end_time: '10:00',
      day_plan_position: 1.5,
      endpoints: [
        { role: 'from', sequence: 0, name: 'Desk A', code: null, lat: 50, lng: 10 },
        { role: 'to', sequence: 1, name: 'Desk B', code: null, lat: 51, lng: 10 },
      ],
    })!;
    expect(car.arrival!.position).toBe(1.5);
  });
});

describe('a booked night at the edge of a day', () => {
  const hotel = (phase: 'morning' | 'evening', ownerIndex: number) =>
    stop({
      ownerIndex,
      bookend: {
        phase,
        accommodationId: 5,
        reservationId: null,
        checkingOut: false,
        checkingIn: false,
        checkOut: null,
      },
    });
  const vias = [
    { day_id: 1, after_order_index: 0, sequence: 0, lat: 1, lng: 1 },
    { day_id: 1, after_order_index: 1, sequence: 0, lat: 2, lng: 2 },
  ];

  it('ROADTRIP-CARRIERS-030: no via leaves the hotel, and none bends the drive to tonight’s', () => {
    // The morning's hotel borrows the first stop's index; the points filed there are
    // that stop's, for the drive leaving it.
    expect(viasLeaving(hotel('morning', 0), vias)).toEqual([]);
    expect(viasOnLeg(hotel('morning', 0), stop({ ownerIndex: 0 }), vias)).toEqual([]);
    expect(viasOnLeg(stop({ ownerIndex: 0 }), stop({ ownerIndex: 1 }), vias)).toEqual([vias[0]]);
    // The points behind the day's last stop shape the road into tomorrow, which the drive
    // to tonight's hotel is not.
    expect(viasOnLeg(stop({ ownerIndex: 1 }), hotel('evening', 2), vias)).toEqual([]);
    expect(viasLeaving(stop({ ownerIndex: 1 }), vias)).toEqual([vias[1]]);
  });

  it('ROADTRIP-CARRIERS-031: a landing or a pick-up opens a day, a departure or a hand-back closes it', () => {
    expect(['arrival', 'pickup', 'departure', 'return', undefined].map((role) => opensTheDay(role as never))).toEqual([
      true,
      true,
      false,
      false,
      false,
    ]);
    expect(['arrival', 'pickup', 'departure', 'return', undefined].map((role) => closesTheDay(role as never))).toEqual([
      false,
      false,
      true,
      true,
      false,
    ]);
  });
});

/**
 * The flight day behind the report: the hotel in Munich is booked for the night from 15:00,
 * and LH 2078 leaves Hamburg at 15:15. The day plan seeded the booking's slot behind the
 * hotel (0.5), and the hotel's own stop is the only one the day stores.
 */
const HAM_AIRPORT = { lat: 53.630402, lng: 9.98823 };
const MUC_AIRPORT = { lat: 48.353802, lng: 11.7861 };
const MUNICH_HOTEL = { lat: 48.1403, lng: 11.5732 };
const SPEICHERSTADT = { lat: 53.5436, lng: 9.9885 };
const PINAKOTHEK = { lat: 48.1482, lng: 11.57 };

const lh2078 = (over: Partial<CarrierBooking> = {}): CarrierBooking => ({
  id: 77,
  type: 'flight',
  title: 'LH 2078 HAM-MUC',
  day_id: 1,
  end_day_id: 1,
  reservation_time: '2026-11-04T15:15',
  reservation_end_time: '2026-11-04T17:20',
  day_plan_position: 0.5,
  endpoints: [
    { role: 'from', sequence: 0, name: 'Hamburg (HAM)', code: 'HAM', ...HAM_AIRPORT },
    { role: 'to', sequence: 1, name: 'Munich (MUC)', code: 'MUC', ...MUC_AIRPORT },
  ],
  ...over,
});

/** Tonight's stay on its check-in day, the way both planners read the booking's own stop. */
const munichHotel = (ownerIndex: number, over: Partial<RoadtripStop> = {}): RoadtripStop =>
  stop({
    ownerIndex,
    name: 'Munich hotel',
    ...MUNICH_HOTEL,
    night: true,
    checkInTime: '15:00',
    dwellMinutes: 60,
    stopType: 'hotel',
    ...over,
  });
const speicherstadt = (ownerIndex: number, time: string | null = null): RoadtripStop =>
  stop({ ownerIndex, name: 'Speicherstadt', ...SPEICHERSTADT, time });

describe('tonight’s stay at the far end of a ride within one day', () => {
  it('ROADTRIP-CARRIERS-032: waits behind the landing, whatever its check-in or the booking’s slot says', () => {
    // Read by its check-in, the hotel sat ahead of the 15:15 departure: the drive went from
    // the Munich hotel to Hamburg airport, only to fly back to Munich.
    const seam = carrierSeam(lh2078())!;
    expect(order(seatCarrierStops(1, [munichHotel(0)], [0], [seam]))).toEqual(['departure', 'arrival', 'Munich hotel']);
    const unslotted = carrierSeam(lh2078({ day_plan_position: null }))!;
    expect(order(seatCarrierStops(1, [munichHotel(0)], [0], [unslotted]))).toEqual([
      'departure',
      'arrival',
      'Munich hotel',
    ]);
    // The morning in Hamburg stays ahead of the flight, timed or not, whichever of the two
    // is stored first.
    expect(order(seatCarrierStops(1, [speicherstadt(0, '10:00'), munichHotel(1)], [0, 1], [seam]))).toEqual([
      'Speicherstadt',
      'departure',
      'arrival',
      'Munich hotel',
    ]);
    const hotelFirst = seatCarrierStops(1, [munichHotel(0), speicherstadt(1)], [0, 1], [unslotted]);
    expect(order(hotelFirst)).toEqual(['Speicherstadt', 'departure', 'arrival', 'Munich hotel']);
    // The terminals stand for the stored stop behind the one they follow, the hotel keeps
    // its own index.
    expect(hotelFirst.map((s) => s.ownerIndex)).toEqual([1, 2, 2, 0]);
    // An evening in Munich comes after the hotel.
    const museum = stop({ ownerIndex: 1, name: 'Pinakothek', ...PINAKOTHEK, time: '19:00' });
    expect(order(seatCarrierStops(1, [munichHotel(0), museum], [0, 1], [seam]))).toEqual([
      'departure',
      'arrival',
      'Munich hotel',
      'Pinakothek',
    ]);
  });

  it('ROADTRIP-CARRIERS-033: a check-in the ride lands after holds the stay to nothing, one it lands before still does', () => {
    // Checked in from 15:00 and reached from a landing at 17:20: held as a pin, the hotel
    // read 15:00 behind the landing and late by the drive from the airport.
    const [, , afternoon] = seatCarrierStops(1, [munichHotel(0)], [0], [carrierSeam(lh2078())!]);
    expect(afternoon).toMatchObject({ name: 'Munich hotel', checkInTime: null, night: true, ownerIndex: 0 });
    const morning = carrierSeam(
      lh2078({ reservation_time: '2026-11-04T07:00', reservation_end_time: '2026-11-04T08:05' }),
    )!;
    const [, , waited] = seatCarrierStops(1, [munichHotel(0)], [0], [morning]);
    expect(waited).toMatchObject({ name: 'Munich hotel', checkInTime: '15:00' });
  });

  it('ROADTRIP-CARRIERS-034: a stay nearer the departure, one with a time of its own and a ride landing tomorrow keep the clock’s seat', () => {
    const seam = carrierSeam(lh2078())!;
    const hamburgHotel = munichHotel(0, { name: 'Hamburg hotel', ...SPEICHERSTADT });
    expect(order(seatCarrierStops(1, [hamburgHotel], [0], [seam]))).toEqual(['Hamburg hotel', 'departure', 'arrival']);
    // A time somebody typed on the stop is theirs, not the booking's.
    expect(order(seatCarrierStops(1, [munichHotel(0, { time: '12:00' })], [0], [seam]))).toEqual([
      'Munich hotel',
      'departure',
      'arrival',
    ]);
    const overnight = carrierSeam(lh2078({ end_day_id: 2, reservation_end_time: '2026-11-05T07:00' }))!;
    expect(order(seatCarrierStops(1, [munichHotel(0)], [0], [overnight]))).toEqual(['Munich hotel', 'departure']);
  });

  it('ROADTRIP-CARRIERS-035: on a day out and back, the stay waits behind the ride that brings the traveller back', () => {
    const out = carrierSeam(
      lh2078({ day_plan_position: null, reservation_time: '08:00', reservation_end_time: '09:05' }),
    )!;
    const back = carrierSeam(
      lh2078({
        id: 78,
        title: 'LH 2079 MUC-HAM',
        day_plan_position: null,
        reservation_time: '18:00',
        reservation_end_time: '19:05',
        endpoints: [
          { role: 'from', sequence: 0, name: 'Munich (MUC)', code: 'MUC', ...MUC_AIRPORT },
          { role: 'to', sequence: 1, name: 'Hamburg (HAM)', code: 'HAM', ...HAM_AIRPORT },
        ],
      }),
    )!;
    const hamburgHotel = munichHotel(0, { name: 'Hamburg hotel', ...SPEICHERSTADT });
    const seated = seatCarrierStops(1, [hamburgHotel], [0], [out, back]);
    expect(seated.map((s) => (s.carrier ? `${s.carrier.reservationId}:${s.carrier.role}` : s.name))).toEqual([
      '77:departure',
      '77:arrival',
      '78:departure',
      '78:arrival',
      'Hamburg hotel',
    ]);
  });
});
