/**
 * Migration test for incoming_leg_transport_mode on day_assignments, plus
 * read-path parity: the field must survive both the single-assignment
 * projection and the day-LIST projection.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb2 } from '../../src/db/database';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { authCookie } from '../helpers/auth';
import { createUser, createTrip, createDay, createPlace } from '../helpers/factories';
import type { FactoryOrm } from '../helpers/factories/context';
import { findRow, updateRows } from '../helpers/factories/rows';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Read-path parity (day-LIST endpoint) — mirrors the harness in
// tests/integration/assignments.test.ts verbatim.
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

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
    resetTestDb(testDb2);
    await resetRateLimits(nestApp);
  });

  afterAll(async () => {
    await nestApp.close();
    testDb2.close();
  });

  it('round-trips incoming_leg_transport_mode through the day-LIST endpoint', async () => {
    const { user } = createUser(testDb2);
    const trip = createTrip(testDb2, user.id);
    const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
    const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

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
      const { user } = createUser(testDb2);
      const trip = createTrip(testDb2, user.id);
      const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
      const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

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
      const { user } = createUser(testDb2);
      const trip = createTrip(testDb2, user.id);
      const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
      const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

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
      const { user } = createUser(testDb2);
      const trip = createTrip(testDb2, user.id);
      const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
      const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

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
      const { user } = createUser(testDb2);
      const trip = createTrip(testDb2, user.id);
      const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
      const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

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
