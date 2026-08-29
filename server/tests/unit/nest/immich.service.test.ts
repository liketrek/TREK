/**
 * ImmichService — credentials, settings, connection, browsing and the asset
 * proxy.
 *
 * The provider code came out of services/memories/ at ~61% branch coverage,
 * because that tree is outside the gate: the integration suites drive it over
 * HTTP and never reach most of the failure paths. These cases go at the service
 * directly with safeFetch stubbed, so every "upstream said no" branch is pinned.
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { ImmichService } from '../../../src/nest/memories/immich.service';
import type { MemoriesAccessService } from '../../../src/nest/memories/memories-access.service';
import { makeStorageFixture } from '../../helpers/storage-fixture';

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      canAccessTrip: () => null,
      isOwner: () => false,
      getPlaceWithTags: () => null,
    },
  };
});
vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'x'.repeat(40),
  ENCRYPTION_KEY: 'a'.repeat(64),
  updateJwtSecret: () => {},
}));

const { decryptMock } = vi.hoisted(() => ({ decryptMock: vi.fn((v: string) => v) }));
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: decryptMock,
  encrypt_api_key: (v: string) => v,
  maybe_encrypt_api_key: (v: string) => v,
}));

const { safeFetch, checkSsrf } = vi.hoisted(() => ({ safeFetch: vi.fn(), checkSsrf: vi.fn() }));
vi.mock('../../../src/utils/ssrfGuard', () => ({
  safeFetch,
  checkSsrf,
  createPinnedDispatcher: vi.fn(() => ({})),
  SsrfBlockedError: class extends Error {},
}));

const audit = { writeAudit: vi.fn() };
const access = { getAlbumIdFromLink: vi.fn() };
const dbs = new DatabaseService(testDb);
const journeyFx = makeStorageFixture('journey/');
const svc = new ImmichService(
  dbs,
  audit as unknown as AuditService,
  access as unknown as MemoriesAccessService,
  journeyFx.storage,
);

const USER = 1;

function seedUser(id: number, url: string | null, key: string | null, autoUpload = 0): void {
  testDb
    .prepare(
      "INSERT OR REPLACE INTO users (id, username, email, password_hash, immich_url, immich_api_key, immich_auto_upload) VALUES (?, ?, ?, 'x', ?, ?, ?)",
    )
    .run(id, `u${id}`, `u${id}@example.test`, url, key, autoUpload);
}

/** A Response-ish object with only what the service reads. */
function upstream(opts: {
  ok?: boolean;
  status?: number;
  json?: unknown;
  url?: string;
  contentType?: string | null;
  body?: string;
}) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    url: opts.url ?? '',
    headers: { get: (h: string) => (h === 'content-type' ? (opts.contentType ?? 'image/jpeg') : null) },
    json: async () => opts.json ?? {},
    arrayBuffer: async () => Buffer.from(opts.body ?? 'bytes'),
  };
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  vi.clearAllMocks();
  decryptMock.mockImplementation((v: string) => v);
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: '1.2.3.4' });
  testDb.prepare('DELETE FROM users').run();
  seedUser(USER, 'https://immich.test', 'key-1');
});

afterAll(() => testDb.close());

describe('getImmichCredentials', () => {
  it('IMMICH-001: returns null when the user row is missing', () => {
    expect(svc.getImmichCredentials(999)).toBeNull();
  });

  it('IMMICH-002: returns null without a URL', () => {
    seedUser(2, null, 'key');
    expect(svc.getImmichCredentials(2)).toBeNull();
  });

  it('IMMICH-003: returns null without an API key', () => {
    seedUser(3, 'https://immich.test', null);
    expect(svc.getImmichCredentials(3)).toBeNull();
  });

  it('IMMICH-004: returns null when the stored key cannot be decrypted', () => {
    decryptMock.mockReturnValue(null);
    expect(svc.getImmichCredentials(USER)).toBeNull();
  });

  it('IMMICH-005: returns the decrypted pair otherwise', () => {
    expect(svc.getImmichCredentials(USER)).toEqual({ immich_url: 'https://immich.test', immich_api_key: 'key-1' });
  });
});

