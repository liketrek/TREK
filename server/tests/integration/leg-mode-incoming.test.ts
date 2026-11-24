/**
 * Migration test for incoming_leg_transport_mode on day_assignments, plus
 * read-path parity: the field must survive both the single-assignment
 * projection and the day-LIST projection.
 */
import { buildApp } from '../../src/bootstrap';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
import { makePlace } from '../helpers/factories/places';
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

// ─────────────────────────────────────────────────────────────────────────────
// Read-path parity (day-LIST endpoint) — mirrors the harness in
// tests/integration/assignments.test.ts verbatim.
// ─────────────────────────────────────────────────────────────────────────────

describe('incoming_leg_transport_mode read-path parity', () => {
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

  it('round-trips incoming_leg_transport_mode through the day-LIST endpoint', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id, { date: '2025-06-01' });
    const place = await makePlace(orm, trip.id, { name: 'Test Place' });

    const create = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    expect(create.status).toBe(201);
    const assignmentId = create.body.assignment.id;

    await updateRows(orm, DayAssignments, { id: assignmentId }, { incoming_leg_transport_mode: 'transit' });

    const res = await request(app).get(`/api/trips/${trip.id}/days`).set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    const foundDay = res.body.days.find((d: any) => d.id === day.id);
    const a = foundDay.assignments.find((x: any) => x.id === assignmentId);
    expect(a.incoming_leg_transport_mode).toBe('transit');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Write path — PUT .../transport gains `direction` (outgoing|incoming).
  // ───────────────────────────────────────────────────────────────────────────

  describe('PUT /assignments/:id/transport direction', () => {
    it('defaults to outgoing (back-compat)', async () => {
      const { user } = await makeUser(orm);
      const trip = await makeTrip(orm, user.id);
      const day = await makeDay(orm, trip.id, { date: '2025-06-01' });
      const place = await makePlace(orm, trip.id, { name: 'Test Place' });

      const create = await request(app)
        .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
        .set('Cookie', authCookie(user.id))
        .send({ place_id: place.id });
      const assignmentId = create.body.assignment.id;

      const res = await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'cycling' });
      expect(res.status).toBe(200);

      const row = await findRow(orm, DayAssignments, { id: assignmentId });
      expect(row?.leg_transport_mode).toBe('cycling');
      expect(row?.incoming_leg_transport_mode).toBeNull();
    });

    it("direction: 'incoming' writes the incoming column", async () => {
      const { user } = await makeUser(orm);
      const trip = await makeTrip(orm, user.id);
      const day = await makeDay(orm, trip.id, { date: '2025-06-01' });
      const place = await makePlace(orm, trip.id, { name: 'Test Place' });

      const create = await request(app)
        .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
        .set('Cookie', authCookie(user.id))
        .send({ place_id: place.id });
      const assignmentId = create.body.assignment.id;

      const res = await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'transit', direction: 'incoming' });
      expect(res.status).toBe(200);

      const row = await findRow(orm, DayAssignments, { id: assignmentId });
      expect(row?.incoming_leg_transport_mode).toBe('transit');
    });

    it('rejects an invalid direction with 400', async () => {
      const { user } = await makeUser(orm);
      const trip = await makeTrip(orm, user.id);
      const day = await makeDay(orm, trip.id, { date: '2025-06-01' });
      const place = await makePlace(orm, trip.id, { name: 'Test Place' });

      const create = await request(app)
        .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
        .set('Cookie', authCookie(user.id))
        .send({ place_id: place.id });
      const assignmentId = create.body.assignment.id;

      const res = await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'walking', direction: 'sideways' });
      expect(res.status).toBe(400);
    });

    it('outgoing and incoming leg modes on one stop persist independently', async () => {
      const { user } = await makeUser(orm);
      const trip = await makeTrip(orm, user.id);
      const day = await makeDay(orm, trip.id, { date: '2025-06-01' });
      const place = await makePlace(orm, trip.id, { name: 'Test Place' });

      const create = await request(app)
        .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
        .set('Cookie', authCookie(user.id))
        .send({ place_id: place.id });
      const assignmentId = create.body.assignment.id;

      await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'cycling' })
        .expect(200);

      await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'transit', direction: 'incoming' })
        .expect(200);

      const row = await findRow(orm, DayAssignments, { id: assignmentId });
      expect(row?.leg_transport_mode).toBe('cycling');
      expect(row?.incoming_leg_transport_mode).toBe('transit');

      const res = await request(app).get(`/api/trips/${trip.id}/days`).set('Cookie', authCookie(user.id));
      expect(res.status).toBe(200);
      const foundDay = res.body.days.find((d: any) => d.id === day.id);
      const a = foundDay.assignments.find((x: any) => x.id === assignmentId);
      expect(a.leg_transport_mode).toBe('cycling');
      expect(a.incoming_leg_transport_mode).toBe('transit');
    });
  });
});
