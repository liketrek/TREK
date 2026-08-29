/**
 * SynologyService — credentials, the SID session with its retry, album listing
 * across three sources, and the asset paths.
 *
 * Same gap as Immich: the provider arrived from services/memories/ at ~60%
 * branch coverage because that tree is outside the gate, and the integration
 * suite drives it over HTTP without reaching the failure paths. The session
 * retry in particular — Synology invalidates a SID on timeout (106), a
 * duplicate login (107) or an unknown SID (119), and the service is supposed to
 * re-login once and repeat the call — had no case at all.
 */
import { runMigrations } from '../../../src/db/migrations';
// The service fires the session-cleared notice and .catch()es it, so the stub
// has to be a promise.

import { createTables } from '../../../src/db/schema';
import { DatabaseService } from '../../../src/nest/database/database.service';
import type { MemoriesAccessService } from '../../../src/nest/memories/memories-access.service';
import { SynologyService } from '../../../src/nest/memories/synology.service';
import { notificationsStub } from '../../helpers/notifications';

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

const { safeFetch, checkSsrf, SsrfBlockedError } = vi.hoisted(() => {
  class SsrfBlockedError extends Error {}
  return { safeFetch: vi.fn(), checkSsrf: vi.fn(), SsrfBlockedError };
});
vi.mock('../../../src/utils/ssrfGuard', () => ({
  safeFetch,
  checkSsrf,
  SsrfBlockedError,
  createPinnedDispatcher: vi.fn(() => ({})),
}));

const access = { getAlbumLinkForSync: vi.fn(), updateSyncTimeForAlbumLink: vi.fn() };
const svc = new SynologyService(
  new DatabaseService(testDb),
  access as unknown as MemoriesAccessService,
  notificationsStub(),
);

const USER = 1;

