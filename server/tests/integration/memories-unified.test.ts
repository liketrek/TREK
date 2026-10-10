/**
 * Unified Memories integration tests (UNIFIED-001 – UNIFIED-020).
 * Covers the provider-agnostic /unified/trips/:tripId/photos and
 * /unified/trips/:tripId/album-links routes.
 *
 * No real HTTP is made — safeFetch is mocked to never be called.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { PhotoProviders } from '../../src/db/entities/PhotoProviders.entity';
import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../src/db/entities/TripPhotos.entity';
import { authCookie } from '../helpers/auth';
import { createUser, createTrip, addTripMember, addTripPhoto, addAlbumLink } from '../helpers/factories';
import type { FactoryOrm } from '../helpers/factories/context';
import { findRow, findRows, updateRows } from '../helpers/factories/rows';
import { resetTestDb, resetRateLimits, setAddonEnabled } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── Hoisted DB mock ──────────────────────────────────────────────────────────

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/utils/ssrfGuard', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/ssrfGuard')>('../../src/utils/ssrfGuard');
  return {
    ...actual,
    checkSsrf: vi.fn().mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: '93.184.216.34' }),
    safeFetch: vi.fn().mockRejectedValue(new Error('safeFetch should not be called in unified tests')),
  };
});

let nestApp: INestApplication;
let app: Application;

const BASE = '/api/integrations/memories/unified';

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

/** The app's own ORM, which the factories seed and read through. */
const orm = (): FactoryOrm => nestApp.get(MikroORM);

/** The trip_photos row pointing at the registered photo `assetId`, on `tripId` when given. */
async function tripPhotoOf(assetId: string, tripId?: number) {
  const photoIds = (await findRows(orm(), TrekPhotos, { asset_id: assetId })).map((p) => p.id);
  return findRow(orm(), TripPhotos, { photo: { $in: photoIds }, ...(tripId !== undefined ? { trip: tripId } : {}) });
}

/** The trip_photos row for `assetId` on `tripId`; fails the case when there is none. */
async function requireTripPhoto(assetId: string, tripId: number) {
  const row = await tripPhotoOf(assetId, tripId);
  if (!row) throw new Error(`no trip photo ${assetId} on trip ${tripId}`);
  return row;
}

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
  // Providers only count as enabled under an enabled journey addon (migration 84 seeds it off).
  setAddonEnabled(testDb, 'journey', true);
  // The migrated snapshot seeds photo_providers.immich.enabled = 0 (an admin must
  // configure it before it's usable in production); the legacy test helper always
  // seeded it enabled, which is what these tests assume. Same convention
  // memories-synology.test.ts already uses for its own provider.
  await updateRows(orm(), PhotoProviders, { id: 'immich' }, { enabled: 1 });
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function photosUrl(tripId: number) {
  return `${BASE}/trips/${tripId}/photos`;
}
function albumLinksUrl(tripId: number, linkId?: number) {
  return linkId ? `${BASE}/trips/${tripId}/album-links/${linkId}` : `${BASE}/trips/${tripId}/album-links`;
}

// ── Unified Photo Management ─────────────────────────────────────────────────

