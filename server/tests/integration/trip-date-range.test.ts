/**
 * What a new date range does to everything planned on a trip's days (#3119).
 * Covers TRIP-RANGE-001 to TRIP-RANGE-009.
 *
 * Each case builds the same trip, Sun 10 to Thu 14 May 2026, with places, notes,
 * timed and untimed bookings, a booking over two days, a flight leg, a booking's
 * place in a day's order and two stays, one of them checking out on the last day.
 * It then reads all of it in calendar terms (the date of the day each row hangs
 * on, plus its own times) before and after the save, so a row that moves to
 * another day shows up as a changed date, whatever the day ids do.
 */
import { buildApp } from '../../src/bootstrap';
import { DayAccommodations } from '../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { DayNotes } from '../../src/db/entities/DayNotes.entity';
import { ReservationDayPositions } from '../../src/db/entities/ReservationDayPositions.entity';
import { ReservationEndpoints } from '../../src/db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { RoadtripDayBoundaries } from '../../src/db/entities/RoadtripDayBoundaries.entity';
import { VacayEntries } from '../../src/db/entities/VacayEntries.entity';
import { legacyBoundIntegerText } from '../../src/nest/common/row-id';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
import { makeDayAccommodation, makeDayAssignment, makeDayNote } from '../helpers/factories/itinerary';
import { makePlace } from '../helpers/factories/places';
import { makeReservation, makeReservationEndpoint } from '../helpers/factories/reservations';
import { findRows, insertRow } from '../helpers/factories/rows';
import { makeTrip, readTripDays } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { makeVacayEntry, makeVacayPlan } from '../helpers/factories/vacay';
import { resetDatabase } from '../helpers/reset-database';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

let nestApp: INestApplication;
let app: Application;
let orm: FactoryOrm;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});
beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
});
afterAll(async () => {
  await nestApp.close();
});

const START = '2026-05-10';
const END = '2026-05-14';

/** The trip of every case, with something on each of its five days. */
async function plannedTrip() {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { start_date: START, end_date: END });
  const days = await readTripDays(orm, trip.id);
  const day = (date: string): number => {
    const found = days.find((d) => d.date === date);
    if (!found) throw new Error(`no day on ${date}`);
    return found.id;
  };
  const [d10, d11, d12, d13, d14] = ['10', '11', '12', '13', '14'].map((d) => day(`2026-05-${d}`));
  const museum = await makePlace(orm, trip.id, { name: 'Museum' });
  const market = await makePlace(orm, trip.id, { name: 'Market' });
  const beach = await makePlace(orm, trip.id, { name: 'Beach' });
  const hotel = await makePlace(orm, trip.id, { name: 'Harbour Hotel' });
  const lodge = await makePlace(orm, trip.id, { name: 'Lake Lodge' });

  await makeDayAssignment(orm, d10, museum.id, { assignment_time: '10:00', assignment_end_time: '12:00' });
  await makeDayAssignment(orm, d12, market.id, { assignment_time: '09:00' });
  await makeDayAssignment(orm, d14, beach.id, { assignment_time: '15:00' });
  await makeDayNote(orm, d11, trip.id, { text: 'Pick up the car', time: '08:00' });
  await makeDayNote(orm, d14, trip.id, { text: 'Return the car', time: '18:00' });

  const flight = await makeReservation(orm, trip.id, {
    title: 'Flight out',
    type: 'flight',
    day: d10,
    reservation_time: `${START}T08:30`,
  });
  await makeReservationEndpoint(orm, flight.id, { role: 'from', local_date: START, local_time: '08:30' });
  const train = await makeReservation(orm, trip.id, {
    title: 'Night train',
    type: 'train',
    day: d12,
    endDay: d13,
    reservation_time: '2026-05-12T22:15',
    reservation_end_time: '2026-05-13T07:40',
  });
  await insertRow(orm, ReservationDayPositions, { reservation: train.id, day: d12, position: 1.5 });
  await makeReservation(orm, trip.id, { title: 'Cooking class', type: 'event', day: d13 });
  await makeReservation(orm, trip.id, {
    title: 'Farewell dinner',
    type: 'restaurant',
    day: d14,
    reservation_time: `${END}T19:30`,
  });

  const harbour = await makeDayAccommodation(orm, trip.id, hotel.id, d10, d12, { check_in: '15:00' });
  await makeReservation(orm, trip.id, {
    title: 'Harbour Hotel booking',
    type: 'hotel',
    day: d10,
    reservation_time: `${START}T15:00`,
    accommodation_id: legacyBoundIntegerText(harbour.id),
  });
  await makeDayAccommodation(orm, trip.id, lodge.id, d12, d14, { check_in: '16:00' });

  return { user, trip };
}