describe('isValidAssetId', () => {
  it('IMMICH-006: accepts UUID-ish ids and rejects traversal or over-long input', () => {
    expect(svc.isValidAssetId('abc-123_XYZ')).toBe(true);
    expect(svc.isValidAssetId('../etc/passwd')).toBe(false);
    expect(svc.isValidAssetId('a'.repeat(101))).toBe(false);
  });
});

describe('getConnectionSettings / setImmichAutoUpload', () => {
  it('IMMICH-007: reports connected with the URL when configured', () => {
    expect(svc.getConnectionSettings(USER)).toEqual({
      immich_url: 'https://immich.test',
      connected: true,
      auto_upload: false,
    });
  });

  it('IMMICH-008: reports an empty URL and not connected when it is not', () => {
    seedUser(4, null, null);
    expect(svc.getConnectionSettings(4)).toEqual({ immich_url: '', connected: false, auto_upload: false });
  });

  it('IMMICH-009: surfaces the auto-upload flag both ways', () => {
    svc.setImmichAutoUpload(USER, true);
    expect(svc.getConnectionSettings(USER).auto_upload).toBe(true);
    svc.setImmichAutoUpload(USER, false);
    expect(svc.getConnectionSettings(USER).auto_upload).toBe(false);
  });
});

describe('saveImmichSettings', () => {
  it('IMMICH-010: refuses a URL the SSRF guard blocks, and writes nothing', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, error: 'blocked host' });

    const result = await svc.saveImmichSettings(USER, 'http://169.254.169.254', 'k', null);

    expect(result).toEqual({ success: false, error: 'Invalid Immich URL: blocked host' });
    expect(svc.getImmichCredentials(USER)!.immich_url).toBe('https://immich.test');
  });

  it('IMMICH-011: stores a trimmed URL and reports plain success', async () => {
    const result = await svc.saveImmichSettings(USER, '  https://new.test  ', 'k2', null);

    expect(result).toEqual({ success: true });
    expect(svc.getImmichCredentials(USER)).toEqual({ immich_url: 'https://new.test', immich_api_key: 'k2' });
  });

  it('IMMICH-012: warns and audits when the URL resolves to a private IP', async () => {
    checkSsrf.mockResolvedValue({ allowed: true, isPrivate: true, resolvedIp: '192.168.1.9' });

    const result = await svc.saveImmichSettings(USER, 'http://nas.local', 'k', '5.6.7.8');

    expect(result.success).toBe(true);
    expect(result.warning).toContain('192.168.1.9');
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'immich.private_ip_configured', ip: '5.6.7.8' }),
    );
  });

  it('IMMICH-013: an empty URL clears the connection without an SSRF check', async () => {
    const result = await svc.saveImmichSettings(USER, undefined, undefined, null);

    expect(result).toEqual({ success: true });
    expect(checkSsrf).not.toHaveBeenCalled();
    expect(svc.getImmichCredentials(USER)).toBeNull();
  });
});

describe('testConnection', () => {
  it('IMMICH-014: refuses a blocked URL before any request', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, error: 'nope' });
    expect(await svc.testConnection('http://x', 'k')).toEqual({ connected: false, error: 'nope' });
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('IMMICH-015: falls back to a generic message when the guard gives no reason', async () => {
    checkSsrf.mockResolvedValue({ allowed: false });
    expect(await svc.testConnection('http://x', 'k')).toEqual({ connected: false, error: 'Invalid Immich URL' });
  });

  it('IMMICH-016: reports the HTTP status when the server rejects the key', async () => {
    safeFetch.mockResolvedValue(upstream({ ok: false, status: 401 }));
    expect(await svc.testConnection('https://immich.test', 'bad')).toEqual({ connected: false, error: 'HTTP 401' });
  });

  it('IMMICH-017: returns the user on success', async () => {
    safeFetch.mockResolvedValue(upstream({ json: { name: 'Ada', email: 'ada@example.test' } }));
    const result = await svc.testConnection('https://immich.test', 'k');
    expect(result.connected).toBe(true);
    expect(result.user).toEqual({ name: 'Ada', email: 'ada@example.test' });
  });

  it('IMMICH-018: reports the canonical URL after an http → https upgrade', async () => {
    safeFetch.mockResolvedValue(upstream({ json: {}, url: 'https://immich.test/api/users/me' }));
    const result = await svc.testConnection('http://immich.test', 'k');
    expect(result.canonicalUrl).toBe('https://immich.test');
  });

  it('IMMICH-019: does NOT rewrite the URL when the host changed — that is a redirect elsewhere', async () => {
    safeFetch.mockResolvedValue(upstream({ json: {}, url: 'https://evil.test/api/users/me' }));
    const result = await svc.testConnection('http://immich.test', 'k');
    expect(result.canonicalUrl).toBeUndefined();
  });

  it('IMMICH-020: reports the thrown message when the request fails', async () => {
    safeFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await svc.testConnection('https://immich.test', 'k')).toEqual({ connected: false, error: 'ECONNREFUSED' });
  });

  it('IMMICH-021: falls back to "Connection failed" for a non-Error rejection', async () => {
    safeFetch.mockRejectedValue('boom');
    expect(await svc.testConnection('https://immich.test', 'k')).toEqual({
      connected: false,
      error: 'Connection failed',
    });
  });
});

