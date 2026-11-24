/**
 * Public byte paths and the location in a photo (PUBMEDIA-*).
 *
 * A phone photo carries the GPS fix it was taken at. A share link, a journey's
 * public page and the anonymous /uploads mounts used to hand out the stored
 * bytes, so the location left with them even where the owner had turned the
 * map off, and /uploads/journey served every entry photo to whoever had seen
 * its URL, share link revoked or not. Here the whole app answers over real
 * files: the public gets the location-free copy, the owner the original.
 */
import { buildApp } from '../../src/bootstrap';
import { Addons } from '../../src/db/entities/Addons.entity';
import { Photos } from '../../src/db/entities/Photos.entity';
import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { authCookie, generateToken } from '../helpers/auth';
import { jpegWithExif } from '../helpers/exif-jpeg';
import { makeJourney } from '../helpers/factories/journeys';
import { findRow, insertRow, upsertRow } from '../helpers/factories/rows';
import { makeShareToken, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import exifr from 'exifr';
import type { Application } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;

const uploadsDir = path.join(__dirname, '../../uploads');
// Every object this suite leaves behind, original and copy, removed one by one:
// the uploads tree is shared with other integration workers.
const created: string[] = [];

const GPS = { lat: 49.274523, lng: -0.703421 };
const phonePhoto = () => jpegWithExif({ DateTimeOriginal: '2026:05:30 15:52:19', gps: GPS, Orientation: 6 });

function track(category: string, name: string): void {
  created.push(path.join(uploadsDir, category, name), path.join(uploadsDir, category, 'public', name));
}

/** Reads any answer whole as bytes, whatever its content type. */
function bytes(req: request.Test): request.Test {
  return req.buffer(true).parse((res, done) => {
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));
    res.on('end', () => done(null, Buffer.concat(chunks)));
  });
}

async function gpsOf(body: Buffer): Promise<number | undefined> {
  return (await exifr.gps(body).catch(() => undefined))?.latitude;
}

async function uploadGalleryPhoto(userId: number, journeyId: number): Promise<{ name: string; photoId: number }> {
  const res = await request(app)
    .post(`/api/journeys/${journeyId}/gallery/photos`)
    .set('Cookie', authCookie(userId))
    .attach('photos', phonePhoto(), { filename: 'PXL_20260530_135219.jpg', contentType: 'image/jpeg' });
  expect(res.status).toBe(201);
  const filePath = res.body.photos[0].file_path as string;
  const name = filePath.replace(/^journey\//, '');
  track('journey', name);
  const row = await findRow(orm, TrekPhotos, { file_path: filePath });
  if (!row) throw new Error(`no trek_photos row for ${filePath}`);
  return { name, photoId: row.id };
}

async function shareLink(userId: number, journeyId: number, flags: Record<string, boolean>): Promise<string> {
  const res = await request(app)
    .post(`/api/journeys/${journeyId}/share-link`)
    .set('Cookie', authCookie(userId))
    .send(flags);
  expect(res.status).toBe(200);
  return res.body.token as string;
}

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
  await upsertRow(orm, Addons, {
    id: 'journey',
    name: 'Journey',
    description: 'Travel journal',
    type: 'global',
    icon: 'Compass',
    enabled: true,
    sort_order: 35,
  });
});

afterAll(async () => {
  await nestApp.close();
  for (const file of created) fs.rmSync(file, { force: true });
});

