/**
 * Immich integration tests.
 * Covers IMMICH-001 to IMMICH-024 (settings, SSRF protection, album links).
 *
 * External Immich API calls are not made — tests focus on settings persistence
 * and input validation.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { PhotoProviders } from '../../src/db/entities/PhotoProviders.entity';
import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { TripAlbumLinks } from '../../src/db/entities/TripAlbumLinks.entity';
import { TripPhotos } from '../../src/db/entities/TripPhotos.entity';
import { authCookie } from '../helpers/auth';
import { createUser } from '../helpers/factories';
import type { FactoryOrm } from '../helpers/factories/context';
import { addAlbumLink, addTripPhoto } from '../helpers/factories/photos';
import { findRow, findRows, updateRows } from '../helpers/factories/rows';
import { makeTrip } from '../helpers/factories/trips';
import { resetTestDb, resetRateLimits, setAddonEnabled } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

// Mock SSRF guard: block loopback and private IPs, allow external hostnames without DNS.
vi.mock('../../src/utils/ssrfGuard', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/ssrfGuard')>('../../src/utils/ssrfGuard');
  return {
    ...actual,
    checkSsrf: vi.fn().mockImplementation(async (rawUrl: string) => {
      try {
        const url = new URL(rawUrl);
        const h = url.hostname;
        if (h === '127.0.0.1' || h === '::1' || h === 'localhost') {
          return { allowed: false, isPrivate: true, error: 'Requests to loopback addresses are not allowed' };
        }
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) {
          return { allowed: false, isPrivate: true, error: 'Requests to private network addresses are not allowed' };
        }
        return { allowed: true, isPrivate: false, resolvedIp: '93.184.216.34' };
      } catch {
        return { allowed: false, isPrivate: false, error: 'Invalid URL' };
      }
    }),
    safeFetch: vi.fn().mockRejectedValue(new Error('safeFetch should not be called in unit tests')),
  };
});

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
  // Providers only count as enabled under an enabled journey addon (migration 84 seeds it off).
  setAddonEnabled(testDb, 'journey', true);
  // The migrated snapshot seeds photo_providers.immich.enabled = 0 (an admin must
  // configure it before it's usable in production); the legacy test helper always
  // seeded it enabled, which is what these tests assume. Same convention
  // memories-synology.test.ts already uses for its own provider.
  await updateRows(orm, PhotoProviders, { id: 'immich' }, { enabled: 1 });
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('Immich settings', () => {
  it('IMMICH-001 — GET /api/integrations/memories/immich/settings returns current settings', async () => {
    const { user } = createUser(testDb);

    const res = await request(app).get('/api/integrations/memories/immich/settings').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    // Settings may be empty initially
    expect(res.body).toBeDefined();
  });

  it('IMMICH-001 — PUT /api/integrations/memories/immich/settings saves Immich URL and API key', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/integrations/memories/immich/settings')
      .set('Cookie', authCookie(user.id))
      .send({ immich_url: 'https://immich.example.com', immich_api_key: 'test-api-key' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('IMMICH-002 — PUT /api/integrations/memories/immich/settings with private IP is blocked by SSRF guard', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/integrations/memories/immich/settings')
      .set('Cookie', authCookie(user.id))
      .send({ immich_url: 'http://192.168.1.100', immich_api_key: 'test-key' });
    expect(res.status).toBe(400);
  });

  it('IMMICH-002 — PUT /api/integrations/memories/immich/settings with loopback is blocked', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/integrations/memories/immich/settings')
      .set('Cookie', authCookie(user.id))
      .send({ immich_url: 'http://127.0.0.1:2283', immich_api_key: 'test-key' });
    expect(res.status).toBe(400);
  });
});

describe('Immich authentication', () => {
  it('GET /api/integrations/memories/immich/settings without auth returns 401', async () => {
    const res = await request(app).get('/api/integrations/memories/immich/settings');
    expect(res.status).toBe(401);
  });

  it('PUT /api/integrations/memories/immich/settings without auth returns 401', async () => {
    const res = await request(app)
      .put('/api/integrations/memories/immich/settings')
      .send({ url: 'https://example.com', api_key: 'key' });
    expect(res.status).toBe(401);
  });
});

describe('Immich album links', () => {
  it('IMMICH-020 — POST album-links creates a link', async () => {
    const { user } = createUser(testDb);
    const trip = await makeTrip(orm, user.id, { title: 'Test Trip' });

    const res = await request(app)
      .post(`/api/integrations/memories/unified/trips/${trip.id}/album-links`)
      .set('Cookie', authCookie(user.id))
      .send({ album_id: 'album-uuid-123', album_name: 'Vacation 2024', provider: 'immich' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const link = await findRow(orm, TripAlbumLinks, { trip: trip.id, user: user.id });
    expect(link).not.toBeNull();
    expect(link?.album_id).toBe('album-uuid-123');
    expect(link?.album_name).toBe('Vacation 2024');
  });

  it('IMMICH-021 — GET album-links returns linked albums', async () => {
    const { user } = createUser(testDb);
    const trip = await makeTrip(orm, user.id, { title: 'Test Trip' });
    await addAlbumLink(orm, trip.id, user.id, 'immich', 'album-abc', 'My Album');

    const res = await request(app)
      .get(`/api/integrations/memories/unified/trips/${trip.id}/album-links`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.links).toBeDefined();
    expect(res.body.links.length).toBe(1);
    expect(res.body.links[0].album_id).toBe('album-abc');
  });

  it('IMMICH-022 — DELETE album-links removes associated photos but not individually-added ones', async () => {
    const { user } = createUser(testDb);
    const trip = await makeTrip(orm, user.id, { title: 'Test Trip' });

    // Create album link
    const linkResult = await addAlbumLink(orm, trip.id, user.id, 'immich', 'album-xyz', 'Album XYZ');

    // Insert photos synced from the album
    for (const assetId of ['asset-001', 'asset-002']) {
      await addTripPhoto(orm, trip.id, user.id, assetId, 'immich', { shared: true, albumLinkId: linkResult.id });
    }

    // Insert an individually-added photo (no album_link_id)
    await addTripPhoto(orm, trip.id, user.id, 'asset-manual', 'immich', { shared: true });

    const res = await request(app)
      .delete(`/api/integrations/memories/unified/trips/${trip.id}/album-links/${linkResult.id}`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Album-linked photos should be gone
    const remainingPhotos = [];
    for (const tp of await findRows(orm, TripPhotos, { trip: trip.id })) {
      const tkp = await findRow(orm, TrekPhotos, { id: tp.photo_id });
      if (tkp) remainingPhotos.push({ ...tp, asset_id: tkp.asset_id });
    }
    expect(remainingPhotos.length).toBe(1);
    expect(remainingPhotos[0].asset_id).toBe('asset-manual');

    // Album link itself should be gone
    const link = await findRow(orm, TripAlbumLinks, { id: linkResult.id });
    expect(link).toBeNull();
  });

  it('IMMICH-023 — DELETE album-link by non-member returns 404', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = await makeTrip(orm, owner.id, { title: 'Test Trip' });

    const linkResult = await addAlbumLink(orm, trip.id, owner.id, 'immich', 'album-secret', 'Secret Album');
    await addTripPhoto(orm, trip.id, owner.id, 'asset-owned', 'immich', { shared: true, albumLinkId: linkResult.id });

    // Non-member tries to delete owner's album link — should be denied
    const res = await request(app)
      .delete(`/api/integrations/memories/unified/trips/${trip.id}/album-links/${linkResult.id}`)
      .set('Cookie', authCookie(other.id));

    expect(res.status).toBe(404);

    // Link and photos should still exist
    const link = await findRow(orm, TripAlbumLinks, { id: linkResult.id });
    expect(link).not.toBeNull();
    const owned = await findRow(orm, TrekPhotos, { asset_id: 'asset-owned' });
    const photo = owned ? await findRow(orm, TripPhotos, { photo: owned.id }) : null;
    expect(photo).not.toBeNull();
  });

  it('IMMICH-024 — DELETE album-link without auth returns 401', async () => {
    const res = await request(app).delete('/api/integrations/memories/unified/trips/1/album-links/1');
    expect(res.status).toBe(401);
  });
});