function seedUser(id: number, cols: Partial<Record<string, unknown>> = {}): void {
  const base = {
    synology_url: 'https://nas.test',
    synology_username: 'ada',
    synology_password: 'pw',
    synology_sid: 'sid-1',
    synology_did: null,
    synology_skip_ssl: 1,
  };
  const row = { ...base, ...cols };
  testDb
    .prepare(
      `INSERT OR REPLACE INTO users (id, username, email, password_hash, synology_url, synology_username, synology_password, synology_sid, synology_did, synology_skip_ssl)
     VALUES (?, ?, ?, 'x', ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      `u${id}`,
      `u${id}@example.test`,
      row.synology_url,
      row.synology_username,
      row.synology_password,
      row.synology_sid,
      row.synology_did,
      row.synology_skip_ssl,
    );
}

/** A Synology API envelope: { success, data } or { success:false, error:{ code } }. */
function api(data: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true, data }),
    arrayBuffer: async () => Buffer.from('x'),
  };
}
function apiError(code: number) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: false, error: { code } }),
    arrayBuffer: async () => Buffer.from('x'),
  };
}
function httpError(status: number) {
  return {
    ok: false,
    status,
    headers: { get: () => null },
    json: async () => ({}),
    arrayBuffer: async () => Buffer.from('x'),
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
  seedUser(USER);
});

afterAll(() => testDb.close());

describe('credentials', () => {
  it('SYNO-U001: an unknown user is 404, not "not configured"', async () => {
    const result = await svc.getSynologySettings(999);
    expect(result).toEqual({ success: false, error: { message: 'User not found', status: 404 } });
  });

  it('SYNO-U002: a half-filled row is "Synology not configured"', async () => {
    seedUser(2, { synology_password: null });
    const result = await svc.getSynologySettings(2);
    expect(result).toEqual({ success: false, error: { message: 'Synology not configured', status: 400 } });
  });

  it('SYNO-U003: a password that will not decrypt is a 500, not a silent retry', async () => {
    decryptMock.mockReturnValue(null);
    const result = await svc.getSynologySettings(USER);
    expect(result).toEqual({ success: false, error: { message: 'Synology credentials corrupted', status: 500 } });
  });

  it('SYNO-U004: skip_ssl is read as a boolean, 0 meaning verify', async () => {
    seedUser(3, { synology_skip_ssl: 0 });
    const result = await svc.getSynologySettings(3);
    expect(result.success && result.data.synology_skip_ssl).toBe(false);
  });

  it('SYNO-U005: settings report the URL, the username and a live session', async () => {
    const result = await svc.getSynologySettings(USER);
    expect(result.success && result.data).toMatchObject({
      synology_url: 'https://nas.test',
      synology_username: 'ada',
      connected: true,
    });
  });
});

describe('the session', () => {
  it('SYNO-U010: a cached SID is used without logging in', async () => {
    safeFetch.mockResolvedValue(api({ list: [] }));
    await svc.searchSynologyPhotos(USER);
    const bodies = safeFetch.mock.calls.map((c) => String((c[1] as { body: URLSearchParams }).body));
    expect(bodies.some((b) => b.includes('SYNO.API.Auth'))).toBe(false);
  });

  it('SYNO-U011: a SID that will not decrypt is cleared and a fresh login happens', async () => {
    decryptMock.mockImplementation((v: string) => (v === 'sid-1' ? null : v));
    safeFetch.mockResolvedValueOnce(api({ sid: 'sid-2' })).mockResolvedValueOnce(api({ list: [] }));

    await svc.searchSynologyPhotos(USER);

    const first = String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body);
    expect(first).toContain('SYNO.API.Auth');
  });

  it('SYNO-U012: a login that returns no sid is a 500', async () => {
    seedUser(4, { synology_sid: null });
    safeFetch.mockResolvedValue(api({}));
    const result = await svc.searchSynologyPhotos(4);
    expect(result).toEqual({
      success: false,
      error: { message: 'Failed to get session ID from Synology', status: 500 },
    });
  });

  it('SYNO-U013: a stored device id rides along so a trusted device skips OTP', async () => {
    seedUser(5, { synology_sid: null, synology_did: 'device-1' });
    safeFetch.mockResolvedValueOnce(api({ sid: 's' })).mockResolvedValueOnce(api({ list: [] }));

    await svc.searchSynologyPhotos(5);

    expect(String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body)).toContain('device_id=device-1');
  });

  it.each([106, 107, 119])('SYNO-U014: error %i clears the SID, re-logs in and repeats the call', async (code) => {
    safeFetch
      .mockResolvedValueOnce(apiError(code)) // the call, with a dead SID
      .mockResolvedValueOnce(api({ sid: 'sid-2' })) // the re-login
      .mockResolvedValueOnce(api({ list: [] })); // the retry

    const result = await svc.searchSynologyPhotos(USER);

    expect(result.success).toBe(true);
    expect(String((safeFetch.mock.calls[1][1] as { body: URLSearchParams }).body)).toContain('SYNO.API.Auth');
  });

  it('SYNO-U015: an app-level error that is NOT a session code is not retried', async () => {
    safeFetch.mockResolvedValue(apiError(105));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result.success).toBe(false);
    // one call only — no re-login, no repeat
    expect(safeFetch).toHaveBeenCalledTimes(1);
  });
});

describe('the API envelope', () => {
  it('SYNO-U020: an HTTP failure carries the upstream status', async () => {
    safeFetch.mockResolvedValue(httpError(502));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result).toEqual({
      success: false,
      error: { message: 'Synology API request failed with status 502', status: 502 },
    });
  });

  it('SYNO-U021: a known app error code becomes its documented message at HTTP 400', async () => {
    safeFetch.mockResolvedValue(apiError(400));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result.success).toBe(false);
    expect((result as { error: { status: number } }).error.status).toBe(400);
  });

  it('SYNO-U022: an unknown code still produces a message rather than undefined', async () => {
    safeFetch.mockResolvedValue(apiError(99999));
    const result = await svc.searchSynologyPhotos(USER);
    expect((result as { error: { message: string } }).error.message).toContain('99999');
  });

  it("SYNO-U023: an SSRF block is a 400 with the guard's own message", async () => {
    safeFetch.mockRejectedValue(new SsrfBlockedError('blocked host'));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result).toEqual({ success: false, error: { message: 'blocked host', status: 400 } });
  });

  it('SYNO-U024: any other transport failure is a 500', async () => {
    safeFetch.mockRejectedValue(new Error('ECONNRESET'));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result).toEqual({ success: false, error: { message: 'Failed to connect to Synology API', status: 500 } });
  });
});

describe('updateSynologySettings', () => {
  it('SYNO-U030: refuses a URL the SSRF guard blocks', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, error: 'private range' });
    const result = await svc.updateSynologySettings(USER, 'http://10.0.0.1', 'ada', 'pw');
    expect(result).toEqual({ success: false, error: { message: 'private range', status: 400 } });
  });

  it('SYNO-U031: keeps the stored password when none is supplied', async () => {
    safeFetch.mockResolvedValue(api({ sid: 's' }));
    await svc.updateSynologySettings(USER, 'https://nas2.test', 'ada');
    const row = testDb.prepare('SELECT synology_password, synology_url FROM users WHERE id = ?').get(USER) as {
      synology_password: string;
      synology_url: string;
    };
    expect(row.synology_password).toBe('pw');
    expect(row.synology_url).toBe('https://nas2.test');
  });
});

describe('testSynologyConnection', () => {
  it('SYNO-U040: sends the OTP and asks for a device token when one is given', async () => {
    safeFetch.mockResolvedValue(api({ sid: 's', did: 'd' }));

    await svc.testSynologyConnection(USER, 'https://nas.test', 'ada', 'pw', '123456');

    const body = String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body);
    expect(body).toContain('otp_code=123456');
    expect(body).toContain('enable_device_token=yes');
  });

  it('SYNO-U041: omits the OTP fields when none is given', async () => {
    safeFetch.mockResolvedValue(api({ sid: 's' }));

    await svc.testSynologyConnection(USER, 'https://nas.test', 'ada', 'pw');

    expect(String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body)).not.toContain('otp_code');
  });
});

describe('listSynologyAlbums', () => {
  it('SYNO-U050: merges personal, shared and shared-with-me, carrying each passphrase', async () => {
    safeFetch
      .mockResolvedValueOnce(api({ list: [{ id: 1, name: 'Personal', item_count: 2 }] }))
      .mockResolvedValueOnce(api({ list: [{ id: 2, name: 'Shared', item_count: 1, passphrase: 'p2' }] }))
      .mockResolvedValueOnce(
        api({ list: [{ id: 3, name: 'WithMe', item_count: 3, sharing_info: { passphrase: 'p3' } }] }),
      );

    const result = await svc.listSynologyAlbums(USER);

    const albums = (result as { data: { albums: { id: string; passphrase?: string }[] } }).data.albums;
    expect(albums.map((a) => a.id).sort()).toEqual(['1', '2', '3']);
    expect(albums.find((a) => a.id === '2')!.passphrase).toBe('p2');
    expect(albums.find((a) => a.id === '3')!.passphrase).toBe('p3');
  });

  it('SYNO-U051: a partial source failure still returns the albums that came back', async () => {
    safeFetch
      .mockResolvedValueOnce(api({ list: [{ id: 1, name: 'Personal' }] }))
      .mockResolvedValueOnce(apiError(105))
      .mockResolvedValueOnce(apiError(105));

    const result = await svc.listSynologyAlbums(USER);

    expect((result as { data: { albums: unknown[] } }).data.albums).toHaveLength(1);
  });

  it('SYNO-U052: the same album id from two sources collapses to one entry', async () => {
    safeFetch
      .mockResolvedValueOnce(api({ list: [{ id: 9, name: 'Dup' }] }))
      .mockResolvedValueOnce(api({ list: [] }))
      .mockResolvedValueOnce(api({ list: [{ id: 9, name: 'Dup', sharing_info: { passphrase: 'p9' } }] }));

    const result = await svc.listSynologyAlbums(USER);

    const albums = (result as { data: { albums: { id: string; passphrase?: string }[] } }).data.albums;
    expect(albums).toHaveLength(1);
    // last write wins, so the shared-with-me passphrase survives
    expect(albums[0].passphrase).toBe('p9');
  });

  it('SYNO-U053: when every source fails, the personal failure is surfaced', async () => {
    safeFetch.mockResolvedValue(httpError(500));
    const result = await svc.listSynologyAlbums(USER);
    expect(result.success).toBe(false);
  });
});

describe('getSynologyAlbumPhotos', () => {
  it('SYNO-U060: pages until a short page and keys assets by the thumbnail cache key', async () => {
    const page = (n: number) =>
      api({
        list: Array.from({ length: n }, (_, i) => ({
          id: i,
          time: 1700000000,
          additional: { thumbnail: { cache_key: `ck-${i}` } },
        })),
      });
    safeFetch.mockResolvedValueOnce(page(50)).mockResolvedValueOnce(page(3));

    const result = await svc.getSynologyAlbumPhotos(USER, '7');

    const assets = (result as { data: { assets: { id: string }[] } }).data.assets;
    expect(assets).toHaveLength(53);
    expect(assets[0].id).toBe('ck-0');
  });

  it('SYNO-U061: a passphrase album queries by passphrase, not album_id', async () => {
    safeFetch.mockResolvedValue(api({ list: [] }));

    await svc.getSynologyAlbumPhotos(USER, '7', 'secret');

    const body = String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body);
    expect(body).toContain('passphrase=secret');
    expect(body).not.toContain('album_id');
  });

  it('SYNO-U062: an upstream failure is passed straight through', async () => {
    safeFetch.mockResolvedValue(httpError(503));
    expect((await svc.getSynologyAlbumPhotos(USER, '7')).success).toBe(false);
  });
});

describe('collectSynologyAlbumSelection', () => {
  it('SYNO-U070: fails when the album link does not resolve', async () => {
    access.getAlbumLinkForSync.mockReturnValue({
      success: false,
      error: { message: 'Album link not found', status: 404 },
    });
    const result = await svc.collectSynologyAlbumSelection(USER, '1', 'l1');
    expect(result.success).toBe(false);
  });

  it('SYNO-U071: returns the cache keys as the selection, with the raw total', async () => {
    access.getAlbumLinkForSync.mockReturnValue({ success: true, data: { albumId: '7', passphrase: undefined } });
    safeFetch.mockResolvedValue(
      api({
        list: [
          { id: 1, additional: { thumbnail: { cache_key: 'ck-1' } } },
          { id: 2, additional: { thumbnail: { cache_key: '' } } },
        ],
      }),
    );

    const result = await svc.collectSynologyAlbumSelection(USER, '1', 'l1');

    const data = (result as { data: { selection: { asset_ids: string[] }; total: number } }).data;
    // the empty cache key is filtered out of the selection but still counted
    expect(data.selection.asset_ids).toEqual(['ck-1']);
    expect(data.total).toBe(2);
  });
});

describe('fetchSynologyThumbnailBytes', () => {
  it('SYNO-U080: fails without credentials rather than fetching', async () => {
    seedUser(6, { synology_url: null });
    const result = await svc.fetchSynologyThumbnailBytes(6, 6, 'a1');
    expect(result).toHaveProperty('error');
    expect(safeFetch).not.toHaveBeenCalled();
  });
});