describe('getConnectionStatus', () => {
  it('IMMICH-022: says "Not configured" without credentials', async () => {
    seedUser(5, null, null);
    expect(await svc.getConnectionStatus(5)).toEqual({ connected: false, error: 'Not configured' });
  });

  it('IMMICH-023: reports the HTTP status, the user, and a thrown failure', async () => {
    safeFetch.mockResolvedValueOnce(upstream({ ok: false, status: 500 }));
    expect(await svc.getConnectionStatus(USER)).toEqual({ connected: false, error: 'HTTP 500' });

    safeFetch.mockResolvedValueOnce(upstream({ json: { name: 'Ada' } }));
    expect((await svc.getConnectionStatus(USER)).user).toEqual({ name: 'Ada', email: undefined });

    safeFetch.mockRejectedValueOnce(new Error('timeout'));
    expect(await svc.getConnectionStatus(USER)).toEqual({ connected: false, error: 'timeout' });
  });
});

describe('browseTimeline', () => {
  it('IMMICH-024: 400s without credentials', async () => {
    seedUser(6, null, null);
    expect(await svc.browseTimeline(6)).toEqual({ error: 'Immich not configured', status: 400 });
  });

  it('IMMICH-025: forwards the upstream status on failure and the buckets on success', async () => {
    safeFetch.mockResolvedValueOnce(upstream({ ok: false, status: 503 }));
    expect(await svc.browseTimeline(USER)).toEqual({ error: 'Failed to fetch from Immich', status: 503 });

    safeFetch.mockResolvedValueOnce(upstream({ json: [{ count: 3 }] }));
    expect(await svc.browseTimeline(USER)).toEqual({ buckets: [{ count: 3 }] });
  });

  it('IMMICH-026: maps an unreachable server to 502', async () => {
    safeFetch.mockRejectedValue(new Error('down'));
    expect(await svc.browseTimeline(USER)).toEqual({ error: 'Could not reach Immich', status: 502 });
  });
});

