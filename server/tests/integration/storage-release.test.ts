/**
 * The immediate release over the full app (#2924): what a user's replace or
 * delete leaves unnamed is gone right after the request, through every owner's
 * real reference source, while an object another row still names (a trip
 * copy, a journey, a saved place) stays. The objects are written straight into
 * the test run's uploads folder under random names and taken back afterwards.
 * RELI-001 to RELI-006.
 */
import { buildApp } from '../../src/bootstrap';
import { Users } from '../../src/db/entities/Users.entity';
import { authCookie } from '../helpers/auth';
import { makeCollection, makeCollectionPlace } from '../helpers/factories/collections';
import type { FactoryOrm } from '../helpers/factories/context';
import { makeJourney } from '../helpers/factories/journeys';
import { makePlace } from '../helpers/factories/places';
import { updateRows } from '../helpers/factories/rows';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const UPLOADS = path.join(__dirname, '../../uploads');
const written: string[] = [];

/** An object of `category` under a fresh random name, as an upload would leave it. */
function stored(category: 'covers' | 'places' | 'avatars', ext = '.jpg'): string {
  const name = `${randomUUID()}${ext}`;
  const file = path.join(UPLOADS, category, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'bytes');
  written.push(file);
  return name;
}

function exists(category: string, name: string): boolean {
  return fs.existsSync(path.join(UPLOADS, category, name));
}

let nestApp: INestApplication;
let app: Application;
let orm: FactoryOrm;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});
afterAll(async () => {
  for (const file of written) fs.rmSync(file, { force: true });
  await nestApp.close();
});

describe('the immediate release of what a change left unnamed', () => {
  it('RELI-001: a replaced trip cover goes at once, but not while a trip copy still shows it', async () => {
    const { user } = await makeUser(orm);
    const old = stored('covers');
    const trip = await makeTrip(orm, user.id, { cover_image: `/uploads/covers/${old}` });
    const copy = await makeTrip(orm, user.id, { cover_image: `/uploads/covers/${old}` });
    const next = stored('covers');

    const first = await request(app)
      .put(`/api/trips/${trip.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ cover_image: `/uploads/covers/${next}` });
    expect(first.status).toBe(200);
    expect(exists('covers', old)).toBe(true);

    const second = await request(app)
      .put(`/api/trips/${copy.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ cover_image: `/uploads/covers/${next}` });
    expect(second.status).toBe(200);
    expect(exists('covers', old)).toBe(false);
    expect(exists('covers', next)).toBe(true);
  });

  it('RELI-002: a deleted trip takes its cover along unless a journey inherited it', async () => {
    const { user } = await makeUser(orm);
    const alone = stored('covers');
    const inherited = stored('covers');
    const tripA = await makeTrip(orm, user.id, { cover_image: `/uploads/covers/${alone}` });
    const tripB = await makeTrip(orm, user.id, { cover_image: `/uploads/covers/${inherited}` });
    await makeJourney(orm, user.id, { cover_image: `covers/${inherited}` });

    const deleteTrip = (id: number) => request(app).delete(`/api/trips/${id}`).set('Cookie', authCookie(user.id));
    expect((await deleteTrip(tripA.id)).status).toBe(200);
    expect((await deleteTrip(tripB.id)).status).toBe(200);
    expect(exists('covers', alone)).toBe(false);
    expect(exists('covers', inherited)).toBe(true);
  });

  it('RELI-003: a replaced place image goes, one a saved place still names stays', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const own = stored('places');
    const saved = stored('places');
    const placeA = await makePlace(orm, trip.id, { image_url: `/uploads/places/${own}` });
    const placeB = await makePlace(orm, trip.id, { image_url: `/uploads/places/${saved}?v=2` });
    const collection = await makeCollection(orm, user.id);
    await makeCollectionPlace(orm, collection.id, user.id, {
      image_url: `https://trip.example.test/uploads/places/${saved}`,
    });

    const clearImage = (id: number) =>
      request(app)
        .put(`/api/trips/${trip.id}/places/${id}`)
        .set('Cookie', authCookie(user.id))
        .send({ image_url: null });
    expect((await clearImage(placeA.id)).status).toBe(200);
    expect((await clearImage(placeB.id)).status).toBe(200);
    expect(exists('places', own)).toBe(false);
    expect(exists('places', saved)).toBe(true);
  });

  it('RELI-004: a deleted place takes its image along', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const image = stored('places');
    const place = await makePlace(orm, trip.id, { image_url: `/uploads/places/${image}` });
    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(exists('places', image)).toBe(false);
  });

  it('RELI-005: a deleted avatar goes; an avatar another account still names stays', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const own = stored('avatars', '.png');
    const shared = stored('avatars', '.png');
    await updateRows(orm, Users, { id: user.id }, { avatar: own });
    await updateRows(orm, Users, { id: other.id }, { avatar: shared });
    const res = await request(app).delete('/api/auth/avatar').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(exists('avatars', own)).toBe(false);

    await updateRows(orm, Users, { id: user.id }, { avatar: shared });
    await request(app).delete('/api/auth/avatar').set('Cookie', authCookie(user.id));
    expect(exists('avatars', shared)).toBe(true);
  });

  it('RELI-006: the release never fails the request, whatever the stored value holds', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { cover_image: '/uploads/covers/../../etc/passwd' });
    const res = await request(app)
      .put(`/api/trips/${trip.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ cover_image: 'https://images.example.test/cover.jpg' });
    expect(res.status).toBe(200);
  });
});
