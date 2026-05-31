/**
 * Memories (photo-providers) module e2e — exercises the migrated
 * /api/integrations/memories endpoints (unified + immich + synologyphotos)
 * through the real JwtAuthGuard against a temp SQLite db. The provider services
 * and canAccessUserPhoto are mocked; fail/success stay real so the envelope
 * shapes are produced by the actual helper code.
 *
 * Focus: auth (401), every route's happy path, the CRITICAL 200-on-failure
 * behaviour of /test + /status, and at least one error envelope per provider
 * router — all asserted byte-identical to the legacy Express routers.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, canAccessTrip: vi.fn(), closeDb: () => {}, reinitialize: () => {} }));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

// Provider services — fully mocked. fail/success/canAccessUserPhoto from the
// helper module are kept real except canAccessUserPhoto which we override.
const { unified, immich, synology } = vi.hoisted(() => ({
  unified: {
    listTripPhotos: vi.fn(), addTripPhotos: vi.fn(), setTripPhotoSharing: vi.fn(),
    removeTripPhoto: vi.fn(), listTripAlbumLinks: vi.fn(), createTripAlbumLink: vi.fn(), removeAlbumLink: vi.fn(),
  },
  immich: {
    getConnectionSettings: vi.fn(), saveImmichSettings: vi.fn(), setImmichAutoUpload: vi.fn(),
    testConnection: vi.fn(), getConnectionStatus: vi.fn(), browseTimeline: vi.fn(), searchPhotos: vi.fn(),
    streamImmichAsset: vi.fn(), listAlbums: vi.fn(), getAlbumPhotos: vi.fn(), syncAlbumAssets: vi.fn(),
    getAssetInfo: vi.fn(), isValidAssetId: vi.fn(),
  },
  synology: {
    getSynologySettings: vi.fn(), updateSynologySettings: vi.fn(), getSynologyStatus: vi.fn(),
    testSynologyConnection: vi.fn(), listSynologyAlbums: vi.fn(), getSynologyAlbumPhotos: vi.fn(),
    syncSynologyAlbumLink: vi.fn(), searchSynologyPhotos: vi.fn(), getSynologyAssetInfo: vi.fn(),
    streamSynologyAsset: vi.fn(),
  },
}));
vi.mock('../../src/services/memories/unifiedService', () => unified);
vi.mock('../../src/services/memories/immichService', () => immich);
vi.mock('../../src/services/memories/synologyService', () => synology);

const { canAccessUserPhoto } = vi.hoisted(() => ({ canAccessUserPhoto: vi.fn() }));
vi.mock('../../src/services/memories/helpersService', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/memories/helpersService')>(
    '../../src/services/memories/helpersService',
  );
  return { ...actual, canAccessUserPhoto };
});

import { MemoriesModule } from '../../src/nest/memories/memories.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const BASE = '/api/integrations/memories';
const UNIFIED = `${BASE}/unified`;
const IMMICH = `${BASE}/immich`;
const SYNO = `${BASE}/synologyphotos`;

describe('Memories e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [MemoriesModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    canAccessUserPhoto.mockReturnValue(true);
    immich.isValidAssetId.mockReturnValue(true);
  });

  // ── Auth ───────────────────────────────────────────────────────────────────
  describe('auth', () => {
    it('401 without a cookie (unified photos)', async () => {
      expect((await request(server).get(`${UNIFIED}/trips/5/photos`)).status).toBe(401);
    });
    it('401 without a cookie (immich status)', async () => {
      expect((await request(server).get(`${IMMICH}/status`)).status).toBe(401);
    });
    it('401 without a cookie (synology albums)', async () => {
      expect((await request(server).get(`${SYNO}/albums`)).status).toBe(401);
    });
  });

  // ── Unified ──────────────────────────────────────────────────────────────────
  describe('unified', () => {
    it('200 list photos -> { photos }', async () => {
      unified.listTripPhotos.mockReturnValue({ success: true, data: [{ photo_id: 1, asset_id: 'a' }] });
      const res = await request(server).get(`${UNIFIED}/trips/5/photos`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ photos: [{ photo_id: 1, asset_id: 'a' }] });
    });

    it('200 add photos -> { success, added } (POST stays 200, not 201)', async () => {
      unified.addTripPhotos.mockResolvedValue({ success: true, data: { added: 2, shared: true } });
      const res = await request(server).post(`${UNIFIED}/trips/5/photos`).set('Cookie', sessionCookie(1))
        .send({ shared: true, selections: [{ provider: 'immich', asset_ids: ['a', 'b'] }] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, added: 2 });
      // x-socket-id absent -> undefined, matching the legacy `req.headers['x-socket-id'] as string`.
      expect(unified.addTripPhotos).toHaveBeenCalledWith('5', 1, true, [{ provider: 'immich', asset_ids: ['a', 'b'] }], undefined);
    });

    it('400 add photos with empty selections -> error envelope', async () => {
      unified.addTripPhotos.mockResolvedValue({ success: false, error: { message: 'No photos selected', status: 400 } });
      const res = await request(server).post(`${UNIFIED}/trips/5/photos`).set('Cookie', sessionCookie(1)).send({ selections: [] });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'No photos selected' });
    });

    it('200 PUT sharing -> { success: true }', async () => {
      unified.setTripPhotoSharing.mockResolvedValue({ success: true, data: true });
      const res = await request(server).put(`${UNIFIED}/trips/5/photos/sharing`).set('Cookie', sessionCookie(1)).send({ photo_id: 9, shared: true });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });

    it('404 DELETE photo on inaccessible trip -> error envelope', async () => {
      unified.removeTripPhoto.mockReturnValue({ success: false, error: { message: 'Trip not found or access denied', status: 404 } });
      const res = await request(server).delete(`${UNIFIED}/trips/5/photos`).set('Cookie', sessionCookie(1)).send({ photo_id: 9 });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found or access denied' });
    });

    it('200 list album-links -> { links }', async () => {
      unified.listTripAlbumLinks.mockReturnValue({ success: true, data: [{ id: 'l1' }] });
      const res = await request(server).get(`${UNIFIED}/trips/5/album-links`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ links: [{ id: 'l1' }] });
    });

    it('200 create album-link / 409 duplicate envelope', async () => {
      unified.createTripAlbumLink.mockReturnValue({ success: true, data: true });
      const ok = await request(server).post(`${UNIFIED}/trips/5/album-links`).set('Cookie', sessionCookie(1)).send({ provider: 'immich', album_id: 'al', album_name: 'A' });
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ success: true });

      unified.createTripAlbumLink.mockReturnValue({ success: false, error: { message: 'Album already linked', status: 409 } });
      const dup = await request(server).post(`${UNIFIED}/trips/5/album-links`).set('Cookie', sessionCookie(1)).send({ provider: 'immich', album_id: 'al', album_name: 'A' });
      expect(dup.status).toBe(409);
      expect(dup.body).toEqual({ error: 'Album already linked' });
    });

    it('200 DELETE album-link -> { success: true }', async () => {
      unified.removeAlbumLink.mockReturnValue({ success: true, data: true });
      const res = await request(server).delete(`${UNIFIED}/trips/5/album-links/7`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });

  // ── Immich ───────────────────────────────────────────────────────────────────
  describe('immich', () => {
    it('200 settings', async () => {
      immich.getConnectionSettings.mockReturnValue({ immich_url: '', connected: false, auto_upload: false });
      const res = await request(server).get(`${IMMICH}/settings`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ immich_url: '', connected: false, auto_upload: false });
    });

    it('200 PUT settings success / 400 invalid url', async () => {
      immich.saveImmichSettings.mockResolvedValue({ success: true });
      const ok = await request(server).put(`${IMMICH}/settings`).set('Cookie', sessionCookie(1)).send({ immich_url: 'https://x', immich_api_key: 'k', auto_upload: true });
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ success: true });
      expect(immich.setImmichAutoUpload).toHaveBeenCalledWith(1, true);

      immich.saveImmichSettings.mockResolvedValue({ success: false, error: 'Invalid Immich URL: bad' });
      const bad = await request(server).put(`${IMMICH}/settings`).set('Cookie', sessionCookie(1)).send({ immich_url: 'bad' });
      expect(bad.status).toBe(400);
      expect(bad.body).toEqual({ error: 'Invalid Immich URL: bad' });
    });

    it('CRITICAL: 200 /status with { connected: false } on failure', async () => {
      immich.getConnectionStatus.mockResolvedValue({ connected: false, error: 'Not configured' });
      const res = await request(server).get(`${IMMICH}/status`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ connected: false, error: 'Not configured' });
    });

    it('CRITICAL: 200 /test missing fields -> { connected: false, error } without calling service', async () => {
      const res = await request(server).post(`${IMMICH}/test`).set('Cookie', sessionCookie(1)).send({ immich_url: 'https://x' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ connected: false, error: 'URL and API key required' });
      expect(immich.testConnection).not.toHaveBeenCalled();
    });

    it('200 /test with creds delegates to service', async () => {
      immich.testConnection.mockResolvedValue({ connected: true, user: { name: 'T' } });
      const res = await request(server).post(`${IMMICH}/test`).set('Cookie', sessionCookie(1)).send({ immich_url: 'https://x', immich_api_key: 'k' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ connected: true, user: { name: 'T' } });
    });

    it('200 browse / 400 not configured', async () => {
      immich.browseTimeline.mockResolvedValue({ buckets: [{ count: 3 }] });
      const ok = await request(server).get(`${IMMICH}/browse`).set('Cookie', sessionCookie(1));
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ buckets: [{ count: 3 }] });

      immich.browseTimeline.mockResolvedValue({ error: 'Immich not configured', status: 400 });
      const bad = await request(server).get(`${IMMICH}/browse`).set('Cookie', sessionCookie(1));
      expect(bad.status).toBe(400);
      expect(bad.body).toEqual({ error: 'Immich not configured' });
    });

    it('200 search (POST stays 200) / 502 envelope', async () => {
      immich.searchPhotos.mockResolvedValue({ assets: [{ id: 'a' }], hasMore: true });
      const ok = await request(server).post(`${IMMICH}/search`).set('Cookie', sessionCookie(1)).send({ page: 1, size: 50 });
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ assets: [{ id: 'a' }], hasMore: true });
      expect(immich.searchPhotos).toHaveBeenCalledWith(1, undefined, undefined, 1, 50);

      immich.searchPhotos.mockResolvedValue({ error: 'Could not reach Immich', status: 502 });
      const bad = await request(server).post(`${IMMICH}/search`).set('Cookie', sessionCookie(1)).send({});
      expect(bad.status).toBe(502);
      expect(bad.body).toEqual({ error: 'Could not reach Immich' });
    });

    it('200 asset info / 400 invalid id / 403 no access', async () => {
      immich.getAssetInfo.mockResolvedValue({ data: { id: 'asset-1', city: 'Paris' } });
      const ok = await request(server).get(`${IMMICH}/assets/5/asset-1/1/info`).set('Cookie', sessionCookie(1));
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ id: 'asset-1', city: 'Paris' });

      immich.isValidAssetId.mockReturnValue(false);
      const invalid = await request(server).get(`${IMMICH}/assets/5/bad/1/info`).set('Cookie', sessionCookie(1));
      expect(invalid.status).toBe(400);
      expect(invalid.body).toEqual({ error: 'Invalid asset ID' });

      immich.isValidAssetId.mockReturnValue(true);
      canAccessUserPhoto.mockReturnValue(false);
      const forbidden = await request(server).get(`${IMMICH}/assets/5/asset-1/2/info`).set('Cookie', sessionCookie(1));
      expect(forbidden.status).toBe(403);
      expect(forbidden.body).toEqual({ error: 'Forbidden' });
    });

    it('streams thumbnail bytes via the service helper', async () => {
      immich.streamImmichAsset.mockImplementation(async (res: any) => {
        res.status(200);
        res.set('Content-Type', 'image/webp');
        res.end(Buffer.from('thumb-bytes'));
      });
      const res = await request(server).get(`${IMMICH}/assets/5/asset-1/1/thumbnail`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/webp');
      expect(immich.streamImmichAsset).toHaveBeenCalledWith(expect.anything(), 1, 'asset-1', 'thumbnail', 1);
    });

    it('200 albums / 200 album photos', async () => {
      immich.listAlbums.mockResolvedValue({ albums: [{ id: 'al' }] });
      const albums = await request(server).get(`${IMMICH}/albums`).set('Cookie', sessionCookie(1));
      expect(albums.status).toBe(200);
      expect(albums.body).toEqual({ albums: [{ id: 'al' }] });

      immich.getAlbumPhotos.mockResolvedValue({ assets: [{ id: 'p1' }] });
      const photos = await request(server).get(`${IMMICH}/albums/al/photos`).set('Cookie', sessionCookie(1));
      expect(photos.status).toBe(200);
      expect(photos.body).toEqual({ assets: [{ id: 'p1' }] });
    });

    it('200 album sync (POST stays 200) / 404 envelope', async () => {
      immich.syncAlbumAssets.mockResolvedValue({ success: true, added: 3, total: 10 });
      const ok = await request(server).post(`${IMMICH}/trips/5/album-links/7/sync`).set('Cookie', sessionCookie(1));
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ success: true, added: 3, total: 10 });

      immich.syncAlbumAssets.mockResolvedValue({ error: 'Album link not found', status: 404 });
      const bad = await request(server).post(`${IMMICH}/trips/5/album-links/9/sync`).set('Cookie', sessionCookie(1));
      expect(bad.status).toBe(404);
      expect(bad.body).toEqual({ error: 'Album link not found' });
    });
  });

  // ── Synology ───────────────────────────────────────────────────────────────
  describe('synologyphotos', () => {
    it('200 settings', async () => {
      synology.getSynologySettings.mockResolvedValue({ success: true, data: { synology_url: 'u', synology_username: 'n', synology_skip_ssl: true, connected: true } });
      const res = await request(server).get(`${SYNO}/settings`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ synology_url: 'u', synology_username: 'n', synology_skip_ssl: true, connected: true });
    });

    it('400 PUT settings without url/username -> envelope', async () => {
      const res = await request(server).put(`${SYNO}/settings`).set('Cookie', sessionCookie(1)).send({ synology_url: '' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'URL and username are required' });
      expect(synology.updateSynologySettings).not.toHaveBeenCalled();
    });

    it('200 PUT settings delegates when valid', async () => {
      synology.updateSynologySettings.mockResolvedValue({ success: true, data: 'settings updated' });
      const res = await request(server).put(`${SYNO}/settings`).set('Cookie', sessionCookie(1)).send({ synology_url: 'https://nas', synology_username: 'admin', synology_password: 'pw' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual('settings updated');
    });

    it('CRITICAL: 200 /status with { connected: false } on failure', async () => {
      synology.getSynologyStatus.mockResolvedValue({ success: true, data: { connected: false, error: 'Synology not configured' } });
      const res = await request(server).get(`${SYNO}/status`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ connected: false, error: 'Synology not configured' });
    });

    it('CRITICAL: 200 /test missing fields -> 200 { connected: false, error } without calling service', async () => {
      const res = await request(server).post(`${SYNO}/test`).set('Cookie', sessionCookie(1)).send({ synology_url: 'https://nas' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ connected: false, error: 'Username, Password are required' });
      expect(synology.testSynologyConnection).not.toHaveBeenCalled();
    });

    it('200 /test delegates when all fields present', async () => {
      synology.testSynologyConnection.mockResolvedValue({ success: true, data: { connected: true, user: { name: 'admin' } } });
      const res = await request(server).post(`${SYNO}/test`).set('Cookie', sessionCookie(1)).send({ synology_url: 'https://nas', synology_username: 'admin', synology_password: 'pw' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ connected: true, user: { name: 'admin' } });
    });

    it('200 albums / 200 album photos with passphrase', async () => {
      synology.listSynologyAlbums.mockResolvedValue({ success: true, data: { albums: [{ id: '1', albumName: 'A', assetCount: 3 }] } });
      const albums = await request(server).get(`${SYNO}/albums`).set('Cookie', sessionCookie(1));
      expect(albums.status).toBe(200);
      expect(albums.body).toEqual({ albums: [{ id: '1', albumName: 'A', assetCount: 3 }] });

      synology.getSynologyAlbumPhotos.mockResolvedValue({ success: true, data: { assets: [{ id: 'p', takenAt: '' }], total: 1, hasMore: false } });
      const photos = await request(server).get(`${SYNO}/albums/1/photos?passphrase=secret`).set('Cookie', sessionCookie(1));
      expect(photos.status).toBe(200);
      expect(photos.body).toEqual({ assets: [{ id: 'p', takenAt: '' }], total: 1, hasMore: false });
      expect(synology.getSynologyAlbumPhotos).toHaveBeenCalledWith(1, '1', 'secret');
    });

    it('200 search (POST stays 200) with offset/limit coercion', async () => {
      synology.searchSynologyPhotos.mockResolvedValue({ success: true, data: { assets: [], total: 0, hasMore: false } });
      const res = await request(server).post(`${SYNO}/search`).set('Cookie', sessionCookie(1)).send({ page: 3, size: 20 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ assets: [], total: 0, hasMore: false });
      // page=3 -> (3-1)=2; size=20 -> limit=20; offset = 2 * 20 = 40
      expect(synology.searchSynologyPhotos).toHaveBeenCalledWith(1, undefined, undefined, 40, 20);
    });

    it('200 album sync (POST stays 200)', async () => {
      synology.syncSynologyAlbumLink.mockResolvedValue({ success: true, data: { added: 2, total: 5 } });
      const res = await request(server).post(`${SYNO}/trips/5/album-links/7/sync`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ added: 2, total: 5 });
    });

    it('200 asset info / 403 distinct synology string on no access', async () => {
      synology.getSynologyAssetInfo.mockResolvedValue({ success: true, data: { id: '40808_1', takenAt: null } });
      const ok = await request(server).get(`${SYNO}/assets/5/40808_1/1/info`).set('Cookie', sessionCookie(1));
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ id: '40808_1', takenAt: null });

      canAccessUserPhoto.mockReturnValue(false);
      const forbidden = await request(server).get(`${SYNO}/assets/5/40808_1/2/info`).set('Cookie', sessionCookie(1));
      expect(forbidden.status).toBe(403);
      expect(forbidden.body).toEqual({ error: "You don't have access to this photo" });
    });

    it('400 invalid asset kind / 403 no access / stream on valid kind', async () => {
      const invalid = await request(server).get(`${SYNO}/assets/5/40808_1/1/bogus`).set('Cookie', sessionCookie(1));
      expect(invalid.status).toBe(400);
      expect(invalid.body).toEqual({ error: 'Invalid asset kind' });

      canAccessUserPhoto.mockReturnValue(false);
      const forbidden = await request(server).get(`${SYNO}/assets/5/40808_1/2/thumbnail`).set('Cookie', sessionCookie(1));
      expect(forbidden.status).toBe(403);
      expect(forbidden.body).toEqual({ error: "You don't have access to this photo" });

      canAccessUserPhoto.mockReturnValue(true);
      synology.streamSynologyAsset.mockImplementation(async (res: any) => {
        res.status(200);
        res.set('Content-Type', 'image/jpeg');
        res.end(Buffer.from('syno-bytes'));
      });
      const ok = await request(server).get(`${SYNO}/assets/5/40808_1/1/thumbnail?size=xl`).set('Cookie', sessionCookie(1));
      expect(ok.status).toBe(200);
      expect(ok.headers['content-type']).toContain('image/jpeg');
      expect(synology.streamSynologyAsset).toHaveBeenCalledWith(expect.anything(), 1, 1, '40808_1', 'thumbnail', 'xl', undefined);
    });
  });
});