describe('searchPhotos', () => {
  it('IMMICH-027: 400s without credentials and 502s when the server is unreachable', async () => {
    seedUser(7, null, null);
    expect(await svc.searchPhotos(7)).toEqual({ error: 'Immich not configured', status: 400 });

    safeFetch.mockRejectedValue(new Error('down'));
    expect(await svc.searchPhotos(USER)).toEqual({ error: 'Could not reach Immich', status: 502 });
  });

  it('IMMICH-028: forwards the upstream status on a failed search', async () => {
    safeFetch.mockResolvedValue(upstream({ ok: false, status: 400 }));
    expect(await svc.searchPhotos(USER)).toEqual({ error: 'Search failed', status: 400 });
  });

  it('IMMICH-029: drops hidden assets an older server still returns (#1474)', async () => {
    safeFetch.mockResolvedValue(
      upstream({
        json: {
          assets: {
            items: [
              { id: 'ok', fileCreatedAt: '2026-01-01' },
              { id: 'hidden-flag', visibility: 'hidden' },
              { id: 'legacy-flag', isVisible: false },
            ],
          },
        },
      }),
    );

    const result = await svc.searchPhotos(USER);

    expect(result.assets!.map((a) => a.id)).toEqual(['ok']);
  });

  it('IMMICH-030: maps exif fields, falls back to createdAt, and marks videos', async () => {
    safeFetch.mockResolvedValue(
      upstream({
        json: {
          assets: {
            items: [
              {
                id: 'a',
                createdAt: '2026-02-02',
                type: 'VIDEO',
                exifInfo: { city: 'Kyoto', country: 'JP', latitude: 35.0, longitude: 135.7 },
              },
              { id: 'b', fileCreatedAt: '2026-03-03', type: 'IMAGE', exifInfo: { latitude: 'nope' } },
            ],
          },
        },
      }),
    );

    const [a, b] = (await svc.searchPhotos(USER)).assets!;

    expect(a).toMatchObject({
      takenAt: '2026-02-02',
      city: 'Kyoto',
      country: 'JP',
      lat: 35.0,
      lng: 135.7,
      mediaType: 'video',
    });
    // A non-numeric coordinate becomes null rather than reaching the client as a string.
    expect(b).toMatchObject({
      takenAt: '2026-03-03',
      city: null,
      country: null,
      lat: null,
      lng: null,
      mediaType: 'image',
    });
  });

  it('IMMICH-031: hasMore counts the raw page, not the filtered one', async () => {
    // Otherwise a page that is entirely hidden assets would stop pagination dead.
    safeFetch.mockResolvedValue(
      upstream({
        json: {
          assets: {
            items: [
              { id: 'x', visibility: 'hidden' },
              { id: 'y', visibility: 'hidden' },
            ],
          },
        },
      }),
    );

    const result = await svc.searchPhotos(USER, undefined, undefined, 1, 2);

    expect(result.assets).toEqual([]);
    expect(result.hasMore).toBe(true);
  });

  it('IMMICH-032: turns a from/to pair into the upstream date bounds', async () => {
    safeFetch.mockResolvedValue(upstream({ json: { assets: { items: [] } } }));

    await svc.searchPhotos(USER, '2026-01-01', '2026-01-31');

    const body = JSON.parse((safeFetch.mock.calls[0][1] as { body: string }).body);
    expect(body.takenAfter).toBe('2026-01-01T00:00:00.000Z');
    expect(body.takenBefore).toBe('2026-01-31T23:59:59.999Z');
    // Load-bearing on Immich >= 1.133: hidden assets must not cross the wire.
    expect(body.visibility).toBe('timeline');
  });
});

describe('getAssetInfo', () => {
  it('IMMICH-033: 404s when the owner has no credentials', async () => {
    seedUser(8, null, null);
    expect(await svc.getAssetInfo(USER, 'a1', 8)).toEqual({ error: 'Not found', status: 404 });
  });

  it("IMMICH-034: reads the OWNER's credentials, not the requester's", async () => {
    seedUser(9, 'https://owner.test', 'owner-key');
    safeFetch.mockResolvedValue(upstream({ json: { id: 'a1' } }));

    await svc.getAssetInfo(USER, 'a1', 9);

    expect(safeFetch.mock.calls[0][0]).toContain('https://owner.test');
    expect((safeFetch.mock.calls[0][1] as { headers: Record<string, string> }).headers['x-api-key']).toBe('owner-key');
  });

  it('IMMICH-035: forwards the upstream status and maps a proxy failure to 502', async () => {
    safeFetch.mockResolvedValueOnce(upstream({ ok: false, status: 404 }));
    expect(await svc.getAssetInfo(USER, 'a1')).toEqual({ error: 'Failed', status: 404 });

    safeFetch.mockRejectedValueOnce(new Error('down'));
    expect(await svc.getAssetInfo(USER, 'a1')).toEqual({ error: 'Proxy error', status: 502 });
  });

  it('IMMICH-036: composes camera/focal/aperture only when both halves are present', async () => {
    safeFetch.mockResolvedValueOnce(
      upstream({
        json: {
          id: 'a1',
          fileCreatedAt: 'x',
          originalFileName: 'IMG.jpg',
          exifInfo: { make: 'Fuji', model: 'X100V', focalLength: 23, fNumber: 2, iso: 200 },
        },
      }),
    );
    const full = (await svc.getAssetInfo(USER, 'a1')).data;
    expect(full).toMatchObject({
      camera: 'Fuji X100V',
      focalLength: '23mm',
      aperture: 'f/2',
      iso: 200,
      fileName: 'IMG.jpg',
    });

    safeFetch.mockResolvedValueOnce(upstream({ json: { id: 'a2', exifInfo: { make: 'Fuji' } } }));
    const partial = (await svc.getAssetInfo(USER, 'a2')).data;
    expect(partial.camera).toBeNull();
    expect(partial.focalLength).toBeNull();
  });

  it('IMMICH-037: survives an asset with no exif block at all', async () => {
    safeFetch.mockResolvedValue(upstream({ json: { id: 'bare' } }));
    const data = (await svc.getAssetInfo(USER, 'bare')).data;
    expect(data).toMatchObject({ id: 'bare', width: null, height: null, city: null, fileName: null });
  });
});

