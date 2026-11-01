/**
 * The deferred release over the full app (#2924): what a user's replace or
 * delete leaves unnamed is queued by the request and left in place, then
 * deleted by the release job once it is due, through every owner's real
 * reference source, while an object another row still names (a trip copy, a
 * journey, a saved place, a value an undo wrote back) stays. The objects are
 * written straight into the test run's uploads folder under random names and
 * taken back afterwards, the owner markers the job wrote with them.
 * RELI-001 to RELI-009.
 */
import { buildApp } from '../../src/bootstrap';
import { Addons } from '../../src/db/entities/Addons.entity';
import { StorageReleaseQueue } from '../../src/db/entities/StorageReleaseQueue.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { withRequestContext } from '../../src/nest/database/request-context';
import { StorageInstallService } from '../../src/nest/storage/storage-install.service';
import { STORAGE_RECLAIMABLE_CATEGORIES, storageOwnerMarkerKey } from '../../src/nest/storage/storage-reclaim.types';
import { RELEASE_DELAY_MS, StorageReleaseService } from '../../src/nest/storage/storage-release.service';
import { StorageService } from '../../src/nest/storage/storage.service';
import { authCookie } from '../helpers/auth';
import { makeCollection, makeCollectionPlace } from '../helpers/factories/collections';
import type { FactoryOrm } from '../helpers/factories/context';
import { makeJourney } from '../helpers/factories/journeys';
import { makePlace } from '../helpers/factories/places';
import { countRows, updateRows, upsertRow } from '../helpers/factories/rows';
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

/** One tick of the release job at `at` (by default once everything queued so far is due). */
async function tick(at: Date = new Date(Date.now() + RELEASE_DELAY_MS + 60_000)) {
  return await withRequestContext(nestApp.get(MikroORM), () => nestApp.get(StorageReleaseService).processDue(at));
}

async function queued(category: string, key: string): Promise<number> {
  return await countRows(orm, StorageReleaseQueue, { category, key });
}

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});
afterAll(async () => {
  for (const file of written) fs.rmSync(file, { force: true });
  // The uploads folder is the test run's shared one: take back the owner markers the job wrote.
  const installId = nestApp.get(StorageInstallService).installId();
  if (installId) {
    const storage = nestApp.get(StorageService);
    await Promise.all(
      STORAGE_RECLAIMABLE_CATEGORIES.map((category) =>
        storage.delete(category, storageOwnerMarkerKey(installId)).catch(() => undefined),
      ),
    );
  }
  await nestApp.close();
});