/**
 * Everything on the trip as it reads on a calendar: the date of the day each row
 * hangs on and its own times, keyed by a name, never by a day id.
 */
async function calendar(tripId: number): Promise<Record<string, unknown>> {
  const days = await readTripDays(orm, tripId);
  const dateOf = new Map(days.map((d) => [d.id, d.date ?? null]));
  const on = (dayId: number | null | undefined) => (dayId == null ? null : (dateOf.get(dayId) ?? 'gone'));
  const out: Record<string, unknown> = {};

  const dayIds = days.map((d) => d.id);
  for (const a of await findRows(orm, DayAssignments, { day: { $in: dayIds } })) {
    const kind = a.accommodation_id ? 'stay stop' : 'place';
    out[`${kind} ${a.place_id}`] = [on(a.day_id), a.assignment_time ?? null, a.assignment_end_time ?? null];
  }
  for (const n of await findRows(orm, DayNotes, { trip: tripId })) {
    out[`note ${n.text}`] = [on(n.day_id), n.time ?? null];
  }
  const bookings = await findRows(orm, Reservations, { trip: tripId });
  const titleOf = new Map(bookings.map((r) => [r.id, r.title]));
  for (const r of bookings) {
    out[`booking ${r.title}`] = [
      on(r.day_id),
      on(r.end_day_id),
      r.reservation_time ?? null,
      r.reservation_end_time ?? null,
    ];
  }
  const bookingIds = [...titleOf.keys()];
  for (const ep of await findRows(orm, ReservationEndpoints, { reservation: { $in: bookingIds } })) {
    out[`leg ${titleOf.get(ep.reservation_id)} ${ep.role}`] = [ep.local_date ?? null, ep.local_time ?? null];
  }
  for (const pos of await findRows(orm, ReservationDayPositions, { reservation: { $in: bookingIds } })) {
    out[`position ${titleOf.get(pos.reservation_id)}`] = [on(pos.day_id), pos.position];
  }
  for (const s of await findRows(orm, DayAccommodations, { trip: tripId })) {
    out[`stay ${s.place_id}`] = [on(s.start_day_id), on(s.end_day_id), s.check_in ?? null];
  }
  return out;
}

async function saveDates(userId: number, tripId: number, body: Record<string, unknown>) {
  const res = await request(app).put(`/api/trips/${tripId}`).set('Cookie', authCookie(userId)).send(body);
  expect(res.status).toBe(200);
}

async function dayDates(tripId: number) {
  return (await readTripDays(orm, tripId)).map((d) => d.date);
}