describe('fetchImmichThumbnailBytes', () => {
  it('IMMICH-038: 404s without credentials for the owner', async () => {
    seedUser(10, null, null);
    expect(await svc.fetchImmichThumbnailBytes(USER, 'a1', 10)).toEqual({ error: 'Not found', status: 404 });
  });

  it('IMMICH-039: returns the bytes with the upstream content type', async () => {
    safeFetch.mockResolvedValue(upstream({ contentType: 'image/webp', body: 'thumb' }));
    const result = await svc.fetchImmichThumbnailBytes(USER, 'a1');
    expect(result).toEqual({ bytes: Buffer.from('thumb'), contentType: 'image/webp' });
  });

  it('IMMICH-040: defaults the content type when the server omits it', async () => {
    safeFetch.mockResolvedValue(upstream({ contentType: null, body: 'thumb' }));
    const result = (await svc.fetchImmichThumbnailBytes(USER, 'a1')) as { contentType: string };
    expect(result.contentType).toBe('image/jpeg');
  });

  it('IMMICH-041: forwards the upstream status and maps a throw to 502', async () => {
    safeFetch.mockResolvedValueOnce(upstream({ ok: false, status: 403 }));
    expect(await svc.fetchImmichThumbnailBytes(USER, 'a1')).toEqual({ error: 'Upstream error', status: 403 });

    safeFetch.mockRejectedValueOnce(new Error('down'));
    expect(await svc.fetchImmichThumbnailBytes(USER, 'a1')).toEqual({ error: 'Proxy error', status: 502 });
  });
});

