/**
 * Synology Photos integration tests (SYNO-001 – SYNO-040).
 * Covers settings, connection test, search, albums, asset streaming, and access control.
 *
 * safeFetch is mocked to return fake Synology API JSON responses based on the `api`
 * query/body parameter. The Synology service uses POST form-body requests so the mock
 * inspects URLSearchParams to dispatch the right fake response.
 *
 * No real HTTP calls are made.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

// ── Hoisted DB mock ──────────────────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

// ── SSRF guard mock — routes all Synology API calls to fake responses ─────────
vi.mock('../../src/utils/ssrfGuard', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/ssrfGuard')>('../../src/utils/ssrfGuard');

  function makeFakeSynologyFetch(url: string, init?: any) {
    const u = String(url);

    // Determine which API was called from the URL query param (e.g. ?api=SYNO.API.Auth)
    // or from the body for POST requests.
    let apiName = '';
    let params = new URLSearchParams();
    try {
      params = new URL(u).searchParams;
      apiName = params.get('api') || '';
    } catch {}
    if (!apiName && init?.body) {
      params = init.body instanceof URLSearchParams
        ? init.body
        : new URLSearchParams(String(init.body));
      apiName = params.get('api') || '';
    }

    // Auth login — used by settings save, status, test-connection
    if (apiName === 'SYNO.API.Auth') {
      return Promise.resolve({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: { sid: 'fake-session-id-abc' } }),
        body: null,
      });
    }

    // Album list
    if (apiName === 'SYNO.Foto.Browse.Album') {
      return Promise.resolve({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({
          success: true,
          data: {
            list: [
              { id: 1, name: 'Summer Trip', item_count: 15 },
              { id: 2, name: 'Winter Holiday', item_count: 8 },
            ],
          },
        }),
        body: null,
      });
    }

    // Search photos
    if (apiName === 'SYNO.Foto.Search.Search') {
      return Promise.resolve({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({
          success: true,
          data: {
            list: [
              {
                id: 101,
                filename: 'photo1.jpg',
                filesize: 1024000,
                time: 1717228800, // 2024-06-01 in Unix timestamp
                additional: {
                  thumbnail: { cache_key: '101_cachekey' },
                  address: { city: 'Tokyo', country: 'Japan', state: 'Tokyo' },
                  exif: { camera: 'Sony A7IV', focal_length: '50', aperture: '1.8', exposure_time: '1/250', iso: 400 },
                  gps: { latitude: 35.6762, longitude: 139.6503 },
                  resolution: { width: 6000, height: 4000 },
                  orientation: 1,
                  description: 'Tokyo street',
                },
              },
            ],
            total: 1,
          },
        }),
        body: null,
      });
    }

    // Browse items (for album sync or asset info)
    if (apiName === 'SYNO.Foto.Browse.Item') {
      return Promise.resolve({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({
          success: true,
          data: {
            list: [
              {
                id: 101,
                filename: 'photo1.jpg',
                filesize: 1024000,
                time: 1717228800,
                additional: {
                  thumbnail: { cache_key: '101_cachekey' },
                  address: { city: 'Tokyo', country: 'Japan', state: 'Tokyo' },
                  exif: { camera: 'Sony A7IV' },
                  gps: { latitude: 35.6762, longitude: 139.6503 },
                  resolution: { width: 6000, height: 4000 },
                  orientation: 1,
                  description: null,
                },
              },
            ],
          },
        }),
        body: null,
      });
    }

    // Thumbnail stream
    if (apiName === 'SYNO.Foto.Thumbnail') {
      if (!(['sm', 'm', 'xl', 'preview'].includes(params.get('size') || '')))
        return Promise.reject(new Error(`Unexpected thumbnail size: ${params.get('size')}`));
      const imageBytes = Buffer.from('fake-synology-thumbnail');
      return Promise.resolve({
        ok: true, status: 200,
        headers: { get: (h: string) => h === 'content-type' ? 'image/jpeg' : null },
        body: new ReadableStream({ start(c) { c.enqueue(imageBytes); c.close(); } }),
      });
    }

    return Promise.reject(new Error(`Unexpected safeFetch call to Synology: ${u}, api=${apiName}`));
  }

  return {
    ...actual,
    checkSsrf: vi.fn().mockImplementation(async (rawUrl: string) => {
      try {
        const url = new URL(rawUrl);
        const h = url.hostname;
        if (h === '127.0.0.1' || h === '::1' || h === 'localhost') {
          return { allowed: false, isPrivate: true, error: 'Loopback not allowed' };
        }
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) {
          return { allowed: false, isPrivate: true, error: 'Private IP not allowed' };
        }
        return { allowed: true, isPrivate: false, resolvedIp: '93.184.216.34' };
      } catch {
        return { allowed: false, isPrivate: false, error: 'Invalid URL' };
      }
    }),
    safeFetch: vi.fn().mockImplementation(makeFakeSynologyFetch),
    __fakeSynologyFetch: makeFakeSynologyFetch,
  };
});

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip, addTripMember, addTripPhoto, setSynologyCredentials } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { safeFetch } from '../../src/utils/ssrfGuard';

let nestApp: INestApplication;
let app: Application;

const SYNO = '/api/integrations/memories/synologyphotos';

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ── Settings ──────────────────────────────────────────────────────────────────

describe('Synology settings', () => {
  it('SYNO-001 — GET /settings when not configured returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get(`${SYNO}/settings`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(400);
  });

  it('SYNO-002 — PUT /settings saves credentials and returns success', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put(`${SYNO}/settings`)
      .set('Cookie', authCookie(user.id))
      .send({
        synology_url: 'https://synology.example.com',
        synology_username: 'admin',
        synology_password: 'secure-password',
      });

    expect(res.status).toBe(200);

    const row = testDb.prepare('SELECT synology_url, synology_username FROM users WHERE id = ?').get(user.id) as any;
    expect(row.synology_url).toBe('https://synology.example.com');
    expect(row.synology_username).toBe('admin');
  });

  it('SYNO-003 — PUT /settings with SSRF-blocked URL returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put(`${SYNO}/settings`)
      .set('Cookie', authCookie(user.id))
      .send({
        synology_url: 'http://192.168.1.100',
        synology_username: 'admin',
        synology_password: 'pass',
      });

    expect(res.status).toBe(400);
  });

  it('SYNO-004 — PUT /settings without URL returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put(`${SYNO}/settings`)
      .set('Cookie', authCookie(user.id))
      .send({ synology_username: 'admin', synology_password: 'pass' }); // no url

    expect(res.status).toBe(400);
  });
});

// ── Connection ────────────────────────────────────────────────────────────────

describe('Synology connection', () => {
  it('SYNO-010 — GET /status when not configured returns { connected: false }', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get(`${SYNO}/status`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(false);
  });

  it('SYNO-011 — GET /status when configured returns { connected: true }', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    const res = await request(app)
      .get(`${SYNO}/status`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
  });

  it('SYNO-012 — POST /test with valid credentials returns { connected: true }', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post(`${SYNO}/test`)
      .set('Cookie', authCookie(user.id))
      .send({
        synology_url: 'https://synology.example.com',
        synology_username: 'admin',
        synology_password: 'secure-password',
      });

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
  });

  it('SYNO-013 — POST /test with missing fields returns error', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post(`${SYNO}/test`)
      .set('Cookie', authCookie(user.id))
      .send({ synology_url: 'https://synology.example.com' }); // missing username+password

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(false);
    expect(res.body.error).toBeDefined();
  });
});

// ── Search & Albums ───────────────────────────────────────────────────────────

describe('Synology search and albums', () => {
  it('SYNO-020 — POST /search returns mapped assets', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    const res = await request(app)
      .post(`${SYNO}/search`)
      .set('Cookie', authCookie(user.id))
      .send({});

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.assets)).toBe(true);
    expect(res.body.assets[0]).toMatchObject({ city: 'Tokyo', country: 'Japan' });
  });

  it('SYNO-021 — POST /search when upstream throws propagates 500', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    // Auth call succeeds, search call throws a network error
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'fake-sid' } }),
        body: null,
      } as any)
      .mockRejectedValueOnce(new Error('Synology unreachable'));

    const res = await request(app)
      .post(`${SYNO}/search`)
      .set('Cookie', authCookie(user.id))
      .send({});

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  it('SYNO-022 — GET /albums returns album list', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    const res = await request(app)
      .get(`${SYNO}/albums`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.albums)).toBe(true);
    expect(res.body.albums).toHaveLength(2);
    expect(res.body.albums[0]).toMatchObject({ albumName: 'Summer Trip', assetCount: 15 });
  });
});

// ── Album listing — multi-source merge ───────────────────────────────────────

describe('Synology listSynologyAlbums multi-source merge', () => {
  // Capture and restore the default safeFetch implementation around each test
  // in this block so the persistent mockImplementation we set doesn't leak.
  let _savedImpl: ((...args: any[]) => any) | undefined;
  beforeEach(() => { _savedImpl = vi.mocked(safeFetch).getMockImplementation(); });
  afterEach(() => { if (_savedImpl) vi.mocked(safeFetch).mockImplementation(_savedImpl); });

  it('SYNO-027 — personal-only: shared and shared-with-me return failure → merged result contains personal albums, no error', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    vi.mocked(safeFetch).mockImplementation((_url: string, init?: any) => {
      // Always read both URL params and body params; body takes precedence for request-specific fields.
      const urlParams = (() => { try { return new URL(String(_url)).searchParams; } catch { return new URLSearchParams(); } })();
      const bodyParams: URLSearchParams = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams(String(init?.body ?? ''));
      const api = urlParams.get('api') || bodyParams.get('api') || '';
      const category = bodyParams.get('category') || urlParams.get('category');

      if (api === 'SYNO.API.Auth') {
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { sid: 'sid-027' } }), body: null } as any);
      }
      if (api === 'SYNO.Foto.Browse.Album') {
        if (!category) {
          // personal albums
          return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { list: [{ id: 1, name: 'Personal Album', item_count: 5 }] } }), body: null } as any);
        }
        // shared category → failure
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: false, error: { code: 400 } }), body: null } as any);
      }
      if (api === 'SYNO.Foto.Sharing.Misc') {
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: false, error: { code: 400 } }), body: null } as any);
      }
      return Promise.reject(new Error(`Unexpected API: ${api}`));
    });

    const res = await request(app)
      .get(`${SYNO}/albums`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.albums)).toBe(true);
    expect(res.body.albums).toHaveLength(1);
    expect(res.body.albums[0]).toMatchObject({ albumName: 'Personal Album', assetCount: 5 });
  });

  it('SYNO-028 — full merge: personal + shared (with passphrase) + shared-with-me (with sharing_info.passphrase) → 4 albums with correct passphrases', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    vi.mocked(safeFetch).mockImplementation((_url: string, init?: any) => {
      const urlParams = (() => { try { return new URL(String(_url)).searchParams; } catch { return new URLSearchParams(); } })();
      const bodyParams: URLSearchParams = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams(String(init?.body ?? ''));
      const api = urlParams.get('api') || bodyParams.get('api') || '';
      const category = bodyParams.get('category') || urlParams.get('category');

      if (api === 'SYNO.API.Auth') {
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { sid: 'sid-028' } }), body: null } as any);
      }
      if (api === 'SYNO.Foto.Browse.Album') {
        if (!category) {
          return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { list: [{ id: 10, name: 'Alpha Album', item_count: 3 }, { id: 11, name: 'Beta Album', item_count: 7 }] } }), body: null } as any);
        }
        // shared category — one album with passphrase
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { list: [{ id: 20, name: 'Shared Out', item_count: 2, passphrase: 'pp-abc' }] } }), body: null } as any);
      }
      if (api === 'SYNO.Foto.Sharing.Misc') {
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { list: [{ id: 30, name: 'Shared With Me', item_count: 4, sharing_info: { passphrase: 'pp-xyz' } }] } }), body: null } as any);
      }
      return Promise.reject(new Error(`Unexpected API: ${api}`));
    });

    const res = await request(app)
      .get(`${SYNO}/albums`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.albums)).toBe(true);
    expect(res.body.albums).toHaveLength(4);

    const byName = (name: string) => res.body.albums.find((a: any) => a.albumName === name);
    expect(byName('Alpha Album')).toMatchObject({ id: '10', assetCount: 3 });
    expect(byName('Beta Album')).toMatchObject({ id: '11', assetCount: 7 });
    expect(byName('Shared Out')).toMatchObject({ id: '20', passphrase: 'pp-abc' });
    expect(byName('Shared With Me')).toMatchObject({ id: '30', passphrase: 'pp-xyz' });

    // personal albums carry no passphrase
    expect(byName('Alpha Album').passphrase).toBeUndefined();
  });

  it('SYNO-029 — dedup: same album id=99 in personal and shared-with-me → last-write-wins gives passphrase from shared-with-me', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    vi.mocked(safeFetch).mockImplementation((_url: string, init?: any) => {
      const urlParams = (() => { try { return new URL(String(_url)).searchParams; } catch { return new URLSearchParams(); } })();
      const bodyParams: URLSearchParams = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams(String(init?.body ?? ''));
      const api = urlParams.get('api') || bodyParams.get('api') || '';
      const category = bodyParams.get('category') || urlParams.get('category');

      if (api === 'SYNO.API.Auth') {
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { sid: 'sid-029' } }), body: null } as any);
      }
      if (api === 'SYNO.Foto.Browse.Album') {
        if (!category) {
          // personal: album id=99 without passphrase
          return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { list: [{ id: 99, name: 'Dup Album', item_count: 10 }] } }), body: null } as any);
        }
        // shared: no entries
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { list: [] } }), body: null } as any);
      }
      if (api === 'SYNO.Foto.Sharing.Misc') {
        // shared-with-me: same album id=99 with passphrase
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { list: [{ id: 99, name: 'Dup Album', item_count: 10, passphrase: 'pp-dup' }] } }), body: null } as any);
      }
      return Promise.reject(new Error(`Unexpected API: ${api}`));
    });

    const res = await request(app)
      .get(`${SYNO}/albums`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.albums)).toBe(true);
    // Deduplicated to a single album
    expect(res.body.albums).toHaveLength(1);
    expect(res.body.albums[0]).toMatchObject({ id: '99', albumName: 'Dup Album' });
    // shared-with-me wins (last write) → passphrase present
    expect(res.body.albums[0].passphrase).toBe('pp-dup');
  });
});

// ── Asset access ──────────────────────────────────────────────────────────────

describe('Synology asset access', () => {
  it('SYNO-030 — GET /assets/info returns metadata for own photo', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');
    addTripPhoto(testDb, trip.id, user.id, '101_cachekey', 'synologyphotos', { shared: false });

    const res = await request(app)
      .get(`${SYNO}/assets/${trip.id}/101_cachekey/${user.id}/info`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ city: 'Tokyo', country: 'Japan' });
  });

  it('SYNO-031 — GET /assets/info by non-owner of unshared photo returns 403', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    addTripPhoto(testDb, trip.id, owner.id, '101_cachekey', 'synologyphotos', { shared: false });

    const res = await request(app)
      .get(`${SYNO}/assets/${trip.id}/101_cachekey/${owner.id}/info`)
      .set('Cookie', authCookie(member.id));

    expect(res.status).toBe(403);
  });

  it('SYNO-032 — GET /assets/thumbnail streams image data for own photo', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');
    addTripPhoto(testDb, trip.id, user.id, '101_cachekey', 'synologyphotos', { shared: false });

    const res = await request(app)
      .get(`${SYNO}/assets/${trip.id}/101_cachekey/${user.id}/thumbnail`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
  });

  it('SYNO-032b — GET /api/photos/:id/thumbnail uses an allowed Synology thumbnail size', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    const insert = testDb.prepare(
      'INSERT INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)'
    ).run('synologyphotos', '101_cachekey', user.id);
    const trekPhotoId = Number(insert.lastInsertRowid);

    vi.mocked(safeFetch).mockClear();

    const res = await request(app)
      .get(`/api/photos/${trekPhotoId}/thumbnail`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
  });

  it('SYNO-033 — GET /assets/original streams image data for shared photo', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    setSynologyCredentials(testDb, owner.id, 'https://synology.example.com', 'admin', 'pass');
    addTripPhoto(testDb, trip.id, owner.id, '101_cachekey', 'synologyphotos', { shared: true });

    const res = await request(app)
      .get(`${SYNO}/assets/${trip.id}/101_cachekey/${owner.id}/original`)
      .set('Cookie', authCookie(member.id));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
  });

  it('SYNO-034 — GET /assets with invalid kind returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripPhoto(testDb, trip.id, user.id, '101_cachekey', 'synologyphotos', { shared: false });

    const res = await request(app)
      .get(`${SYNO}/assets/${trip.id}/101_cachekey/${user.id}/badkind`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(400);
  });

  it('SYNO-035 — GET /assets/info where trip does not exist returns 403', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    // Insert a shared photo referencing a trip that doesn't exist (FK disabled temporarily)
    testDb.exec('PRAGMA foreign_keys = OFF');
    testDb.prepare('INSERT OR IGNORE INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)').run('synologyphotos', '101_cachekey', owner.id);
    const tkpSyno35 = testDb.prepare('SELECT id FROM trek_photos WHERE provider = ? AND asset_id = ? AND owner_id = ?').get('synologyphotos', '101_cachekey', owner.id) as any;
    testDb.prepare(
      'INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, ?)'
    ).run(9999, owner.id, tkpSyno35.id, 1);
    testDb.exec('PRAGMA foreign_keys = ON');

    const res = await request(app)
      .get(`${SYNO}/assets/9999/101_cachekey/${owner.id}/info`)
      .set('Cookie', authCookie(member.id));

    // canAccessUserPhoto: shared photo found, but canAccessTrip(9999) → null → false → 403
    expect(res.status).toBe(403);
  });

  it('SYNO-036 — GET /assets/info when upstream throws propagates 500', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');
    addTripPhoto(testDb, trip.id, user.id, '101_cachekey', 'synologyphotos', { shared: false });

    // Auth call succeeds, Browse.Item call throws a network error
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'fake-sid' } }),
        body: null,
      } as any)
      .mockRejectedValueOnce(new Error('network failure'));

    const res = await request(app)
      .get(`${SYNO}/assets/${trip.id}/101_cachekey/${user.id}/info`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});

// ── Auth checks ───────────────────────────────────────────────────────────────

describe('Synology auth checks', () => {
  it('SYNO-040 — GET /settings without auth returns 401', async () => {
    expect((await request(app).get(`${SYNO}/settings`)).status).toBe(401);
  });

  it('SYNO-040 — PUT /settings without auth returns 401', async () => {
    expect((await request(app).put(`${SYNO}/settings`)).status).toBe(401);
  });

  it('SYNO-040 — GET /status without auth returns 401', async () => {
    expect((await request(app).get(`${SYNO}/status`)).status).toBe(401);
  });

  it('SYNO-040 — POST /test without auth returns 401', async () => {
    expect((await request(app).post(`${SYNO}/test`)).status).toBe(401);
  });

  it('SYNO-040 — GET /albums without auth returns 401', async () => {
    expect((await request(app).get(`${SYNO}/albums`)).status).toBe(401);
  });

  it('SYNO-040 — POST /search without auth returns 401', async () => {
    expect((await request(app).post(`${SYNO}/search`)).status).toBe(401);
  });

  it('SYNO-040 — GET /assets/info without auth returns 401', async () => {
    expect((await request(app).get(`${SYNO}/assets/1/photo-x/1/info`)).status).toBe(401);
  });

  it('SYNO-040 — GET /assets/thumbnail without auth returns 401', async () => {
    expect((await request(app).get(`${SYNO}/assets/1/photo-x/1/thumbnail`)).status).toBe(401);
  });
});

// ── Album sync ────────────────────────────────────────────────────────────────

import { addAlbumLink } from '../helpers/factories';
import { encrypt_api_key } from '../../src/services/apiKeyCrypto';

describe('Synology syncSynologyAlbumLink', () => {
  it('SYNO-050 — POST sync happy path: trip owner with album link saves photos to DB', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');
    // The migration inserts synologyphotos with enabled=0; ensure it is enabled for this test.
    testDb.prepare("UPDATE photo_providers SET enabled = 1 WHERE id = 'synologyphotos'").run();
    // album_id must be a numeric string so getAlbumIdFromLink returns it and
    // syncSynologyAlbumLink passes Number(album_id) to the API.
    const link = addAlbumLink(testDb, trip.id, user.id, 'synologyphotos', '1', 'Summer Trip');

    const res = await request(app)
      .post(`${SYNO}/trips/${trip.id}/album-links/${link.id}/sync`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(typeof res.body.added).toBe('number');
    expect(typeof res.body.total).toBe('number');

    // Verify photos were inserted into the DB
    const photos = testDb.prepare(`
      SELECT tp.*, tkp.provider FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tp.trip_id = ? AND tp.user_id = ?
    `).all(trip.id, user.id) as any[];
    expect(photos.length).toBeGreaterThan(0);
    expect(photos[0].provider).toBe('synologyphotos');
  });

  it('SYNO-051 — POST sync when user is not a trip member returns 404', async () => {
    const { user: owner } = createUser(testDb);
    const { user: outsider } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    setSynologyCredentials(testDb, owner.id, 'https://synology.example.com', 'admin', 'pass');
    const link = addAlbumLink(testDb, trip.id, owner.id, 'synologyphotos', '1', 'Summer Trip');

    const res = await request(app)
      .post(`${SYNO}/trips/${trip.id}/album-links/${link.id}/sync`)
      .set('Cookie', authCookie(outsider.id));

    expect(res.status).toBe(404);
  });

  it('SYNO-052 — POST sync when Synology is not configured returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // No credentials — album link still exists for the user
    const link = addAlbumLink(testDb, trip.id, user.id, 'synologyphotos', '1', 'Summer Trip');

    const res = await request(app)
      .post(`${SYNO}/trips/${trip.id}/album-links/${link.id}/sync`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('SYNO-053 — POST sync without auth returns 401', async () => {
    expect((await request(app).post(`${SYNO}/trips/1/album-links/1/sync`)).status).toBe(401);
  });

  it('SYNO-054 — POST sync with passphrase link: uses passphrase in item-list call and persists encrypted passphrase on trek_photos', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');
    testDb.prepare("UPDATE photo_providers SET enabled = 1 WHERE id = 'synologyphotos'").run();

    // Insert a link with an encrypted passphrase directly into the DB.
    const rawPassphrase = 'syno-share-pass-abc';
    const result = testDb.prepare(
      'INSERT INTO trip_album_links (trip_id, user_id, provider, album_id, album_name, passphrase) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(trip.id, user.id, 'synologyphotos', '99', 'Shared Album', encrypt_api_key(rawPassphrase));
    const link = testDb.prepare('SELECT * FROM trip_album_links WHERE id = ?').get(result.lastInsertRowid) as any;

    // Override safeFetch so browse-item only succeeds when called with the passphrase param.
    vi.mocked(safeFetch).mockImplementation(async (url: any, init?: any) => {
      const bodyParams = init?.body instanceof URLSearchParams
        ? init.body
        : new URLSearchParams(String(init?.body ?? ''));
      const apiName = bodyParams.get('api') || (new URL(String(url)).searchParams.get('api') ?? '');

      if (apiName === 'SYNO.API.Auth') {
        return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: { sid: 'fake-sid-054' } }), body: null } as any;
      }

      if (apiName === 'SYNO.Foto.Browse.Item') {
        // Only respond successfully when the passphrase param is present.
        if (bodyParams.get('passphrase') !== rawPassphrase) {
          return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: false, error: { code: 105 } }), body: null } as any;
        }
        return {
          ok: true, status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              list: [{ id: 201, filename: 'shared.jpg', filesize: 512000, time: 1717228800, additional: { thumbnail: { cache_key: '201_sharedkey' } } }],
            },
          }),
          body: null,
        } as any;
      }

      return Promise.reject(new Error(`SYNO-054: unexpected safeFetch call: api=${apiName}`));
    });

    const res = await request(app)
      .post(`${SYNO}/trips/${trip.id}/album-links/${link.id}/sync`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.added).toBeGreaterThan(0);

    // The trek_photos row for the synced photo must have a non-null passphrase.
    const photo = testDb.prepare(`
      SELECT tkp.passphrase FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tp.trip_id = ? AND tp.user_id = ?
      LIMIT 1
    `).get(trip.id, user.id) as { passphrase: string | null } | undefined;

    expect(photo).toBeDefined();
    expect(photo!.passphrase).not.toBeNull();
  });
});

// ── Session retry logic ───────────────────────────────────────────────────────

describe('Synology session retry on error codes 106/107/119', () => {
  it('SYNO-060 — request retries with fresh session when API returns error code 119', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    // Clear previous call history so the count only reflects this test's calls
    vi.mocked(safeFetch).mockClear();

    // Call sequence:
    //   1. Auth login (fresh session — no cached SID) → success with sid
    //   2. SYNO.Foto.Browse.Album call → returns { success: false, error: { code: 119 } }
    //   3. Auth login again (retry session after clearing SID) → success with new sid
    //   4. SYNO.Foto.Browse.Album retry call → success
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        // call 1: initial login
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'first-sid' } }),
        body: null,
      } as any)
      .mockResolvedValueOnce({
        // call 2: album list → session expired (119)
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: false, error: { code: 119 } }),
        body: null,
      } as any)
      .mockResolvedValueOnce({
        // call 3: retry login after clearing SID
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'second-sid' } }),
        body: null,
      } as any)
      .mockResolvedValueOnce({
        // call 4: retry album list → success
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            list: [{ id: 99, name: 'Retry Album', item_count: 5 }],
          },
        }),
        body: null,
      } as any);

    const res = await request(app)
      .get(`${SYNO}/albums`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.albums)).toBe(true);
    expect(res.body.albums[0]).toMatchObject({ albumName: 'Retry Album' });
    // Five safeFetch calls: login, failed album list (119), re-login, successful album list retry,
    // plus one additional call for the shared or shared-with-me source (handled by default mock)
    expect(vi.mocked(safeFetch)).toHaveBeenCalledTimes(5);
  });

  it('SYNO-061 — request retries with fresh session when API returns error code 106', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    vi.mocked(safeFetch).mockClear();
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'sid-one' } }),
        body: null,
      } as any)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: false, error: { code: 106 } }),
        body: null,
      } as any)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'sid-two' } }),
        body: null,
      } as any)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: { list: [{ id: 3, name: 'Timeout Album', item_count: 2 }] },
        }),
        body: null,
      } as any);

    const res = await request(app)
      .get(`${SYNO}/albums`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.albums[0]).toMatchObject({ albumName: 'Timeout Album' });
    // Five safeFetch calls: login, failed album list (106), re-login, successful album list retry,
    // plus one additional call for the shared or shared-with-me source (handled by default mock)
    expect(vi.mocked(safeFetch)).toHaveBeenCalledTimes(5);
  });
});

// ── Date range search ─────────────────────────────────────────────────────────

describe('Synology searchSynologyPhotos date range', () => {
  it('SYNO-070 — POST /search with from/to passes start_time and end_time to Synology API', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    // Capture the body sent on the search call (second safeFetch call after auth)
    let capturedBody: URLSearchParams | null = null;
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        // login
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'fake-sid' } }),
        body: null,
      } as any)
      .mockImplementationOnce((_url: string, init?: any) => {
        capturedBody = init?.body instanceof URLSearchParams
          ? init.body
          : new URLSearchParams(String(init?.body ?? ''));
        return Promise.resolve({
          ok: true, status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              list: [
                {
                  id: 201,
                  filename: 'dated.jpg',
                  filesize: 512000,
                  time: 1717228800,
                  additional: {
                    thumbnail: { cache_key: '201_abc' },
                    address: { city: 'Kyoto', country: 'Japan', state: 'Kyoto' },
                    exif: {},
                    gps: {},
                    resolution: { width: 4000, height: 3000 },
                    orientation: 1,
                    description: null,
                  },
                },
              ],
            },
          }),
          body: null,
        } as any);
      });

    const res = await request(app)
      .post(`${SYNO}/search`)
      .set('Cookie', authCookie(user.id))
      .send({ from: '2024-06-01', to: '2024-06-30' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.assets)).toBe(true);

    // Verify date parameters were forwarded in the Synology API request body
    expect(capturedBody).not.toBeNull();
    const startTime = capturedBody!.get('start_time');
    const endTime = capturedBody!.get('end_time');
    expect(startTime).toBeDefined();
    expect(Number(startTime)).toBeGreaterThan(0);
    expect(endTime).toBeDefined();
    expect(Number(endTime)).toBeGreaterThan(Number(startTime));
  });

  it('SYNO-071 — POST /search without date range omits start_time and end_time', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    let capturedBody: URLSearchParams | null = null;
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'fake-sid' } }),
        body: null,
      } as any)
      .mockImplementationOnce((_url: string, init?: any) => {
        capturedBody = init?.body instanceof URLSearchParams
          ? init.body
          : new URLSearchParams(String(init?.body ?? ''));
        return Promise.resolve({
          ok: true, status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, data: { list: [] } }),
          body: null,
        } as any);
      });

    const res = await request(app)
      .post(`${SYNO}/search`)
      .set('Cookie', authCookie(user.id))
      .send({});

    expect(res.status).toBe(200);
    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.get('start_time')).toBeNull();
    expect(capturedBody!.get('end_time')).toBeNull();
  });
});

// ── Search pagination ─────────────────────────────────────────────────────────

describe('Synology search pagination', () => {
  it('SYNO-025 — POST /search with { page: 2, size: 50 } sends offset=50 and limit=50 to Synology API', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    let capturedBody: URLSearchParams | null = null;
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        // login
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'fake-sid' } }),
        body: null,
      } as any)
      .mockImplementationOnce((_url: string, init?: any) => {
        capturedBody = init?.body instanceof URLSearchParams
          ? init.body
          : new URLSearchParams(String(init?.body ?? ''));
        return Promise.resolve({
          ok: true, status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, data: { list: [] } }),
          body: null,
        } as any);
      });

    const res = await request(app)
      .post(`${SYNO}/search`)
      .set('Cookie', authCookie(user.id))
      .send({ page: 2, size: 50 });

    expect(res.status).toBe(200);
    expect(capturedBody).not.toBeNull();
    // With the fix: limit=50 is resolved first, then offset = (2-1)*50 = 50
    expect(capturedBody!.get('offset')).toBe('50');
    expect(capturedBody!.get('limit')).toBe('50');
  });

  it('SYNO-026 — POST /search with { page: 3, size: 25 } sends offset=50 and limit=25 to Synology API', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    let capturedBody: URLSearchParams | null = null;
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'fake-sid' } }),
        body: null,
      } as any)
      .mockImplementationOnce((_url: string, init?: any) => {
        capturedBody = init?.body instanceof URLSearchParams
          ? init.body
          : new URLSearchParams(String(init?.body ?? ''));
        return Promise.resolve({
          ok: true, status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, data: { list: [] } }),
          body: null,
        } as any);
      });

    const res = await request(app)
      .post(`${SYNO}/search`)
      .set('Cookie', authCookie(user.id))
      .send({ page: 3, size: 25 });

    expect(res.status).toBe(200);
    expect(capturedBody).not.toBeNull();
    // page 3 → page index = 2 (after subtracting 1), offset = 2 * 25 = 50
    expect(capturedBody!.get('offset')).toBe('50');
    expect(capturedBody!.get('limit')).toBe('25');
  });
});

// ── SSRF catch branch in _fetchSynologyJson ────────────────────────────────────

describe('Synology SSRF blocked error handling', () => {
  it('SYNO-080 — safeFetch throwing SsrfBlockedError for private IP URL returns connected: false', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'http://192.168.1.200', 'admin', 'pass');

    const { SsrfBlockedError: SsrfErr } = await import('../../src/utils/ssrfGuard');

    // Make safeFetch throw SsrfBlockedError — simulating the SSRF guard blocking the private IP.
    // _fetchSynologyJson catches SsrfBlockedError and returns fail(message, 400).
    // getSynologyStatus receives the failure from _getSynologySession and returns { connected: false }.
    vi.mocked(safeFetch).mockRejectedValueOnce(new SsrfErr('Private IP not allowed'));

    const res = await request(app)
      .get(`${SYNO}/status`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(false);
  });

  it('SYNO-081 — safeFetch throwing SsrfBlockedError during one album source is swallowed; other sources still return albums', async () => {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');

    const { SsrfBlockedError: SsrfErr } = await import('../../src/utils/ssrfGuard');

    const emptyAlbumResponse = {
      ok: true, status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, data: { list: [{ id: 99, name: 'Shared Album', item_count: 2, passphrase: 'pp-test' }] } }),
      body: null,
    } as any;

    // Auth succeeds, personal album source throws SSRF, shared + shared-with-me succeed.
    // listSynologyAlbums uses Promise.allSettled so the SSRF failure is logged and skipped.
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { sid: 'sid-x' } }),
        body: null,
      } as any)
      .mockRejectedValueOnce(new SsrfErr('Private IP detected'))
      .mockResolvedValueOnce(emptyAlbumResponse)
      .mockResolvedValueOnce(emptyAlbumResponse);

    const res = await request(app)
      .get(`${SYNO}/albums`)
      .set('Cookie', authCookie(user.id));

    // Personal failed (SSRF), shared sources returned an album — 200 with non-empty list.
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.albums)).toBe(true);
    expect(res.body.albums.length).toBeGreaterThan(0);
  });
});

// ── Passphrase persistence fixes ─────────────────────────────────────────────

import { getOrCreateTrekPhoto, deleteTrekPhotoIfOrphan } from '../../src/services/memories/photoResolverService';
import { decrypt_api_key } from '../../src/services/apiKeyCrypto';

describe('trek_photos passphrase healing (SYNO-090)', () => {
  it('SYNO-090 — getOrCreateTrekPhoto overwrites an existing bad passphrase when a new one is supplied', () => {
    const { user } = createUser(testDb);

    const wrongPass = 'wrong-passphrase';
    const correctPass = 'correct-passphrase';

    const id1 = getOrCreateTrekPhoto('synologyphotos', 'asset-heal-test', user.id, wrongPass);
    const row1 = testDb.prepare('SELECT passphrase FROM trek_photos WHERE id = ?').get(id1) as { passphrase: string };
    expect(decrypt_api_key(row1.passphrase)).toBe(wrongPass);

    const id2 = getOrCreateTrekPhoto('synologyphotos', 'asset-heal-test', user.id, correctPass);
    expect(id2).toBe(id1);
    const row2 = testDb.prepare('SELECT passphrase FROM trek_photos WHERE id = ?').get(id2) as { passphrase: string };
    expect(decrypt_api_key(row2.passphrase)).toBe(correctPass);
  });
});

describe('trek_photos orphan cleanup (SYNO-091)', () => {
  it('SYNO-091 — deleteTrekPhotoIfOrphan removes the trek_photos row when no trip_photos or journey_photos reference it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare("UPDATE photo_providers SET enabled = 1 WHERE id = 'synologyphotos'").run();

    const trekPhotoId = getOrCreateTrekPhoto('synologyphotos', 'asset-orphan-test', user.id, 'pass-A');

    testDb.prepare(
      'INSERT OR IGNORE INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 1)'
    ).run(trip.id, user.id, trekPhotoId);

    // Still referenced — must not be deleted.
    deleteTrekPhotoIfOrphan(trekPhotoId);
    expect(testDb.prepare('SELECT id FROM trek_photos WHERE id = ?').get(trekPhotoId)).toBeDefined();

    // Remove the reference, then orphan-cleanup should delete the trek_photos row.
    testDb.prepare('DELETE FROM trip_photos WHERE photo_id = ?').run(trekPhotoId);
    deleteTrekPhotoIfOrphan(trekPhotoId);
    expect(testDb.prepare('SELECT id FROM trek_photos WHERE id = ?').get(trekPhotoId)).toBeUndefined();
  });

  it('SYNO-092 — re-adding a previously removed Synology photo stores the new passphrase correctly', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare("UPDATE photo_providers SET enabled = 1 WHERE id = 'synologyphotos'").run();

    const firstPass = 'first-passphrase';
    const secondPass = 'second-passphrase';

    // Add with wrong passphrase, then remove (simulating the bug scenario).
    const id1 = getOrCreateTrekPhoto('synologyphotos', 'asset-readd-test', user.id, firstPass);
    testDb.prepare(
      'INSERT OR IGNORE INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 1)'
    ).run(trip.id, user.id, id1);
    testDb.prepare('DELETE FROM trip_photos WHERE photo_id = ?').run(id1);
    deleteTrekPhotoIfOrphan(id1);

    // trek_photos row should be gone.
    expect(testDb.prepare('SELECT id FROM trek_photos WHERE id = ?').get(id1)).toBeUndefined();

    // Re-add with the correct passphrase.
    const id2 = getOrCreateTrekPhoto('synologyphotos', 'asset-readd-test', user.id, secondPass);
    const row = testDb.prepare('SELECT passphrase FROM trek_photos WHERE id = ?').get(id2) as { passphrase: string };
    expect(decrypt_api_key(row.passphrase)).toBe(secondPass);
  });
});

// ── Skip-SSL forwarding on image-byte fetches (#1611) ─────────────────────────

describe('Synology skip-SSL forwarding to image fetches (#1611)', () => {
  // Earlier tests queue mock*Once responses on safeFetch that are not always
  // fully consumed — reset to the shared fake so they can't leak in here.
  beforeEach(async () => {
    const guard = await import('../../src/utils/ssrfGuard') as any;
    vi.mocked(safeFetch).mockReset();
    vi.mocked(safeFetch).mockImplementation(guard.__fakeSynologyFetch);
  });

  // Unique asset id per run — the thumbnail disk cache keys on
  // provider:asset:kind:owner and would otherwise serve a stale entry from a
  // previous run instead of hitting safeFetch.
  let assetSeq = 0;
  const uniqueAssetId = () => `${Date.now()}${++assetSeq}_test1611`;

  function createSynologyTrekPhoto(skipSsl: 0 | 1) {
    const { user } = createUser(testDb);
    setSynologyCredentials(testDb, user.id, 'https://synology.example.com', 'admin', 'pass');
    testDb.prepare('UPDATE users SET synology_skip_ssl = ? WHERE id = ?').run(skipSsl, user.id);
    const assetId = uniqueAssetId();
    const insert = testDb.prepare(
      'INSERT INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)'
    ).run('synologyphotos', assetId, user.id);
    return { user, trekPhotoId: Number(insert.lastInsertRowid) };
  }

  function thumbnailFetchCalls() {
    return vi.mocked(safeFetch).mock.calls.filter(call => String(call[0]).includes('SYNO.Foto.Thumbnail'));
  }

  it('SYNO-100 — thumbnail fetch passes rejectUnauthorized: false when skip-SSL is enabled', async () => {
    const { user, trekPhotoId } = createSynologyTrekPhoto(1);
    vi.mocked(safeFetch).mockClear();

    const res = await request(app)
      .get(`/api/photos/${trekPhotoId}/thumbnail`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    const calls = thumbnailFetchCalls();
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call[2]).toMatchObject({ rejectUnauthorized: false });
    }
  });

  it('SYNO-101 — original fetch passes rejectUnauthorized: false when skip-SSL is enabled', async () => {
    const { user, trekPhotoId } = createSynologyTrekPhoto(1);
    vi.mocked(safeFetch).mockClear();

    const res = await request(app)
      .get(`/api/photos/${trekPhotoId}/original`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    const calls = thumbnailFetchCalls();
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call[2]).toMatchObject({ rejectUnauthorized: false });
    }
  });

  it('SYNO-102 — image fetches verify TLS when skip-SSL is disabled', async () => {
    const { user, trekPhotoId } = createSynologyTrekPhoto(0);
    vi.mocked(safeFetch).mockClear();

    const res = await request(app)
      .get(`/api/photos/${trekPhotoId}/thumbnail`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    const calls = thumbnailFetchCalls();
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call[2]?.rejectUnauthorized ?? true).toBe(true);
    }
  });
});