/** The same calendar, with every date it names moved by `delta` days. */
function shifted(before: Record<string, unknown>, delta: number): Record<string, unknown> {
  const move = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(move);
    if (typeof value !== 'string') return value;
    const m = /^(\d{4}-\d{2}-\d{2})(.*)$/.exec(value);
    if (!m) return value;
    const d = new Date(`${m[1]}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    return `${d.toISOString().slice(0, 10)}${m[2]}`;
  };
  return Object.fromEntries(Object.entries(before).map(([k, v]) => [k, move(v)]));
}

describe('a longer range keeps everything on its date (#3119)', () => {
  it('TRIP-RANGE-001: a day added before the start, bookings kept on their dates, moves nothing', async () => {
    const { user, trip } = await plannedTrip();
    const before = await calendar(trip.id);

    await saveDates(user.id, trip.id, { start_date: '2026-05-09', end_date: END, date_shift_mode: 'keep_bookings' });

    expect(await dayDates(trip.id)).toEqual(['2026-05-09', START, '2026-05-11', '2026-05-12', '2026-05-13', END]);
    expect(await calendar(trip.id)).toEqual(before);
  });

  it('TRIP-RANGE-002: the same without a mode, as the phone and MCP save it', async () => {
    const { user, trip } = await plannedTrip();
    const before = await calendar(trip.id);

    await saveDates(user.id, trip.id, { start_date: '2026-05-07', end_date: END });

    expect((await dayDates(trip.id)).slice(0, 4)).toEqual(['2026-05-07', '2026-05-08', '2026-05-09', START]);
    expect(await calendar(trip.id)).toEqual(before);
  });

  it('TRIP-RANGE-003: days added after the end, or at both ends, move nothing either', async () => {
    const { user, trip } = await plannedTrip();
    const before = await calendar(trip.id);

    await saveDates(user.id, trip.id, { start_date: START, end_date: '2026-05-16' });
    expect(await calendar(trip.id)).toEqual(before);

    await saveDates(user.id, trip.id, {
      start_date: '2026-05-08',
      end_date: '2026-05-17',
      date_shift_mode: 'keep_bookings',
    });
    expect((await dayDates(trip.id)).length).toBe(10);
    expect(await calendar(trip.id)).toEqual(before);
  });

  it('TRIP-RANGE-004: "shift everything" still moves the whole plan with the new start', async () => {
    const { user, trip } = await plannedTrip();
    const before = await calendar(trip.id);

    await saveDates(user.id, trip.id, { start_date: '2026-05-09', end_date: END, date_shift_mode: 'shift_all' });

    // Every day, booking, stay and leg sits one day earlier; the new last day is empty.
    expect(await calendar(trip.id)).toEqual(shifted(before, -1));
  });
});

describe('a moved or shorter range follows the positional rule the dialog warns about', () => {
  it('TRIP-RANGE-005: moving the trip a day later keeps the plans on their days and the bookings on their dates', async () => {
    const { user, trip } = await plannedTrip();
    const before = await calendar(trip.id);

    await saveDates(user.id, trip.id, { start_date: '2026-05-11', end_date: '2026-05-15' });

    const after = await calendar(trip.id);
    // The plans move with the days...
    expect(after['note Pick up the car']).toEqual(shifted(before, 1)['note Pick up the car']);
    expect(after['note Return the car']).toEqual(shifted(before, 1)['note Return the car']);
    // ...the timed bookings still in the range stay on their dates and times.
    expect(after['booking Farewell dinner']).toEqual(before['booking Farewell dinner']);
    expect(after['booking Night train']).toEqual(before['booking Night train']);
  });

  it('TRIP-RANGE-006: an earlier end removes only the last day and leaves the rest where it was', async () => {
    const { user, trip } = await plannedTrip();
    const before = await calendar(trip.id);

    await saveDates(user.id, trip.id, { start_date: START, end_date: '2026-05-13' });

    const after = await calendar(trip.id);
    expect(after['note Return the car']).toBeUndefined();
    expect(after['note Pick up the car']).toEqual(before['note Pick up the car']);
    expect(after['booking Night train']).toEqual(before['booking Night train']);
    expect(after['booking Flight out']).toEqual(before['booking Flight out']);
    expect(after['leg Flight out from']).toEqual(before['leg Flight out from']);
  });

  it('TRIP-RANGE-007: a later start takes the last day, as the dialog says, and keeps the bookings on their dates', async () => {
    const { user, trip } = await plannedTrip();
    const before = await calendar(trip.id);

    await saveDates(user.id, trip.id, { start_date: '2026-05-11', end_date: END });

    const after = await calendar(trip.id);
    expect(await dayDates(trip.id)).toEqual(['2026-05-11', '2026-05-12', '2026-05-13', END]);
    expect(after['note Return the car']).toBeUndefined();
    expect(after['note Pick up the car']).toEqual(shifted(before, 1)['note Pick up the car']);
    expect(after['booking Night train']).toEqual(before['booking Night train']);
  });
});

describe('what hangs on day numbers or dates outside the day rows follows the plan (#3119)', () => {
  /** A boundary on the days of 12 and 14 May, each after a stop of its own there. */
  async function roadTrip(tripId: number) {
    const days = await readTripDays(orm, tripId);
    const stop = await makePlace(orm, tripId, { name: 'Viewpoint' });
    const boundaryOn = async (date: string): Promise<[string, number]> => {
      const day = days.find((d) => d.date === date);
      if (!day) throw new Error(`no day on ${date}`);
      const a = await makeDayAssignment(orm, day.id, stop.id);
      await insertRow(orm, RoadtripDayBoundaries, {
        trip: tripId,
        day_number: day.day_number,
        fromAssignment: a.id,
        fraction: 0.5,
      });
      return [date, a.id];
    };
    return Object.fromEntries(await Promise.all(['2026-05-12', END].map(boundaryOn)));
  }

  /** Each boundary by the date of the day its number points at, with the stop it starts from. */
  async function boundaryDates(tripId: number) {
    const days = await readTripDays(orm, tripId);
    const rows = await findRows(orm, RoadtripDayBoundaries, { trip: tripId }, { day_number: 'asc' });
    return rows.map((b) => [days.find((d) => d.day_number === b.day_number)?.date ?? null, b.from_assignment_id]);
  }

  it('TRIP-RANGE-008: road trip day boundaries stay on their days when a day is added before the start', async () => {
    const { user, trip } = await plannedTrip();
    const stops = await roadTrip(trip.id);
    const expected = [
      ['2026-05-12', stops['2026-05-12']],
      [END, stops[END]],
    ];

    await saveDates(user.id, trip.id, { start_date: '2026-05-09', end_date: END, date_shift_mode: 'keep_bookings' });
    expect(await boundaryDates(trip.id)).toEqual(expected);

    // Both ends at once, then shifting everything: the boundaries go with their days either way.
    await saveDates(user.id, trip.id, { start_date: '2026-05-07', end_date: '2026-05-16' });
    expect(await boundaryDates(trip.id)).toEqual(expected);
    await saveDates(user.id, trip.id, {
      start_date: '2026-05-06',
      end_date: '2026-05-16',
      date_shift_mode: 'shift_all',
    });
    expect(await boundaryDates(trip.id)).toEqual([
      ['2026-05-11', stops['2026-05-12']],
      ['2026-05-13', stops[END]],
    ]);
  });

  it("TRIP-RANGE-009: the owner's leave days stay when days are only added, and still move with a moved trip", async () => {
    const { user, trip } = await plannedTrip();
    const plan = await makeVacayPlan(orm, user.id);
    await Promise.all(
      ['2026-05-11', '2026-05-12', '2026-05-13', END].map((date) => makeVacayEntry(orm, plan.id, user.id, date)),
    );
    const leave = async () =>
      (await findRows(orm, VacayEntries, { plan: plan.id, user: user.id }, { date: 'asc' })).map((e) => e.date);

    await saveDates(user.id, trip.id, { start_date: '2026-05-09', end_date: END, date_shift_mode: 'keep_bookings' });
    expect(await leave()).toEqual(['2026-05-11', '2026-05-12', '2026-05-13', END]);

    await saveDates(user.id, trip.id, { start_date: '2026-05-09', end_date: '2026-05-16' });
    expect(await leave()).toEqual(['2026-05-11', '2026-05-12', '2026-05-13', END]);

    // Shifting everything a day later moves the plan, and the leave with it.
    await saveDates(user.id, trip.id, {
      start_date: '2026-05-10',
      end_date: '2026-05-16',
      date_shift_mode: 'shift_all',
    });
    expect(await leave()).toEqual(['2026-05-12', '2026-05-13', END, '2026-05-15']);
  });
});