describe('streamImmichAsset', () => {
  function makeRes() {
    return { status: vi.fn().mockReturnThis(), json: vi.fn(), set: vi.fn(), end: vi.fn() };
  }

  it('IMMICH-041b: answers 404 when the owner has no connection, instead of leaving the request open', async () => {
    // It used to return { error, status } and touch nothing. All four callers
    // ignored that return, so the client got no status line at all and waited
    // out its own timeout. Synology's counterpart always wrote; this matches.
    seedUser(11, null, null);
    const res = makeRes();

    await svc.streamImmichAsset(res as never, USER, 'a1', 'thumbnail', 11);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('IMMICH-041c: reads the connection of the OWNER, not of the viewer', async () => {
    // A shared album is proxied with the owner's key on the viewer's behalf, so
    // a viewer who happens to have Immich configured must not paper over an
    // owner who does not.
    seedUser(USER, 'https://immich.example', 'viewer-key');
    seedUser(12, null, null);
    const res = makeRes();

    await svc.streamImmichAsset(res as never, USER, 'a1', 'original', 12);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('IMMICH-041d: proxies with the owner key once a connection exists', async () => {
    seedUser(13, 'https://immich.example', 'owner-key');
    safeFetch.mockResolvedValue(upstream({ contentType: 'image/jpeg', body: 'bytes' }));
    const res = makeRes();

    await svc.streamImmichAsset(res as never, USER, 'a1', 'thumbnail', 13);

    expect(safeFetch).toHaveBeenCalledTimes(1);
    const [url, init] = safeFetch.mock.calls[0];
    expect(url).toContain('/api/assets/a1/thumbnail');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('owner-key');
  });
});

describe('collectAlbumSelection', () => {
  it('IMMICH-042: 404s when the album link does not resolve', async () => {
    access.getAlbumIdFromLink.mockReturnValue({ success: false });
    expect(await svc.collectAlbumSelection('1', 'l1', USER)).toEqual({ error: 'Album link not found', status: 404 });
  });

  it('IMMICH-043: 400s when the user has no Immich credentials', async () => {
    access.getAlbumIdFromLink.mockReturnValue({ success: true, data: 'album-1' });
    seedUser(11, null, null);
    expect(await svc.collectAlbumSelection('1', 'l1', 11)).toEqual({ error: 'Immich not configured', status: 400 });
  });

  it('IMMICH-044: returns only visible image assets, with the raw total', async () => {
    access.getAlbumIdFromLink.mockReturnValue({ success: true, data: 'album-1' });
    safeFetch.mockResolvedValue(
      upstream({
        json: {
          assets: [
            { id: 'img', type: 'IMAGE' },
            { id: 'vid', type: 'VIDEO' },
            { id: 'hidden', type: 'IMAGE', visibility: 'hidden' },
          ],
        },
      }),
    );

    const result = (await svc.collectAlbumSelection('1', 'l1', USER)) as {
      selection: { asset_ids: string[] };
      total: number;
    };

    expect(result.selection.asset_ids).toEqual(['img']);
    expect(result.total).toBe(1);
  });

  it('IMMICH-045: maps an unreachable server to 502', async () => {
    access.getAlbumIdFromLink.mockReturnValue({ success: true, data: 'album-1' });
    safeFetch.mockRejectedValue(new Error('down'));
    expect(await svc.collectAlbumSelection('1', 'l1', USER)).toEqual({ error: 'Could not reach Immich', status: 502 });
  });
});

describe('uploadToImmich', () => {
  function writeJourneyObject(name: string, bytes: string): void {
    const dir = path.join(journeyFx.root, 'journey');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), bytes);
  }

  it('IMMICH-UP-001: returns null without credentials and never fetches', async () => {
    expect(await svc.uploadToImmich(999, 'journey/pic.jpg', 'pic.jpg')).toBeNull();
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('IMMICH-UP-002: returns null for a path outside the journey category', async () => {
    seedUser(USER, 'https://immich.test', 'key-1');
    expect(await svc.uploadToImmich(USER, 'files/doc.pdf', 'doc.pdf')).toBeNull();
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('IMMICH-UP-003: returns null when the object is missing (old existsSync guard)', async () => {
    seedUser(USER, 'https://immich.test', 'key-1');
    expect(await svc.uploadToImmich(USER, 'journey/gone.jpg', 'gone.jpg')).toBeNull();
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('IMMICH-UP-004: posts the bytes as multipart and answers the created asset id', async () => {
    seedUser(USER, 'https://immich.test', 'key-1');
    writeJourneyObject('up.jpg', 'jpeg-bytes-here');
    safeFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'immich-42' }) });

    expect(await svc.uploadToImmich(USER, 'journey/up.jpg', 'up.jpg')).toBe('immich-42');

    const [url, init] = safeFetch.mock.calls[0] as [
      string,
      { method: string; body: Buffer; headers: Record<string, string> },
    ];
    expect(url).toBe('https://immich.test/api/assets');
    expect(init.method).toBe('POST');
    expect(init.headers['x-api-key']).toBe('key-1');
    expect(init.body.includes(Buffer.from('jpeg-bytes-here'))).toBe(true);
  });

  it('IMMICH-UP-005: a rejected upstream answers null, not a throw', async () => {
    seedUser(USER, 'https://immich.test', 'key-1');
    writeJourneyObject('rej.jpg', 'bytes');
    safeFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    expect(await svc.uploadToImmich(USER, 'journey/rej.jpg', 'rej.jpg')).toBeNull();
  });
});