describe('journey share link', () => {
  it('PUBMEDIA-001: with the map not shared, /original carries no GPS, orientation kept; the owner still gets the original', async () => {
    const { user } = await makeUser(orm);
    const journey = await makeJourney(orm, user.id);
    const { photoId } = await uploadGalleryPhoto(user.id, journey.id);
    const token = await shareLink(user.id, journey.id, { share_timeline: true, share_gallery: true, share_map: false });

    const shared = await bytes(request(app).get(`/api/public/journey/${token}/photos/${photoId}/original`));
    expect(shared.status).toBe(200);
    const body = shared.body as Buffer;
    expect(await gpsOf(body)).toBeUndefined();
    expect(await exifr.orientation(body)).toBe(6);
    expect(body.length).toBe(phonePhoto().length);

    const owned = await bytes(request(app).get(`/api/photos/${photoId}/original`).set('Cookie', authCookie(user.id)));
    expect(owned.status).toBe(200);
    expect(await gpsOf(owned.body as Buffer)).toBeCloseTo(GPS.lat, 5);
  });

  it('PUBMEDIA-002: once the share link is deleted, no URL it handed out returns bytes', async () => {
    const { user } = await makeUser(orm);
    const journey = await makeJourney(orm, user.id);
    const { name, photoId } = await uploadGalleryPhoto(user.id, journey.id);
    const token = await shareLink(user.id, journey.id, { share_timeline: true, share_gallery: true, share_map: true });
    const original = `/api/public/journey/${token}/photos/${photoId}/original`;
    const thumbnail = `/api/public/journey/${token}/photos/${photoId}/thumbnail`;
    expect((await request(app).get(original)).status).toBe(200);

    const revoke = await request(app)
      .delete(`/api/journeys/${journey.id}/share-link`)
      .set('Cookie', authCookie(user.id));
    expect(revoke.status).toBe(200);

    expect((await request(app).get(original)).status).toBe(404);
    expect((await request(app).get(thumbnail)).status).toBe(404);
    expect(
      (await request(app).get(`/api/public/journey/${token}/photo/local/${name}/${user.id}/original`)).status,
    ).toBe(404);
    // Nor does the static mount: an entry photo is no cover.
    expect((await request(app).get(`/uploads/journey/${name}`)).status).toBe(404);
  });
});

describe('/uploads/journey', () => {
  it('PUBMEDIA-010: serves a cover, location-free, and 404s an entry photo for everyone', async () => {
    const { user } = await makeUser(orm);
    const journey = await makeJourney(orm, user.id);
    const { name: entryPhoto } = await uploadGalleryPhoto(user.id, journey.id);
    const cover = await request(app)
      .post(`/api/journeys/${journey.id}/cover`)
      .set('Cookie', authCookie(user.id))
      .attach('cover', phonePhoto(), { filename: 'cover.jpg', contentType: 'image/jpeg' });
    expect(cover.status).toBe(200);
    const coverName = (cover.body.cover_image as string).replace(/^journey\//, '');
    track('journey', coverName);

    const hit = await bytes(request(app).get(`/uploads/journey/${coverName}`));
    expect(hit.status).toBe(200);
    expect(hit.headers['content-type']).toBe('image/jpeg');
    expect(await gpsOf(hit.body as Buffer)).toBeUndefined();
    expect(await exifr.orientation(hit.body as Buffer)).toBe(6);

    expect((await request(app).get(`/uploads/journey/${entryPhoto}`)).status).toBe(404);
    expect((await request(app).get(`/uploads/journey/${entryPhoto}`).set('Cookie', authCookie(user.id))).status).toBe(
      404,
    );
    // The copies are not reachable by their own name either.
    expect((await request(app).get(`/uploads/journey/public/${coverName}`)).status).toBe(404);
  });
});

describe('/uploads/photos with a trip share token', () => {
  it('PUBMEDIA-020: the share token gets the copy without GPS, a session the stored photo', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const name = 'pubmedia-trip-photo.integration.jpg';
    fs.mkdirSync(path.join(uploadsDir, 'photos'), { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, 'photos', name), phonePhoto());
    track('photos', name);
    await insertRow(orm, Photos, { trip: trip.id, filename: name, original_name: name });
    await makeShareToken(orm, trip.id, user.id, { token: 'pubmedia-share-token' });

    const shared = await bytes(request(app).get(`/uploads/photos/${name}?token=pubmedia-share-token`));
    expect(shared.status).toBe(200);
    expect(await gpsOf(shared.body as Buffer)).toBeUndefined();

    const owned = await bytes(
      request(app)
        .get(`/uploads/photos/${name}`)
        .set('Authorization', `Bearer ${generateToken(user.id)}`),
    );
    expect(owned.status).toBe(200);
    expect(await gpsOf(owned.body as Buffer)).toBeCloseTo(GPS.lat, 5);
  });
});
