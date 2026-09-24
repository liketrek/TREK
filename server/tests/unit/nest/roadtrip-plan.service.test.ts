/**
 * RoadtripPlanService against the worker's real SQLite schema.
 *
 * The planning SELECT is the one place the server reads a visit's times for the road
 * trip, and the tests beside the MCP tools hand the service its rows by hand, so a
 * column the statement never selects would go unnoticed there. These run the statement.
 */
import { db } from '../../../src/db/database';
import type { McpContext } from '../../../src/nest-mcp';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { RoadtripPlanService } from '../../../src/nest/roadtrip/roadtrip-plan.service';
import { RoadtripPlanningMcp } from '../../../src/nest/roadtrip/roadtrip-planning.mcp';
import { createDay, createDayAccommodation, createDayAssignment, createPlace, createTrip, createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import type { RoadtripPreferences } from '@trek/shared';
import { bookendAssignmentId, type RoadtripStop } from '@trek/shared/roadtrip';

import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Every leg an hour and 60 km, whatever it joins. */
function hourlyRouter() {
  return {
    profiles: () => ['driving'],
    route: vi.fn(async (_user: number, _trip: number, _day: number, points: { lat: number; lng: number }[], _profile?: string) => ({
      parts: points.slice(1).map(() => ({ distance: 60000, duration: 3600 })),
      avoidMissed: [],
      leg: {
        line: points.map((p) => [p.lat, p.lng]),
        vias: [],
        seg: {
          from: [points[0].lat, points[0].lng],
          to: [points[points.length - 1].lat, points[points.length - 1].lng],
          mid: [points[0].lat, points[0].lng],
          distance: 60000 * (points.length - 1),
          duration: 3600 * (points.length - 1),
          mode: 'driving',
          distanceText: '',
          drivingText: '',
          walkingText: '',
        },
      },
    })),
  };
}

function setup() {
  const { user } = createUser(db);
  const trip = createTrip(db, user.id);
  const day = createDay(db, trip.id);
  const visits = ['Hamburg', 'Lueneburg', 'Celle'].map((name, i) => {
    const place = createPlace(db, trip.id, { name, lat: 53 - i * 0.3, lng: 10 });
    db.prepare('UPDATE places SET duration_minutes = ? WHERE id = ?').run(i === 0 ? 0 : 30, place.id);
    return createDayAssignment(db, day.id, place.id);
  });
  db.prepare("UPDATE day_assignments SET assignment_time = '09:00' WHERE id = ?").run(visits[0].id);
  const plans = new RoadtripPlanService(
    new DatabaseService(db),
    { getUserSettings: () => ({}) } as never,
    { read: () => ({}) } as never,
    hourlyRouter() as never,
    { listForTrip: () => [], tracksForTrip: () => [] } as never,
    { list: () => [] } as never,
  );
  return { user, trip, visits, plans };
}

beforeEach(() => {
  resetTestDb(db);
});

describe('a visit end time on the road trip', () => {
  it('is read from the visit, and from the place when the visit has none', () => {
    const { user, trip, visits, plans } = setup();
    db.prepare("UPDATE day_assignments SET assignment_end_time = '14:00' WHERE id = ?").run(visits[1].id);
    db.prepare(
      "UPDATE places SET end_time = '18:00' WHERE id = (SELECT place_id FROM day_assignments WHERE id = ?)",
    ).run(visits[2].id);

    const context = plans.context(trip.id, user.id);

    expect(context.visits.map((v) => [v.name, v.end_time])).toEqual([
      ['Hamburg', null],
      ['Lueneburg', '14:00'],
      ['Celle', '18:00'],
    ]);
  });

  it('is when the drive leaves the stop, in place of its stay', async () => {
    const { user, trip, visits, plans } = setup();
    db.prepare("UPDATE day_assignments SET assignment_end_time = '14:00' WHERE id = ?").run(visits[1].id);

    const { calculated } = await plans.calculate(trip.id, user.id);
    const day = calculated.days[0];

    expect(day.stops[1]).toMatchObject({ name: 'Lueneburg', leaveAt: '14:00' });
    expect(day.schedule.entries.map((e) => [e.arrival, e.departure])).toEqual([
      ['09:00', '09:00'],
      ['10:00', '14:00'],
      ['15:00', '15:30'],
    ]);
    expect(day.schedule.warnings).toEqual([]);
  });

  it('is reported when the drive gets there after it', async () => {
    const { user, trip, visits, plans } = setup();
    db.prepare("UPDATE day_assignments SET assignment_end_time = '09:30' WHERE id = ?").run(visits[1].id);

    const { calculated } = await plans.calculate(trip.id, user.id);

    expect(calculated.days[0].schedule.warnings).toEqual([{ index: 1, code: 'missedLeave', minutes: 30 }]);
    expect(calculated.days[0].schedule.entries[1]).toMatchObject({ arrival: '10:00', departure: '10:00' });
  });

  it('leaves a stop without one to its stay', async () => {
    const { user, trip, plans } = setup();

    const { calculated } = await plans.calculate(trip.id, user.id);

    expect(calculated.days[0].schedule.entries[1]).toMatchObject({ arrival: '10:00', departure: '10:30' });
    expect(calculated.days[0].stops[1].leaveAt).toBeNull();
  });
});

describe('a booked night on the road trip (#2410)', () => {
  // The night flag comes off the planning SELECT (stay.id), not off a row the tests
  // hand the service, so a column dropped from the statement would flip every stop
  // to a night here and nowhere else.
  it('marks the stop the night is booked at, and a day that is only its night stands among the days', async () => {
    const { user, trip, plans } = setup();
    const arrival = createDay(db, trip.id);
    const hotel = createPlace(db, trip.id, { name: 'Rostock', lat: 54.09, lng: 12.1 });
    createDayAssignment(db, arrival.id, hotel.id);
    createDayAccommodation(db, trip.id, hotel.id, arrival.id, arrival.id, { check_in: '15:00' });

    const { context, calculated } = await plans.calculate(trip.id, user.id);

    expect(context.visits.map((v) => [v.name, v.stay_id !== null])).toEqual([
      ['Hamburg', false],
      ['Lueneburg', false],
      ['Celle', false],
      ['Rostock', true],
    ]);
    expect(calculated.quietDays).toEqual([]);
    expect(calculated.days.map((d) => d.dayId)).toContain(arrival.id);
    const night = calculated.days.find((d) => d.dayId === arrival.id)!;
    expect(night.stops.map((s) => [s.name, s.night])).toEqual([['Rostock', true]]);
    expect(night.legs).toEqual([]);
    expect(night.schedule.entries[0]).toMatchObject({ arrival: '15:00', anchored: true });
  });

  it('files a lone stop that is no night under the quiet days', async () => {
    const { user, trip, plans } = setup();
    const quiet = createDay(db, trip.id);
    const museum = createPlace(db, trip.id, { name: 'Museum', lat: 54.09, lng: 12.1 });
    createDayAssignment(db, quiet.id, museum.id);

    const { calculated } = await plans.calculate(trip.id, user.id);

    expect(calculated.days.map((d) => d.dayId)).not.toContain(quiet.id);
    expect(calculated.quietDays.map((d) => d.dayId)).toEqual([quiet.id]);
  });
});

describe('a booking the traveller rides (#2428)', () => {
  function withFlight(dayId: number, tripId: number, over: { end_day_id?: number; dep?: string; arr?: string } = {}) {
    const result = db
      .prepare(
        `INSERT INTO reservations (trip_id, title, type, day_id, end_day_id, reservation_time, reservation_end_time)
         VALUES (?, ?, 'flight', ?, ?, ?, ?)`,
      )
      .run(tripId, 'LH 2020 HAM → MUC', dayId, over.end_day_id ?? dayId, over.dep ?? '13:20', over.arr ?? '14:30');
    const id = Number(result.lastInsertRowid);
    const endpoint = db.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    endpoint.run(id, 'from', 0, 'Hamburg Airport', 'HAM', 53.63, 9.99);
    endpoint.run(id, 'to', 1, 'Munich Airport', 'MUC', 48.35, 11.78);
    return id;
  }

  it('seats the terminals in the day and never asks the router for the ride', async () => {
    const { user, trip, visits, plans } = setup();
    db.prepare("UPDATE day_assignments SET assignment_time = '10:00' WHERE id = ?").run(visits[1].id);
    // Pinned to the minute the drive reaches it anyway, so the clock alone seats the
    // flight here. Untimed, Celle lies south of Lueneburg with the airport north of both,
    // and the flight would go where it adds the least road (#2461, see below).
    db.prepare("UPDATE day_assignments SET assignment_time = '15:30' WHERE id = ?").run(visits[2].id);
    const day = db.prepare('SELECT day_id FROM day_assignments WHERE id = ?').get(visits[0].id) as { day_id: number };
    const flightId = withFlight(day.day_id, trip.id);

    const { context, calculated } = await plans.calculate(trip.id, user.id);

    expect(context.carriers).toHaveLength(1);
    expect(context.carriers[0].endpoints).toHaveLength(2);
    const card = calculated.days[0];
    // Behind Lueneburg (10:00), before Celle (15:30): the day plan's own seat.
    expect(card.stops.map((s) => s.carrier?.role ?? s.name)).toEqual(['Hamburg', 'Lueneburg', 'departure', 'arrival', 'Celle']);
    const departure = card.stops[2];
    expect(departure.carrier).toMatchObject({ reservationId: flightId, type: 'flight', code: 'HAM', at: '13:20' });
    expect(departure.assignmentId).toBeLessThan(-2_000_000_000);
    // The ride is a leg of the booking's minutes with no road under it; the roads to
    // and from the terminals were routed like any other leg.
    expect(card.legs.map((l) => [l?.mode, l?.duration])).toEqual([
      ['driving', 3600],
      ['driving', 3600],
      ['flight', 70 * 60],
      ['driving', 3600],
    ]);
    expect(card.legs[2]?.distance).toBe(0);
    // Reached an hour ahead of the flight, off on the timetable, landed on the timetable.
    expect(card.schedule.entries.map((e) => [e.arrival, e.departure])).toEqual([
      ['09:00', '09:00'],
      ['10:00', '10:30'],
      ['12:20', '13:20'],
      ['14:30', '14:30'],
      ['15:30', '16:00'],
    ]);
    // The day's figures are the drive's: three roads of 60 km, no flight in them.
    expect(card.distance).toBe(180_000);
    expect(calculated.totalStops).toBe(3);
  });

  it('lets a booking without located terminals fall through, a hire car without a desk among them', async () => {
    const { user, trip, visits, plans } = setup();
    const day = db.prepare('SELECT day_id FROM day_assignments WHERE id = ?').get(visits[0].id) as { day_id: number };
    db.prepare("INSERT INTO reservations (trip_id, title, type, day_id) VALUES (?, 'Hire car', 'car', ?)").run(trip.id, day.day_id);
    db.prepare("INSERT INTO reservations (trip_id, title, type, day_id, reservation_time) VALUES (?, 'Somewhere', 'train', ?, '11:00')").run(trip.id, day.day_id);
    db.prepare("INSERT INTO reservations (trip_id, title, type, day_id, reservation_time) VALUES (?, 'Cab', 'taxi', ?, '11:00')").run(trip.id, day.day_id);

    const { context, calculated } = await plans.calculate(trip.id, user.id);

    expect(context.carriers.map((c) => c.type).sort()).toEqual(['car', 'train']);
    expect(calculated.days[0].stops.every((s) => !s.carrier)).toBe(true);
  });

  it("puts a hire car's desks on the road: the pick-up opens the day, the return closes it, one run through both", async () => {
    const { user, trip, visits, plans } = setup();
    db.prepare("UPDATE day_assignments SET assignment_time = '10:00' WHERE id = ?").run(visits[1].id);
    db.prepare("UPDATE day_assignments SET assignment_time = '12:00' WHERE id = ?").run(visits[2].id);
    const day = db.prepare('SELECT day_id FROM day_assignments WHERE id = ?').get(visits[0].id) as { day_id: number };
    const result = db
      .prepare(
        `INSERT INTO reservations (trip_id, title, type, day_id, end_day_id, reservation_time, reservation_end_time)
         VALUES (?, 'Sixt', 'car', ?, ?, '08:00', '18:00')`,
      )
      .run(trip.id, day.day_id, day.day_id);
    const carId = Number(result.lastInsertRowid);
    const endpoint = db.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    endpoint.run(carId, 'from', 0, 'Sixt Hauptbahnhof', null, 53.55, 10.0);
    endpoint.run(carId, 'to', 1, 'Sixt Airport', 'HAM', 53.63, 9.99);
    const router = hourlyRouter();
    const service = new RoadtripPlanService(
      new DatabaseService(db),
      { getUserSettings: () => ({}) } as never,
      { read: () => ({}) } as never,
      router as never,
      { listForTrip: () => [], tracksForTrip: () => [] } as never,
      { list: () => [] } as never,
    );

    const { calculated } = await service.calculate(trip.id, user.id);

    const card = calculated.days[0];
    expect(card.stops.map((s) => s.carrier?.role ?? s.name)).toEqual(['pickup', 'Hamburg', 'Lueneburg', 'Celle', 'return']);
    expect(card.stops[0].carrier).toMatchObject({ reservationId: carId, type: 'car', at: '08:00' });
    expect(card.stops[4].carrier).toMatchObject({ role: 'return', code: 'HAM', at: '18:00' });
    // One road, desk to desk: no ride, no seam, one routing run.
    expect(router.route).toHaveBeenCalledTimes(1);
    expect(card.legs.map((l) => l?.mode)).toEqual(['driving', 'driving', 'driving', 'driving']);
    expect(card.schedule.entries[0]).toMatchObject({ arrival: '08:00', departure: '08:00' });
    expect(card.distance).toBe(240_000);
    expect(calculated.totalStops).toBe(3);
  });
});

/**
 * The crossing from the report behind #2461: Amsterdam and Newcastle on one day, neither
 * with a clock, and a ferry from IJmuiden to the Port of Tyne. A day sailing here, so the
 * drive on from the far pier ends before midnight and the one-day trip stays one card.
 */
describe('a ferry across the day, and one on no day (#2461)', () => {
  function crossing() {
    const { user } = createUser(db);
    const trip = createTrip(db, user.id);
    const day = createDay(db, trip.id);
    for (const [name, lat, lng] of [
      ['Amsterdam', 52.3731, 4.8926],
      ['Newcastle', 54.9783, -1.6178],
    ] as const) {
      createDayAssignment(db, day.id, createPlace(db, trip.id, { name, lat, lng }).id);
    }
    const router = hourlyRouter();
    const plans = new RoadtripPlanService(
      new DatabaseService(db),
      { getUserSettings: () => ({}) } as never,
      { read: () => ({}) } as never,
      router as never,
      { listForTrip: () => [], tracksForTrip: () => [] } as never,
      { list: () => [] } as never,
    );
    return { user, trip, day, router, plans };
  }

  function withFerry(tripId: number, dayId: number | null, title: string, located = true): number {
    const id = Number(
      db
        .prepare(
          `INSERT INTO reservations (trip_id, title, type, day_id, end_day_id, reservation_time, reservation_end_time)
           VALUES (?, ?, 'ferry', ?, ?, '09:30', '15:00')`,
        )
        .run(tripId, title, dayId, dayId).lastInsertRowid,
    );
    if (located) {
      const endpoint = db.prepare(
        'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
      );
      endpoint.run(id, 'from', 0, 'IJmuiden', null, 52.4581, 4.5879);
      endpoint.run(id, 'to', 1, 'Port of Tyne', null, 54.9925, -1.4522);
    }
    return id;
  }

  it('drives to the pier and on from the far one, and never overland between the two shores', async () => {
    const { user, trip, day, router, plans } = crossing();
    withFerry(trip.id, day.id, 'IJmuiden to Newcastle');

    const { calculated, undatedRides } = await plans.calculate(trip.id, user.id);

    const card = calculated.days[0];
    // By the clock alone the ferry closed the day: Amsterdam to Newcastle overland, back
    // to IJmuiden, and only then the crossing.
    expect(card.stops.map((s) => s.carrier?.role ?? s.name)).toEqual(['Amsterdam', 'departure', 'arrival', 'Newcastle']);
    expect(card.legs.map((l) => l?.mode)).toEqual(['driving', 'ferry', 'driving']);
    // Two roads, one to each side of the crossing, and nothing between the two cities.
    expect(router.route).toHaveBeenCalledTimes(2);
    expect(card.distance).toBe(120_000);
    expect(undatedRides).toEqual([]);
  });

  it('names a located ride on no day, and the tool answers with the same list', async () => {
    const { user, trip, day, plans } = crossing();
    const undated = withFerry(trip.id, null, 'Ferry without a date');
    withFerry(trip.id, day.id, 'Ferry on the day');
    withFerry(trip.id, null, 'Ferry without terminals', false);
    db.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Dinner', 'restaurant')").run(trip.id);

    const plan = await plans.calculate(trip.id, user.id);

    expect(plan.undatedRides).toEqual([{ id: undated, type: 'ferry', title: 'Ferry without a date' }]);
    // It is on the drive nowhere, which is why it is named.
    expect(plan.context.carriers.map((c) => c.id)).not.toContain(undated);
    expect(plan.calculated.days.flatMap((d) => d.stops).some((s) => s.carrier?.reservationId === undated)).toBe(false);

    const tool = new RoadtripPlanningMcp(plans, {} as never, {} as never);
    const answer = await tool.calculate({ tripId: trip.id, includeGeometry: false }, { userId: user.id } as McpContext);
    const body = JSON.parse(answer.content[0].text as string);
    expect(body.undatedRides).toEqual(plan.undatedRides);
    expect(body.complete).toBe(true);
  });
});

/**
 * A booked night at both ends of the days around it, read from the planning SELECTs.
 *
 * The same two trips as the rule's own cases in shared (nightBookends.spec.ts, ROADTRIP-
 * BOOKENDS-001..005) with the same expected days, so the server's plan and the browser's
 * cannot drift apart: the stays come off `context.stays`, the rule is the shared one, and
 * only the router is a stand-in. Off unless the trip switches it on.
 */
describe('a booked night at both ends of its days', () => {
  const GETAWAY = { lat: -33.71, lng: 150.31 };
  const WALLINGA = { lat: -34.1, lng: 150.9 };
  const HOTEL = { lat: 45.07, lng: 7.68 };

  function trip(settings: RoadtripPreferences = { roadtrip_hotel_bookends: true }) {
    const { user } = createUser(db);
    const created = createTrip(db, user.id);
    const router = hourlyRouter();
    const plans = new RoadtripPlanService(
      new DatabaseService(db),
      { getUserSettings: () => ({}) } as never,
      { read: () => settings } as never,
      router as never,
      { listForTrip: () => [], tracksForTrip: () => [] } as never,
      { list: () => [] } as never,
    );
    return { user, trip: created, router, plans };
  }
  const visit = (tripId: number, dayId: number, name: string, at: { lat: number; lng: number }) => {
    const place = createPlace(db, tripId, { name, ...at });
    db.prepare('UPDATE places SET duration_minutes = 0 WHERE id = ?').run(place.id);
    return { place, assignment: createDayAssignment(db, dayId, place.id) };
  };
  const linkBooking = (tripId: number, stayId: number) =>
    Number(
      db
        .prepare("INSERT INTO reservations (trip_id, title, type, accommodation_id) VALUES (?, 'Motel', 'hotel', ?)")
        .run(tripId, stayId).lastInsertRowid,
    );
  const shape = (stops: RoadtripStop[]) =>
    stops.map((s) => (s.bookend ? `${s.bookend.phase}:${s.bookend.accommodationId}` : s.name));
  const lats = (router: ReturnType<typeof hourlyRouter>) =>
    router.route.mock.calls.map((call) => call[3].map((p: { lat: number }) => p.lat));

  /** A check-in with two places, then a transfer day that is only the next check-in. */
  function cam(settings?: RoadtripPreferences) {
    const t = trip(settings);
    const [d1, d2, d3] = [createDay(db, t.trip.id), createDay(db, t.trip.id), createDay(db, t.trip.id)];
    const getaway = visit(t.trip.id, d1.id, 'Getaway', GETAWAY);
    visit(t.trip.id, d1.id, 'Lookout', { lat: -33.73, lng: 150.35 });
    visit(t.trip.id, d1.id, 'Falls', { lat: -33.65, lng: 150.38 });
    const wallinga = visit(t.trip.id, d2.id, 'Wallinga', WALLINGA);
    const stayA = createDayAccommodation(db, t.trip.id, getaway.place.id, d1.id, d2.id, {
      check_in: '14:00',
      check_out: '10:00',
    });
    const stayB = createDayAccommodation(db, t.trip.id, wallinga.place.id, d2.id, d3.id, { check_in: '15:00' });
    return { ...t, days: [d1, d2, d3], stayA, stayB };
  }

  /** Three nights in one hotel with two places on every day before the check-out. */
  function simeon(settings?: RoadtripPreferences) {
    const t = trip(settings);
    const days = [1, 2, 3, 4].map(() => createDay(db, t.trip.id));
    const h = visit(t.trip.id, days[0].id, 'H', HOTEL);
    (
      [
        [0, 'P1', 45.1],
        [0, 'P2', 45.2],
        [1, 'P3', 45.3],
        [1, 'P4', 45.4],
        [2, 'P5', 45.5],
        [2, 'P6', 45.6],
      ] as const
    ).forEach(([day, name, lat]) => visit(t.trip.id, days[day].id, name, { lat, lng: 7.5 }));
    const stay = createDayAccommodation(db, t.trip.id, h.place.id, days[0].id, days[3].id, { check_in: '15:00' });
    return { ...t, days, stay };
  }

  it('seats the check-in day back at the stay and starts the transfer day there, as the rule in shared does', async () => {
    const { user, trip: created, router, plans, days, stayA } = cam();
    const reservationId = linkBooking(created.id, stayA.id);
    linkBooking(created.id, stayA.id);

    const { calculated, failures } = await plans.calculate(created.id, user.id);

    expect(calculated.days.map((d) => shape(d.stops))).toEqual([
      ['Getaway', 'Lookout', 'Falls', `evening:${stayA.id}`],
      [`morning:${stayA.id}`, 'Wallinga'],
    ]);
    const [back, out] = [calculated.days[0].stops[3], calculated.days[1].stops[0]];
    expect(back.bookend).toEqual({
      phase: 'evening',
      accommodationId: stayA.id,
      reservationId,
      checkingOut: false,
      checkingIn: true,
      checkOut: null,
      checkIn: '14:00',
    });
    expect(back).toMatchObject({ name: 'Getaway', lat: GETAWAY.lat, lng: GETAWAY.lng, stopType: 'hotel', time: null });
    expect(back.assignmentId).toBe(bookendAssignmentId(days[0].id, 'evening'));
    expect(out.bookend).toMatchObject({ phase: 'morning', checkingOut: true, checkOut: '10:00', reservationId });
    // The check-out is a label: the drive leaves when it must to make the 15:00 check-in.
    expect(calculated.days[1].schedule.entries.map((e) => [e.arrival, e.departure])).toEqual([
      ['14:00', '14:00'],
      ['15:00', expect.any(String)],
    ]);
    // One run a day, the hotel legs inside it, and the check-out day is no card.
    expect(lats(router)).toEqual([
      [GETAWAY.lat, -33.73, -33.65, GETAWAY.lat],
      [GETAWAY.lat, WALLINGA.lat],
    ]);
    expect(calculated.days.map((d) => d.distance)).toEqual([180_000, 60_000]);
    expect(calculated.totalStops).toBe(4);
    expect(failures).toEqual([]);

    // calculate_roadtrip hands the assistant the same stops.
    const tool = new RoadtripPlanningMcp(plans, {} as never, {} as never);
    const answer = await tool.calculate({ tripId: created.id, includeGeometry: false }, { userId: user.id } as McpContext);
    const body = JSON.parse(answer.content[0].text as string);
    expect(body.days[1].stops[0].bookend).toMatchObject({ phase: 'morning', accommodationId: stayA.id });
  });

  it('asks the router nothing for a night spent at one hotel when the days are connected', async () => {
    const { user, trip: created, router, plans } = cam({ roadtrip_hotel_bookends: true, roadtrip_connect_days: true });

    const { calculated } = await plans.calculate(created.id, user.id);

    // The two day runs, and no seam from the Getaway to the Getaway.
    expect(router.route).toHaveBeenCalledTimes(2);
    expect(calculated.days[1].arrivingLeg).toBeFalsy();
    expect(calculated.totalDistance).toBe(240_000);
  });

  it('starts and ends every day between the nights at the hotel, and leaves the check-out day undriven', async () => {
    const { user, trip: created, router, plans, days, stay } = simeon();

    const { calculated } = await plans.calculate(created.id, user.id);

    expect(calculated.days.map((d) => shape(d.stops))).toEqual([
      ['H', 'P1', 'P2', `evening:${stay.id}`],
      [`morning:${stay.id}`, 'P3', 'P4', `evening:${stay.id}`],
      [`morning:${stay.id}`, 'P5', 'P6', `evening:${stay.id}`],
    ]);
    expect(calculated.days[1].stops[0].bookend).toMatchObject({ checkingOut: false, checkingIn: false, checkOut: null });
    // The evening keeps the index the next stored stop would have.
    expect(calculated.days[1].stops[3].ownerIndex).toBe(2);
    expect(calculated.days.map((d) => d.dayId)).not.toContain(days[3].id);
    expect(router.route).toHaveBeenCalledTimes(3);
    expect(lats(router)[1]).toEqual([HOTEL.lat, 45.3, 45.4, HOTEL.lat]);
  });

  it('drives out of the morning hotel the way the first place is reached from it, as the browser and the day plan do', async () => {
    const { user, trip: created, router, plans } = simeon();
    db.prepare(
      "UPDATE day_assignments SET incoming_leg_transport_mode = 'walking' WHERE place_id = (SELECT id FROM places WHERE trip_id = ? AND name = 'P3')",
    ).run(created.id);

    const { calculated } = await plans.calculate(created.id, user.id);

    expect(calculated.days[1].stops[0]).toMatchObject({ legMode: 'walking', bookend: { phase: 'morning' } });
    const runs = router.route.mock.calls.map((call) => [call[4], call[3].map((p: { lat: number }) => p.lat)]);
    // The hotel's leg on foot on its own, the rest of the day in the day's own mode.
    expect(runs).toContainEqual(['walking', [HOTEL.lat, 45.3]]);
    expect(runs).toContainEqual(['driving', [45.3, 45.4, HOTEL.lat]]);
    // The other mornings are reached no particular way and stay in one run.
    expect(runs).toContainEqual(['driving', [HOTEL.lat, 45.5, 45.6, HOTEL.lat]]);
  });

  it('drives the stored days while the trip has it off, and a preview can switch it either way', async () => {
    const off = simeon({});
    const stored = await off.plans.calculate(off.trip.id, off.user.id);
    expect(stored.calculated.days.map((d) => shape(d.stops))).toEqual([
      ['H', 'P1', 'P2'],
      ['P3', 'P4'],
      ['P5', 'P6'],
    ]);

    const preview = await off.plans.calculate(off.trip.id, off.user.id, { roadtrip_hotel_bookends: true });
    expect(preview.calculated.days[1].stops.map((s) => s.bookend?.phase ?? null)).toEqual(['morning', null, null, 'evening']);
    expect(preview.preferences.roadtrip_hotel_bookends).toBe(true);

    const on = simeon();
    const without = await on.plans.calculate(on.trip.id, on.user.id, { roadtrip_hotel_bookends: false });
    expect(without.calculated.days.flatMap((d) => d.stops).some((s) => s.bookend)).toBe(false);
  });

  it('reads every stay with its place, its nights and its earliest booking into the context', () => {
    const { user, trip: created, plans, days, stayA, stayB } = cam();
    const first = linkBooking(created.id, stayA.id);
    linkBooking(created.id, stayA.id);

    const context = plans.context(created.id, user.id);

    expect(context.stays).toEqual([
      {
        id: stayA.id,
        place_id: expect.any(Number),
        start_day_id: days[0].id,
        end_day_id: days[1].id,
        check_in: '14:00',
        check_out: '10:00',
        place_name: 'Getaway',
        place_lat: GETAWAY.lat,
        place_lng: GETAWAY.lng,
        reservation_id: first,
      },
      expect.objectContaining({ id: stayB.id, place_name: 'Wallinga', check_in: '15:00', reservation_id: null }),
    ]);
  });

  it('names the hotel in the failures of a run it pushes past the router’s waypoint limit', async () => {
    const t = trip({});
    const [d1, d2] = [createDay(db, t.trip.id), createDay(db, t.trip.id)];
    for (let i = 0; i < 100; i++) visit(t.trip.id, d1.id, `Stop ${i}`, { lat: 40 + i * 0.01, lng: 5 });
    const hotel = createPlace(db, t.trip.id, { name: 'Tonight', ...HOTEL });
    createDayAccommodation(db, t.trip.id, hotel.id, d1.id, d2.id);

    // A hundred stored stops are one run the router takes.
    const stored = await t.plans.calculate(t.trip.id, t.user.id);
    expect(stored.failures).toEqual([]);

    // Tonight's hotel is the hundred and first waypoint.
    const seated = await t.plans.calculate(t.trip.id, t.user.id, { roadtrip_hotel_bookends: true });
    expect(seated.failures).toHaveLength(100);
    expect(seated.failures[99]).toMatchObject({
      toAssignmentId: bookendAssignmentId(d1.id, 'evening'),
      reason: 'More than 100 waypoints in this run.',
    });
    expect(seated.failures[99].toAssignmentId).toBeLessThan(-6_000_000_000);
  });

  /**
   * Trip 45 on the dev instance: a night in Hamburg, then LH 2078 to Munich at 15:15 on the
   * day the Munich hotel is checked into from 15:00, the booking's slot seeded behind it.
   */
  function trip45(settings?: RoadtripPreferences) {
    const t = trip(settings);
    const days = [1, 2, 3, 4, 5].map(() => createDay(db, t.trip.id));
    const atlantic = visit(t.trip.id, days[0].id, 'Hotel Atlantic Hamburg', { lat: 53.5573, lng: 10.0056 });
    const munich = visit(t.trip.id, days[2].id, 'Hotel Bayerischer Hof', { lat: 48.1403, lng: 11.5732 });
    const stays = { check_in: '15:00', check_out: '11:00' };
    const hamburgStay = createDayAccommodation(db, t.trip.id, atlantic.place.id, days[0].id, days[2].id, stays);
    createDayAccommodation(db, t.trip.id, munich.place.id, days[2].id, days[4].id, stays);
    const flight = Number(
      db
        .prepare(
          `INSERT INTO reservations (trip_id, title, type, day_id, end_day_id, reservation_time, reservation_end_time, day_plan_position)
           VALUES (?, 'LH 2078 HAM-MUC', 'flight', ?, ?, '2026-11-04T15:15', '2026-11-04T17:20', 0.5)`,
        )
        .run(t.trip.id, days[2].id, days[2].id).lastInsertRowid,
    );
    const endpoint = db.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    endpoint.run(flight, 'from', 0, 'Hamburg (HAM)', 'HAM', 53.630402, 9.98823);
    endpoint.run(flight, 'to', 1, 'Munich (MUC)', 'MUC', 48.353802, 11.7861);
    return { ...t, flightDay: days[2], hamburgStay };
  }

  it('flies the day of the Munich check-in out of Hamburg and ends it at the Munich hotel, with no road between the cities (trip 45)', async () => {
    // Every run the router is asked for lies north of 53 or south of 49.
    const oneCity = (router: ReturnType<typeof hourlyRouter>) =>
      lats(router).every((run) => run.every((lat: number) => lat > 53) || run.every((lat: number) => lat < 49));

    const off = trip45({});
    const stored = await off.plans.calculate(off.trip.id, off.user.id);
    const offDay = stored.calculated.days.find((d) => d.dayId === off.flightDay.id)!;
    expect(shape(offDay.stops)).toEqual(['Hamburg (HAM)', 'Munich (MUC)', 'Hotel Bayerischer Hof']);
    // At the airport by the check-in, at the hotel an hour after landing, and late for nothing.
    expect(offDay.schedule.entries.map((e) => e.arrival)).toEqual(['14:15', '17:20', '18:20']);
    expect(offDay.schedule.warnings).toEqual([]);
    expect(oneCity(off.router)).toBe(true);

    const on = trip45();
    const seated = await on.plans.calculate(on.trip.id, on.user.id);
    const onDay = seated.calculated.days.find((d) => d.dayId === on.flightDay.id)!;
    expect(shape(onDay.stops)).toEqual([
      `morning:${on.hamburgStay.id}`,
      'Hamburg (HAM)',
      'Munich (MUC)',
      'Hotel Bayerischer Hof',
    ]);
    expect(oneCity(on.router)).toBe(true);
    expect(seated.failures).toEqual([]);
  });

  it('drives no road between two stays on a day a flight saved without its airports moves the traveller (#2476)', async () => {
    const { user, trip: created, router, plans, days, stayA } = cam();
    db.prepare(
      "INSERT INTO reservations (trip_id, title, type, day_id, end_day_id, reservation_time) VALUES (?, 'Flight', 'flight', ?, ?, '12:00')",
    ).run(created.id, days[1].id, days[1].id);

    const { calculated, failures } = await plans.calculate(created.id, user.id);

    expect(calculated.days.map((d) => shape(d.stops))).toEqual([
      ['Getaway', 'Lookout', 'Falls', `evening:${stayA.id}`],
      ['Wallinga'],
    ]);
    expect(lats(router)).toEqual([[GETAWAY.lat, -33.73, -33.65, GETAWAY.lat]]);
    expect(failures).toEqual([]);
  });
});
