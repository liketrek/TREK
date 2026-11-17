/**
 * A NUL character (U+0000) in a user string, on SQLite and on Postgres alike.
 *
 * Postgres text cannot hold it, so a write or a filter carrying one used to
 * answer a 500 there while SQLite stored it. TREK stores no NUL on either
 * engine now (src/db/nul-free.ts): every string a statement carries loses it,
 * so the same request answers the same status and leaves the same row on both
 * engines (M1 / program rule 22 first made it a 201 on SQLite). The control
 * characters 0x01-0x1F, which both engines store, are swept in
 * places.test.ts.
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
import type { AbstractSqlConnection } from '@mikro-orm/sql';
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

describe('a NUL character in a user string, on every engine', () => {
  it('GET ?search=%00 is 200 and matches as an empty search', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makePlace(orm, trip.id, { name: 'Spot' });

    // A raw, pre-encoded `%00` in the URL: `.query({...})` goes through
    // superagent's own encoder, which need not round-trip a NUL the same way.
    const res = await request(app).get(`/api/trips/${trip.id}/places?search=%00`).set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.places.map((p: { name: string }) => p.name)).toEqual(['Spot']);
  });

  it('POST create with a NUL in the name is 201 and stores the name without it', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'nul\u0000name' });
    expect(res.status).toBe(201);
    expect(res.body.place.name).toBe('nulname');

    const stored = await findRow(orm, Places, { id: res.body.place.id });
    expect(stored?.name).toBe('nulname');
  });

  it('a parameter of a Kysely statement loses its NUL too', async () => {
    const kysely = (orm.em.getConnection() as AbstractSqlConnection).getClient<object>();
    const row = await kysely.selectNoFrom((eb) => eb.val('a\u0000b').as('v')).executeTakeFirstOrThrow();
    expect(row.v).toBe('ab');
  });
});
