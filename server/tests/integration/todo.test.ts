/**
 * Todo integration tests — TODO-001 through TODO-012.
 * Covers all endpoints at /api/trips/:tripId/todo.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { db as testDb } from '../../src/db/database';
import { MikroORM } from '@mikro-orm/core';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { FactoryOrm } from '../helpers/factories/context';
import { createUser, createTrip, addTripMember } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { findRows } from '../helpers/factories/rows';
import { TodoItems } from '../../src/db/entities/TodoItems.entity';
import { invalidatePermissionsCache } from '../../src/nest/permissions/permissions-cache';

let nestApp: INestApplication;
let app: Application;
let orm: FactoryOrm;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
  await invalidatePermissionsCache();
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('Todo items', () => {
  it('TODO-001: GET /api/trips/:id/todo returns empty items for a new trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = await request(app)
      .get(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('TODO-002: POST /api/trips/:id/todo creates a todo with title only', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Book hotel' });
    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({ name: 'Book hotel', checked: 0, trip_id: trip.id });
    expect(res.body.item.id).toBeDefined();
  });

  it('TODO-003: POST /api/trips/:id/todo creates a todo with all optional fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({
        name: 'Pack suitcase',
        category: 'Preparation',
        description: 'Pack everything for the trip',
        priority: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({
      name: 'Pack suitcase',
      category: 'Preparation',
      description: 'Pack everything for the trip',
      priority: 2,
    });
  });

  it('TODO-004: POST /api/trips/:id/todo - missing name returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({ category: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('TODO-005: PUT /api/trips/:id/todo/:todoId toggles checked status', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Visit museum' });
    const itemId = createRes.body.item.id;

    // Toggle to checked
    const res = await request(app)
      .put(`/api/trips/${trip.id}/todo/${itemId}`)
      .set('Cookie', authCookie(user.id))
      .send({ checked: 1 });
    expect(res.status).toBe(200);
    expect(res.body.item.checked).toBe(1);

    // Toggle back to unchecked
    const res2 = await request(app)
      .put(`/api/trips/${trip.id}/todo/${itemId}`)
      .set('Cookie', authCookie(user.id))
      .send({ checked: 0 });
    expect(res2.status).toBe(200);
    expect(res2.body.item.checked).toBe(0);
  });

  it('TODO-006: PUT /api/trips/:id/todo/:todoId updates category', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Buy souvenirs' });
    const itemId = createRes.body.item.id;

    const res = await request(app)
      .put(`/api/trips/${trip.id}/todo/${itemId}`)
      .set('Cookie', authCookie(user.id))
      .send({ category: 'Shopping' });
    expect(res.status).toBe(200);
    expect(res.body.item.category).toBe('Shopping');
  });

  it('TODO-007: DELETE /api/trips/:id/todo/:todoId deletes a todo', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'To Delete' });
    const itemId = createRes.body.item.id;

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/todo/${itemId}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify gone from list
    const listRes = await request(app)
      .get(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id));
    expect(listRes.body.items).toHaveLength(0);
  });

  it('TODO-008: PUT /api/trips/:id/todo/reorder reorders items', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Create 3 items
    const r1 = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'First' });
    const r2 = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Second' });
    const r3 = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Third' });

    const id1 = r1.body.item.id;
    const id2 = r2.body.item.id;
    const id3 = r3.body.item.id;

    // Reverse the order
    const res = await request(app)
      .put(`/api/trips/${trip.id}/todo/reorder`)
      .set('Cookie', authCookie(user.id))
      .send({ orderedIds: [id3, id2, id1] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify the new order in the DB
    const items = await findRows(orm, TodoItems, { trip: trip.id }, { sort_order: 'asc' });
    expect(items[0].id).toBe(id3);
    expect(items[1].id).toBe(id2);
    expect(items[2].id).toBe(id1);
  });

  it('TODO-009: Non-member accessing trip returns 404', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(stranger.id));
    expect(res.status).toBe(404);
  });

  it('TODO-010: Trip member can read and create todos', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // Member can read
    const getRes = await request(app)
      .get(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(member.id));
    expect(getRes.status).toBe(200);

    // Member can create
    const postRes = await request(app)
      .post(`/api/trips/${trip.id}/todo`)
      .set('Cookie', authCookie(member.id))
      .send({ name: 'Member task' });
    expect(postRes.status).toBe(201);
  });

  it('TODO-011: PUT /api/trips/:id/todo/:todoId - non-existent item returns 404', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = await request(app)
      .put(`/api/trips/${trip.id}/todo/99999`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('TODO-012: GET /api/trips/:id/todo - unauthenticated returns 401', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = await request(app).get(`/api/trips/${trip.id}/todo`);
    expect(res.status).toBe(401);
  });
});

describe('Todo category assignees', () => {
  it('TODO-013: GET /api/trips/:id/todo/category-assignees returns empty object for new trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = await request(app)
      .get(`/api/trips/${trip.id}/todo/category-assignees`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.assignees).toEqual({});
  });

  it('TODO-014: PUT /api/trips/:id/todo/category-assignees/:name sets assignees', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/todo/category-assignees/Shopping`)
      .set('Cookie', authCookie(owner.id))
      .send({ user_ids: [owner.id, member.id] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.assignees)).toBe(true);
    expect(res.body.assignees).toHaveLength(2);

    // Verify via GET
    const getRes = await request(app)
      .get(`/api/trips/${trip.id}/todo/category-assignees`)
      .set('Cookie', authCookie(owner.id));
    expect(getRes.body.assignees.Shopping).toBeDefined();
    expect(getRes.body.assignees.Shopping).toHaveLength(2);
  });

  it('TODO-015: PUT category-assignees with empty array clears assignees', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // Set assignees
    await request(app)
      .put(`/api/trips/${trip.id}/todo/category-assignees/Shopping`)
      .set('Cookie', authCookie(owner.id))
      .send({ user_ids: [owner.id] });

    // Clear them
    const res = await request(app)
      .put(`/api/trips/${trip.id}/todo/category-assignees/Shopping`)
      .set('Cookie', authCookie(owner.id))
      .send({ user_ids: [] });
    expect(res.status).toBe(200);
    expect(res.body.assignees).toHaveLength(0);
  });
});
