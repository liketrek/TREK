/**
 * Collections upload integration tests (COLL-P01…P05).
 *
 * Cover + place-image upload parity, written BEFORE the storage-upload swap:
 * statuses, bodies, on-disk layout — including the cover filter's plain-Error
 * 500 quirk (shared with the trip cover config) and the place-image filter's
 * statusCode-400 contract.
 */
import { buildApp } from '../../src/bootstrap';
import { Addons } from '../../src/db/entities/Addons.entity';
import { CollectionPlaces } from '../../src/db/entities/CollectionPlaces.entity';
import { Collections } from '../../src/db/entities/Collections.entity';
import { StorageService } from '../../src/nest/storage/storage.service';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
import { insertRow, upsertRow } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { trackStoredObjects, type StoredObjects } from '../helpers/stored-objects';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

let nestApp: INestApplication;
// Only what this suite stored is removed: other suites share uploads/ and may run beside it.
let stored: StoredObjects;
let app: Application;
let orm: FactoryOrm;
const FIXTURE_IMG = path.join(__dirname, '../fixtures/small-image.jpg');
const coversDir = path.join(__dirname, '../../uploads/covers');
const placesDir = path.join(__dirname, '../../uploads/places');

async function createCollection(ownerId: number): Promise<number> {
  return insertRow(orm, Collections, { owner: ownerId, name: 'C' });
}

async function createCollectionPlace(collectionId: number, ownerId: number): Promise<number> {
  return insertRow(orm, CollectionPlaces, { collection: collectionId, owner: ownerId, name: 'P' });
}

beforeAll(async () => {
  nestApp = await buildApp();
  stored = trackStoredObjects(nestApp.get(StorageService));
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
  // Enable the collections addon (the controller sits behind AddonGuard).
  await upsertRow(orm, Addons, {
    id: 'collections',
    name: 'Collections',
    description: 'Saved places',
    type: 'global',
    icon: 'Bookmark',
    enabled: true,
    sort_order: 40,
  });
});

afterAll(async () => {
  await stored.cleanup();
  await nestApp.close();
});

describe('Collection cover upload', () => {
  it('COLL-P01 — cover upload stores /uploads/covers/<uuid> and writes the file', async () => {
    const { user } = await makeUser(orm);
    const collectionId = await createCollection(user.id);

    const res = await request(app)
      .post(`/api/addons/collections/${collectionId}/cover`)
      .set('Cookie', authCookie(user.id))
      .attach('cover', FIXTURE_IMG, 'cover.png');
    expect(res.status).toBe(201);
    expect(res.body.cover_image).toMatch(/^\/uploads\/covers\/[0-9a-f-]{36}\.png$/);
    const diskName = res.body.cover_image.replace('/uploads/covers/', '');
    expect(fs.existsSync(path.join(coversDir, diskName))).toBe(true);
  });

  it('COLL-P02 — no file → 400 "No image uploaded"', async () => {
    const { user } = await makeUser(orm);
    const collectionId = await createCollection(user.id);

    const res = await request(app)
      .post(`/api/addons/collections/${collectionId}/cover`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No image uploaded');
  });

  it('COLL-P03 — non-image cover is 500 (plain-Error filter quirk — pinned, do not "fix")', async () => {
    const { user } = await makeUser(orm);
    const collectionId = await createCollection(user.id);

    const res = await request(app)
      .post(`/api/addons/collections/${collectionId}/cover`)
      .set('Cookie', authCookie(user.id))
      .attach('cover', Buffer.from('plain text'), { filename: 'doc.txt', contentType: 'text/plain' });
    expect(res.status).toBe(500);
  });
});

describe('Collection place image upload', () => {
  it('COLL-P04 — place image upload stores /uploads/places/<uuid> and writes the file', async () => {
    const { user } = await makeUser(orm);
    const collectionId = await createCollection(user.id);
    const placeId = await createCollectionPlace(collectionId, user.id);

    const res = await request(app)
      .post(`/api/addons/collections/places/${placeId}/image`)
      .set('Cookie', authCookie(user.id))
      .attach('image', FIXTURE_IMG, 'photo.jpg');
    expect(res.status).toBe(200);
    expect(res.body.image_url).toMatch(/^\/uploads\/places\/[0-9a-f-]{36}\.jpg$/);
    const diskName = res.body.image_url.replace('/uploads/places/', '');
    expect(fs.existsSync(path.join(placesDir, diskName))).toBe(true);
  });

  it('COLL-P05 — non-image place upload is 400 with the bespoke message', async () => {
    const { user } = await makeUser(orm);
    const collectionId = await createCollection(user.id);
    const placeId = await createCollectionPlace(collectionId, user.id);

    const res = await request(app)
      .post(`/api/addons/collections/places/${placeId}/image`)
      .set('Cookie', authCookie(user.id))
      .attach('image', Buffer.from('%PDF-1.4'), { filename: 'doc.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Only jpg, png, gif, webp images allowed');
  });
});
