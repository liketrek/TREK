/**
 * A request's NUL characters are gone before any logic runs, on SQLite and on
 * Postgres alike (src/nest/common/nul-free-input.ts).
 *
 * The database stores no NUL on either engine (src/db/nul-free.ts), so a value
 * the application still held with one was a different value from the one the
 * database compared: `victim@x.test\u0000` was a fresh key for the per-email
 * password-reset throttle while the lookup found the victim's row, so every
 * spelling mailed the victim a new link and voided the last one. These run
 * through buildApp(), the production stack, so the edge is the one that ships.
 */
import { buildApp } from '../../src/bootstrap';
import { PasswordResetTokens } from '../../src/db/entities/PasswordResetTokens.entity';
import { authCookie } from '../helpers/auth';
import { makePlace } from '../helpers/factories/places';
import { countRows } from '../helpers/factories/rows';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { oneByOne } from '../helpers/one-by-one';
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

describe('a NUL character in a request, on every engine', () => {
  it('cannot make a new key for the per-email reset throttle', async () => {
    const { user } = await makeUser(orm, { email: 'nul-throttle@example.test' });
    const spellings = [
      'nul-throttle@example.test\u0000',
      'nul-throttle@example.test\u0000\u0000',
      'nul-\u0000throttle@example.test',
      '\u0000nul-throttle@example.test\u0000\u0000\u0000',
    ];
    // Each request from a fresh per-IP bucket, the distributed case the
    // per-email throttle is there for, and one by one, so it counts in order.
    const statuses = await oneByOne(spellings, async (email) => {
      await resetRateLimits(nestApp);
      return (await request(app).post('/api/auth/forgot-password').send({ email })).status;
    });
    expect(statuses).toEqual([200, 200, 200, 200]);
    // Three links, the throttle's limit; the fourth spelling is the same address.
    expect(await countRows(orm, PasswordResetTokens, { user: user.id })).toBe(3);
  });

  it('leaves a password as sent: one set with a NUL signs in with exactly that password', async () => {
    const password = 'Nul\u0000Password-1';
    const { user } = await makeUser(orm, { email: 'nul-password@example.test', password });

    const exact = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(exact.status).toBe(200);
    const stripped = await request(app).post('/api/auth/login').send({ email: user.email, password: 'NulPassword-1' });
    expect(stripped.status).toBe(401);
  });

  it('cleans the path and the query string before the route reads them', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makePlace(orm, trip.id, { name: 'Spot' });

    // Raw, pre-encoded `%00`: superagent's own encoder need not round-trip a NUL.
    const res = await request(app)
      .get(`/api/trips/${trip.id}%00/places?search=Sp%00ot`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.places.map((p: { name: string }) => p.name)).toEqual(['Spot']);
  });

  it('cleans a cookie, which cookie-parser percent-decodes', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${authCookie(user.id)}%00`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});
