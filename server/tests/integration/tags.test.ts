/**
 * Tags integration tests — TAG-001 through TAG-010.
 * Covers GET/POST/PUT/DELETE /api/tags.
 */
import { buildApp } from '../../src/bootstrap';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
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
// The booted app's own ORM, the one the requests write through.
let orm: FactoryOrm;

beforeAll(async () => {
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
});

describe('Tags', () => {
  it('TAG-001: GET /api/tags returns empty array for new user', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app).get('/api/tags').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it('TAG-002: POST /api/tags creates a tag with default color', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app).post('/api/tags').set('Cookie', authCookie(user.id)).send({ name: 'Must See' });
    expect(res.status).toBe(201);
    expect(res.body.tag).toMatchObject({ name: 'Must See', user_id: user.id });
    expect(res.body.tag.id).toBeDefined();
    expect(res.body.tag.color).toBe('#10b981'); // default color
  });

  it('TAG-003: POST /api/tags creates a tag with a custom color', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Foodie', color: '#f59e0b' });
    expect(res.status).toBe(201);
    expect(res.body.tag.color).toBe('#f59e0b');
  });

  it('TAG-004: POST /api/tags without name returns 400', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app).post('/api/tags').set('Cookie', authCookie(user.id)).send({ color: '#ff0000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('TAG-005: PUT /api/tags/:id updates tag name and color', async () => {
    const { user } = await makeUser(orm);
    const createRes = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Old Name', color: '#aaaaaa' });
    const tagId = createRes.body.tag.id;

    const res = await request(app)
      .put(`/api/tags/${tagId}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'New Name', color: '#bbbbbb' });
    expect(res.status).toBe(200);
    expect(res.body.tag.name).toBe('New Name');
    expect(res.body.tag.color).toBe('#bbbbbb');
  });

  it('TAG-006: PUT /api/tags/:id - tag belonging to another user returns 404', async () => {
    const { user: userA } = await makeUser(orm);
    const { user: userB } = await makeUser(orm);
    const createRes = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(userA.id))
      .send({ name: 'User A Tag' });
    const tagId = createRes.body.tag.id;

    // User B tries to update User A's tag
    const res = await request(app)
      .put(`/api/tags/${tagId}`)
      .set('Cookie', authCookie(userB.id))
      .send({ name: 'Hijacked' });
    expect(res.status).toBe(404);
  });

  it('TAG-007: DELETE /api/tags/:id removes the tag', async () => {
    const { user } = await makeUser(orm);
    const createRes = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'To Delete' });
    const tagId = createRes.body.tag.id;

    const res = await request(app).delete(`/api/tags/${tagId}`).set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify gone
    const listRes = await request(app).get('/api/tags').set('Cookie', authCookie(user.id));
    expect(listRes.body.tags).toHaveLength(0);
  });

  it('TAG-008: DELETE /api/tags/:id - tag belonging to another user returns 404', async () => {
    const { user: userA } = await makeUser(orm);
    const { user: userB } = await makeUser(orm);
    const createRes = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(userA.id))
      .send({ name: 'User A Tag' });
    const tagId = createRes.body.tag.id;

    const res = await request(app).delete(`/api/tags/${tagId}`).set('Cookie', authCookie(userB.id));
    expect(res.status).toBe(404);
  });

  it('TAG-009: Tags are user-scoped — user A cannot see user B tags', async () => {
    const { user: userA } = await makeUser(orm);
    const { user: userB } = await makeUser(orm);
    await request(app).post('/api/tags').set('Cookie', authCookie(userA.id)).send({ name: 'User A Private Tag' });

    const res = await request(app).get('/api/tags').set('Cookie', authCookie(userB.id));
    expect(res.status).toBe(200);
    expect(res.body.tags).toHaveLength(0);
  });

  it('TAG-010: Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(401);
  });

  it('TAG-011: PUT /api/tags/abc - non-numeric id returns the legacy 404, not a 500 (Plan 3b Task 2 fix round, item 1b)', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app).put('/api/tags/abc').set('Cookie', authCookie(user.id)).send({ name: 'Ghost' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
  });

  it('TAG-012: DELETE /api/tags/abc - non-numeric id returns the legacy 404, not a 500 (Plan 3b Task 2 fix round, item 1b)', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app).delete('/api/tags/abc').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
  });
});
