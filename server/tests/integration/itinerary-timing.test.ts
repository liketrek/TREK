import { buildApp } from '../../src/bootstrap';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { authCookie } from '../helpers/auth';
import { makeDayAssignment } from '../helpers/factories/itinerary';
import { makePlace } from '../helpers/factories/places';
import { makeReservation } from '../helpers/factories/reservations';
import { findRow, updateRows } from '../helpers/factories/rows';
import { makeDay, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;
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
async function fixture() {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id);
  const day = await makeDay(orm, trip.id);
  const place = await makePlace(orm, trip.id);
  const assignment = await makeDayAssignment(orm, day.id, place.id);
  return { user, trip, day, place, assignment };
}
describe('visit and day timing HTTP', () => {
  it('preserves an explicit clear and zero stay for one visit without changing place or booking defaults', async () => {
    const f = await fixture();
    const second = await makeDayAssignment(orm, f.day.id, f.place.id, { order_index: 1 });
    await updateRows(orm, Places, { id: f.place.id }, { place_time: '09:00', end_time: '10:00', duration_minutes: 60 });
    const booking = await makeReservation(orm, f.trip.id);
    await updateRows(
      orm,
      Reservations,
      { id: booking.id },
      { place: f.place.id, reservation_time: '2027-01-01T11:00', reservation_end_time: '2027-01-01T12:00' },
    );
    const base = `/api/trips/${f.trip.id}/assignments/${f.assignment.id}`;
    const cleared = await request(app)
      .put(`${base}/time`)
      .set('Cookie', authCookie(f.user.id))
      .send({ place_time: null, end_time: null })
      .expect(200);
    expect(cleared.body.assignment).toMatchObject({
      times_explicit: true,
      assignment_time: null,
      place: { place_time: null, end_time: null },
    });
    const stayed = await request(app)
      .put(`${base}/stay`)
      .set('Cookie', authCookie(f.user.id))
      .send({ stay_minutes: 0 })
      .expect(200);
    expect(stayed.body.assignment.stay_minutes).toBe(0);
    const read = await request(app)
      .get(`/api/trips/${f.trip.id}/days`)
      .set('Cookie', authCookie(f.user.id))
      .expect(200);
    expect(read.body.days[0].assignments.find((a: { id: number }) => a.id === second.id)).toMatchObject({
      stay_minutes: null,
      times_explicit: false,
      place: { place_time: '09:00' },
    });
    expect(await findRow(orm, Places, { id: f.place.id })).toMatchObject({
      place_time: '09:00',
      end_time: '10:00',
      duration_minutes: 60,
    });
    expect(await findRow(orm, Reservations, { id: booking.id })).toMatchObject({
      reservation_time: '2027-01-01T11:00',
      reservation_end_time: '2027-01-01T12:00',
    });
    await request(app)
      .put(`${base}/stay`)
      .set('Cookie', authCookie(f.user.id))
      .send({ stay_minutes: null })
      .expect(200);
    expect(await findRow(orm, DayAssignments, { id: f.assignment.id })).toMatchObject({
      stay_minutes: null,
      times_explicit: 1,
    });
  });
  it('persists day timing and rejects foreign targets and invalid values', async () => {
    const f = await fixture();
    const timing = {
      enabled: true,
      start: '08:30',
      travel: [{ from: `assignment:${f.assignment.id}`, to: 'point:end', mode: 'walking', minutes: 0 }],
    };
    const url = `/api/trips/${f.trip.id}/days/${f.day.id}/timing`;
    const saved = await request(app).put(url).set('Cookie', authCookie(f.user.id)).send(timing).expect(200);
    expect(saved.body.day.timing).toEqual(timing);
    expect(saved.body.day).not.toHaveProperty('timing_json');
    const other = await makeTrip(orm, f.user.id);
    await request(app)
      .put(`/api/trips/${other.id}/days/${f.day.id}/timing`)
      .set('Cookie', authCookie(f.user.id))
      .send(timing)
      .expect(404);
    await request(app)
      .put(url)
      .set('Cookie', authCookie(f.user.id))
      .send({ ...timing, start: '25:00' })
      .expect(400);
    await request(app)
      .put(`/api/trips/${other.id}/assignments/${f.assignment.id}/stay`)
      .set('Cookie', authCookie(f.user.id))
      .send({ stay_minutes: 10 })
      .expect(404);
    await request(app)
      .put(`/api/trips/${f.trip.id}/assignments/${f.assignment.id}/stay`)
      .set('Cookie', authCookie(f.user.id))
      .send({ stay_minutes: -1 })
      .expect(400);
    expect(await findRow(orm, Days, { id: f.day.id })).toMatchObject({ timing_json: JSON.stringify(timing) });
  });
  it('copies per-visit inputs and remaps manual travel endpoints', async () => {
    const f = await fixture();
    const second = await makeDayAssignment(orm, f.day.id, f.place.id, { order_index: 1 });
    await updateRows(
      orm,
      DayAssignments,
      { id: f.assignment.id },
      { stay_minutes: 0, times_explicit: 1, assignment_time: null },
    );
    const timing = {
      enabled: true,
      start: '08:30',
      travel: [{ from: `assignment:${f.assignment.id}`, to: `assignment:${second.id}`, mode: 'walking', minutes: 12 }],
    };
    await updateRows(orm, Days, { id: f.day.id }, { timing_json: JSON.stringify(timing) });
    const copied = await request(app)
      .post(`/api/trips/${f.trip.id}/copy`)
      .set('Cookie', authCookie(f.user.id))
      .send({})
      .expect(201);
    const read = await request(app)
      .get(`/api/trips/${copied.body.trip.id}/days`)
      .set('Cookie', authCookie(f.user.id))
      .expect(200);
    const day = read.body.days[0];
    expect(day.assignments[0]).toMatchObject({ stay_minutes: 0, times_explicit: true, assignment_time: null });
    expect(day.timing).toEqual({
      ...timing,
      travel: [
        { ...timing.travel[0], from: `assignment:${day.assignments[0].id}`, to: `assignment:${day.assignments[1].id}` },
      ],
    });
  });
});