describe('the deferred release of what a change left unnamed', () => {
  it('RELI-001: a replaced trip cover waits in the queue, then goes, but not while a trip copy still shows it', async () => {
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
    expect(await queued('covers', old)).toBe(1);
    await tick();
    expect(exists('covers', old)).toBe(true);
    expect(await queued('covers', old)).toBe(0);

    const second = await request(app)
      .put(`/api/trips/${copy.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ cover_image: `/uploads/covers/${next}` });
    expect(second.status).toBe(200);
    // The request itself deletes nothing.
    expect(exists('covers', old)).toBe(true);
    await tick();
    expect(exists('covers', old)).toBe(false);
    expect(exists('covers', next)).toBe(true);
  });

  it('RELI-002: a deleted trip takes its cover along a day later, unless a journey inherited it', async () => {
    const { user } = await makeUser(orm);
    const alone = stored('covers');
    const inherited = stored('covers');
    const tripA = await makeTrip(orm, user.id, { cover_image: `/uploads/covers/${alone}` });
    const tripB = await makeTrip(orm, user.id, { cover_image: `/uploads/covers/${inherited}` });
    await makeJourney(orm, user.id, { cover_image: `covers/${inherited}` });

    const deleteTrip = (id: number) => request(app).delete(`/api/trips/${id}`).set('Cookie', authCookie(user.id));
    expect((await deleteTrip(tripA.id)).status).toBe(200);
    expect((await deleteTrip(tripB.id)).status).toBe(200);
    expect(exists('covers', alone)).toBe(true);
    await tick();
    expect(exists('covers', alone)).toBe(false);
    expect(exists('covers', inherited)).toBe(true);
  });

  it('RELI-003: a replaced place image goes once due, one a saved place still names stays', async () => {
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
    await tick();
    expect(exists('places', own)).toBe(false);
    expect(exists('places', saved)).toBe(true);
  });

  it('RELI-004: a deleted place takes its image along once due, not before', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const image = stored('places');
    const place = await makePlace(orm, trip.id, { image_url: `/uploads/places/${image}` });
    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    await tick(new Date());
    expect(exists('places', image)).toBe(true);
    expect(await queued('places', image)).toBe(1);
    await tick();
    expect(exists('places', image)).toBe(false);
    expect(await queued('places', image)).toBe(0);
  });

  it('RELI-005: a deleted avatar goes once due; an avatar another account still names stays', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const own = stored('avatars', '.png');
    const shared = stored('avatars', '.png');
    await updateRows(orm, Users, { id: user.id }, { avatar: own });
    await updateRows(orm, Users, { id: other.id }, { avatar: shared });
    const res = await request(app).delete('/api/auth/avatar').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    await tick();
    expect(exists('avatars', own)).toBe(false);

    await updateRows(orm, Users, { id: user.id }, { avatar: shared });
    await request(app).delete('/api/auth/avatar').set('Cookie', authCookie(user.id));
    await tick();
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
    const tooLong = await request(app)
      .put(`/api/trips/${trip.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ cover_image: `/uploads/covers/${'a'.repeat(2048)}` });
    expect(tooLong.status).toBe(400);
  });

  it('RELI-007: a cover an undo writes back before it is due stays, and its row goes', async () => {
    const { user } = await makeUser(orm);
    const old = stored('covers');
    const trip = await makeTrip(orm, user.id, { cover_image: `/uploads/covers/${old}` });
    const put = (cover: string | null) =>
      request(app).put(`/api/trips/${trip.id}`).set('Cookie', authCookie(user.id)).send({ cover_image: cover });
    expect((await put(null)).status).toBe(200);
    expect(await queued('covers', old)).toBe(1);
    expect((await put(`/uploads/covers/${old}`)).status).toBe(200);
    await tick();
    expect(exists('covers', old)).toBe(true);
    expect(await queued('covers', old)).toBe(0);
  });

  it('RELI-008: a PUT that sends the cover a trip already has queues nothing', async () => {
    const { user } = await makeUser(orm);
    const same = stored('covers');
    const trip = await makeTrip(orm, user.id, { cover_image: `/uploads/covers/${same}` });
    const res = await request(app)
      .put(`/api/trips/${trip.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ cover_image: `/uploads/covers/${same}` });
    expect(res.status).toBe(200);
    expect(await queued('covers', same)).toBe(0);
  });

  it('RELI-009: a replaced journey cover is queued, never deleted by the request; an unchanged one queues nothing', async () => {
    await upsertRow(orm, Addons, {
      id: 'journey',
      name: 'Journey',
      description: 'Travel journal',
      type: 'global',
      icon: 'Compass',
      enabled: true,
      sort_order: 35,
    });
    const { user } = await makeUser(orm);
    const old = stored('covers');
    const journey = await makeJourney(orm, user.id, { cover_image: `covers/${old}` });
    const patch = (cover: string) =>
      request(app).patch(`/api/journeys/${journey.id}`).set('Cookie', authCookie(user.id)).send({ cover_image: cover });
    expect((await patch(`covers/${old}`)).status).toBe(200);
    expect(await queued('covers', old)).toBe(0);
    const next = stored('covers');
    expect((await patch(`covers/${next}`)).status).toBe(200);
    expect(await queued('covers', old)).toBe(1);
    // What the assistant's undo writes back within the window keeps its object.
    expect((await patch(`covers/${old}`)).status).toBe(200);
    await tick();
    expect(exists('covers', old)).toBe(true);
    expect(exists('covers', next)).toBe(false);
  });
});