describe('Unified photo management', () => {
  it('UNIFIED-001 — GET photos lists own + shared photos from other members', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // owner has a private photo; member has a shared photo
    addTripPhoto(testDb, trip.id, owner.id, 'asset-own', 'immich', { shared: false });
    addTripPhoto(testDb, trip.id, member.id, 'asset-shared', 'immich', { shared: true });

    const res = await request(app).get(photosUrl(trip.id)).set('Cookie', authCookie(owner.id));

    expect(res.status).toBe(200);
    const ids = (res.body.photos as any[]).map((p: any) => p.asset_id);
    expect(ids).toContain('asset-own');
    expect(ids).toContain('asset-shared');
  });

  it("UNIFIED-002 — GET photos excludes other members' private photos", async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    addTripPhoto(testDb, trip.id, member.id, 'asset-private', 'immich', { shared: false });

    const res = await request(app).get(photosUrl(trip.id)).set('Cookie', authCookie(owner.id));

    expect(res.status).toBe(200);
    const ids = (res.body.photos as any[]).map((p: any) => p.asset_id);
    expect(ids).not.toContain('asset-private');
  });

  it('UNIFIED-003 — GET photos returns 404 for non-member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app).get(photosUrl(trip.id)).set('Cookie', authCookie(stranger.id));

    expect(res.status).toBe(404);
  });

  it('UNIFIED-004 — POST photos adds photos from selections', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({
        shared: true,
        selections: [{ provider: 'immich', asset_ids: ['asset-a', 'asset-b'] }],
      });

    expect(res.status).toBe(200);
    expect(res.body.added).toBe(2);

    const photoIds = (await findRows(orm(), TripPhotos, { trip: trip.id })).map((r) => r.photo_id);
    const rows = await findRows(orm(), TrekPhotos, { id: { $in: photoIds } });
    expect(rows.map((r) => r.asset_id)).toEqual(expect.arrayContaining(['asset-a', 'asset-b']));
  });

  it('UNIFIED-005 — POST photos with empty selections returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app).post(photosUrl(trip.id)).set('Cookie', authCookie(user.id)).send({ selections: [] });

    expect(res.status).toBe(400);
  });

  it('UNIFIED-006 — POST photos with invalid provider returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ selections: [{ provider: 'nonexistent', asset_ids: ['asset-x'] }] });

    expect(res.status).toBe(400);
  });

  it('UNIFIED-007 — PUT photos/sharing toggles shared flag', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripPhoto(testDb, trip.id, user.id, 'asset-tog', 'immich', { shared: false });
    const trekRef = await requireTripPhoto('asset-tog', trip.id);

    const res = await request(app)
      .put(`${photosUrl(trip.id)}/sharing`)
      .set('Cookie', authCookie(user.id))
      .send({ photo_id: trekRef.photo_id, shared: true });

    expect(res.status).toBe(200);
    const row = await tripPhotoOf('asset-tog');
    expect(row?.shared).toBe(1);
  });

  it('UNIFIED-008 — PUT photos/sharing on non-member trip returns 404', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .put(`${photosUrl(trip.id)}/sharing`)
      .set('Cookie', authCookie(stranger.id))
      .send({ provider: 'immich', asset_id: 'any', shared: true });

    expect(res.status).toBe(404);
  });

  it('UNIFIED-009 — DELETE photos removes own photo', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripPhoto(testDb, trip.id, user.id, 'asset-del', 'immich');
    const trekRef = await requireTripPhoto('asset-del', trip.id);

    const res = await request(app)
      .delete(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ photo_id: trekRef.photo_id });

    expect(res.status).toBe(200);
    expect(await tripPhotoOf('asset-del')).toBeNull();
  });

  it('UNIFIED-009a — DELETE photos is held to the body contract, and still takes a numeric string', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripPhoto(testDb, trip.id, user.id, 'asset-contract', 'immich');
    const trekRef = await requireTripPhoto('asset-contract', trip.id);

    // A DELETE that reads a body validates it like any other write, so a
    // photo_id that is neither a number nor a string never reaches the handler.
    const bad = await request(app)
      .delete(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ photo_id: { id: trekRef.photo_id } });

    expect(bad.status).toBe(400);
    expect(bad.body.error).toContain('photo_id');

    // The contract is deliberately loose about the type, because the client has
    // always been free to send the id as a string.
    const ok = await request(app)
      .delete(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ photo_id: String(trekRef.photo_id) });

    expect(ok.status).toBe(200);
    expect(await tripPhotoOf('asset-contract')).toBeNull();
  });

  it('UNIFIED-010 — DELETE photos on non-member trip returns 404', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .delete(photosUrl(trip.id))
      .set('Cookie', authCookie(stranger.id))
      .send({ provider: 'immich', asset_id: 'any' });

    expect(res.status).toBe(404);
  });
});

// ── Unified Album-Link Management ────────────────────────────────────────────

describe('Unified album-link management', () => {
  it('UNIFIED-011 — POST album-links with missing provider returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ album_id: 'album-abc', album_name: 'Test' }); // no provider

    expect(res.status).toBe(400);
  });

  it('UNIFIED-012 — POST album-links with missing album_id returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ provider: 'immich', album_name: 'Test' }); // no album_id

    expect(res.status).toBe(400);
  });

  it('UNIFIED-013 — POST album-links duplicate link returns 409', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await request(app)
      .post(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ provider: 'immich', album_id: 'album-dup', album_name: 'Dup' });

    const res = await request(app)
      .post(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ provider: 'immich', album_id: 'album-dup', album_name: 'Dup' });

    expect(res.status).toBe(409);
  });

  it('UNIFIED-014 — GET album-links only returns links for enabled providers', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addAlbumLink(testDb, trip.id, user.id, 'immich', 'album-enabled');

    // Disable the immich provider
    await updateRows(orm(), PhotoProviders, { id: 'immich' }, { enabled: 0 });

    const res = await request(app).get(albumLinksUrl(trip.id)).set('Cookie', authCookie(user.id));

    // Re-enable for future tests
    await updateRows(orm(), PhotoProviders, { id: 'immich' }, { enabled: 1 });

    expect(res.status).toBe(400); // no providers enabled → error
  });

  it('UNIFIED-021 — GET album-links reports no providers while the journey addon is off', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addAlbumLink(testDb, trip.id, user.id, 'immich', 'album-x');

    setAddonEnabled(testDb, 'journey', false);

    const res = await request(app).get(albumLinksUrl(trip.id)).set('Cookie', authCookie(user.id));

    setAddonEnabled(testDb, 'journey', true);

    expect(res.status).toBe(400); // provider rows still say enabled, journey off wins
  });
});

// ── Auth checks ───────────────────────────────────────────────────────────────

describe('Unified auth checks', () => {
  it('UNIFIED-020 — GET photos without auth returns 401', async () => {
    const res = await request(app).get(`${BASE}/trips/1/photos`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — POST photos without auth returns 401', async () => {
    const res = await request(app).post(`${BASE}/trips/1/photos`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — PUT photos/sharing without auth returns 401', async () => {
    const res = await request(app).put(`${BASE}/trips/1/photos/sharing`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — DELETE photos without auth returns 401', async () => {
    const res = await request(app).delete(`${BASE}/trips/1/photos`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — GET album-links without auth returns 401', async () => {
    const res = await request(app).get(`${BASE}/trips/1/album-links`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — POST album-links without auth returns 401', async () => {
    const res = await request(app).post(`${BASE}/trips/1/album-links`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — DELETE album-links without auth returns 401', async () => {
    const res = await request(app).delete(`${BASE}/trips/1/album-links/1`);
    expect(res.status).toBe(401);
  });
});
