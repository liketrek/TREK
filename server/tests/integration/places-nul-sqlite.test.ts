/**
 * M1 / program rule 22 (task-4-review.md): a NUL byte in a user string no
 * longer 500s on SQLite. The platform override restores the legacy raw bind's
 * byte-for-byte round-trip (base 94c6efbbc: 200/201; before that fix, every
 * ORM-converted statement 500'd on NUL).
 *
 * Moved out of places.test.ts so the rest of that suite runs on both engines:
 * these two cases are about SQLite's value quoting, and Postgres text cannot
 * hold U+0000 at all (tests/postgres/lane.ts, SQLITE_ONLY). The control
 * characters 0x01-0x1F stay in places.test.ts, where they run on both.
 */
import { buildApp } from '../../src/bootstrap';
import { Places } from '../../src/db/entities/Places.entity';
import { authCookie } from '../helpers/auth';
import { makePlace } from '../helpers/factories/places';
import { findRow } from '../helpers/factories/rows';
import { makeTrip } from '../helpers/factories/trips';
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

describe('M1 — NUL-safe value quoting on the SQLite platform (rule 22)', () => {
  it("GET ?search=%00 is 200, not 500 (status parity — SQLite's LIKE pattern matcher itself iterates its RHS as NUL-terminated, an independent SQLite limitation this platform fix does not touch, so a NUL search matches everything on BOTH trees, not nothing)", async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makePlace(orm, trip.id, { name: 'Spot' });

    // A raw, pre-encoded `%00` in the URL — the review's exact literal
    // request shape (`GET /api/trips/:id/places?search=%00`). `.query({...})`
    // goes through superagent's own `qs` encoder, which is not guaranteed to
    // round-trip a NUL character the same way; the literal query string is
    // what Express/the route actually receives in production.
    const res = await request(app).get(`/api/trips/${trip.id}/places?search=%00`).set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
  });

  it('POST create with a NUL in the name is 201 and the name round-trips byte-for-byte', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const name = 'nul\u0000name';

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name });
    expect(res.status).toBe(201);
    expect(res.body.place.name).toBe(name);

    const stored = await findRow(orm, Places, { id: res.body.place.id });
    expect(stored?.name).toBe(name);
  });
});
